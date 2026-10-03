export interface ExportRow {
  rowLabel: string;
  columnLabel: string;
  cellTitle: string;
  series: string;
  x: string | number;
  y: string | number;
  value: number;
}

const EXPORT_COLUMNS: readonly (keyof ExportRow)[] = [
  'rowLabel',
  'columnLabel',
  'cellTitle',
  'series',
  'x',
  'y',
  'value'
];

function csvCell(value: string | number): string {
  const text = String(value);
  if (!/[\n\r,]/.test(text) && !text.includes(String.fromCharCode(34))) {
    return text;
  }
  const quote = String.fromCharCode(34);
  return `${quote}${text.replaceAll(quote, quote + quote)}${quote}`;
}

export function rowsToCsv(rows: readonly ExportRow[]): string {
  const header = EXPORT_COLUMNS.join(',');
  const body = rows.map((row) =>
    EXPORT_COLUMNS.map((column) => csvCell(row[column])).join(',')
  );
  return [header, ...body].join('\r\n');
}

export function rowsToJson(rows: readonly ExportRow[]): string {
  return JSON.stringify(rows, null, 2);
}

