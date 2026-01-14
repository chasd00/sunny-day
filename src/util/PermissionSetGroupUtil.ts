import { readFileSync } from 'node:fs';
import { SfProject, Logger } from '@salesforce/core';
import { XMLParser } from 'fast-xml-parser';
import { PermissionSetUtil, PermissionSetSubset } from './PermissionSetUtil.js';

export type PermissionSetGroup = {
  PermissionSetGroup: {
    [key: string]: string | string[] | object | undefined;
    permissionSets?: string | string[];
    mutingPermissionSets?: string | string[];
  };
};

/**
 * Utility class for reading and parsing Salesforce Permission Set Group metadata files
 */
export class PermissionSetGroupUtil {
  private static readonly EXPECTED_LOCATION = 'force-app/main/default/permissionsetgroups';
  private static readonly PERMISSION_SET_GROUP_EXTENSION = '.permissionsetgroup-meta.xml';

  /**
   * Reads a permission set group file and aggregates permissions from all included permission sets
   *
   * @param project - The resolved SfProject instance
   * @param permissionSetGroupName - Name of the permission set group (with or without .permissionsetgroup-meta.xml extension)
   * @param filterForPermission - Type of permission to extract (e.g., 'objectPermissions', 'fieldPermissions', 'userPermissions')
   * @returns Array of permission objects aggregated from all permission sets in the group, with muting applied
   */
  public static async getPermissions(
    project: SfProject,
    permissionSetGroupName: string,
    filterForPermission: string
  ): Promise<PermissionSetSubset[]> {

    const log = await Logger.child('PermissionSetGroupUtil.getPermissions');

    // Ensure filename has the correct extension
    const filename: string = permissionSetGroupName.endsWith(this.PERMISSION_SET_GROUP_EXTENSION)
      ? permissionSetGroupName
      : `${permissionSetGroupName}${this.PERMISSION_SET_GROUP_EXTENSION}`;

    // Read the permission set group file from the expected location
    const filePath = `${project.getPath()}/${this.EXPECTED_LOCATION}/${filename}`;
    const xmlData = readFileSync(filePath, 'utf-8');

    // Parse XML to an object
    const parser = new XMLParser();
    const psgObj: PermissionSetGroup = parser.parse(xmlData) as PermissionSetGroup;

    // Normalize permissionSets to array
    let permissionSets: string[] = [];
    if (psgObj.PermissionSetGroup.permissionSets) {
      permissionSets = Array.isArray(psgObj.PermissionSetGroup.permissionSets)
        ? psgObj.PermissionSetGroup.permissionSets
        : [psgObj.PermissionSetGroup.permissionSets];
    }

    // Normalize mutingPermissionSets to array
    let mutingPermissionSets: string[] = [];
    if (psgObj.PermissionSetGroup.mutingPermissionSets) {
      mutingPermissionSets = Array.isArray(psgObj.PermissionSetGroup.mutingPermissionSets)
        ? psgObj.PermissionSetGroup.mutingPermissionSets
        : [psgObj.PermissionSetGroup.mutingPermissionSets];
    }

    // Aggregate permissions from all included permission sets
    const allPermissions: PermissionSetSubset[] = [];
    for (const psName of permissionSets) {
      try {
        // eslint-disable-next-line no-await-in-loop
        const psPermissions = await PermissionSetUtil.getPermissions(project, psName, filterForPermission);
        allPermissions.push(...psPermissions);
      } catch (error) {
        // If a permission set cannot be read, skip it and continue
        log.warn(`Warning: Could not read permission set '${psName}': ${(error as Error).message}`);
      }
    }

    // Apply muting: collect permissions from muting permission sets
    const mutingPermissions = new Map<string, PermissionSetSubset>();
    for (const mutingPsName of mutingPermissionSets) {
      try {
        // eslint-disable-next-line no-await-in-loop
        const mutingPsPermissions = await PermissionSetUtil.getPermissions(project, mutingPsName, filterForPermission);
        for (const mutingPerm of mutingPsPermissions) {
          // Use Name as the key for identifying the same permission
          mutingPermissions.set(mutingPerm.Name, mutingPerm);
        }
      } catch (error) {
        // If a muting permission set cannot be read, skip it and continue
        log.warn(
          `Warning: Could not read muting permission set '${mutingPsName}': ${(error as Error).message}`
        );
      }
    }

    // Merge permissions with the same Name using OR logic
    // If multiple permission sets grant the same permission, merge them (any true value wins)
    const mergedPermissions = new Map<string, PermissionSetSubset>();
    for (const permission of allPermissions) {
      const permName = permission.Name;

      if (mergedPermissions.has(permName)) {
        // Merge with existing permission using OR logic
        const existing = mergedPermissions.get(permName)!;
        const merged: PermissionSetSubset = { ...existing };

        for (const [key, value] of Object.entries(permission)) {
          if (key === 'PS' || key === 'Name') continue;

          // OR logic: if either the existing or new value is true, the result is true
          const existingValue = existing[key];
          if (value || existingValue) {
            merged[key] = 'true';
          } else if (!(value && existingValue)) {
            merged[key] = 'false';
          } else {
            // For non-boolean values, take the new value
            merged[key] = value;
          }
        }

        mergedPermissions.set(permName, merged);
      } else {
        // First occurrence of this permission
        mergedPermissions.set(permName, { ...permission });
      }
    }

    // Apply muting logic: for each merged permission, apply muting if applicable
    const finalPermissions: PermissionSetSubset[] = [];
    for (const [permName, permission] of mergedPermissions) {
      const mutingPerm = mutingPermissions.get(permName);
      if (mutingPerm) {
        // Apply muting logic: muting permission takes precedence
        // If any boolean permission is explicitly set to false in the muting PS, it overrides
        const mutedPermission: PermissionSetSubset = { ...permission };

        for (const [key, value] of Object.entries(mutingPerm)) {
          if (key === 'PS' || key === 'Name') continue;

          // Muting permission explicitly sets values (typically to false to revoke permissions)
          if (!value) {
            mutedPermission[key] = 'false';
          } else if (value) {
            mutedPermission[key] = 'true';
          }
        }

        // Replace PS property with PSG to indicate this came from a permission set group
        delete mutedPermission.PS;
        mutedPermission.PSG = permissionSetGroupName;
        finalPermissions.push(mutedPermission);
      } else {
        // No muting for this permission, include it as-is but mark as from PSG
        delete permission.PS;
        permission.PSG = permissionSetGroupName;
        finalPermissions.push(permission);
      }
    }

    return finalPermissions;
  }
}
