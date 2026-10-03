#!/usr/bin/env python3
import argparse
import re
import subprocess
from pathlib import Path

REPO_ENTRIES = [Path("src/pages/index.astro"), Path("public/index-standalone.html")]
REQUIRED_ASSETS = [
    "app.css",
    "app-core.js",
    "app-annual-api.js",
    "app-shows.js",
    "app-calendar.js",
    "app-annual-scope.js",
    "app-control.js",
    "app-bind.js",
    "app-modals.js",
]
SERVICE_WORKER = Path("public/sw.js")
CONTROL_SOURCE = Path("public/app-control.js")
CORE_SOURCE = Path("public/app-core.js")
WORKFLOW_DIR = Path(".github/workflows")
TOOL_OUTPUT_MARKER = b"[executed " + b"on device:"
TOOL_READ_PREFIX = b"[Reading "
GITHUB_RUN_COMMAND_LIMIT = 21_000

ASSET_RE = re.compile(r'(?:/|\./)(app(?:-[a-z0-9-]+)?\.js|app\.css)\?v=([A-Za-z0-9._-]+)', re.I)
CACHE_RE = re.compile(r"const C=['\"](paradise-shows-public-v\d+)['\"]")


def asset_map(path: Path):
    text = path.read_text(encoding="utf-8")
    found = {}
    for asset, version in ASSET_RE.findall(text):
        found.setdefault(asset, []).append(version)
    missing = [asset for asset in REQUIRED_ASSETS if asset not in found]
    assert not missing, f"{path}: missing versioned assets: {missing}"
    duplicates = {asset: versions for asset, versions in found.items() if len(versions) != 1}
    assert not duplicates, f"{path}: duplicate versioned asset references: {duplicates}"
    versions = {versions[0] for asset, versions in found.items() if asset in REQUIRED_ASSETS}
    assert len(versions) == 1, f"{path}: asset versions are not internally consistent: {sorted(versions)}"
    return {asset: found[asset][0] for asset in REQUIRED_ASSETS}, next(iter(versions))


def validate_service_worker():
    text = SERVICE_WORKER.read_text(encoding="utf-8")
    match = CACHE_RE.search(text)
    assert match, f"{SERVICE_WORKER}: versioned Paradise Shows cache name not found"
    for asset in REQUIRED_ASSETS:
        token = f"/{asset}"
        assert token in text, f"{SERVICE_WORKER}: missing cached asset {token}"
    return match.group(1)


def validate_control_refresh_state():
    text = CONTROL_SOURCE.read_text(encoding="utf-8")
    assert "sum.remaining_conflicts??sum.conflict_rows??conflicts.length??0" in text, (
        f"{CONTROL_SOURCE}: Control screen does not prefer current unresolved conflict count"
    )
    assert "${unresolvedConflicts}" in text, (
        f"{CONTROL_SOURCE}: Control screen conflict counter is not bound to unresolved conflict count"
    )
    assert "const recoveryCurrentShows=Number(rh?.current_shows??rh?.shows_count??0)" in text, (
        f"{CONTROL_SOURCE}: recovery-health show coverage is not sourced from the live payload"
    )
    assert "recoveryCurrentPayments=Number(rh?.current_payments??rh?.payments_count??0)" in text, (
        f"{CONTROL_SOURCE}: recovery-health payment coverage is not sourced from the live payload"
    )
    assert "${recoveryCoverageText}" in text, (
        f"{CONTROL_SOURCE}: recovery-health coverage text is not rendered dynamically"
    )
    assert "'36/3 matched'" not in text, (
        f"{CONTROL_SOURCE}: stale hard-coded recovery coverage count remains"
    )
    assert "Preserved source snapshot:" in text, (
        f"{CONTROL_SOURCE}: preserved source baseline label is missing"
    )
    assert "Source freshness:" not in text, (
        f"{CONTROL_SOURCE}: preserved source snapshot is mislabeled as current freshness"
    )


def validate_route_contract():
    text = CORE_SOURCE.read_text(encoding="utf-8")
    assert text.count("window.addEventListener('hashchange',activateLocationView);") == 1, (
        f"{CORE_SOURCE}: hash-route synchronization listener is missing or duplicated"
    )
    assert "PROSPECT-[A-Z0-9-]+" in text, (
        f"{CORE_SOURCE}: prospect-only annual-plan profile routes are not accepted by the deep-link parser"
    )
    assert "function ensureActiveRouteData()" in text and "function openDeepLinkedProfileIfReady()" in text, (
        f"{CORE_SOURCE}: route activation does not centralize lazy data loading/deep-link opening"
    )
    assert "||prospectRoute" in text, (
        f"{CORE_SOURCE}: direct PROSPECT deep links do not force annual-plan loading"
    )
    assert "Number(state.deepLinkedYear)>=2000" in text, (
        f"{CORE_SOURCE}: deep-link serializer can emit an invalid /year/0 route for null years"
    )
    subprocess.run(["node", "scripts/verify-route-contract.mjs"], check=True)


def validate_repository_hygiene():
    tracked = subprocess.check_output(["git", "ls-files"], text=True).splitlines()
    contaminated = []
    for raw in tracked:
        path = Path(raw)
        if not path.is_file():
            continue
        try:
            data = path.read_bytes()
        except OSError:
            continue
        if TOOL_OUTPUT_MARKER in data or data.startswith(TOOL_READ_PREFIX):
            contaminated.append(raw)
    assert not contaminated, f"Committed Remote Desktop/tool-output markers found: {contaminated}"

    oversized = []
    for path in sorted(list(WORKFLOW_DIR.glob("*.yml")) + list(WORKFLOW_DIR.glob("*.yaml"))):
        lines = path.read_text(encoding="utf-8").splitlines()
        i = 0
        while i < len(lines):
            match = re.match(r"^(\\s*)run:\\s*[|>][+-]?\\s*$", lines[i])
            if not match:
                i += 1
                continue
            indent = len(match.group(1))
            i += 1
            block = []
            while i < len(lines):
                raw = lines[i]
                if not raw:
                    block.append("")
                    i += 1
                    continue
                current_indent = len(raw) - len(raw.lstrip())
                if current_indent <= indent:
                    break
                block.append(raw)
                i += 1
            command_chars = len("\n".join(block))
            if command_chars > GITHUB_RUN_COMMAND_LIMIT:
                oversized.append((str(path), command_chars))
    assert not oversized, (
        f"GitHub Actions run blocks exceed {GITHUB_RUN_COMMAND_LIMIT} characters: {oversized}"
    )


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--live-entry", type=Path)
    args = parser.parse_args()

    repo_maps = []
    repo_versions = []
    for path in REPO_ENTRIES:
        mapping, version = asset_map(path)
        repo_maps.append(mapping)
        repo_versions.append(version)

    assert len(set(repo_versions)) == 1, (
        f"Repository entrypoints disagree on asset version: "
        f"{dict(zip(map(str, REPO_ENTRIES), repo_versions))}"
    )
    assert repo_maps[0] == repo_maps[1], "Repository entrypoints disagree on versioned asset references"

    version = repo_versions[0]
    cache = validate_service_worker()
    validate_control_refresh_state()
    validate_route_contract()
    validate_repository_hygiene()

    if args.live_entry:
        _, live_version = asset_map(args.live_entry)
        assert live_version == version, (
            f"Live asset version {live_version!r} does not match repository version {version!r}"
        )

    print({
        "asset_contract": "PASS",
        "version": version,
        "service_worker_cache": cache,
        "live_entry_checked": bool(args.live_entry),
    })


if __name__ == "__main__":
    main()
