import type { CellDefinition, CellId, SharingScope } from '../core/types';

export function resolveTargetCellIds(
  cells: readonly CellDefinition[],
  activeCellId: string,
  scope: SharingScope
): CellId[] {
  const active = cells.find((cell) => cell.id === activeCellId);
  if (!active) {
    throw new Error(`Unknown active cell: ${activeCellId}`);
  }

  return cells
    .filter((cell) => {
      switch (scope) {
        case 'individual':
          return cell.id === active.id;
        case 'row':
          return cell.row === active.row;
        case 'column':
          return cell.column === active.column;
        case 'all':
          return true;
      }
    })
    .map((cell) => cell.id);
}

