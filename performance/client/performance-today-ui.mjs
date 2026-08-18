export const PERFORMANCE_TODAY_UI_VERSION = '2026.08.18-performance-today-ui-v1';

function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function elapsed(startedAt, now = new Date()) {
  const start = new Date(startedAt);
  const current = new Date(now);
  if (Number.isNaN(start.valueOf()) || Number.isNaN(current.valueOf())) return '';
  const minutes = Math.max(0, Math.floor((current - start) / 60000));
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours} hr ${mins} min` : `${mins} min`;
}

function gpsLabel(location = {}) {
  if (location.state === 'ACTIVE') return 'GPS ✓';
  if (location.state === 'LIMITED') return 'GPS APPROXIMATE';
  if (location.state === 'PERMISSION_REQUIRED') return 'GPS PERMISSION NEEDED';
  if (location.state === 'ERROR' || location.state === 'STOP_ERROR') return 'GPS NEEDS ATTENTION';
  if (location.state === 'RECONNECTING') return 'GPS RECONNECTING';
  return 'GPS OFF';
}

export function renderPerformanceTodayMarkup(state, now = new Date()) {
  const warning = state?.warning ? `<p class="performance-warning" role="status">${esc(state.warning)}</p>` : '';
  const disabled = state?.busy ? ' disabled aria-disabled="true"' : '';

  if (!state || state.mode === 'IDLE') {
    return `<section class="performance-today" data-performance-state="idle">
      <p class="performance-eyebrow">GOOD MORNING</p>
      <h2>Ready for the field?</h2>
      <p class="performance-status">${gpsLabel(state?.location)}</p>
      ${warning}
      <button type="button" data-performance-action="start"${disabled}>START MY DAY</button>
    </section>`;
  }

  if (state.mode === 'ACTIVE' || state.mode === 'FINISHING') {
    const shift = state.shift || {};
    return `<section class="performance-today" data-performance-state="active">
      <p class="performance-eyebrow">SHIFT ACTIVE · ${esc(elapsed(shift.started_at, now))}</p>
      <h2>${gpsLabel(state.location)}</h2>
      <p class="performance-counts">${esc(shift.doors ?? 0)} Doors · ${esc(shift.conversations ?? 0)} Conversations</p>
      ${warning}
      <button type="button" data-performance-action="finish"${disabled}>FINISH DAY</button>
    </section>`;
  }

  if (state.mode === 'COMPLETE') {
    const shift = state.shift || {};
    return `<section class="performance-today" data-performance-state="complete">
      <p class="performance-eyebrow">DAY COMPLETE ✓</p>
      <h2>${esc(shift.doors ?? 0)} Doors · ${esc(shift.conversations ?? 0)} Conversations</h2>
      ${warning}
    </section>`;
  }

  return `<section class="performance-today" data-performance-state="error">
    <h2>Performance needs attention</h2>
    ${warning}
  </section>`;
}

export async function mountPerformanceToday({ root, controller, now = () => new Date() }) {
  if (!root || typeof root.addEventListener !== 'function') throw new Error('Performance Today root element is required');
  if (!controller?.getState || !controller?.load || !controller?.startMyDay || !controller?.finishDay) {
    throw new Error('Performance Today controller is required');
  }

  const render = () => {
    root.innerHTML = renderPerformanceTodayMarkup(controller.getState(), now());
  };

  root.addEventListener('click', async event => {
    const button = event.target?.closest?.('[data-performance-action]');
    if (!button) return;
    button.disabled = true;
    try {
      if (button.dataset.performanceAction === 'start') await controller.startMyDay();
      if (button.dataset.performanceAction === 'finish') await controller.finishDay();
    } finally {
      render();
    }
  });

  await controller.load();
  render();
  return Object.freeze({ render });
}

export const PerformanceTodayUIInvariants = Object.freeze([
  'the isolated Today UI exposes explicit Start My Day and Finish Day actions',
  'the UI never displays an invented KPI pace classification when no configured standard exists',
  'permission or GPS errors remain visible without changing field Lookup authority',
  'this module is not production-active until intentionally mounted by the native Performance shell',
]);
