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


def verify_scope_contract_current():
    path = Path('/tmp/annual_plan.html')
    if not path.exists():
        raise AssertionError('annual plan DOM was not produced by mature deep-link step')
    dom = path.read_text(encoding='utf-8')
    annual = post_current_annual_plan()
    run_id, expected = annual_metrics(annual)
    rows = annual.get('rows') or []

    keys = (
        'EAST_COAST_FLORIDA',
        'WEST_COAST_FLORIDA',
        'CENTRAL_FLORIDA',
        'NORTHERN_FLORIDA',
        'PANHANDLE_FLORIDA',
        'B2B',
    )
    def scope(row):
        return 'B2B' if row.get('planning_category') == 'B2B' else row.get('geographic_region')

    expected_counts = {key: sum(scope(row) == key for row in rows) for key in keys}
    pairs = re.findall(r'data-annual-scope="([A-Z0-9_]+)"[^>]*>[^<]*?([0-9]+)</button>', dom)
    counts = {key: int(value) for key, value in pairs}
    assert counts == expected_counts, (counts, expected_counts)
    assert sum(counts.values()) == len(rows), (counts, len(rows))
    assert counts.get('EAST_COAST_FLORIDA', 0) > 0, counts
    assert re.search(r'class="chip active" data-annual-scope="EAST_COAST_FLORIDA"', dom), 'East Coast scope is not active by default'

    east_rows = [row for row in rows if scope(row) == 'EAST_COAST_FLORIDA']
    east_profiles = len({row.get('profile_id') for row in east_rows})
    east_pursue = sum(row.get('plan_decision') == 'PURSUE' for row in east_rows)
    east_watch = sum(row.get('plan_decision') == 'WATCH' for row in east_rows)
    east_research = sum(row.get('plan_decision') == 'RESEARCH_IDENTITY' for row in east_rows)

    header = re.search(r'<h2>2027 booking plan</h2><p>([0-9]+) plan rows · ([0-9]+) profiles', dom)
    assert header, dom[:2500]
    assert int(header.group(1)) == len(east_rows), header.groups()
    assert int(header.group(2)) == east_profiles, header.groups()
    assert f'Pursue {east_pursue}' in dom
    assert f'Watch {east_watch}' in dom
    assert f'Research {east_research}' in dom

    top = re.search(r'data-show-mode="PLAN2027"[^>]*>2027 Plan ([0-9]+)</button>', dom)
    assert top, dom[:2500]
    assert int(top.group(1)) == len(rows), top.group(1)

    for row in east_rows:
        assert f'data-plan-id="{row.get("plan_id")}"' in dom, ('East row missing from default DOM', row.get('plan_id'))
    for row in rows:
        if scope(row) != 'EAST_COAST_FLORIDA':
            assert f'data-plan-id="{row.get("plan_id")}"' not in dom, ('Non-East row leaked into default DOM', row.get('plan_id'), scope(row))

    print({
        'annual_default_scope': 'PASS',
        'run_id': run_id,
        'scope_counts': counts,
        'visible_rows': len(east_rows),
        'visible_profiles': east_profiles,
        'statewide_rows': len(rows),
        'structured_estimates': expected['estimated'],
        'broad_estimates': expected['broad_estimated'],
    })


base.verify_scope_contract = verify_scope_contract_current

if __name__ == '__main__':
    if not os.environ.get('ANNUAL_API'):
        raise RuntimeError('ANNUAL_API is required for the current-publication mature smoke')
    base.main()
