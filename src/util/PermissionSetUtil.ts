import { readFileSync } from 'node:fs';
import { SfProject, Logger } from '@salesforce/core';
import { XMLParser } from 'fast-xml-parser';

export type PermissionSet = {
  [rootElement: string]: {
    [key: string]: string | object;
  };
};

// Permission attribute flags (allowRead, editable, enabled, ...) are parsed as booleans;
// identity columns (PS/PSG/Name and the underlying object/field/name) are strings.
export type PermissionSetSubset = {
  [key: string]: string | boolean;
};

/**
 * Utility class for reading and parsing Salesforce Permission Set (and Muting
 * Permission Set) metadata files.
 */
export class PermissionSetUtil {
  private static readonly PERMISSION_SET_LOCATION = 'force-app/main/default/permissionsets';
  private static readonly PERMISSION_SET_EXTENSION = '.permissionset-meta.xml';

  // Muting permission sets are a separate metadata type with their own folder,
  // file suffix, and root XML element.
  private static readonly MUTING_PERMISSION_SET_LOCATION = 'force-app/main/default/mutingpermissionsets';
  private static readonly MUTING_PERMISSION_SET_EXTENSION = '.mutingpermissionset-meta.xml';

  /**
   * Reads a permission set file and extracts a specific permission type as an array
   *
   * @param project - The resolved SfProject instance
   * @param permissionSetName - Name of the permission set (with or without .permissionset-meta.xml extension)
   * @param filterForPermission - Type of permission to extract (e.g., 'objectPermissions', 'fieldPermissions', 'userPermissions')
   * @returns Array of permission objects of the specified type
   */
  public static async getPermissions(
    project: SfProject,
    permissionSetName: string,
    filterForPermission: string
  ): Promise<PermissionSetSubset[]> {
    return this.readPermissions(
      project,
      permissionSetName,
      filterForPermission,
      this.PERMISSION_SET_LOCATION,
      this.PERMISSION_SET_EXTENSION,
      'PermissionSet'
    );
  }

  /**
   * Reads a muting permission set file and extracts a specific permission type as an array.
   *
   * Muting permission sets share the same body shape as permission sets, but live in a
   * different folder, use a different file suffix, and have a `<MutingPermissionSet>` root.
   * A `true` flag here means the permission should be muted (disabled).
   *
   * @param project - The resolved SfProject instance
   * @param mutingPermissionSetName - Name of the muting permission set (with or without .mutingpermissionset-meta.xml extension)
   * @param filterForPermission - Type of permission to extract
   * @returns Array of muting permission objects of the specified type
   */
  public static async getMutingPermissions(
    project: SfProject,
    mutingPermissionSetName: string,
    filterForPermission: string
  ): Promise<PermissionSetSubset[]> {
    return this.readPermissions(
      project,
      mutingPermissionSetName,
      filterForPermission,
      this.MUTING_PERMISSION_SET_LOCATION,
      this.MUTING_PERMISSION_SET_EXTENSION,
      'MutingPermissionSet'
    );
  }

  // eslint-disable-next-line complexity
  private static async readPermissions(
    project: SfProject,
    permissionSetName: string,
    filterForPermission: string,
    location: string,
    extension: string,
    rootElement: 'PermissionSet' | 'MutingPermissionSet'
  ): Promise<PermissionSetSubset[]> {

    await Logger.child('PermissionSetUtil.readPermissions');

    // Ensure filename has the correct extension
    const filename: string = permissionSetName.endsWith(extension)
      ? permissionSetName
      : `${permissionSetName}${extension}`;

    // Read the permission set file from the expected location
    const filePath = `${project.getPath()}/${location}/${filename}`;
    const xmlData = readFileSync(filePath, 'utf-8');

    // Parse XML to an object and extract permission level objects based on the permission type
    const parser = new XMLParser();
    const psObj: PermissionSet = parser.parse(xmlData) as PermissionSet;
    const root = psObj[rootElement] ?? {};

    let permissions: PermissionSetSubset[] = [];
    if (Array.isArray(root[filterForPermission])) {
      permissions = [...root[filterForPermission] as PermissionSetSubset[]];
    } else if (root[filterForPermission]) {
      permissions = [root[filterForPermission] as PermissionSetSubset];
    }

    return permissions.map(p => {

      switch (filterForPermission) {
        // set properties PS and Name
        // the value for property Name depends on what permission is being requested

        case 'objectPermissions': {
          const { object, ...objectPermission } = p
          return {
            PS: permissionSetName,
            Name: object,
            ...objectPermission
          }
        }
        case 'fieldPermissions': {
          const { field, ...fieldPermission } = p
          return {
            PS: permissionSetName,
            Name: field,
            ...fieldPermission
          }
        }
        case 'userPermissions': {
          const { name, ...userPermission } = p
          return {
            PS: permissionSetName,
            Name: name,
            ...userPermission
          }
        }
        default:
          return {
            PS: permissionSetName,
            ...p
          }
      }

    }) as PermissionSetSubset[];

  }
}
