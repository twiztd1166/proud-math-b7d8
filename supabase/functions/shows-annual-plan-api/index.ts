const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const deploymentId = Deno.env.get('DENO_DEPLOYMENT_ID') || '';
const deploymentVersion = deploymentId.split('_').at(-1) || 'local';

const ORIGINS = new Set([
  'https://paradise-shows-pe12.vercel.app',
  'https://paradise-shows-1bas3du7d-pe12.vercel.app',
  'https://paradise-shows-open.anthonybeckner.chatgpt.site',
  'https://taxlrlfsobtnbasjcnuf.supabase.co',
  'https://twiztd1166.github.io',
  'https://paradise-shows-public.proud-math-b7d8.pages.dev',
  'capacitor://localhost',
  'https://paradise-shows-history-preview-pe12.vercel.app',
  'https://paradise-shows-history-preview-mm1r2q63x-pe12.vercel.app',
]);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const cors = (r: Request) => {
  const origin = r.headers.get('origin') || '';
  return {
    ...(ORIGINS.has(origin) ? { 'Access-Control-Allow-Origin': origin } : {}),
    'Access-Control-Allow-Headers': 'content-type, authorization',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Vary': 'Origin',
  };
};

const out = (r: Request, x: unknown, status = 200) => new Response(JSON.stringify(x), {
  status,
  headers: {
    ...cors(r),
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'X-Paradise-Deployment-Version': deploymentVersion,
  },
});

function validYear(value: unknown) {
  const year = Number(value ?? 2027);
  return Number.isInteger(year) && year >= 2026 && year <= 2035 ? year : null;
}

async function rest(table: string, params: URLSearchParams) {
  if (!SUPABASE_URL || !KEY) throw new Error('SUPABASE_RUNTIME_CONFIG_MISSING');
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`, {
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      Accept: 'application/json',
    },
  });
  if (!response.ok) throw new Error(`POSTGREST_${response.status}`);
  return response.json();
}

function planningDate(row: any, year: number) {
  if (row.event_start) return String(row.event_start);
  if (row.estimated_start) return String(row.estimated_start);
  const month = Number(row.expected_month);
  if (Number.isInteger(month) && month >= 1 && month <= 12) return `${year}-${String(month).padStart(2, '0')}-15`;
  if (row.schedule_type === 'ON_DEMAND') return `${year}-12-30`;
  return '9999-12-31';
}

const decisionRank: Record<string, number> = { PURSUE: 0, WATCH: 1, RESEARCH_IDENTITY: 2 };
const priorityRank: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };

function canonicalSort(a: any, b: any, year: number) {
  return planningDate(a, year).localeCompare(planningDate(b, year))
    || (decisionRank[String(a.plan_decision || '')] ?? 9) - (decisionRank[String(b.plan_decision || '')] ?? 9)
    || (priorityRank[String(a.priority || '')] ?? 9) - (priorityRank[String(b.priority || '')] ?? 9)
    || String(a.canonical_event || '').localeCompare(String(b.canonical_event || ''))
    || String(a.plan_id || '').localeCompare(String(b.plan_id || ''));
}

Deno.serve(async (r: Request) => {
  if (r.method === 'OPTIONS') return new Response('ok', { headers: cors(r) });

  try {
    let requestedYear: unknown = 2027;
    let requestedRunId = '';
    if (r.method === 'GET') {
      const url = new URL(r.url);
      requestedYear = url.searchParams.get('year') || 2027;
      requestedRunId = String(url.searchParams.get('runId') || '').trim();
    } else if (r.method === 'POST') {
      let body: any;
      try { body = await r.json(); } catch { return out(r, { ok: false, error: 'Invalid JSON' }, 400); }
      if (body.action && String(body.action) !== 'annualPlan') return out(r, { ok: false, error: 'Unknown action' }, 400);
      requestedYear = body.year ?? 2027;
      requestedRunId = String(body.runId || '').trim();
    } else {
      return out(r, { ok: false, error: 'GET or POST required' }, 405);
    }

    const year = validYear(requestedYear);
    if (year === null) return out(r, { ok: false, error: 'Valid annual plan year required' }, 400);
    if (requestedRunId && !UUID_RE.test(requestedRunId)) return out(r, { ok: false, error: 'Valid annual plan run required' }, 400);

    const publicationParams = new URLSearchParams({
      select: 'plan_year,run_id,published_at,published_by,notes',
      plan_year: `eq.${year}`,
      limit: '1',
    });
    const publications = await rest('shows_app_annual_plan_publication', publicationParams) as any[];
    const publication = publications?.[0] || null;

    const selectedRunId = requestedRunId || String(publication?.run_id || '');
    if (!selectedRunId) return out(r, {
      ok: true,
      version: 3,
      year,
      publication,
      requested_run_id: requestedRunId || null,
      published: false,
      run: null,
      summary: { rows: 0, profiles: 0, pursue: 0, watch: 0, research: 0, exact: 0, expected: 0, estimated: 0, broad_estimated: 0, conflicts: 0 },
      rows: [],
    });

    const runParams = new URLSearchParams({
      select: 'id,plan_year,status,created_at,source_scope,notes,row_count',
      id: `eq.${selectedRunId}`,
      plan_year: `eq.${year}`,
      status: 'eq.READY',
      limit: '1',
    });
    const runs = await rest('shows_app_annual_plan_runs', runParams) as any[];
    const run = runs?.[0] || null;
    if (!run) {
      if (requestedRunId) return out(r, { ok: false, error: 'READY annual plan run not found' }, 404);
      return out(r, { ok: false, error: 'Published annual plan run unavailable' }, 500);
    }

    const planParams = new URLSearchParams({
      select: 'plan_id,plan_year,profile_id,canonical_event,occurrence_label,coverage_class,plan_decision,priority,publication_status,date_confidence,event_start,event_end,expected_month,expected_window_text,action_start,action_due,action_window_text,cost_status,budget_min,budget_max,budget_basis,placement_reference,historical_signal,next_action,source_basis,source_refs,mfc_ids,schedule_type,conflict_notes,geographic_region,planning_category,estimated_start,estimated_end,estimate_confidence,estimate_basis',
      run_id: `eq.${run.id}`,
      limit: '1000',
    });
    const plan = await rest('shows_app_annual_plan', planParams) as any[];
    const rows = (plan || []).sort((a: any, b: any) => canonicalSort(a, b, year));

    const summary = {
      rows: rows.length,
      profiles: new Set(rows.map((x: any) => x.profile_id)).size,
      pursue: rows.filter((x: any) => x.plan_decision === 'PURSUE').length,
      watch: rows.filter((x: any) => x.plan_decision === 'WATCH').length,
      research: rows.filter((x: any) => x.plan_decision === 'RESEARCH_IDENTITY').length,
      exact: rows.filter((x: any) => !!x.event_start).length,
      expected: rows.filter((x: any) => !x.event_start && !!x.expected_month).length,
      estimated: rows.filter((x: any) => !!x.estimated_start).length,
      broad_estimated: rows.filter((x: any) => !!x.estimated_start && !x.expected_month).length,
      conflicts: rows.filter((x: any) => !!String(x.conflict_notes || '').trim()).length,
    };

    return out(r, {
      ok: true,
      version: 3,
      year,
      publication,
      requested_run_id: requestedRunId || null,
      published: Boolean(publication && String(publication.run_id) === String(run.id)),
      run,
      summary,
      rows,
    });
  } catch {
    return out(r, { ok: false, error: 'Unable to load annual plan' }, 500);
  }
});
