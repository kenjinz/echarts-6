import * as echarts from 'echarts';

import {
  DEFAULT_SHARING_STATE,
  buildChartOption,
  normalizeSharingState,
  summarizeSharingState,
  type SharingState
} from './chart-option';
import './style.css';

const SETTING_KEYS = new Set<keyof SharingState>([
  'shareVisualMap',
  'shareLegend',
  'shareXAxis',
  'shareYAxis',
  'shareDataZoom'
]);

function requireElement<T extends Element>(id: string): T {
  const element = document.querySelector<T>(`#${id}`);

  if (!element) {
    throw new Error(`Missing required element: #${id}`);
  }

  return element;
}

function requireSelector<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);

  if (!element) {
    throw new Error(`Missing required element: ${selector}`);
  }

  return element;
}

function isSettingKey(setting: string | undefined): setting is keyof SharingState {
  return setting !== undefined &&
    SETTING_KEYS.has(setting as keyof SharingState);
}

try {
  const chartElement = requireElement<HTMLDivElement>('matrix-chart');
  const statusElement = requireElement<HTMLElement>('chart-status');
  const settingInputs = document.querySelectorAll<HTMLInputElement>(
    'input[data-setting]'
  );
  const settingsGrid = requireSelector<HTMLElement>('.settings-grid');
  const zoomInput = requireSelector<HTMLInputElement>(
    'input[data-setting=shareDataZoom]'
  );
  const zoomControl = requireSelector<HTMLElement>('[data-zoom-control]');
  const zoomNote = requireSelector<HTMLElement>('[data-zoom-note]');

  const chart = echarts.init(chartElement, undefined, { renderer: 'canvas' });
  let state: SharingState = { ...DEFAULT_SHARING_STATE };

  function syncControls(): void {
    settingInputs.forEach((input) => {
      const setting = input.dataset.setting;

      if (isSettingKey(setting)) {
        input.checked = state[setting];
      }
    });

    const zoomAvailable = state.shareXAxis || state.shareYAxis;
    zoomInput.disabled = !zoomAvailable;
    zoomControl.classList.toggle('is-disabled', !zoomAvailable);
    zoomNote.textContent = zoomAvailable
      ? 'Shared data zoom applies to each enabled shared axis.'
      : 'Shared data zoom is available when Shared X axis or Shared Y axis is enabled.';
  }

  function render(nextState: SharingState): void {
    const previousOption = chart.getOption() as echarts.EChartsOption | undefined;
    state = normalizeSharingState(nextState);
    chart.setOption(buildChartOption(state, previousOption?.legend), {
      notMerge: true,
      lazyUpdate: false
    });
    syncControls();
    statusElement.textContent =
      `1 ECharts instance · ${summarizeSharingState(state)}`;
    statusElement.classList.remove('is-error');
    statusElement.classList.add('is-active');
  }

  settingsGrid.addEventListener('change', (event) => {
    if (!(event.target instanceof HTMLInputElement)) {
      return;
    }

    const setting = event.target.dataset.setting;
    if (!isSettingKey(setting)) {
      return;
    }

    const nextState: SharingState = { ...state };
    nextState[setting] = event.target.checked;

    if (!nextState.shareXAxis && !nextState.shareYAxis) {
      nextState.shareDataZoom = false;
    }

    render(nextState);
  });

  const resizeObserver = new ResizeObserver(() => {
    chart.resize();
  });
  resizeObserver.observe(chartElement);

  window.addEventListener(
    'pagehide',
    (event) => {
      if (event.persisted) {
        return;
      }

      resizeObserver.disconnect();
      chart.dispose();
    }
  );

  render({ ...DEFAULT_SHARING_STATE });
}
catch (error) {
  const statusElement = document.querySelector<HTMLElement>('#chart-status');

  if (statusElement) {
    statusElement.textContent = 'Unable to initialize the matrix POC';
    statusElement.classList.remove('is-active');
    statusElement.classList.add('is-error');
  }

  throw error;
}
