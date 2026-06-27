import * as fs from 'node:fs';
import * as XLSX from 'xlsx';

// The SheetJS ESM build does not auto-load Node's fs module, so writeFile needs it set explicitly.
XLSX.set_fs(fs);

export type XlsxRow = Record<string, string | boolean>;

/**
 * Writes an array of row objects to an .xlsx file. Column headers are derived from the
 * keys of the first row, preserving their order.
 *
 * @param filePath - Destination path for the .xlsx file
 * @param sheetName - Name for the worksheet
 * @param rows - Row objects; each key becomes a column
 */
export function writeXlsx(filePath: string, sheetName: string, rows: readonly XlsxRow[]): void {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows as XlsxRow[]);
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, filePath);
}
