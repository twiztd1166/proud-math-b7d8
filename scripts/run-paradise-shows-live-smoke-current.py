#!/usr/bin/env python3
"""Current-publication compatibility layer for the preserved Paradise Shows mature smoke.

The preserved mature-smoke source remains authoritative for broad operating coverage. This wrapper
adapts only the annual-plan read assertions to the currently published READY run, while preserving
the verified LIFE-190 -> LIFE-171 historical-series reconciliation used by the operating smoke.
"""
import importlib.util
import json
import os
import re
import urllib.request
from pathlib import Path

BASE_PATH = Path(__file__).with_name('run-paradise-shows-live-smoke.py')
spec = importlib.util.spec_from_file_location('paradise_mature_smoke_base', BASE_PATH)
if spec is None or spec.loader is None:
    raise RuntimeError('Unable to load preserved mature-smoke runner')
base = importlib.util.module_from_spec(spec)
spec.loader.exec_module(base)


def post_current_annual_plan():
    api = os.environ['ANNUAL_API']
    site = os.environ['SITE']
    payload = json.dumps({'action': 'annualPlan', 'year': 2027}).encode('utf-8')
    req = urllib.request.Request(
        api,
        data=payload,
        method='POST',
        headers={
            'Origin': site,
            'Content-Type': 'application/json',
            **({'Authorization': 'Bearer ' + os.environ['PARADISE_SHOWS_CI_SESSION_TOKEN']}
               if os.environ.get('PARADISE_SHOWS_CI_SESSION_TOKEN') else {}),
        },
    )
    with urllib.request.urlopen(req, timeout=30) as response:
        return json.loads(response.read().decode('utf-8'))


def annual_metrics(annual):
    assert annual.get('ok') is True, annual
    assert annual.get('version') == 3, annual
    assert annual.get('published') is True, annual
    run = annual.get('run') or {}
    publication = annual.get('publication') or {}
    assert run.get('id'), run
    assert run.get('id') == publication.get('run_id'), (run, publication)
    assert run.get('status') == 'READY', run
    rows = annual.get('rows') or []
    assert rows and len(rows) == int(run.get('row_count') or 0), (len(rows), run)

    fixed = [r for r in rows if r.get('schedule_type') == 'FIXED_EVENT' and r.get('event_start')]
    pairs = []
    for i, a in enumerate(fixed):
        for b in fixed[i + 1:]:
            ae = a.get('event_end') or a.get('event_start')
            be = b.get('event_end') or b.get('event_start')
            if a.get('event_start') <= be and b.get('event_start') <= ae:
                pairs.append((a, b))
    pursue_pairs = [(a, b) for a, b in pairs if a.get('plan_decision') == 'PURSUE' and b.get('plan_decision') == 'PURSUE']

    summary = annual.get('summary') or {}
    expected = {
        'row_count': len(rows),
        'rows': len(rows),
        'profiles': len({r.get('profile_id') for r in rows}),
        'pursue': sum(r.get('plan_decision') == 'PURSUE' for r in rows),
        'watch': sum(r.get('plan_decision') == 'WATCH' for r in rows),
        'research': sum(r.get('plan_decision') == 'RESEARCH_IDENTITY' for r in rows),
        'exact': sum(bool(r.get('event_start')) for r in rows),
        'expected_month': sum(not r.get('event_start') and r.get('expected_month') is not None for r in rows),
        'estimated': sum(bool(r.get('estimated_start')) for r in rows),
        'broad_estimated': sum(bool(r.get('estimated_start')) and r.get('expected_month') is None for r in rows),
        'conflicts': sum(bool(str(r.get('conflict_notes') or '').strip()) for r in rows),
        'row_len': len(rows),
        'overlap_pairs': len(pairs),
        'pursue_pairs': len(pursue_pairs),
    }
    for key in ('rows','profiles','pursue','watch','research','exact','estimated','broad_estimated','conflicts'):
        assert int(summary.get(key) or 0) == int(expected[key]), (key, summary, expected)
    assert int(summary.get('expected') or 0) == int(expected['expected_month']), (summary, expected)
    return run.get('id'), expected


CURRENT_ANNUAL = post_current_annual_plan()
CURRENT_RUN, CURRENT_EXPECTED = annual_metrics(CURRENT_ANNUAL)

base.SCOPE_AWARE_ANNUAL_API_BLOCK = f"""expected = {CURRENT_EXPECTED!r}
assert run.get('id') == {CURRENT_RUN!r}, run
assert run.get('status') == 'READY', run
assert run.get('row_count') == expected['row_count'], (run, expected)
summary=x.get('summary') or {{}}
assert summary.get('rows') == expected['rows'], (summary, expected)
assert summary.get('profiles') == expected['profiles'], (summary, expected)
assert summary.get('pursue') == expected['pursue'], (summary, expected)
assert summary.get('watch') == expected['watch'], (summary, expected)
assert x.get('published') is True, x
assert (x.get('publication') or {{}}).get('run_id') == run.get('id'), x.get('publication')
assert summary.get('estimated') == expected['estimated'], (summary, expected)
assert summary.get('broad_estimated') == expected['broad_estimated'], (summary, expected)"""

_original_scope_aware = base.scope_aware_annual_api_script


def scope_aware_annual_api_script_current(script: str) -> str:
    script = _original_scope_aware(script)
    count = script.count("assert x.get('version') == 1, x")
    if count != 1:
        raise RuntimeError(f'Expected one annual response-version assertion, got {count}')
    script = script.replace("assert x.get('version') == 1, x", "assert x.get('version') == 3, x", 1)

    pattern = re.compile(r'(-o /tmp/annual-plan\.json \\\n\s*-X POST )"\$API"')
    script, count = pattern.subn(r'\1"$ANNUAL_API"', script, count=1)
    if count != 1:
        raise RuntimeError(f'Expected one annual-plan API curl target, got {count}')

    # Preserve the verified source-grain history relation independently of annual-plan revision.
    stale = "assert len(historical_2013)==66, len(historical_2013)"
    if script.count(stale) != 1:
        raise RuntimeError('Expected exactly one pre-LIFE-190 historical candidate assertion')
    replacement = """life190=profiles['LIFE-190']
assert life190.get('related_current_profile_id') == 'LIFE-171', life190
assert not life190.get('current_rebook_opportunity'), life190
assert not has_current_control(life190), life190
assert float(life190.get('lifetime_net_volume') or 0) > 0, life190
assert int(life190.get('latest_history_year') or 0) >= 2013, life190
life106=profiles['LIFE-106']
assert life106.get('related_current_profile_id') == 'LIFE-124', life106
assert life106.get('canonical_series_profile_id') == 'LIFE-124', life106
assert not any(p.get('profile_id')=='LIFE-106' for p in historical_2013), life106
assert len(historical_2013)==64, len(historical_2013)"""
    return script.replace(stale, replacement, 1)


base.scope_aware_annual_api_script = scope_aware_annual_api_script_current
base.post_annual_plan = post_current_annual_plan

_original_deep_link = base.scope_aware_deep_link_script


def scope_aware_deep_link_script_current(script: str) -> str:
    script = _original_deep_link(script)
    stale_lines = (
        "grep -q 'Identity research' /tmp/annual_plan.html",
        'grep -q \'data-plan-id="2027-LIFE-050-LEGACY-RESEARCH"\' /tmp/annual_plan.html',
    )
    for stale in stale_lines:
        count = script.count(stale)
        if count != 1:
            raise RuntimeError(f'Expected exactly one pre-audit-suppression DOM assertion, got {count}: {stale}')
        script = script.replace(stale, f": # replaced by audit-duplicate-aware verifier: {stale}", 1)

    marker = "grep -q 'Research 0' /tmp/annual_plan.html"
    count = script.count(marker)
    if count != 1:
        raise RuntimeError(f'Expected exactly one annual-plan research filter assertion, got {count}')
    script = script.replace(
        marker,
        marker + "\n"
        + "grep -q 'Audit duplicates' /tmp/annual_plan.html\n"
        + "grep -q 'audit-only duplicates preserved' /tmp/annual_plan.html",
        1,
    )
    return script


base.scope_aware_deep_link_script = scope_aware_deep_link_script_current

ANNUAL_SCOPE_KEYS = (
    'EAST_COAST_FLORIDA',
    'WEST_COAST_FLORIDA',
    'CENTRAL_FLORIDA',
    'NORTHERN_FLORIDA',
    'PANHANDLE_FLORIDA',
    'B2B',
)
ANNUAL_SCOPE_WEST_FALLBACK = {
    'LIFE-017','LIFE-025','LIFE-032','LIFE-044','LIFE-062',
    'LIFE-071','LIFE-099','LIFE-109','LIFE-124','LIFE-172',
}
ANNUAL_SCOPE_B2B_FALLBACK = {
    'HIST-108','PROSPECT-COCOA-ECONOMIC-SHOWCASE','PROSPECT-COOPERATOR-SOFL',
    'PROSPECT-FORTEM-DISASTER-RESILIENCE-EXPO','PROSPECT-LONGEVITY-SPRINGFEST',
    'PROSPECT-PB-CONDO-HOA-EXPO',
}


def annual_scope_key_current(row):
    category = str(row.get('planning_category') or '').strip().upper()
    region = str(row.get('geographic_region') or '').strip().upper()
    if category == 'B2B':
        return 'B2B'
    if region in ANNUAL_SCOPE_KEYS and region != 'B2B':
        return region
    profile = str(row.get('profile_id') or '').strip().upper()
    if profile in ANNUAL_SCOPE_B2B_FALLBACK:
        return 'B2B'
    if profile in ANNUAL_SCOPE_WEST_FALLBACK:
        return 'WEST_COAST_FLORIDA'
    return 'EAST_COAST_FLORIDA'


def annual_is_audit_duplicate(row):
    return 'DUPLICATE_SUPPRESSED' in str(row.get('publication_status') or '').upper()


def verify_scope_contract_current():
    path = Path('/tmp/annual_plan.html')
    if not path.exists():
        raise AssertionError('annual plan DOM was not produced by mature deep-link step')
    dom = path.read_text(encoding='utf-8')
    annual = post_current_annual_plan()
    run_id, expected = annual_metrics(annual)
    rows = annual.get('rows') or []

    expected_counts = {
        key: sum(annual_scope_key_current(row) == key for row in rows)
        for key in ANNUAL_SCOPE_KEYS
    }
    pairs = re.findall(
        r'data-annual-scope="([A-Z0-9_]+)"[^>]*>[^<]*?([0-9]+)</button>',
        dom,
    )
    counts = {key: int(value) for key, value in pairs}
    assert counts == expected_counts, (counts, expected_counts)
    assert sum(counts.values()) == len(rows), (counts, len(rows))
    assert counts.get('EAST_COAST_FLORIDA', 0) > 0, counts
    assert re.search(
        r'class="chip active" data-annual-scope="EAST_COAST_FLORIDA"',
        dom,
    ), 'East Coast scope is not active by default'

    east_all_rows = [
        row for row in rows
        if annual_scope_key_current(row) == 'EAST_COAST_FLORIDA'
    ]
    east_planning_rows = [
        row for row in east_all_rows
        if not annual_is_audit_duplicate(row)
    ]
    east_audit_rows = [
        row for row in east_all_rows
        if annual_is_audit_duplicate(row)
    ]
    statewide_planning_rows = [
        row for row in rows
        if not annual_is_audit_duplicate(row)
    ]
    statewide_audit_rows = [
        row for row in rows
        if annual_is_audit_duplicate(row)
    ]

    east_profiles = len({
        row.get('profile_id')
        for row in east_planning_rows
        if row.get('profile_id')
    })
    east_pursue = sum(
        row.get('plan_decision') == 'PURSUE'
        for row in east_planning_rows
    )
    east_watch = sum(
        row.get('plan_decision') == 'WATCH'
        for row in east_planning_rows
    )
    east_research = sum(
        row.get('plan_decision') == 'RESEARCH_IDENTITY'
        for row in east_planning_rows
    )

    header = re.search(
        r'<h2>2027 booking plan</h2><p>([0-9]+) planning rows · ([0-9]+) audit-only duplicates preserved · ([0-9]+) planning profiles',
        dom,
    )
    assert header, dom[:3000]
    visible_rows = int(header.group(1))
    visible_audit_rows = int(header.group(2))
    visible_profiles = int(header.group(3))
    assert visible_rows == len(east_planning_rows), (visible_rows, len(east_planning_rows))
    assert visible_audit_rows == len(east_audit_rows), (visible_audit_rows, len(east_audit_rows))
    assert visible_profiles == east_profiles, (visible_profiles, east_profiles)

    assert 'Planning rows' in dom
    assert 'Planning profiles' in dom
    assert f'Pursue {east_pursue}' in dom
    assert f'Watch {east_watch}' in dom
    assert f'Research {east_research}' in dom
    assert f'Audit duplicates {len(east_audit_rows)}' in dom
    assert 'Duplicate-suppressed legacy controls are preserved for audit/history but hidden from normal planning views' in dom

    top = re.search(
        r'data-show-mode="PLAN2027"[^>]*>2027 Plan ([0-9]+)</button>',
        dom,
    )
    assert top, dom[:3000]
    assert int(top.group(1)) == len(statewide_planning_rows), (
        top.group(1),
        len(statewide_planning_rows),
    )

    for row in east_planning_rows:
        plan_id = row.get('plan_id')
        assert f'data-plan-id="{plan_id}"' in dom, (
            'East planning row missing from default DOM',
            plan_id,
        )
    for row in east_audit_rows:
        plan_id = row.get('plan_id')
        assert f'data-plan-id="{plan_id}"' not in dom, (
            'Audit-only duplicate leaked into default DOM',
            plan_id,
        )
    for row in rows:
        if annual_scope_key_current(row) != 'EAST_COAST_FLORIDA':
            plan_id = row.get('plan_id')
            assert f'data-plan-id="{plan_id}"' not in dom, (
                'Non-East row leaked into default DOM',
                plan_id,
                annual_scope_key_current(row),
            )

    print({
        'annual_default_scope': 'PASS',
        'run_id': run_id,
        'scope_counts': counts,
        'visible_planning_rows': len(east_planning_rows),
        'visible_audit_rows': len(east_audit_rows),
        'visible_planning_profiles': east_profiles,
        'statewide_planning_rows': len(statewide_planning_rows),
        'statewide_audit_rows': len(statewide_audit_rows),
        'published_rows': len(rows),
        'structured_estimates': expected['estimated'],
        'broad_estimates': expected['broad_estimated'],
        'duplicate_suppression': 'PASS',
    })


base.verify_scope_contract = verify_scope_contract_current

if __name__ == '__main__':
    if not os.environ.get('ANNUAL_API'):
        raise RuntimeError('ANNUAL_API is required for the current-publication mature smoke')
    base.main()
