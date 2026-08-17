# Paradise Public Branch Ruleset Setup

Status: **PREPARED — NOT YET APPLIED IN GITHUB SETTINGS**  
As of: 2026-08-17

Purpose: close the remaining repository-governance gap around `paradise-canvass-manager-public` without weakening the existing exact-SHA field + Paradise University release workflow.

The connected GitHub automation available during this audit can read repository/branch state and modify repository content, but it does not expose the repository-ruleset or branch-protection write endpoint. Therefore this file is the controlled settings recipe; it is not evidence that the settings are already active.

## Ruleset A — Paradise Public Release Protection

Create a **branch ruleset** in repository Settings → Rules → Rulesets.

- Ruleset name: `Paradise Public Release Protection`
- Enforcement: `Active`
- Target branch: `paradise-canvass-manager-public`
- Bypass: add the **GitHub Actions app** as `Always allow` only if GitHub offers that app/integration in the bypass selector.
  - Reason: `build-canvass-v37.yml` legitimately publishes validated artifacts/metadata to the public branch after all exact-SHA gates pass.
  - Do **not** substitute a broad repository-admin bypass if GitHub Actions is not available. Leave the settings gate open and revisit the publication architecture instead.
- Do not add ordinary human/user bypass actors to this ruleset.

Enable these rules:

1. **Restrict deletions** / prevent deletion of the target branch.
2. **Require a pull request before merging**.
   - Allowed merge method: `merge` only.
   - Required approving reviews: `0` unless Paradise intentionally adds a separate human-review governance requirement later.
   - Require review-thread resolution if the UI offers it without imposing a reviewer requirement.
3. **Require status checks to pass before merging**.
   - Required check: `Paradise public premerge gate`
   - Require branches to be up to date before merging: **ON**.
4. **Block force pushes**.

Do **not** enable these without a separate design change:

- Require linear history — incompatible with the controlled normal-merge release method.
- Require signed commits — the current controlled bot/public history is not uniformly signed.
- Merge queue — the current required workflow is not configured for `merge_group`.

## Why the GitHub Actions bypass is bounded

`scripts/validate-release-workflow-controls.mjs` fails unless the workflow inventory contains exactly one `contents: write` workflow:

- allowed: `.github/workflows/build-canvass-v37.yml`
- every other current workflow must remain read-only with respect to repository contents.

The same validator requires the public premerge gate to remain read-only, forbids `git push`, forbids `pull_request_target`, and forbids use of repository secrets.

This makes the application-level bypass narrow and machine-audited. It does not make a GitHub-admin account incapable of changing repository settings; repository settings remain a separate trust boundary.

## Ruleset B — Paradise Release Control Files

Use a second branch ruleset to protect the CI/release-control code itself from ordinary changes.

- Ruleset name: `Paradise Release Control Files`
- Enforcement: `Active`
- Target branch: `paradise-canvass-manager-public`
- Bypass actor: user `twiztd1166` — **Pull requests only**, not always/exempt.
- Do **not** grant GitHub Actions a bypass on this second ruleset.

Enable **Restrict file paths** for these patterns/files:

- `.github/workflows/build-canvass-v37.yml`
- `.github/workflows/deploy-canvass-cloudflare.yml`
- `.github/workflows/validate-paradise-*.yml`
- `scripts/validate-*.mjs`
- `scripts/build-canvass-site.mjs`
- `scripts/apply-controlled-update.mjs`
- `scripts/change-control-report.mjs`
- `tests/*.spec.js`
- `playwright.config.js`

Intent: changes to release workflows, validators, test assertions, or the build/control scripts should require an intentional PR-only bypass by the repository owner; routine GitHub Actions publication commits do not touch these paths and therefore do not need a bypass on this ruleset.

If GitHub's UI treats the restriction or bypass differently than described, stop rather than broadening access. Do not add an `Always allow` owner bypass merely to make setup easier.

## Required premerge check

The repository now contains:

- workflow: `.github/workflows/validate-paradise-public-pr.yml`
- workflow name: `Validate Paradise public premerge gate`
- required job/check context: **`Paradise public premerge gate`**

That exact job name is intentional. Do not require one of the generic historical `validate` job names.

The gate runs on pull requests targeting `paradise-canvass-manager-public` and performs:

- release-control static validation;
- controlled 78 / 76 / 2 field-baseline validation;
- Training/field release isolation;
- static production build;
- iPhone field + offline + Training/UX regressions;
- device matrix;
- adversarial/service-worker/progress-transfer matrix;
- retries = 0 for the browser release gate.

It has `contents: read`, no publish step, and no repository secrets.

## Post-merge barrier remains mandatory

Rulesets are an additional barrier, not a replacement for the post-merge release workflow.

After an authorized normal merge into public:

1. all four University workflows must pass on the exact public source SHA;
2. the field release workflow must pass its controlled field tests;
3. the release workflow must re-read the public head and refuse stale publication;
4. only then may controlled public metadata/artifact commits be created;
5. `paradise-canvass-manager-validated` may advance only by a normal non-force push.

## Verification after settings are applied

Do not call repository governance closed until a readback confirms the rules are active on `paradise-canvass-manager-public` and an ordinary PR is actually blocked unless `Paradise public premerge gate` reports success.

Until that readback exists, status remains: **RULESET PREPARED, NOT APPLIED**.
