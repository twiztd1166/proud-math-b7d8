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
    },
    '893343f8-8347-4c63-bfce-9eff4b351667': {
        'row_count': 107, 'rows': 107, 'profiles': 103, 'pursue': 35, 'watch': 72,
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
    return script.replace(
        STALE_ANNUAL_API_BLOCK,
        SCOPE_AWARE_ANNUAL_API_BLOCK,
        1,
    )


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
    for key, expected in expected_parked.items():
        assert counts.get(key) == expected, (key, counts)
    assert counts.get('EAST_COAST_FLORIDA') in (92, 95), counts
    assert re.search(
        r'class="chip active" data-annual-scope="EAST_COAST_FLORIDA"', d
    ), 'East Coast scope is not active by default'

    header = re.search(
        r'<h2>2027 booking plan</h2><p>([0-9]+) plan rows · ([0-9]+) profiles', d
    )
    assert header, (counts, d[:2000])
    visible_rows = int(header.group(1))
    visible_profiles = int(header.group(2))
    assert visible_rows == counts['EAST_COAST_FLORIDA'], (visible_rows, counts)
    assert visible_profiles in (89, 92), visible_profiles

    top = re.search(
        r'data-show-mode="PLAN2027"[^>]*>2027 Plan ([0-9]+)</button>', d
    )
    assert top, (counts, d[:2000])
    statewide_rows = int(top.group(1))
    assert statewide_rows == sum(counts.values()), (statewide_rows, counts)
    assert statewide_rows in (104, 107), statewide_rows

    assert 'Pursue 30' in d
    assert ('Watch 62' in d) or ('Watch 65' in d)
    assert 'Research 0' in d

    parked_dom_markers = (
        '2027-LIFE-062-LEGACY-RESEARCH',
        'Florida State Fair — Feb. 4–15, 2027',
        '2027-LIFE-025-SEP',
        'Sarasota Bradenton Home Show — Sep. 10–12, 2027',
    )
    for marker in parked_dom_markers:
        assert marker not in d, ('parked West Coast record leaked into East default', marker)

    annual = post_annual_plan()
    assert annual.get('ok') is True, annual
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

    print({
        'annual_default_scope': 'PASS',
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
