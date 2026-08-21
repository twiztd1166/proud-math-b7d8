import { createClient } from '@supabase/supabase-js';
import { createPerformanceSupabaseOptions, mintEnrollment, validateTrustedDeviceSession } from './performance-session.mjs';
import { isUuid } from '../shared/performance-events.mjs';

export const PERFORMANCE_WEB_ADMIN_ENROLLMENT_VERSION = '2026.08.21-web-admin-enrollment-v1';

const SUPABASE_URL = 'https://taxlrlfsobtnbasjcnuf.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_3e755MdDisPBQzzGrBVBIA_gy4uqNqr';
const ADMIN_CARD_ID = 'performanceWebAdminEnrollment';
const ADMIN_FORM_ID = 'performanceWebAdminEnrollmentForm';
const ADMIN_STATUS_ID = 'performanceWebAdminEnrollmentStatus';
const ADMIN_EMPLOYEE_ID = 'performanceWebAdminEmployee';
const ADMIN_CLEAR_CODE_ID = 'performanceWebAdminClearCode';

let adminClient = null;
let installInFlight = false;

function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function safeMessage(error) {
  return String(error?.message || error || 'Unknown error').slice(0, 220);
}

export function canManageWebEnrollments(role) {
  return role === 'manager' || role === 'admin';
}

function getAdminClient() {
  if (!adminClient) {
    adminClient = createClient(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY,
      createPerformanceSupabaseOptions(window.localStorage),
    );
  }
  return adminClient;
}

async function resolveAuthorizedAdmin() {
  const supabase = getAdminClient();
  const session = await validateTrustedDeviceSession({ supabase, signOutWhenInvalid: true });
  if (session.status !== 'READY' || !canManageWebEnrollments(session.role)) return null;
  return { supabase, session };
}

async function loadActiveEmployees(supabase) {
  const { data, error } = await supabase
    .from('performance_employees')
    .select('id,display_name,role')
    .eq('active', true)
    .order('display_name', { ascending: true });
  if (error) throw error;
  return (data ?? [])
    .filter(employee => isUuid(employee?.id) && typeof employee?.display_name === 'string')
    .map(employee => Object.freeze({
      id: employee.id,
      displayName: employee.display_name.trim().slice(0, 120),
      role: String(employee.role || '').slice(0, 40),
    }));
}

function adminMarkup(employees) {
  const options = employees.map(employee => (
    `<option value="${esc(employee.id)}">${esc(employee.displayName)}${employee.role ? ` — ${esc(employee.role)}` : ''}</option>`
  )).join('');

  return `<div class="performance-web-card performance-web-security" id="${ADMIN_CARD_ID}">
    <p class="performance-eyebrow">ADMIN TESTING</p>
    <h3>Issue a one-time device code</h3>
    <p>For controlled testing only. The code expires in 10 minutes and should be entered only on the assigned employee's private company-controlled browser or device.</p>
    <form id="${ADMIN_FORM_ID}" autocomplete="off">
      <label for="${ADMIN_EMPLOYEE_ID}">Employee</label>
      <select id="${ADMIN_EMPLOYEE_ID}" class="input" required>
        <option value="">Select employee</option>
        ${options}
      </select>
      <button class="btn secondary" type="submit">ISSUE ONE-TIME CODE</button>
    </form>
    <div id="${ADMIN_STATUS_ID}" role="status" aria-live="polite"></div>
  </div>`;
}

function showIssuedCode(result) {
  const status = document.getElementById(ADMIN_STATUS_ID);
  if (!status) return;
  status.replaceChildren();

  const employee = document.createElement('p');
  employee.textContent = `Code for ${result.employee?.displayName || 'selected employee'}:`;
  const codeLine = document.createElement('p');
  const code = document.createElement('code');
  code.textContent = result.token;
  codeLine.appendChild(code);
  const expiry = document.createElement('p');
  const expiresAt = new Date(result.expiresAt);
  expiry.textContent = Number.isNaN(expiresAt.valueOf())
    ? 'One-time code expires shortly.'
    : `Expires ${expiresAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}.`;
  const warning = document.createElement('p');
  warning.textContent = 'Use once. Do not text, email, log, or store this code after enrollment.';
  const clear = document.createElement('button');
  clear.id = ADMIN_CLEAR_CODE_ID;
  clear.className = 'btn secondary';
  clear.type = 'button';
  clear.textContent = 'CLEAR CODE';
  clear.addEventListener('click', () => status.replaceChildren(), { once: true });

  status.append(employee, codeLine, expiry, warning, clear);
}

function showAdminError(error) {
  const status = document.getElementById(ADMIN_STATUS_ID);
  if (!status) return;
  status.textContent = `Enrollment code was not issued. ${safeMessage(error)}`;
}

function bindAdminForm(supabase) {
  const form = document.getElementById(ADMIN_FORM_ID);
  form?.addEventListener('submit', async event => {
    event.preventDefault();
    const select = document.getElementById(ADMIN_EMPLOYEE_ID);
    const employeeId = String(select?.value || '').trim();
    if (!isUuid(employeeId)) {
      showAdminError(new Error('Select an active employee'));
      return;
    }

    const submit = form.querySelector('button[type="submit"]');
    if (submit) submit.disabled = true;
    const status = document.getElementById(ADMIN_STATUS_ID);
    if (status) status.textContent = 'Creating a protected one-time enrollment code…';

    try {
      const authorization = await validateTrustedDeviceSession({ supabase, signOutWhenInvalid: true });
      if (authorization.status !== 'READY' || !canManageWebEnrollments(authorization.role)) {
        throw new Error('Manager or admin authorization is required');
      }
      const result = await mintEnrollment({ supabase, employeeId, expiresMinutes: 10 });
      if (typeof result?.token !== 'string' || result.token.length < 40 || !isUuid(result?.employee?.id)) {
        throw new Error('Enrollment service returned an invalid one-time code');
      }
      showIssuedCode(result);
    } catch (error) {
      showAdminError(error);
    } finally {
      if (submit) submit.disabled = false;
    }
  });
}

async function installAdminTools() {
  if (installInFlight || document.getElementById(ADMIN_CARD_ID)) return;
  const securityCard = document.querySelector('.performance-web-security');
  if (!securityCard) return;

  installInFlight = true;
  try {
    const authorized = await resolveAuthorizedAdmin();
    if (!authorized || document.getElementById(ADMIN_CARD_ID)) return;
    const employees = await loadActiveEmployees(authorized.supabase);
    if (!employees.length) return;

    securityCard.insertAdjacentHTML('beforebegin', adminMarkup(employees));
    bindAdminForm(authorized.supabase);
  } catch {
    // The ordinary Performance screen remains usable when admin tools cannot load.
  } finally {
    installInFlight = false;
  }
}

function observePerformanceRoot() {
  const main = document.getElementById('main');
  if (!main || typeof MutationObserver === 'undefined') return;
  const observer = new MutationObserver(() => { void installAdminTools(); });
  observer.observe(main, { childList: true, subtree: true });
  void installAdminTools();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', observePerformanceRoot, { once: true });
} else {
  observePerformanceRoot();
}

export const PerformanceWebAdminEnrollmentInvariants = Object.freeze([
  'manager enrollment tools are rendered only after a READY trusted-device session resolves to manager or admin',
  'the browser uses the existing JWT-protected performance-enrollment-mint function and never receives a service-role or secret key',
  'employee choices come from active performance employee records and are never hard-coded into the client',
  'plaintext enrollment codes are shown only in transient DOM state and are never written to localStorage or console output',
  'the protected server function remains the final authorization boundary for every enrollment mint',
  'admin testing tools do not change GPS, shift, Lookup, University, KPI/pay, municipality, or employee-rollout controls',
]);
