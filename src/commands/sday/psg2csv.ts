import { writeFileSync } from 'node:fs';
import { Messages, SfProject } from '@salesforce/core';
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import * as XLSX from 'xlsx';
import { PermissionSetGroupUtil, PermissionSetGroupSubset } from '../../util/PermissionSetGroupUtil.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@chasd00/sunny-day', 'sday.psg2csv');

export type SdayPsg2csvResult = {
  path: string;
  permissionset: string;
  permission: string;
  data: PermissionSetGroupSubset[];
};

export default class SdayPsg2csv extends SfCommand<SdayPsg2csvResult> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');

  public static readonly flags = {
    permissionset: Flags.string({
      summary: messages.getMessage('flags.permissionsetgroup.summary'),
      description: messages.getMessage('flags.permissionsetgroup.description'),
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
      deprecated: true,
      suggestion: 'No longer needed, sensible column ordering is handled by default.'
    }),
  };

  public async run(): Promise<SdayPsg2csvResult> {
    const { flags } = await this.parse(SdayPsg2csv);

    // find the project, throws an exception if the project directory is not found or valid
    const projectDir = flags.projectdir ?? '.';
    const project = await SfProject.resolve(projectDir);

    // read the permission set and extract the specified permission type
    const permissionList: PermissionSetGroupSubset[] = await PermissionSetGroupUtil.getPermissions(
      project,
      flags.permissionset,
      flags.permission
    );

    if (flags.outputfile) {
      // write to a file

      if (flags.outputfile.endsWith('xlsx')) {
        // excel file

        const workbook: XLSX.WorkBook = XLSX.utils.book_new();
        const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(permissionList);
        XLSX.utils.book_append_sheet(workbook, worksheet, flags.permission);
        XLSX.writeFile(workbook, flags.outputfile);

      } else {
        // plain txt csv file

        const csvRows = this.toCSV(permissionList);
        writeFileSync(`./${flags.outputfile}`, csvRows.join('\n'));
      }

    } else {
      // write to stdout
      const csvRows = this.toCSV(permissionList);
      this.log(csvRows.join('\n'));
    }

    // return required flags and the extracted portion of the permission set as a
    // property on the result object in case the user adds the --json flag
    return {
      path: 'src/commands/project/psg2csv.ts',
      data: permissionList,
      permissionset: flags.permissionset,
      permission: flags.permission,
    };
  }

  // eslint-disable-next-line class-methods-use-this
  private toCSV(permissionList: PermissionSetGroupSubset[]): string[] {

    const csvRows: string[] = [];

    // - header row
    const headers: string[] = Object.keys(permissionList[0] as Record<string, string>);
    csvRows.push(headers.join(','));

    // - data rows
    for (const obj of permissionList) {
      const values = headers.map((header) => {
        let value = obj[header];
        if (typeof value === 'string' && value.includes(',')) {
          value = `"${value}"`;
        } else if (typeof value === 'boolean') {
          value = value ? 'TRUE' : 'FALSE';
        }
        return value;
      });
      csvRows.push(values.join(','));
    }

    return csvRows;
  }
}
