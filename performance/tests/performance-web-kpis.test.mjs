import test from 'node:test';
import assert from 'node:assert/strict';
import {
  appointmentCountForShift,
  buildRatePaceSummary,
  calculateNeutralWebKpis,
  calculateVolumePace,
  classifyRatePace,
  formatKpiPace,
  formatKpiRate,
  formatPaceStatus,
  resolveRatePaceStandard,
  visibleShiftCounts,
  workedHoursForShift,
} from '../client/performance-web-kpis.mjs';

const SHIFT_ID = '11111111-1111-4111-8111-111111111111';

function knock(id, type, capturedAt) {
  return { client_event_id: id, shift_id: SHIFT_ID, event_type: type, captured_at: capturedAt };
}

function standard(overrides = {}) {
  return {
    version_label: 'test-minimum-v1',
    applies_to_role: 'canvasser',
    applies_to_office: null,
    applies_to_team: null,
    effective_from: '2026-08-01T00:00:00.000Z',
    effective_to: null,
    metric_key: 'knocks_per_hour',
    minimum: 10,
    ...overrides,
  };
}

const paceShift = {
  id: SHIFT_ID,
  status: 'active',
  started_at: '2026-08-21T16:00:00.000Z',
};
const paceEmployee = { role: 'canvasser', office: 'East', team: 'A' };

test('worked hours remain available separately from productive knock time', () => {
  const shift = {
    status: 'active',
    started_at: '2026-08-21T16:00:00.000Z',
    finished_at: null,
    break_seconds: 900,
  };
  assert.equal(workedHoursForShift(shift, '2026-08-21T18:15:00.000Z'), 2);
});

test('finished shift uses authoritative finish and fails closed on impossible breaks', () => {
  assert.equal(workedHoursForShift({
    status: 'finished',
    started_at: '2026-08-21T16:00:00.000Z',
    finished_at: '2026-08-21T17:30:00.000Z',
    break_seconds: 1800,
  }), 1);
  assert.equal(workedHoursForShift({
    status: 'finished',
    started_at: '2026-08-21T16:00:00.000Z',
    finished_at: '2026-08-21T16:10:00.000Z',
    break_seconds: 900,
  }), null);
});

test('local count draft may temporarily supersede server counts for live feedback', () => {
  assert.deepEqual(
    visibleShiftCounts({ doors: 10, conversations: 3 }, { doors: 12, conversations: 4 }),
    { doors: 12, conversations: 4 },
  );
});

test('appointment counting deduplicates server and pending SET ids and excludes void', () => {
  const result = appointmentCountForShift({
    shiftId: SHIFT_ID,
    serverRows: [
      { client_set_id: 'a', origin_shift_id: SHIFT_ID, status: 'open' },
      { client_set_id: 'b', origin_shift_id: SHIFT_ID, status: 'void' },
    ],
    pendingWrites: [
      { id: 'a', kind: 'SET', payload: { originShiftId: SHIFT_ID, status: 'open' } },
      { id: 'c', kind: 'SET', payload: { originShiftId: SHIFT_ID, status: 'open' } },
      { id: 'd', kind: 'SET', payload: { originShiftId: '22222222-2222-4222-8222-222222222222', status: 'open' } },
    ],
  });
  assert.deepEqual(result, { count: 2, pendingSyncCount: 1 });
});

test('neutral KPI per-hour math uses explicit productive knock time', () => {
  const kpis = calculateNeutralWebKpis({
    shift: {
      id: SHIFT_ID,
      status: 'finished',
      started_at: '2026-08-21T16:00:00.000Z',
      finished_at: '2026-08-21T20:00:00.000Z',
      break_seconds: 0,
      doors: 40,
      conversations: 12,
    },
    knockEvents: [
      knock('a', 'KNOCK_STARTED', '2026-08-21T16:30:00.000Z'),
      knock('b', 'KNOCK_STOPPED', '2026-08-21T18:30:00.000Z'),
    ],
    appointmentCount: 3,
  });
  assert.equal(kpis.workedHours, 4);
  assert.equal(kpis.knockHours, 2);
  assert.equal(kpis.doorsPerHour, 20);
  assert.equal(kpis.conversationsPerHour, 6);
  assert.equal(kpis.appointmentsPerHour, 1.5);
  assert.equal(kpis.conversationRate, 0.3);
  assert.equal(kpis.appointmentRate, 0.25);
  assert.equal(formatKpiPace(kpis.appointmentsPerHour), '1.5');
  assert.equal(formatKpiRate(kpis.conversationRate), '30.0%');
});

test('no Knock Clock evidence never falls back to total shift duration', () => {
  const kpis = calculateNeutralWebKpis({
    shift: {
      id: SHIFT_ID,
      status: 'finished',
      started_at: '2026-08-21T16:00:00.000Z',
      finished_at: '2026-08-21T20:00:00.000Z',
      break_seconds: 0,
      doors: 40,
      conversations: 12,
    },
    appointmentCount: 3,
    knockEvents: [],
  });
  assert.equal(kpis.workedHours, 4);
  assert.equal(kpis.knockHours, 0);
  assert.equal(kpis.doorsPerHour, null);
  assert.equal(kpis.conversationsPerHour, null);
  assert.equal(kpis.appointmentsPerHour, null);
  assert.equal(kpis.conversationRate, 0.3);
});

test('zero denominators render unavailable instead of fake zero performance', () => {
  const kpis = calculateNeutralWebKpis({
    shift: {
      id: SHIFT_ID,
      status: 'active',
      started_at: '2026-08-21T18:00:00.000Z',
      doors: 0,
      conversations: 0,
    },
    appointmentCount: 0,
    knockEvents: [],
    now: '2026-08-21T18:00:00.000Z',
  });
  assert.equal(kpis.doorsPerHour, null);
  assert.equal(kpis.conversationRate, null);
  assert.equal(kpis.appointmentRate, null);
  assert.equal(formatKpiPace(kpis.doorsPerHour), '—');
  assert.equal(formatKpiRate(kpis.conversationRate), '—');
});

test('rate pace fails closed when no approved effective minimum exists', () => {
  const resolution = resolveRatePaceStandard({
    standards: [],
    metricKey: 'knocks_per_hour',
    employee: paceEmployee,
    shift: paceShift,
  });
  assert.equal(resolution.status, 'GOAL_NOT_CONFIGURED');
  const pace = classifyRatePace(12, resolution, 'ACTIVE');
  assert.equal(pace.status, 'GOAL_NOT_CONFIGURED');
  assert.equal(formatPaceStatus(pace.status), 'GOAL NOT CONFIGURED');
});

test('rate pace uses one exact scoped effective minimum with no tolerance band', () => {
  const resolution = resolveRatePaceStandard({
    standards: [standard()],
    metricKey: 'knocks_per_hour',
    employee: paceEmployee,
    shift: paceShift,
  });
  assert.equal(resolution.status, 'CONFIGURED');
  assert.equal(resolution.minimum, 10);
  assert.equal(classifyRatePace(10, resolution, 'ACTIVE').status, 'ON_PACE');
  assert.equal(classifyRatePace(9.999, resolution, 'ACTIVE').status, 'OFF_PACE');
  assert.equal(classifyRatePace(12, resolution, 'ACTIVE').status, 'ON_PACE');
  assert.equal(classifyRatePace(10, resolution, 'COMPLETE').status, 'AT_OR_ABOVE_GOAL');
  assert.equal(classifyRatePace(9.999, resolution, 'LAST').status, 'BELOW_GOAL');
});

test('scoped and effective standard matching is explicit and deterministic', () => {
  assert.equal(resolveRatePaceStandard({
    standards: [standard({ applies_to_role: 'manager' })],
    metricKey: 'knocks_per_hour',
    employee: paceEmployee,
    shift: paceShift,
  }).status, 'GOAL_NOT_CONFIGURED');

  assert.equal(resolveRatePaceStandard({
    standards: [standard({ effective_from: '2026-08-22T00:00:00.000Z' })],
    metricKey: 'knocks_per_hour',
    employee: paceEmployee,
    shift: paceShift,
  }).status, 'GOAL_NOT_CONFIGURED');

  assert.equal(resolveRatePaceStandard({
    standards: [standard({ applies_to_office: 'east', applies_to_team: 'a' })],
    metricKey: 'knocks_per_hour',
    employee: paceEmployee,
    shift: paceShift,
  }).status, 'CONFIGURED');
});

test('multiple applicable standards fail closed rather than inventing scope precedence', () => {
  const resolution = resolveRatePaceStandard({
    standards: [
      standard({ version_label: 'global-v1', applies_to_role: null }),
      standard({ version_label: 'role-v1', applies_to_role: 'canvasser' }),
    ],
    metricKey: 'knocks_per_hour',
    employee: paceEmployee,
    shift: paceShift,
  });
  assert.equal(resolution.status, 'GOAL_CONFIGURATION_AMBIGUOUS');
  assert.equal(classifyRatePace(99, resolution, 'ACTIVE').status, 'GOAL_CONFIGURATION_AMBIGUOUS');
});

test('no measured Knock Clock rate never gets a false on-pace classification', () => {
  const resolution = resolveRatePaceStandard({
    standards: [standard()],
    metricKey: 'knocks_per_hour',
    employee: paceEmployee,
    shift: paceShift,
  });
  assert.equal(classifyRatePace(null, resolution, 'ACTIVE').status, 'NO_MEASURED_RATE_YET');
});

test('rate pace summary maps only supported live standard keys', () => {
  const summary = buildRatePaceSummary({
    kpis: { doorsPerHour: 11, appointmentsPerHour: 0.5 },
    standards: [
      standard({ metric_key: 'knocks_per_hour', minimum: 10, version_label: 'doors-v1' }),
      standard({ metric_key: 'sets_per_hour', minimum: 0.5, version_label: 'sets-v1' }),
    ],
    employee: paceEmployee,
    shift: paceShift,
    mode: 'ACTIVE',
  });
  assert.equal(summary.doors.status, 'ON_PACE');
  assert.equal(summary.appointments.status, 'ON_PACE');
});

test('volume pace requires explicit goal and planned hours before live classification', () => {
  assert.equal(calculateVolumePace({ actual: 20, workedHours: 4, plannedWorkHours: 8 }).status, 'GOAL_NOT_CONFIGURED');
  assert.equal(calculateVolumePace({ actual: 20, dailyGoal: 40, workedHours: 4 }).status, 'PLANNED_HOURS_NOT_CONFIGURED');
  assert.equal(calculateVolumePace({ actual: 20, dailyGoal: 40, workedHours: 0, plannedWorkHours: 8 }).status, 'PLANNED_HOURS_NOT_CONFIGURED');
});

test('volume pace math uses exact elapsed fraction and caps expected goal at full day', () => {
  const exact = calculateVolumePace({ actual: 20, dailyGoal: 40, workedHours: 4, plannedWorkHours: 8, mode: 'ACTIVE' });
  assert.equal(exact.expectedByNow, 20);
  assert.equal(exact.projectedFinish, 40);
  assert.equal(exact.status, 'ON_PACE');
  assert.equal(calculateVolumePace({ actual: 19, dailyGoal: 40, workedHours: 4, plannedWorkHours: 8 }).status, 'OFF_PACE');
  assert.equal(calculateVolumePace({ actual: 22, dailyGoal: 40, workedHours: 4, plannedWorkHours: 8 }).status, 'ON_PACE');

  const overtime = calculateVolumePace({ actual: 39, dailyGoal: 40, workedHours: 10, plannedWorkHours: 8 });
  assert.equal(overtime.expectedByNow, 40);
  assert.equal(overtime.projectedFinish, 39);
  assert.equal(overtime.status, 'OFF_PACE');
});

test('completed volume result uses final goal attainment rather than live pace wording', () => {
  assert.equal(calculateVolumePace({ actual: 40, dailyGoal: 40, mode: 'COMPLETE' }).status, 'AT_OR_ABOVE_GOAL');
  assert.equal(calculateVolumePace({ actual: 39, dailyGoal: 40, mode: 'LAST' }).status, 'BELOW_GOAL');
});
