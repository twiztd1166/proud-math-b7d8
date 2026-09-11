#!/usr/bin/env python3
import json
import os
import re
import subprocess
import sys
import tempfile
import urllib.request
from pathlib import Path

SOURCE = Path('scripts/debug-paradise-shows-live-source.yml')
ANNUAL_API_STEP = 'Verify live CORS and operating population'
DEEP_LINK_STEP = 'Execute show database deep links in fresh headless Chrome'

STALE_ANNUAL_API_BLOCK = """assert run.get('id') == '0294bac9-5400-4f31-9a13-fc7897b4ddfd', run
assert run.get('status') == 'READY', run
assert run.get('row_count') == 104, run
summary=x.get('summary') or {}
assert summary.get('rows') == 104, summary
assert summary.get('profiles') == 100, summary
assert summary.get('pursue') == 35, summary
assert summary.get('watch') == 69, summary"""

SCOPE_AWARE_ANNUAL_API_BLOCK = """expected_runs = {
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
}
expected = expected_runs.get(run.get('id'))
assert expected is not None, run
assert run.get('status') == 'READY', run
assert run.get('row_count') == expected['row_count'], (run, expected)
summary=x.get('summary') or {}
assert summary.get('rows') == expected['rows'], (summary, expected)
assert summary.get('profiles') == expected['profiles'], (summary, expected)
assert summary.get('pursue') == expected['pursue'], (summary, expected)
assert summary.get('watch') == expected['watch'], (summary, expected)"""

STALE_ANNUAL_API_LINES = [
    (
        "assert summary.get('research') == 0, summary",
        "assert summary.get('research') == expected['research'], (summary, expected)",
    ),
    (
        "assert summary.get('exact') == 37, summary",
        "assert summary.get('exact') == expected['exact'], (summary, expected)",
    ),
    (
        "assert summary.get('expected') == 43, summary",
        "assert summary.get('expected') == expected['expected_month'], (summary, expected)",
    ),
    (
        "assert summary.get('conflicts') == 28, summary",
        "assert summary.get('conflicts') == expected['conflicts'], (summary, expected)",
    ),
    (
        "assert len(rows) == 104, len(rows)",
        "assert len(rows) == expected['row_len'], (len(rows), expected)",
    ),
    (
        "assert len(overlap_pairs) == 31, len(overlap_pairs)",
        "assert len(overlap_pairs) == expected['overlap_pairs'], (len(overlap_pairs), expected)",
    ),
    (
        "assert len(pursue_pairs) == 10, len(pursue_pairs)",
        "assert len(pursue_pairs) == expected['pursue_pairs'], (len(pursue_pairs), expected)",
    ),
]

STALE_DEEP_LINK_LINES = [
    "grep -q '104 plan rows' /tmp/annual_plan.html",
    "grep -q 'Pursue 35' /tmp/annual_plan.html",
    "grep -q 'Watch 69' /tmp/annual_plan.html",
    "grep -q 'data-plan-id=\"2027-LIFE-062-LEGACY-RESEARCH\"' /tmp/annual_plan.html",
    "grep -q 'Florida State Fair — Feb. 4–15, 2027' /tmp/annual_plan.html",
    "grep -q 'data-plan-id=\"2027-LIFE-025-SEP\"' /tmp/annual_plan.html",
    "grep -q 'Sarasota Bradenton Home Show — Sep. 10–12, 2027' /tmp/annual_plan.html",
]


def extract_run_steps(text: str):
    lines = text.splitlines()
    steps = []
    current_name = None
    i = 0
    while i < len(lines):
        line = lines[i]
        if line.startswith('      - name: '):
            current_name = line[len('      - name: '):].strip()
        if line == '        run: |':
            i += 1
            block = []
            while i < len(lines):
                raw = lines[i]
                if raw.startswith('          '):
                    block.append(raw[10:])
                    i += 1
                    continue
                if raw == '':
                    block.append('')
                    i += 1
                    continue
                break
            steps.append((current_name or '<unnamed run step>', '\n'.join(block) + '\n'))
            continue
        i += 1
    return steps


def scope_aware_annual_api_script(script: str) -> str:
    count = script.count(STALE_ANNUAL_API_BLOCK)
    if count != 1:
        raise RuntimeError(
            f'Expected exactly one stale annual-plan API assertion block, got {count}'
        )
    script = script.replace(
        STALE_ANNUAL_API_BLOCK,
        SCOPE_AWARE_ANNUAL_API_BLOCK,
        1,
    )
    for stale, replacement in STALE_ANNUAL_API_LINES:
        count = script.count(stale)
        if count != 1:
            raise RuntimeError(
                f'Expected exactly one stale annual-plan API assertion, got {count}: {stale}'
            )
        script = script.replace(stale, replacement, 1)
    return script


def scope_aware_deep_link_script(script: str) -> str:
    for stale in STALE_DEEP_LINK_LINES:
        count = script.count(stale)
        if count != 1:
            raise RuntimeError(f'Expected exactly one stale mature-smoke assertion, got {count}: {stale}')
        script = script.replace(stale, f": # replaced by scope-aware verifier: {stale}", 1)
    return script


def run_shell_block(script: str, env: dict):
    path = None
    try:
        with tempfile.NamedTemporaryFile('w', encoding='utf-8', suffix='.sh', delete=False) as handle:
            handle.write(script)
            path = handle.name
        subprocess.run(
            ['bash', '--noprofile', '--norc', '-e', '-o', 'pipefail', path],
            check=True,
            env=env,
        )
    finally:
        if path:
            Path(path).unlink(missing_ok=True)


def post_annual_plan():
    api = os.environ['API']
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


def verify_scope_contract():
    path = Path('/tmp/annual_plan.html')
    if not path.exists():
        raise AssertionError('annual plan DOM was not produced by mature deep-link step')
    d = path.read_text(encoding='utf-8')

    annual = post_annual_plan()
    assert annual.get('ok') is True, annual
    run = annual.get('run') or {}
    run_id = run.get('id')
    expected_runs = {
        '0294bac9-5400-4f31-9a13-fc7897b4ddfd': {
            'statewide_rows': 104, 'east_rows': 92, 'east_profiles': 89,
            'east_pursue': 30, 'east_watch': 62,
        },
        '893343f8-8347-4c63-bfce-9eff4b351667': {
            'statewide_rows': 107, 'east_rows': 95, 'east_profiles': 92,
            'east_pursue': 30, 'east_watch': 65,
        },
        '910320e9-5942-4cb6-aa3e-5203bb1fb3e2': {
            'statewide_rows': 112, 'east_rows': 100, 'east_profiles': 97,
            'east_pursue': 32, 'east_watch': 68,
        },
    }
    expected = expected_runs.get(run_id)
    assert expected is not None, run
    assert run.get('status') == 'READY', run

    pairs = re.findall(
        r'data-annual-scope="([A-Z0-9_]+)"[^>]*>[^<]*?([0-9]+)</button>', d
    )
    counts = {k: int(v) for k, v in pairs}
    expected_parked = {
        'WEST_COAST_FLORIDA': 11,
        'B2B': 1,
        'CENTRAL_FLORIDA': 0,
        'NORTHERN_FLORIDA': 0,
        'PANHANDLE_FLORIDA': 0,
    }
    for key, expected_count in expected_parked.items():
        assert counts.get(key) == expected_count, (key, counts)
    assert counts.get('EAST_COAST_FLORIDA') == expected['east_rows'], (counts, expected)
    assert re.search(
        r'class="chip active" data-annual-scope="EAST_COAST_FLORIDA"', d
    ), 'East Coast scope is not active by default'

    header = re.search(
        r'<h2>2027 booking plan</h2><p>([0-9]+) plan rows · ([0-9]+) profiles', d
    )
    assert header, (counts, d[:2000])
    visible_rows = int(header.group(1))
    visible_profiles = int(header.group(2))
    assert visible_rows == expected['east_rows'], (visible_rows, expected)
    assert visible_profiles == expected['east_profiles'], (visible_profiles, expected)

    top = re.search(
        r'data-show-mode="PLAN2027"[^>]*>2027 Plan ([0-9]+)</button>', d
    )
    assert top, (counts, d[:2000])
    statewide_rows = int(top.group(1))
    assert statewide_rows == sum(counts.values()), (statewide_rows, counts)
    assert statewide_rows == expected['statewide_rows'], (statewide_rows, expected)

    assert f"Pursue {expected['east_pursue']}" in d, expected
    assert f"Watch {expected['east_watch']}" in d, expected
    assert 'Research 0' in d

    parked_dom_markers = (
        '2027-LIFE-062-LEGACY-RESEARCH',
        'Florida State Fair — Feb. 4–15, 2027',
        '2027-LIFE-025-SEP',
        'Sarasota Bradenton Home Show — Sep. 10–12, 2027',
    )
    for marker in parked_dom_markers:
        assert marker not in d, ('parked West Coast record leaked into East default', marker)

    rows = annual.get('rows') or []
    by_plan = {r.get('plan_id'): r for r in rows}
    preserved = {
        '2027-LIFE-062-LEGACY-RESEARCH': 'Florida State Fair — Feb. 4–15, 2027',
        '2027-LIFE-025-SEP': 'Sarasota Bradenton Home Show — Sep. 10–12, 2027',
    }
    for plan_id, label in preserved.items():
        row = by_plan.get(plan_id)
        assert row, (plan_id, 'missing from preserved statewide plan')
        assert row.get('occurrence_label') == label, (plan_id, row.get('occurrence_label'))

    if run_id == '910320e9-5942-4cb6-aa3e-5203bb1fb3e2':
        r7_added = {
            '2027-HIST-059-PRIMARY',
            '2027-HIST-109-PRIMARY',
            '2027-HIST-111-PRIMARY',
            '2027-HIST-122-PRIMARY',
            '2027-HIST-210-PRIMARY',
        }
        assert r7_added.issubset(by_plan), (r7_added - set(by_plan), 'missing R7 additions')
        for plan_id in r7_added:
            assert f'data-plan-id="{plan_id}"' in d, (plan_id, 'R7 East row not visible in default scope')

    print({
        'annual_default_scope': 'PASS',
        'run_id': run_id,
        'scope_counts': counts,
        'visible_rows': visible_rows,
        'visible_profiles': visible_profiles,
        'statewide_rows': statewide_rows,
        'parked_statewide_preservation': 'PASS',
    })


def main():
    source = SOURCE.read_text(encoding='utf-8')
    steps = extract_run_steps(source)
    if len(steps) != 5:
        raise RuntimeError(f'Expected exactly 5 preserved mature-smoke run steps, found {len(steps)}')
    names = [name for name, _ in steps]
    if ANNUAL_API_STEP not in names:
        raise RuntimeError('Preserved mature smoke is missing the annual-plan API step')
    if DEEP_LINK_STEP not in names:
        raise RuntimeError('Preserved mature smoke is missing the deep-link step')

    env = os.environ.copy()
    for index, (name, script) in enumerate(steps, 1):
        print(f'\n=== Preserved mature smoke {index}/{len(steps)}: {name} ===', flush=True)
        if name == ANNUAL_API_STEP:
            script = scope_aware_annual_api_script(script)
        if name == DEEP_LINK_STEP:
            script = scope_aware_deep_link_script(script)
        run_shell_block(script, env)
        if name == DEEP_LINK_STEP:
            verify_scope_contract()

    print('\nPreserved mature smoke suite: PASS', flush=True)


if __name__ == '__main__':
    try:
        main()
    except Exception as exc:
        print(f'::error::Preserved mature smoke runner failed: {exc}', file=sys.stderr)
        raise