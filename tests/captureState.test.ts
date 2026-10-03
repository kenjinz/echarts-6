import { describe, expect, it } from 'vitest';

import { captureOptionState } from '../src/sharing/captureState';
import { createDefaultSnapshot } from '../src/sharing/optionState';

describe('capturing ECharts interaction state', () => {
  it('captures zoom state for every axis targeted by the component', () => {
    const snapshot = createDefaultSnapshot('C06', 1);
    captureOptionState(snapshot, {
      dataZoom: [{
        xAxisId: ['xAxis/row-0:column-0/main', 'xAxis/row-0:column-1/main'],
        start: 21,
        end: 79
      }]
    });

    expect(snapshot.interactive.dataZoom['row-0:column-0/x']).toEqual({ start: 21, end: 79 });
    expect(snapshot.interactive.dataZoom['row-0:column-1/x']).toEqual({ start: 21, end: 79 });
  });

  it('captures grouped legend selection using semantic series names', () => {
    const snapshot = createDefaultSnapshot('C09', 1);
    captureOptionState(snapshot, {
      legend: [{
        selected: { 'Observed/row-1': false, 'Forecast/row-1': true }
      }]
    });

    expect(snapshot.interactive.legendSelections['row-1:column-0']).toEqual({
      Observed: false,
      Forecast: true
    });
    expect(snapshot.interactive.legendSelections['row-1:column-1']).toEqual({
      Observed: false,
      Forecast: true
    });
  });

  it('captures per-cell 3D camera state', () => {
    const snapshot = createDefaultSnapshot('G03', 1);
    captureOptionState(snapshot, {
      grid3D: [{
        id: 'grid3D/row-0:column-1/main',
        viewControl: { alpha: 30, beta: 45, distance: 90, center: [1, 2, 3] }
      }]
    });

    expect(snapshot.interactive.camera['row-0:column-1']).toEqual({
      alpha: 30,
      beta: 45,
      distance: 90,
      center: [1, 2, 3]
    });
  });
});
