# shows-api v91 recovery control

## Scope

This is a non-deploying recovery/control artifact for GitHub issue #511. It does not modify the live Supabase function, annual-plan rows, historical-audit rows, Current Shows, payments, bookings, organizer actions, profile relations, or Layer 3.

## Active production identity

Read back from Supabase project `taxlrlfsobtnbasjcnuf` on 2026-09-14:

- function slug: `shows-api`
- status: `ACTIVE`
- active version: `91`
- function id: `aa84a894-0ba4-451e-961d-7371937c7906`
- `verify_jwt`: `false`
- import map: present
- entrypoint: `index.ts`
- import-map file: `deno.json`
- active deployment bundle SHA-256: `05ea0d044045427d36b2fe780cfcbf9de272ccb89a2baeb1e7e062469191451d`
- `deno.json`: `{"compilerOptions":{"lib":["deno.window"]}}`

The Supabase management read successfully returned the exact active `index.ts` and `deno.json`. The full active source is therefore recoverable from the provider. This repository artifact intentionally does **not** claim that the complete v91 source has already been losslessly copied into GitHub; that remains an acceptance criterion before any production redeploy.

## Confirmed legacy defect

The active v91 `annualPlan` branch currently selects the newest READY run:

```ts
const latest=await db.from('shows_app_annual_plan_runs')
  .select('id,plan_year,status,created_at,source_scope,notes,row_count')
  .eq('plan_year',year).eq('status','READY')
  .order('created_at',{ascending:false}).limit(1);
if(latest.error)return out(r,{ok:false,error:'Unable to load annual plan'},500);
const run=latest.data?.[0]||null;
```

That behavior predates the READY-versus-PUBLISHED split. It is non-authoritative and must not define public currentness.

On the current 2027 database there are 16 READY runs. The newest READY run currently happens to equal the publication pointer (`83a90da8-d460-413f-8ca4-7735bcbe0f88`, R19), so the defect is latent today but would surface as soon as a newer READY-but-unpublished candidate exists.

## Minimal replacement selector

The safest compatibility correction preserves the existing v1 response shape and all row fields/order while changing only run selection:

```ts
const publication=await db.from('shows_app_annual_plan_publication')
  .select('run_id')
  .eq('plan_year',year)
  .maybeSingle();
if(publication.error)return out(r,{ok:false,error:'Unable to load annual plan'},500);
const publishedRunId=String(publication.data?.run_id||'');
if(!publishedRunId)return out(r,{ok:true,version:1,year,run:null,summary:{rows:0,profiles:0,pursue:0,watch:0,research:0,exact:0,expected:0,conflicts:0},rows:[]});

const selected=await db.from('shows_app_annual_plan_runs')
  .select('id,plan_year,status,created_at,source_scope,notes,row_count')
  .eq('id',publishedRunId)
  .eq('plan_year',year)
  .eq('status','READY')
  .maybeSingle();
if(selected.error)return out(r,{ok:false,error:'Unable to load annual plan'},500);
const run=selected.data||null;
if(!run)return out(r,{ok:false,error:'Unable to load annual plan'},500);
```

No login, session, authentication, bootstrap, catalog, catalog-history, conflict, show-update, payment-update, or payment-calculation code needs to change.

## Read-only selector validation

A direct database simulation of the proposed selector returned:

- published run: `83a90da8-d460-413f-8ca4-7735bcbe0f88`
- published run status: `READY`
- 291 rows
- 284 profiles
- 45 PURSUE
- 246 WATCH
- 0 RESEARCH
- 151 exact
- 102 expected-month
- 176 conflict-note rows

The existing v1 contract can therefore be preserved while removing newest-READY semantics.

## Mandatory source-capture gate before deployment

Before any `shows-api` deployment:

1. Export the complete active v91 `index.ts` and `deno.json` directly from Supabase into this repository without manual reconstruction.
2. Record the provider bundle hash above beside the captured source.
3. Produce a mechanical diff proving the only semantic change is the `annualPlan` run selector unless a separately reviewed operating-API change is explicitly authorized.
4. Preserve `verify_jwt=false` unless a separate authentication migration is intentionally authorized; v91 implements its own write-session authentication for write actions.
5. Establish rollback to the exact captured v91 source/package before deployment.
6. Run the governed annual-read verifier, production scope/history verifier, legacy annual compatibility verifier, and full mature smoke against the deployment candidate.
7. Exercise unauthenticated write rejection and authenticated write-session behavior before closeout.
8. Prove a READY-but-unpublished candidate cannot become visible through `shows-api?action=annualPlan`.

## Rollback rule

If any operating regression appears after a future v92 deployment, redeploy the exact captured v91 source/package and confirm the active provider bundle identity before any further change. Do not reconstruct rollback source from this document.
