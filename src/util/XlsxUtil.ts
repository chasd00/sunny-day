import ExcelJS from 'exceljs';

export type XlsxRow = Record<string, string | boolean>;

/**
 * Writes an array of row objects to an .xlsx file. Column headers are derived from the
 * keys of the first row, preserving their order.
 *
 * @param filePath - Destination path for the .xlsx file
 * @param sheetName - Name for the worksheet
 * @param rows - Row objects; each key becomes a column
 */
export async function writeXlsx(
  filePath: string,
  sheetName: string,
  rows: readonly XlsxRow[]
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
  worksheet.columns = headers.map((header) => ({ header, key: header }));
  worksheet.addRows(rows as XlsxRow[]);

  await workbook.xlsx.writeFile(filePath);
}
