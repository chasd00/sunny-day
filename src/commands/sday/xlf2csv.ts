import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Messages, SfError } from '@salesforce/core';
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { XMLParser } from 'fast-xml-parser';
import { writeXlsx } from '../../util/XlsxUtil.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@chasd00/sunny-day', 'sday.xlf2csv');

export type SdayXlf2csvResult = {
  id: string;
  maxwidth: string;
  'size-unit': string;
  source: string;
  'source-language': string;
  target: string;
  'target-language': string;
  note: string;
};

type XlfTransUnit = {
  '@_id': string;
  '@_maxwidth'?: string;
  '@_size-unit'?: string;
  source: string;
  target?: string;
  note?: string;
};

type XlfBody = {
  'trans-unit'?: XlfTransUnit | XlfTransUnit[];
};

type XlfFile = {
  '@_source-language'?: string;
  '@_target-language'?: string;
  body?: XlfBody;
};

type XliffRoot = {
  xliff?: {
    file?: XlfFile;
  };
};

export default class SdayXlf2csv extends SfCommand<SdayXlf2csvResult[]> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');

  public static readonly flags = {
    file: Flags.file({
      summary: messages.getMessage('flags.file.summary'),
      char: 'f',
      required: true,
      exists: true,
    }),
    outputfile: Flags.string({
      summary: messages.getMessage('flags.outputfile.summary'),
      description: messages.getMessage('flags.outputfile.description'),
      char: 'o',
      required: false,
    }),
  };

  private static toCSV(data: SdayXlf2csvResult[]): string[] {
    if (data.length === 0) {
      return [];
    }

    const headers: Array<keyof SdayXlf2csvResult> = ['id', 'maxwidth', 'size-unit', 'source-language', 'source', 'target-language', 'target', 'note'];
    const csvRows = [headers.join(',')];

    for (const row of data) {
      const values = headers.map((header) => {
        let value = row[header] ?? '';
        // Escape quotes by doubling them
        value = value.replace(/"/g, '""');
        // Wrap in quotes if it contains comma, newline or quote
        if (value.includes(',') || value.includes('\n') || value.includes('"')) {
          value = `"${value}"`;
        }
        return value;
      });
      csvRows.push(values.join(','));
    }

    return csvRows;
  }

  public async run(): Promise<SdayXlf2csvResult[]> {
    const { flags } = await this.parse(SdayXlf2csv);

    const filePath = resolve(flags.file);
    let fileContent: string;
    try {
      fileContent = readFileSync(filePath, 'utf-8');
    } catch (error) {
      throw new SfError(`Could not read file: ${filePath}`);
    }

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
    });

    const result = parser.parse(fileContent) as XliffRoot;

    const xliff = result.xliff;
    if (!xliff) {
      throw new SfError('Invalid XLIFF file: missing root <xliff> element');
    }

    const file = xliff.file;
    if (!file) {
      throw new SfError('Invalid XLIFF file: missing <file> element');
    }

    const body = file.body;
    if (!body) {
      throw new SfError('Invalid XLIFF file: missing <body> element');
    }

    let transUnits = body['trans-unit'];
    if (!transUnits) {
      this.log('No translation units found.');
      return [];
    }

    if (!Array.isArray(transUnits)) {
      transUnits = [transUnits];
    }

    const parsedData: SdayXlf2csvResult[] = transUnits.map((unit) => ({
      id: unit['@_id'] ?? '',
      maxwidth: unit['@_maxwidth'] ?? '',
      'size-unit': unit['@_size-unit'] ?? '',
      'source-language': file['@_source-language'] ?? '',      
      source: unit.source ?? '',
      'target-language': file['@_target-language'] ?? '',
      target: unit.target ?? '',
      note: unit.note ?? '',
    }));

    if (flags.outputfile) {
      if (flags.outputfile.endsWith('.xlsx')) {
        // Excel file
        writeXlsx(flags.outputfile, 'Translations', parsedData);
      } else {
        // Plain CSV file
        const csvRows = SdayXlf2csv.toCSV(parsedData);
        writeFileSync(flags.outputfile, csvRows.join('\n'));
      }
    } else {
      // stdout
      const csvRows = SdayXlf2csv.toCSV(parsedData);
      this.log(csvRows.join('\n'));
    }

    return parsedData;
  }
}
