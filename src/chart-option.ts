import type {
  ContinuousVisualMapComponentOption,
  DataZoomComponentOption,
  EChartsOption,
  GridComponentOption,
  HeatmapSeriesOption,
  PlainLegendComponentOption,
  TooltipComponentFormatterCallbackParams,
  XAxisComponentOption,
  YAxisComponentOption
} from 'echarts';

export interface SharingState {
  shareVisualMap: boolean;
  shareLegend: boolean;
  shareXAxis: boolean;
  shareYAxis: boolean;
  shareDataZoom: boolean;
}

export const DEFAULT_SHARING_STATE: Readonly<SharingState> = {
  shareVisualMap: false,
  shareLegend: false,
  shareXAxis: false,
  shareYAxis: false,
  shareDataZoom: false
};

const MATRIX_COLUMNS = ['North', 'East', 'South', 'West'];
const MATRIX_ROWS = ['Temperature', 'Humidity', 'Pressure'];
const X_CATEGORIES = ['00', '03', '06', '09', '12', '15', '18', '21'];
const Y_CATEGORIES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const VALUE_MIN = 0;
const VALUE_MAX = 100;

const VISUAL_MAP_COLORS = ['#2563eb', '#06b6d4', '#f59e0b', '#dc2626'];

type HeatmapDatum = [xIndex: number, yIndex: number, value: number];

interface MatrixHostedOption {
  coordinateSystem: 'matrix';
  coord: [columnName: string, rowName: string];
}

type MatrixGridOption = GridComponentOption & MatrixHostedOption;
type MatrixLegendOption = PlainLegendComponentOption & MatrixHostedOption;
type MatrixVisualMapOption = ContinuousVisualMapComponentOption &
  MatrixHostedOption;

export function normalizeSharingState(state: SharingState): SharingState {
  return {
    ...state,
    shareDataZoom:
      state.shareDataZoom && (state.shareXAxis || state.shareYAxis)
  };
}

function makeLayerData(
  rowIndex: number,
  columnIndex: number,
  layerOffset: number
): HeatmapDatum[] {
  const data: HeatmapDatum[] = [];

  for (let yIndex = 0; yIndex < Y_CATEGORIES.length; yIndex += 1) {
    for (let xIndex = 0; xIndex < X_CATEGORIES.length; xIndex += 1) {
      data.push([
        xIndex,
        yIndex,
        makeLayerValue(rowIndex, columnIndex, xIndex, yIndex, layerOffset)
      ]);
    }
  }

  return data;
}

function makeLayerValue(
  rowIndex: number,
  columnIndex: number,
  xIndex: number,
  yIndex: number,
  layerOffset: number
): number {
  const raw =
    18 + rowIndex * 17 + columnIndex * 11 +
    xIndex * 7 + yIndex * 9 + layerOffset +
    ((xIndex + 1) * (yIndex + 2) * (columnIndex + 2)) % 23;

  return Math.max(VALUE_MIN, Math.min(VALUE_MAX, raw % 101));
}

function formatTooltip(params: TooltipComponentFormatterCallbackParams): string {
  const item = Array.isArray(params) ? params[0] : params;
  if (!item) {
    return '';
  }

  const match = String(item.seriesId).match(
    /^cell-(\d+)-(\d+)-(observed|forecast)$/
  );
  const value = item.value;

  if (!match || !Array.isArray(value)) {
    return '';
  }

  const rowIndex = Number(match[1]);
  const columnIndex = Number(match[2]);
  const xIndex = value[0];
  const yIndex = value[1];
  const numericValue = value[2];

  if (
    typeof xIndex !== 'number' ||
    typeof yIndex !== 'number' ||
    typeof numericValue !== 'number'
  ) {
    return '';
  }

  const rowName = MATRIX_ROWS[rowIndex] ?? 'Unknown row';
  const columnName = MATRIX_COLUMNS[columnIndex] ?? 'Unknown column';
  const layer = match[3] === 'observed' ? 'Observed' : 'Forecast';
  const xCategory = X_CATEGORIES[xIndex] ?? String(xIndex);
  const yCategory = Y_CATEGORIES[yIndex] ?? String(yIndex);
  const observedValue =
    layer === 'Observed'
      ? numericValue
      : makeLayerValue(rowIndex, columnIndex, xIndex, yIndex, 0);
  const forecastValue =
    layer === 'Forecast'
      ? numericValue
      : makeLayerValue(rowIndex, columnIndex, xIndex, yIndex, 9);

  return [
    `<strong>${rowName} · ${columnName}</strong>`,
    `${xCategory} · ${yCategory}`,
    `Observed${layer === 'Observed' ? ' (hovered)' : ''}: ${observedValue}`,
    `Forecast${layer === 'Forecast' ? ' (hovered)' : ''}: ${forecastValue}`
  ].join('<br/>');
}

export function buildChartOption(state: SharingState): EChartsOption {
  const normalized = normalizeSharingState(state);
  const grids: MatrixGridOption[] = [];
  const xAxes: XAxisComponentOption[] = [];
  const yAxes: YAxisComponentOption[] = [];
  const legends: (PlainLegendComponentOption | MatrixLegendOption)[] = [];
  const visualMaps: (
    | ContinuousVisualMapComponentOption
    | MatrixVisualMapOption
  )[] = [];
  const dataZoom: DataZoomComponentOption[] = [];
  const series: HeatmapSeriesOption[] = [];

  const option: EChartsOption = {
    animationDurationUpdate: 250,
    matrix: {
      id: 'poc-matrix',
      left: 92,
      right: normalized.shareVisualMap || normalized.shareYAxis ? 132 : 42,
      top: normalized.shareLegend ? 76 : 34,
      bottom: normalized.shareDataZoom && normalized.shareXAxis ? 84 : 46,
      x: { data: MATRIX_COLUMNS, levelSize: 32 },
      y: { data: MATRIX_ROWS, levelSize: 38 },
      body: { itemStyle: { borderColor: '#cbd5e1', borderWidth: 1 } }
    },
    tooltip: { trigger: 'item', confine: true, formatter: formatTooltip },
    grid: grids,
    xAxis: xAxes,
    yAxis: yAxes,
    legend: legends,
    visualMap: visualMaps,
    dataZoom,
    series
  };

  MATRIX_ROWS.forEach((rowName, rowIndex) => {
    MATRIX_COLUMNS.forEach((columnName, columnIndex) => {
      const cellId = `cell-${rowIndex}-${columnIndex}`;
      const coord: [string, string] = [columnName, rowName];
      const showXAxis =
        !normalized.shareXAxis || rowIndex === MATRIX_ROWS.length - 1;
      const showYAxis = !normalized.shareYAxis || columnIndex === 0;

      grids.push({
        id: cellId,
        coordinateSystem: 'matrix',
        coord,
        top: normalized.shareLegend ? 8 : 26,
        right: normalized.shareVisualMap ? 8 : 34,
        bottom: 26,
        left: 34,
        containLabel: false
      });

      xAxes.push({
        id: cellId,
        gridId: cellId,
        type: 'category',
        data: X_CATEGORIES,
        axisLine: { show: showXAxis },
        axisTick: { show: showXAxis },
        axisLabel: { show: showXAxis, fontSize: 9, interval: 1 },
        splitLine: { show: false }
      });

      yAxes.push({
        id: cellId,
        gridId: cellId,
        type: 'category',
        data: Y_CATEGORIES,
        axisLine: { show: showYAxis },
        axisTick: { show: showYAxis },
        axisLabel: { show: showYAxis, fontSize: 9 },
        splitLine: { show: false }
      });

      const observedName = normalized.shareLegend
        ? 'Observed'
        : `${cellId}:Observed`;
      const forecastName = normalized.shareLegend
        ? 'Forecast'
        : `${cellId}:Forecast`;
      const cellSeriesIndexes = [series.length, series.length + 1];

      series.push(
        {
          id: `${cellId}-observed`,
          name: observedName,
          type: 'heatmap',
          xAxisId: cellId,
          yAxisId: cellId,
          data: makeLayerData(rowIndex, columnIndex, 0),
          progressive: 0,
          itemStyle: { borderColor: '#ffffff', borderWidth: 0.5 }
        },
        {
          id: `${cellId}-forecast`,
          name: forecastName,
          type: 'heatmap',
          xAxisId: cellId,
          yAxisId: cellId,
          data: makeLayerData(rowIndex, columnIndex, 9),
          progressive: 0,
          itemStyle: {
            opacity: 0.58,
            borderColor: 'rgba(255, 255, 255, 0.9)',
            borderWidth: 1,
            borderType: 'dashed'
          }
        }
      );

      if (!normalized.shareLegend) {
        legends.push({
          id: `${cellId}-legend`,
          coordinateSystem: 'matrix',
          coord,
          data: [observedName, forecastName],
          formatter: (name: string) => name.replace(`${cellId}:`, ''),
          top: 4,
          left: 'center',
          orient: 'horizontal',
          itemWidth: 10,
          itemHeight: 7,
          itemGap: 6,
          padding: 0,
          textStyle: { fontSize: 9 }
        });
      }

      if (!normalized.shareVisualMap) {
        visualMaps.push({
          id: `${cellId}-visual-map`,
          type: 'continuous',
          coordinateSystem: 'matrix',
          coord,
          seriesIndex: cellSeriesIndexes,
          min: VALUE_MIN,
          max: VALUE_MAX,
          calculable: true,
          orient: 'vertical',
          right: 4,
          top: 30,
          itemWidth: 8,
          itemHeight: 48,
          text: [],
          inRange: { color: VISUAL_MAP_COLORS }
        });
      }

      if (!normalized.shareXAxis) {
        dataZoom.push({
          id: `${cellId}-x-inside`,
          type: 'inside',
          xAxisId: cellId,
          filterMode: 'filter'
        });
      }

      if (!normalized.shareYAxis) {
        dataZoom.push({
          id: `${cellId}-y-inside`,
          type: 'inside',
          yAxisId: cellId,
          filterMode: 'filter'
        });
      }
    });
  });

  if (normalized.shareLegend) {
    legends.push({
      id: 'shared-legend',
      data: ['Observed', 'Forecast'],
      top: 18,
      left: 'center',
      selectedMode: true
    });
  }

  if (normalized.shareVisualMap) {
    visualMaps.push({
      id: 'shared-visual-map',
      type: 'continuous',
      seriesIndex: series.map((_seriesOption, seriesIndex) => seriesIndex),
      min: VALUE_MIN,
      max: VALUE_MAX,
      calculable: true,
      orient: 'vertical',
      right: 24,
      top: 'middle',
      itemWidth: 18,
      itemHeight: 220,
      inRange: { color: VISUAL_MAP_COLORS }
    });
  }

  if (normalized.shareDataZoom && normalized.shareXAxis) {
    dataZoom.push(
      {
        id: 'shared-x-slider',
        type: 'slider',
        xAxisIndex: 'all',
        left: 92,
        right: 132,
        bottom: 20,
        height: 22,
        filterMode: 'filter'
      },
      {
        id: 'shared-x-inside',
        type: 'inside',
        xAxisIndex: 'all',
        filterMode: 'filter'
      }
    );
  }

  if (normalized.shareDataZoom && normalized.shareYAxis) {
    dataZoom.push(
      {
        id: 'shared-y-slider',
        type: 'slider',
        yAxisIndex: 'all',
        top: normalized.shareLegend ? 76 : 34,
        bottom: normalized.shareDataZoom && normalized.shareXAxis ? 84 : 46,
        right: 70,
        width: 22,
        filterMode: 'filter'
      },
      {
        id: 'shared-y-inside',
        type: 'inside',
        yAxisIndex: 'all',
        filterMode: 'filter'
      }
    );
  }

  return option;
}

export function summarizeSharingState(state: SharingState): string {
  const normalized = normalizeSharingState(state);
  let zoomSummary: string;

  if (normalized.shareDataZoom) {
    if (normalized.shareXAxis && normalized.shareYAxis) {
      zoomSummary = 'shared X + Y';
    }
    else if (normalized.shareXAxis) {
      zoomSummary = 'shared X';
    }
    else {
      zoomSummary = 'shared Y';
    }
  }
  else if (normalized.shareXAxis || normalized.shareYAxis) {
    zoomSummary = 'fixed shared axes';
  }
  else {
    zoomSummary = 'local';
  }

  return [
    `Visual map: ${normalized.shareVisualMap ? 'shared' : 'local'}`,
    `Legend: ${normalized.shareLegend ? 'shared' : 'local'}`,
    `X: ${normalized.shareXAxis ? 'shared' : 'local'}`,
    `Y: ${normalized.shareYAxis ? 'shared' : 'local'}`,
    `Zoom: ${zoomSummary}`
  ].join(' · ');
}
