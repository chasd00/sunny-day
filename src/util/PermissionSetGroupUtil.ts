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
;

export type PermissionSetGroupSubset = {
  [key: string]: string | boolean;
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

    // Collect permissions from the group's muting permission set(s), keyed by Name.
    // Muting permission sets are a distinct metadata type, so they must be read from the
    // mutingpermissionsets/ folder rather than as regular permission sets.
    const mutingPermissions = new Map<string, PermissionSetSubset>();
    for (const mutingPsName of mutingPermissionSets) {
      try {
        // eslint-disable-next-line no-await-in-loop
        const mutingPsPermissions = await PermissionSetUtil.getMutingPermissions(
          project,
          mutingPsName,
          filterForPermission
        );
        for (const mutingPerm of mutingPsPermissions) {
          // Use Name as the key for identifying the same permission
          mutingPermissions.set(String(mutingPerm.Name), mutingPerm);
        }
      } catch (error) {
        // If a muting permission set cannot be read, skip it and continue
        log.warn(
          `Warning: Could not read muting permission set '${mutingPsName}': ${(error as Error).message}`
        );
      }
    }

    // Merge permissions with the same Name using OR logic across the granting permission sets.
    // If any included permission set grants a flag, the merged result grants it.
    const mergedPermissions = new Map<string, PermissionSetSubset>();
    for (const permission of allPermissions) {
      const permName = String(permission.Name);

      if (mergedPermissions.has(permName)) {
        const existing = mergedPermissions.get(permName)!;
        const merged: PermissionSetSubset = { ...existing };

        for (const [key, value] of Object.entries(permission)) {
          if (key === 'PS' || key === 'Name') continue;

          if (typeof value === 'boolean' || typeof existing[key] === 'boolean') {
            // OR logic for boolean flags
            merged[key] = this.isEnabled(existing[key]) || this.isEnabled(value);
          } else {
            // Non-boolean values: take the latest value
            merged[key] = value;
          }
        }

        mergedPermissions.set(permName, merged);
      } else {
        // First occurrence of this permission
        mergedPermissions.set(permName, { ...permission });
      }
    }

    // Apply muting: a `true` flag in a muting permission set disables (mutes) that flag in
    // the merged result. A `false`/absent flag leaves the granted value untouched. Muting only
    // subtracts from what the group grants, so it is applied after the merge above.
    const finalPermissions: PermissionSetSubset[] = [];
    for (const [permName, permission] of mergedPermissions) {
      const mutingPerm = mutingPermissions.get(permName);
      if (mutingPerm) {
        const mutedPermission: PermissionSetSubset = { ...permission };

        for (const [key, value] of Object.entries(mutingPerm)) {
          if (key === 'PS' || key === 'Name') continue;

          // Only a muting flag set to true disables the corresponding granted flag.
          if (this.isEnabled(value)) {
            mutedPermission[key] = false;
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

  /**
   * Normalizes a parsed metadata flag to a boolean. fast-xml-parser yields real booleans,
   * but values may also arrive as the strings 'true'/'false' depending on parser options.
   */
  private static isEnabled(value: string | boolean | undefined): boolean {
    return value === true || value === 'true';
  }
}
