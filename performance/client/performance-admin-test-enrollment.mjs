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

function setStatus(message, kind = 'info') {
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.dataset.kind = kind;
}

function clearPlaintextCode() {
  currentPlaintextCode = '';
  if (codeEl) codeEl.textContent = '';
}

function displayName(employee) {
  return `${employee.display_name} — ${employee.role}`;
}

async function loadActiveAdminTesters(supabase) {
  const { data, error } = await supabase
    .from('performance_employees')
    .select('id,display_name,role,active')
    .eq('active', true)
    .eq('role', AUTHORIZED_TEST_ROLE)
    .order('display_name', { ascending: true });
  if (error) throw error;
  return (data ?? []).filter(employee => employee?.id && employee?.display_name && employee?.active === true && employee?.role === AUTHORIZED_TEST_ROLE);
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

  if (session.status !== 'READY' || session.role !== AUTHORIZED_TEST_ROLE) {
    setStatus('This page requires an enrolled Paradise admin test browser. No enrollment code was issued.', 'error');
    return;
  }

  let employees;
  try {
    employees = await loadActiveAdminTesters(supabase);
  } catch {
    setStatus('Could not load the active admin test list. No enrollment code was issued.', 'error');
    return;
  }

  if (!employees.length) {
    setStatus('No active Paradise admin testers are available for test enrollment.', 'error');
    return;
  }

  populateEmployees(employees, session.employeeId);
  form.hidden = false;
  setStatus('Authorized admin test browser. Issue a short-lived one-time code only for the intended admin tester.', 'success');

  form.addEventListener('submit', async event => {
    event.preventDefault();
    clearPlaintextCode();
    resultCard.hidden = true;
    if (issueButton) issueButton.disabled = true;

    const employeeId = employeeSelect.value;
    const selectedEmployee = employees.find(employee => employee.id === employeeId && employee.role === AUTHORIZED_TEST_ROLE);
    const expiresMinutes = Number(expiresSelect.value || 10);
    if (!selectedEmployee) {
      setStatus('Select a valid active admin tester.', 'error');
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
      setStatus('One-time admin test enrollment issued. It is short-lived and the plaintext is not persisted by this page.', 'success');
    } catch {
      clearPlaintextCode();
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

  window.addEventListener('pagehide', clearPlaintextCode, { once: true });
}

void bootAdminTestEnrollment();

export const PerformanceAdminTestEnrollmentInvariants = Object.freeze([
  'the page requires an existing READY trusted-device session with admin role before showing enrollment controls',
  'the test page offers active admin employee records only and cannot be used for employee-wide enrollment',
  'the server-side performance-enrollment-mint function independently enforces manager/admin authorization',
  'the one-time token is generated server-side, remains short-lived, and is not persisted by this page',
  'no Supabase secret or service-role credential is present in the browser',
  'no direct client write to performance_enrollment_tokens is used',
  'this surface is controlled admin testing only and does not authorize employee rollout',
]);
