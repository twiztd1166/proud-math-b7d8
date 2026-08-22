export const PERFORMANCE_WEB_ACTION_FEEDBACK_VERSION = '2026.08.22-web-action-feedback-v1';

const LONG_WAIT_MS = 4000;

function pendingLabel(button) {
  const knockAction = button?.dataset?.performanceKnockAction;
  if (knockAction === 'start') return 'STARTING…';
  if (knockAction === 'stop') return 'STOPPING…';
  if (button?.dataset?.performanceWebAction === 'finish') return 'FINISHING DAY…';
  return null;
}

function waitingLabel(button) {
  const knockAction = button?.dataset?.performanceKnockAction;
  if (knockAction === 'start') return 'STARTING… PLEASE WAIT';
  if (knockAction === 'stop') return 'STOPPING… PLEASE WAIT';
  if (button?.dataset?.performanceWebAction === 'finish') return 'FINISHING DAY… PLEASE WAIT';
  return null;
}

export function markPerformanceActionPending(button) {
  const label = pendingLabel(button);
  if (!label || !(button instanceof HTMLButtonElement)) return false;
  if (button.dataset.performanceActionPending === 'true') return false;
  button.dataset.performanceActionPending = 'true';
  button.disabled = true;
  button.setAttribute('aria-disabled', 'true');
  button.setAttribute('aria-busy', 'true');
  button.textContent = label;
  window.setTimeout(() => {
    if (!button.isConnected || button.dataset.performanceActionPending !== 'true') return;
    const waiting = waitingLabel(button);
    if (waiting) button.textContent = waiting;
  }, LONG_WAIT_MS);
  return true;
}

document.addEventListener('click', event => {
  const target = event.target instanceof Element ? event.target : null;
  const button = target?.closest('[data-performance-knock-action],[data-performance-web-action="finish"]');
  if (!(button instanceof HTMLButtonElement)) return;
  // Let the existing action listener observe the click first. The microtask then locks the
  // visible control before a second human tap can be dispatched while the async action runs.
  queueMicrotask(() => { markPerformanceActionPending(button); });
}, true);

export const ParadisePerformanceWebActionFeedbackInvariants = Object.freeze([
  'Start Knocking, Stop Knocking, and Finish Day acknowledge the first tap immediately',
  'the tapped control is disabled during the in-flight action so repeated taps are not required',
  'the helper does not create, update, or delete Performance records itself',
  'the authoritative action implementation remains responsible for success, retry, and error state',
]);
