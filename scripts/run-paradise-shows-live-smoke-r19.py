#!/usr/bin/env python3
"""R19 compatibility layer for the preserved Paradise Shows mature smoke.

The preserved source remains authoritative for the broad operating smoke. This wrapper changes
the annual-plan read contract for the publication-gated R19 API and reconciles the later verified
LIFE-190 -> LIFE-171 series relation that legitimately removes one Silver profile from the
historical candidate pool.
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

R19_RUN = '83a90da8-d460-413f-8ca4-7735bcbe0f88'

base.SCOPE_AWARE_ANNUAL_API_BLOCK = """expected_runs = {
    '0294bac9-5400-4f31-9a13-fc7897b4ddfd': {
        'row_count': 104, 'rows': 104, 'profiles': 100, 'pursue': 35, 'watch': 69,
        'research': 0, 'exact': 37, 'expected_month': 43, 'conflicts': 28,
        'row_len': 104, 'overlap_pairs': 31, 'pursue_pairs': 10,
    },
    '893343f8-8347-4c63-bfce-9eff4b351667': {
        'row_count': 107, 'rows': 107, 'profiles': 103, 'pursue': 35, 'watch': 72,
        'research': 0, 'exact': 42, 'expected_month': 42, 'conflicts': 29,
        'row_len': 107, 'overlap_pairs': 33, 'pursue_pairs': 10,
    },
    '910320e9-5942-4cb6-aa3e-5203bb1fb3e2': {
        'row_count': 112, 'rows': 112, 'profiles': 108, 'pursue': 37, 'watch': 75,
        'research': 0, 'exact': 44, 'expected_month': 45, 'conflicts': 31,
        'row_len': 112, 'overlap_pairs': 36, 'pursue_pairs': 12,
    },
    '6570ebf8-7b5f-4314-a65d-030100f644a3': {
        'row_count': 121, 'rows': 121, 'profiles': 116, 'pursue': 37, 'watch': 84,
        'research': 0, 'exact': 54, 'expected_month': 44, 'conflicts': 43,
        'row_len': 121, 'overlap_pairs': 52, 'pursue_pairs': 12,
    },
    '83a90da8-d460-413f-8ca4-7735bcbe0f88': {
        'row_count': 291, 'rows': 291, 'profiles': 284, 'pursue': 45, 'watch': 246,
        'research': 0, 'exact': 151, 'expected_month': 102, 'conflicts': 176,
        'row_len': 291, 'overlap_pairs': 381, 'pursue_pairs': 17,
    },
}
expected = expected_runs.get(run.get('id'))
assert expected is not None, run
assert run.get('status') == 'READY', run
assert run.get('row_count') == expected['row_count'], (run, expected)
summary=x.get('summary') or {}
assert summary.get('rows') == expected['rows'], (summary, expected)
assert summary.get('profiles') == expected['profiles'], (summary, expected)
assert summary.get('pursue') == expected['pursue'], (summary, expected)
assert summary.get('watch') == expected['watch'], (summary, expected)
if run.get('id') == '83a90da8-d460-413f-8ca4-7735bcbe0f88':
    assert x.get('published') is True, x
    assert (x.get('publication') or {}).get('run_id') == '83a90da8-d460-413f-8ca4-7735bcbe0f88', x.get('publication')
    assert summary.get('estimated') == 125, summary
    assert summary.get('broad_estimated') == 25, summary"""

_original_scope_aware = base.scope_aware_annual_api_script


def scope_aware_annual_api_script_r19(script: str) -> str:
    script = _original_scope_aware(script)
    count = script.count("assert x.get('version') == 1, x")
    if count != 1:
        raise RuntimeError(f'Expected one annual response-version assertion, got {count}')
    script = script.replace("assert x.get('version') == 1, x", "assert x.get('version') == 3, x", 1)
    pattern = re.compile(r'(-o /tmp/annual-plan\.json \\\n\s*-X POST )"\$API"')
    script, count = pattern.subn(r'\1"$ANNUAL_API"', script, count=1)
    if count != 1:
        raise RuntimeError(f'Expected one annual-plan API curl target, got {count}')

    # The preserved source predates the Sep. 12 verified identity relation that maps the legacy
    # LIFE-190 source-grain profile to the continuing LIFE-171 canonical series. Reconcile the
    # historical-candidate count only while also asserting the exact governed reason for the delta.
    stale = "assert len(historical_2013)==66, len(historical_2013)"
    if script.count(stale) != 1:
        raise RuntimeError('Expected exactly one pre-LIFE-190 historical candidate assertion')
    replacement = """life190=profiles['LIFE-190']
assert life190.get('related_current_profile_id') == 'LIFE-171', life190
assert not life190.get('current_rebook_opportunity'), life190
assert not has_current_control(life190), life190
assert float(life190.get('lifetime_net_volume') or 0) > 0, life190
assert int(life190.get('latest_history_year') or 0) >= 2013, life190
assert len(historical_2013)==65, len(historical_2013)"""
    script = script.replace(stale, replacement, 1)
    return script


base.scope_aware_annual_api_script = scope_aware_annual_api_script_r19


def post_annual_plan_r19():
    api = os.environ['ANNUAL_API']
    site = os.environ['SITE']
    payload = json.dumps({'action': 'annualPlan', 'year': 2027}).encode('utf-8')
    req = urllib.request.Request(
        api,
        data=payload,
        method='POST',
        headers={'Origin': site, 'Content-Type': 'application/json'},
    )
    with urllib.request.urlopen(req, timeout=30) as response:
        return json.loads(response.read().decode('utf-8'))


base.post_annual_plan = post_annual_plan_r19


def verify_scope_contract_r19():
    path = Path('/tmp/annual_plan.html')
    if not path.exists():
        raise AssertionError('annual plan DOM was not produced by mature deep-link step')
    dom = path.read_text(encoding='utf-8')
    annual = post_annual_plan_r19()
    assert annual.get('ok') is True, annual
    assert annual.get('version') == 3, annual
    assert annual.get('published') is True, annual
    assert (annual.get('publication') or {}).get('run_id') == R19_RUN, annual.get('publication')
    run = annual.get('run') or {}
    assert run.get('id') == R19_RUN, run
    assert run.get('status') == 'READY', run
    assert run.get('row_count') == 291, run

    pairs = re.findall(r'data-annual-scope="([A-Z0-9_]+)"[^>]*>[^<]*?([0-9]+)</button>', dom)
    counts = {key: int(value) for key, value in pairs}
    expected_counts = {
        'EAST_COAST_FLORIDA': 273,
        'WEST_COAST_FLORIDA': 11,
        'CENTRAL_FLORIDA': 0,
        'NORTHERN_FLORIDA': 0,
        'PANHANDLE_FLORIDA': 0,
        'B2B': 7,
    }
    assert counts == expected_counts, (counts, expected_counts)
    assert re.search(r'class="chip active" data-annual-scope="EAST_COAST_FLORIDA"', dom), 'East Coast scope is not active by default'

    header = re.search(r'<h2>2027 booking plan</h2><p>([0-9]+) plan rows · ([0-9]+) profiles', dom)
    assert header, dom[:2500]
    assert int(header.group(1)) == 273, header.groups()
    assert int(header.group(2)) == 268, header.groups()
    assert 'Pursue 40' in dom
    assert 'Watch 233' in dom
    assert 'Research 0' in dom

    top = re.search(r'data-show-mode="PLAN2027"[^>]*>2027 Plan ([0-9]+)</button>', dom)
    assert top, dom[:2500]
    assert int(top.group(1)) == 291, top.group(1)

    rows = annual.get('rows') or []
    assert len(rows) == 291, len(rows)
    assert sum(1 for row in rows if row.get('estimated_start')) == 125
    assert sum(1 for row in rows if row.get('estimated_start') and not row.get('expected_month')) == 25
    print({
        'run': R19_RUN,
        'published': annual.get('published'),
        'publication': annual.get('publication'),
        'scope_counts': counts,
        'east_rows': 273,
        'east_profiles': 268,
        'statewide_rows': 291,
        'structured_estimates': 125,
        'broad_estimates': 25,
    })


base.verify_scope_contract = verify_scope_contract_r19

if __name__ == '__main__':
    if not os.environ.get('ANNUAL_API'):
        raise RuntimeError('ANNUAL_API is required for the R19 mature smoke')
    base.main()
