import type { CellDefinition } from '../core/types';

export function createCells(rows: number, columns: number): CellDefinition[] {
  if (!Number.isInteger(rows) || !Number.isInteger(columns) || rows < 0 || columns < 0) {
    throw new Error('Rows and columns must be non-negative integers');
  }

  return Array.from({ length: rows * columns }, (_, index) => {
    const row = Math.floor(index / columns);
    const column = index % columns;
    return {
      id: `row-${row}:column-${column}`,
      row,
      column,
      title: `Row ${row + 1} · Column ${column + 1}`
    };
  });
}

