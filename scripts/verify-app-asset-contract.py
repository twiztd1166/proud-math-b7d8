#!/usr/bin/env python3
import argparse
import re
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
