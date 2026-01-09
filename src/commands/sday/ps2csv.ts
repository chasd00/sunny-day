/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { readFileSync, writeFileSync } from 'node:fs';
import { Messages, SfProject } from '@salesforce/core';
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { XMLParser } from 'fast-xml-parser';

type PermissionSet = {
  PermissionSet: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  };
};

type PermissionSetSubset = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('sunny-day', 'sday.ps2csv');

export type SdayPs2csvResult = {
  path: string;
  permissionset: string;
  permission: string;
  data: PermissionSetSubset[];
};

export default class SdayPs2csv extends SfCommand<SdayPs2csvResult> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');

  public static readonly flags = {
    permissionset: Flags.string({
      summary: messages.getMessage('flags.permissionset.summary'),
      description: messages.getMessage('flags.permissionset.description'),
      char: 'p',
      required: true,
    }),
    permission: Flags.string({
      summary: messages.getMessage('flags.permission.summary'),
      description: messages.getMessage('flags.permission.description'),
      char: 'r',
      required: true,
      options: ['objectPermissions', 'fieldPermissions', 'userPermissions'],
    }),
    projectdir: Flags.string({
      summary: messages.getMessage('flags.projectdir.summary'),
      description: messages.getMessage('flags.projectdir.description'),
      char: 'd',
      required: false,
    }),
    outputfile: Flags.string({
      summary: messages.getMessage('flags.outputfile.summary'),
      description: messages.getMessage('flags.outputfile.description'),
      char: 'f',
      required: false,
    }),
    firstcol: Flags.string({
      summary: messages.getMessage('flags.firstcol.summary'),
      description: messages.getMessage('flags.firstcol.description'),
      char: 'c',
      required: false,
    }),
  };

  public async run(): Promise<SdayPs2csvResult> {
    const { flags } = await this.parse(SdayPs2csv);

    // find the project, throws an exception if the project directory is not found or valid
    const projectDir = flags.projectdir ?? '.';
    const project = await SfProject.resolve(projectDir);

    // read the permission set from the expected location
    const filename: string = flags.permissionset.endsWith('.permissionset-meta.xml')
      ? flags.permissionset
      : `${flags.permissionset}.permissionset-meta.xml`;
    const expectedLocation: string = 'force-app/main/default/permissionsets';
    const xmlData = readFileSync(`${project.getPath()}/${expectedLocation}/${filename}`, 'utf-8');

    // parse xml to an object and extract permission level objects based on the permission flag
    const parser = new XMLParser();
    const psObj: PermissionSet = parser.parse(xmlData);
    const objArray: PermissionSetSubset[] = Array.isArray(psObj.PermissionSet[flags.permission])
      ? psObj.PermissionSet[flags.permission]
      : [psObj.PermissionSet[flags.permission]];

    // convert to csv
    const csvRows: string[] = [];

    // - header row
    const headers: string[] = Object.keys(objArray[0] as Record<string, string>);
    headers.sort((a, b) => {
      if (flags.firstcol) {
        if (a === flags.firstcol) return -1;
        if (b === flags.firstcol) return 1;
      }
      return a < b ? -1 : 1;
    });
    csvRows.push(headers.join(','));

    // - data rows
    for (const obj of objArray) {
      const values = headers.map((header) => {
        let value = obj[header];
        if (typeof value === 'string' && value.includes(',')) {
          value = `"${value}"`;
        } else if (typeof value === 'boolean') {
          value = value ? 'TRUE' : 'FALSE';
        }
        return value as string;
      });
      csvRows.push(values.join(','));
    }

    // write to file or stdout based on if a outputFile flag was provided
    if (flags.outputfile) {
      writeFileSync(`./${flags.outputfile}`, csvRows.join('\n'));
    } else {
      this.log(csvRows.join('\n'));
    }

    // return required flags and the extracted portion of the permission set as a
    // property on the result object in case the user adds the --json flag
    return {
      path: 'src/commands/project/ps2csv.ts',
      data: objArray,
      permissionset: flags.permissionset,
      permission: flags.permission,
    };
  }
}
