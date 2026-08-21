import { createClient } from '@supabase/supabase-js';
import {
  createPerformanceSupabaseOptions,
  mintEnrollment,
  validateTrustedDeviceSession,
} from './performance-session.mjs';

export const PERFORMANCE_ADMIN_TEST_ENROLLMENT_VERSION = '2026.08.21-admin-test-enrollment-v1';

const SUPABASE_URL = 'https://taxlrlfsobtnbasjcnuf.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_3e755MdDisPBQzzGrBVBIA_gy4uqNqr';
const AUTHORIZED_TEST_ROLE = 'admin';
const AUTHORIZED_TEST_EMPLOYEE_IDS = Object.freeze([
  'a6eb5ecc-ca82-4b83-94f3-5a0a534e3f64',
  'c10e9f21-e71e-4385-ab8b-855da0a506a3',
]);
const AUTHORIZED_TEST_EMPLOYEE_ID_SET = new Set(AUTHORIZED_TEST_EMPLOYEE_IDS);

const statusEl = document.getElementById('adminTestStatus');
const form = document.getElementById('adminTestEnrollmentForm');
const employeeSelect = document.getElementById('adminTestEmployee');
const expiresSelect = document.getElementById('adminTestExpires');
const issueButton = document.getElementById('adminTestIssue');
const resultCard = document.getElementById('adminTestResult');
const employeeNameEl = document.getElementById('adminTestEmployeeName');
const codeEl = document.getElementById('adminTestCode');
const expiryEl = document.getElementById('adminTestExpiry');
const copyButton = document.getElementById('adminTestCopy');

let currentPlaintextCode = '';
let expiryTimer = null;

function setStatus(message, kind = 'info') {
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.dataset.kind = kind;
}

function clearPlaintextCode({ hideResult = false } = {}) {
  currentPlaintextCode = '';
  if (expiryTimer) window.clearTimeout(expiryTimer);
  expiryTimer = null;
  if (codeEl) codeEl.textContent = '';
  if (hideResult && resultCard) resultCard.hidden = true;
}

function scheduleExpiryClear(expiresAt) {
  const delay = Math.max(0, Date.parse(expiresAt) - Date.now());
  expiryTimer = window.setTimeout(() => {
    clearPlaintextCode({ hideResult: true });
    setStatus('The displayed one-time code expired and was cleared. Issue a new code if testing still requires it.', 'info');
  }, Math.min(delay, 2147483647));
}

function displayName(employee) {
  return `${employee.display_name} — ${employee.role}`;
}

async function loadAuthorizedAdminTesters(supabase) {
  const { data, error } = await supabase
    .from('performance_employees')
    .select('id,display_name,role,active')
    .in('id', AUTHORIZED_TEST_EMPLOYEE_IDS)
    .eq('active', true)
    .eq('role', AUTHORIZED_TEST_ROLE)
    .order('display_name', { ascending: true });
  if (error) throw error;
  return (data ?? []).filter(employee =>
    employee?.id
    && employee?.display_name
    && employee?.active === true
    && employee?.role === AUTHORIZED_TEST_ROLE
    && AUTHORIZED_TEST_EMPLOYEE_ID_SET.has(employee.id));
}

function populateEmployees(employees, currentEmployeeId) {
  if (!employeeSelect) return;
  employeeSelect.replaceChildren();
  for (const employee of employees) {
    const option = document.createElement('option');
    option.value = employee.id;
    option.textContent = displayName(employee);
    employeeSelect.append(option);
  }

  const preferred = employees.find(employee => employee.id !== currentEmployeeId) ?? employees[0];
  if (preferred) employeeSelect.value = preferred.id;
}

async function bootAdminTestEnrollment() {
  if (!form || !employeeSelect || !expiresSelect || !resultCard) return;

  const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    createPerformanceSupabaseOptions(window.localStorage),
  );

  let session;
  try {
    session = await validateTrustedDeviceSession({ supabase, signOutWhenInvalid: true });
  } catch {
    setStatus('Admin test enrollment is unavailable. Return to Paradise Performance and verify this trusted browser.', 'error');
    return;
  }

  if (
    session.status !== 'READY'
    || session.role !== AUTHORIZED_TEST_ROLE
    || !AUTHORIZED_TEST_EMPLOYEE_ID_SET.has(session.employeeId)
  ) {
    setStatus('This page requires one of the designated enrolled Paradise admin test browsers. No enrollment code was issued.', 'error');
    return;
  }

  let employees;
  try {
    employees = await loadAuthorizedAdminTesters(supabase);
  } catch {
    setStatus('Could not load the designated admin test list. No enrollment code was issued.', 'error');
    return;
  }

  if (!employees.length) {
    setStatus('No designated Paradise admin testers are currently active for test enrollment.', 'error');
    return;
  }

  populateEmployees(employees, session.employeeId);
  form.hidden = false;
  setStatus('Authorized designated admin test browser. Issue a short-lived one-time code only for the intended admin tester.', 'success');

  form.addEventListener('submit', async event => {
    event.preventDefault();
    clearPlaintextCode({ hideResult: true });
    if (issueButton) issueButton.disabled = true;

    const employeeId = employeeSelect.value;
    const selectedEmployee = employees.find(employee =>
      employee.id === employeeId
      && employee.role === AUTHORIZED_TEST_ROLE
      && AUTHORIZED_TEST_EMPLOYEE_ID_SET.has(employee.id));
    const expiresMinutes = Number(expiresSelect.value || 10);
    if (!selectedEmployee) {
      setStatus('Select a valid designated active admin tester.', 'error');
      if (issueButton) issueButton.disabled = false;
      return;
    }

    try {
      const enrollment = await mintEnrollment({ supabase, employeeId, expiresMinutes });
      if (!enrollment?.token || !enrollment?.expiresAt) throw new Error('Enrollment function returned an incomplete result');

      currentPlaintextCode = enrollment.token;
      if (employeeNameEl) employeeNameEl.textContent = selectedEmployee.display_name;
      if (codeEl) codeEl.textContent = currentPlaintextCode;
      if (expiryEl) expiryEl.textContent = `Expires ${new Date(enrollment.expiresAt).toLocaleString()}`;
      resultCard.hidden = false;
      scheduleExpiryClear(enrollment.expiresAt);
      setStatus('One-time admin test enrollment issued. It is short-lived and the plaintext is not persisted by this page.', 'success');
    } catch {
      clearPlaintextCode({ hideResult: true });
      setStatus('Enrollment code could not be issued. No direct database fallback was attempted.', 'error');
    } finally {
      if (issueButton) issueButton.disabled = false;
    }
  });

  copyButton?.addEventListener('click', async () => {
    if (!currentPlaintextCode) return;
    try {
      await navigator.clipboard.writeText(currentPlaintextCode);
      setStatus('One-time code copied. Share only with the intended admin tester before it expires.', 'success');
    } catch {
      setStatus('Copy was unavailable. Select the displayed one-time code manually.', 'error');
    }
  });

  window.addEventListener('pagehide', () => clearPlaintextCode({ hideResult: true }), { once: true });
}

void bootAdminTestEnrollment();

export const PerformanceAdminTestEnrollmentInvariants = Object.freeze([
  'the page requires an existing READY trusted-device session with admin role and a designated admin-test employee identity before showing controls',
  'the test cohort is explicitly limited to the two designated active admin employee identities',
  'the server-side performance-enrollment-mint function independently enforces manager/admin authorization',
  'the one-time token is generated server-side, remains short-lived, is cleared on expiry or page hide, and is not persisted by this page',
  'no Supabase secret or service-role credential is present in the browser',
  'no direct client write to performance_enrollment_tokens is used',
  'this surface is controlled admin testing only and does not authorize employee rollout',
]);
