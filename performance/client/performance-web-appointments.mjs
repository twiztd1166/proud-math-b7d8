import {
  WEB_ROUTE_MAX_ACCURACY_METERS,
  qualifiedRoutePoints,
  splitTrackedSegments,
} from './performance-web-summary.mjs';

export const PERFORMANCE_WEB_APPOINTMENTS_VERSION = '2026.08.21-web-appointments-v1';
export const WEB_APPOINTMENT_PIN_MAX_ACCURACY_METERS = 100;

function finite(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function text(value) {
  const valueText = String(value ?? '').trim();
  return valueText || null;
}

function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function localAppointmentIso(dateValue, timeValue) {
  const date = String(dateValue || '').trim();
  const time = String(timeValue || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Choose an appointment date');
  if (!/^\d{2}:\d{2}$/.test(time)) throw new Error('Choose an appointment time');
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const appointment = new Date(year, month - 1, day, hour, minute, 0, 0);
  if (
    Number.isNaN(appointment.valueOf()) ||
    appointment.getFullYear() !== year ||
    appointment.getMonth() !== month - 1 ||
    appointment.getDate() !== day ||
    appointment.getHours() !== hour ||
    appointment.getMinutes() !== minute
  ) throw new Error('Appointment date/time is invalid');
  return appointment.toISOString();
}

export function normalizeAppointmentDraft(draft = {}) {
  const customerName = text(draft.customerName);
  if (!customerName) throw new Error('Customer name is required');
  return Object.freeze({
    customerName,
    customerPhone: text(draft.customerPhone),
    confirmedCustomerAddress: text(draft.confirmedCustomerAddress),
    product: text(draft.product),
    appointmentAt: localAppointmentIso(draft.appointmentDate, draft.appointmentTime),
  });
}

export function buildAppointmentSetPayload({
  draft,
  employeeId,
  shiftId,
  deviceId,
  capturedAt,
  location = null,
}) {
  const normalized = normalizeAppointmentDraft(draft);
  const captured = new Date(capturedAt);
  if (Number.isNaN(captured.valueOf())) throw new Error('Set captured time is invalid');
  const latitude = finite(location?.latitude);
  const longitude = finite(location?.longitude);
  const accuracyMeters = finite(location?.accuracyMeters ?? location?.accuracy);
  const validCoordinates = latitude !== null && longitude !== null && latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
  return Object.freeze({
    employeeId,
    originShiftId: shiftId,
    createdDeviceId: deviceId,
    customerName: normalized.customerName,
    customerPhone: normalized.customerPhone,
    confirmedCustomerAddress: normalized.confirmedCustomerAddress,
    product: normalized.product,
    appointmentAt: normalized.appointmentAt,
    latitude: validCoordinates ? latitude : null,
    longitude: validCoordinates ? longitude : null,
    accuracyMeters: validCoordinates && accuracyMeters !== null && accuracyMeters >= 0 ? accuracyMeters : null,
    quickSet: false,
    status: 'open',
  });
}

function serverAppointment(row) {
  const clientSetId = String(row?.client_set_id ?? row?.clientSetId ?? '');
  if (!clientSetId) return null;
  return {
    clientSetId,
    id: row?.id ?? null,
    originShiftId: row?.origin_shift_id ?? row?.originShiftId ?? null,
    customerName: text(row?.customer_name ?? row?.customerName) ?? 'Appointment',
    customerPhone: text(row?.customer_phone ?? row?.customerPhone),
    confirmedCustomerAddress: text(row?.confirmed_customer_address ?? row?.confirmedCustomerAddress),
    product: text(row?.product),
    appointmentAt: row?.appointment_at ?? row?.appointmentAt ?? null,
    setCapturedAt: row?.set_captured_at ?? row?.setCapturedAt ?? row?.capturedAt ?? null,
    latitude: finite(row?.set_latitude ?? row?.latitude),
    longitude: finite(row?.set_longitude ?? row?.longitude),
    accuracyMeters: finite(row?.set_accuracy_meters ?? row?.accuracyMeters),
    quickSet: row?.quick_set === true || row?.quickSet === true,
    status: String(row?.status ?? 'open'),
    syncState: row?.syncState ?? 'SYNCED',
  };
}

function pendingAppointment(write) {
  if (write?.kind !== 'SET') return null;
  const p = write.payload || {};
  return serverAppointment({
    clientSetId: write.id,
    originShiftId: p.originShiftId,
    customerName: p.customerName,
    customerPhone: p.customerPhone,
    confirmedCustomerAddress: p.confirmedCustomerAddress,
    product: p.product,
    appointmentAt: p.appointmentAt,
    setCapturedAt: write.capturedAt,
    latitude: p.latitude,
    longitude: p.longitude,
    accuracyMeters: p.accuracyMeters,
    quickSet: p.quickSet,
    status: p.status,
    syncState: write.state === 'REJECTED' ? 'NEEDS_ATTENTION' : 'PENDING',
  });
}

export function mergeAppointments(serverRows = [], pendingWrites = []) {
  const rows = new Map();
  for (const row of serverRows) {
    const appointment = serverAppointment(row);
    if (appointment) rows.set(appointment.clientSetId, appointment);
  }
  for (const write of pendingWrites) {
    const appointment = pendingAppointment(write);
    if (appointment && !rows.has(appointment.clientSetId)) rows.set(appointment.clientSetId, appointment);
  }
  return Array.from(rows.values()).sort((a, b) => {
    const aTime = Date.parse(a.appointmentAt || a.setCapturedAt || '') || 0;
    const bTime = Date.parse(b.appointmentAt || b.setCapturedAt || '') || 0;
    return aTime - bTime || String(a.clientSetId).localeCompare(String(b.clientSetId));
  });
}

export function appointmentHasPin(appointment, maxAccuracyMeters = WEB_APPOINTMENT_PIN_MAX_ACCURACY_METERS) {
  const latitude = finite(appointment?.latitude);
  const longitude = finite(appointment?.longitude);
  const accuracy = finite(appointment?.accuracyMeters);
  return latitude !== null && longitude !== null && latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180 && accuracy !== null && accuracy >= 0 && accuracy <= maxAccuracyMeters;
}

export function formatAppointmentAt(value) {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return 'Time not set';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function radians(value) {
  return Number(value) * Math.PI / 180;
}

export function renderPinnedRouteTrace(routePoints = [], appointments = [], { width = 320, height = 180 } = {}) {
  const route = qualifiedRoutePoints(routePoints, WEB_ROUTE_MAX_ACCURACY_METERS);
  const pins = appointments.map((appointment, index) => ({ ...appointment, appointmentIndex: index + 1 })).filter(appointment => appointmentHasPin(appointment));
  if (!route.length && !pins.length) {
    return '<div class="performance-route-empty">Route and appointment pins appear after a qualified GPS fix.</div>';
  }

  const boundsRows = [
    ...route.map(point => ({ latitude: point.latitude, longitude: point.longitude })),
    ...pins.map(pin => ({ latitude: pin.latitude, longitude: pin.longitude })),
  ];
  const averageLatitude = boundsRows.reduce((sum, row) => sum + row.latitude, 0) / boundsRows.length;
  const cosLat = Math.max(0.2, Math.cos(radians(averageLatitude)));
  const projectedBounds = boundsRows.map(row => ({ x: row.longitude * cosLat, y: row.latitude }));
  const xs = projectedBounds.map(point => point.x);
  const ys = projectedBounds.map(point => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const spanX = Math.max(maxX - minX, 0.000001);
  const spanY = Math.max(maxY - minY, 0.000001);
  const pad = 22;
  const plotWidth = width - pad * 2;
  const plotHeight = height - pad * 2;
  const scale = Math.min(plotWidth / spanX, plotHeight / spanY);
  const usedWidth = spanX * scale;
  const usedHeight = spanY * scale;
  const offsetX = pad + (plotWidth - usedWidth) / 2;
  const offsetY = pad + (plotHeight - usedHeight) / 2;
  const project = row => ({
    ...row,
    x: offsetX + ((row.longitude * cosLat) - minX) * scale,
    y: height - (offsetY + (row.latitude - minY) * scale),
  });
  const routeScreen = route.map(project);
  const pinScreen = pins.map(project);
  const segments = splitTrackedSegments(routeScreen);
  const polylines = segments
    .filter(segment => segment.length > 1)
    .map((segment, index) => `<polyline data-route-segment="${index + 1}" points="${segment.map(point => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' ')}" class="performance-route-line"></polyline>`)
    .join('');
  const routeMarkers = routeScreen.length ? `<circle cx="${routeScreen[0].x.toFixed(1)}" cy="${routeScreen[0].y.toFixed(1)}" r="5" class="performance-route-start"></circle><circle cx="${routeScreen.at(-1).x.toFixed(1)}" cy="${routeScreen.at(-1).y.toFixed(1)}" r="6" class="performance-route-current"></circle>` : '';
  const pinMarkup = pinScreen.map(pin => `<g class="performance-appointment-pin" data-performance-appointment-pin="${esc(pin.clientSetId)}" role="button" tabindex="0" aria-label="Appointment ${pin.appointmentIndex}: ${esc(pin.customerName)}">
      <title>${esc(pin.customerName)} — ${esc(formatAppointmentAt(pin.appointmentAt))}${pin.product ? ` — ${esc(pin.product)}` : ''}</title>
      <circle cx="${pin.x.toFixed(1)}" cy="${pin.y.toFixed(1)}" r="10"></circle>
      <text x="${pin.x.toFixed(1)}" y="${(pin.y + 3.5).toFixed(1)}">${pin.appointmentIndex}</text>
    </g>`).join('');

  return `<svg class="performance-route-svg performance-route-svg-pinned" viewBox="0 0 ${width} ${height}" role="img" aria-label="GPS route trace with ${route.length} qualified points and ${pins.length} appointment pins">
    <rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="14" class="performance-route-bg"></rect>
    ${polylines}${routeMarkers}${pinMarkup}
  </svg>`;
}

export const PerformanceWebAppointmentInvariants = Object.freeze([
  'customer address and set-capture GPS remain separate evidence fields',
  'appointment pins require captured GPS coordinates with 100 meters or better accuracy',
  'map pin labels never expose the customer phone number',
  'the pinned route renderer uses only same-origin Paradise data and no third-party map provider',
  'route segments preserve the same accuracy, mocked-point, and hidden-gap exclusions as the web shift summary',
]);
