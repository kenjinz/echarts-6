import { it, expect } from 'vitest';
// Add to tests/foundationState.test.ts with existing imports deduplicated.
import { createDefaultSnapshot, prepareSnapshot } from '../src/sharing/optionState';
it('applies defaults only to fresh P12 and 3D examples', () => {
  expect(prepareSnapshot('P12')).toMatchObject({ rows: 3, columns: 2 });
  const imported = createDefaultSnapshot('P12', 42);
  imported.rows = 1;
  imported.columns = 3;
  expect(prepareSnapshot('P12', imported)).toEqual(imported);
  const mixed = createDefaultSnapshot('G08', 42);
  mixed.interactive.viewMode = { 'row-0:column-0': '2d', 'row-0:column-1': '3d' };
  expect(prepareSnapshot('G08', mixed)).toEqual(mixed);
  expect(prepareSnapshot('G08').interactive.viewMode['row-0:column-0']).toBe('3d');
});
it('does not alias or mutate imported snapshots', () => {
  const imported = createDefaultSnapshot('G08', 42);
  const prepared = prepareSnapshot('G08', imported);
  prepared.interactive.viewMode['row-0:column-0'] = '2d';
  expect(imported.interactive.viewMode).toEqual({});
});
