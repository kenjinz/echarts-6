import './style.css';

const status = document.querySelector<HTMLElement>('#chart-status');
if (status) {
  status.textContent = 'Matrix ready for chart configuration.';
  status.classList.add('is-active');
}
