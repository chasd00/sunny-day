import { readFileSync } from 'node:fs';
import { SfProject } from '@salesforce/core';
import { XMLParser } from 'fast-xml-parser';

export type PermissionSet = {
  PermissionSet: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  };
};

export type PermissionSetSubset = {
  [key: string]: string;
};

/**
 * Utility class for reading and parsing Salesforce Permission Set metadata files
 */
export class PermissionSetUtil {
  private static readonly EXPECTED_LOCATION = 'force-app/main/default/permissionsets';
  private static readonly PERMISSION_SET_EXTENSION = '.permissionset-meta.xml';

  /**
   * Reads a permission set file and extracts a specific permission type as an array
   *
   * @param project - The resolved SfProject instance
   * @param permissionSetName - Name of the permission set (with or without .permissionset-meta.xml extension)
   * @param filterForPermission - Type of permission to extract (e.g., 'objectPermissions', 'fieldPermissions', 'userPermissions')
   * @returns Array of permission objects of the specified type
   */
  public static getPermissions(
    project: SfProject,
    permissionSetName: string,
    filterForPermission: string
  ): PermissionSetSubset[] {
    // Ensure filename has the correct extension
    const filename: string = permissionSetName.endsWith(this.PERMISSION_SET_EXTENSION)
      ? permissionSetName
      : `${permissionSetName}${this.PERMISSION_SET_EXTENSION}`;

    // Read the permission set file from the expected location
    const filePath = `${project.getPath()}/${this.EXPECTED_LOCATION}/${filename}`;
    const xmlData = readFileSync(filePath, 'utf-8');

    // Parse XML to an object and extract permission level objects based on the permission type
    const parser = new XMLParser();
    const psObj: PermissionSet = parser.parse(xmlData) as PermissionSet;
    
    let permissions: PermissionSetSubset[] = [];
    if ( Array.isArray( psObj.PermissionSet[filterForPermission] )) {
      permissions = [...psObj.PermissionSet[filterForPermission] as PermissionSetSubset[]];
    } else {
      permissions = [psObj.PermissionSet[filterForPermission] as PermissionSetSubset];
    }
   
    return permissions.map( p => {

      switch (filterForPermission) {
        // set properties PS and Name
        // the value for property Name depends on what permission is being requested
        
        case 'objectPermissions':
          // eslint-disable-next-line no-case-declarations
          const { object, ...objectPermission } = p
          return {
            PS: permissionSetName,
            Name: object,
            ...objectPermission
          }
        case 'fieldPermissions':
          // eslint-disable-next-line no-case-declarations
          const { field, ...fieldPermission } = p
          return {
            PS: permissionSetName,
            Name: field,
            ...fieldPermission
          }
        case 'userPermissions':    
          // eslint-disable-next-line no-case-declarations
          const { name, ...userPermission } = p
          return {
            PS: permissionSetName,
            Name: name,
            ...userPermission
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
