# Paradise Public Branch Ruleset Setup

Status: **PREPARED — NOT YET APPLIED IN GITHUB SETTINGS**  
As of: 2026-08-17

Purpose: close the remaining repository-governance gap around `paradise-canvass-manager-public` without weakening the existing exact-SHA field + Paradise University release workflow.

The connected GitHub automation available during this audit can read repository/branch state and modify repository content, but it does not expose the repository-ruleset or branch-protection write endpoint. Therefore this file is the controlled settings recipe; it is not evidence that the settings are already active.

## Paradise Public Release Protection

Create a **branch ruleset** in repository Settings → Rules → Rulesets.

- Ruleset name: `Paradise Public Release Protection`
- Enforcement: `Active`
- Target branch: `paradise-canvass-manager-public`
- Bypass: add the **GitHub Actions app** as `Always allow` only if GitHub offers that app/integration in the bypass selector.
  - Reason: `build-canvass-v37.yml` legitimately publishes validated artifacts/metadata to the public branch after all exact-SHA gates pass.
  - Do **not** substitute a broad repository-admin or ordinary-user bypass if GitHub Actions is not available. Leave the settings gate open and revisit the publication architecture instead.
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
- Restrict updates — unnecessary for the intended design and would change who is permitted to update the branch beyond the PR/status-check model.

## Why the GitHub Actions bypass is bounded

`scripts/validate-release-workflow-controls.mjs` fails unless the workflow inventory contains exactly one `contents: write` workflow:

- allowed: `.github/workflows/build-canvass-v37.yml`
- every other current workflow must remain read-only with respect to repository contents.

The same validator requires the public premerge gate to remain read-only, forbids `git push`, forbids `pull_request_target`, and forbids use of repository secrets.

This makes the application-level GitHub Actions bypass narrow and machine-audited. It does **not** make the repository owner or a GitHub administrator incapable of intentionally changing the ruleset or control code; repository administration remains the ultimate trust boundary.

## Control-file protection boundary

Do **not** create the previously considered `Paradise Release Control Files` branch ruleset with **Restrict file paths**. GitHub documents file-path restriction as a **push-ruleset** capability. Push rulesets are not the applicable repository-level mechanism for this public personal repository under the current GitHub plan/surface.

Instead, control-code integrity is handled by the existing layered design:

- ordinary updates to public must come through a pull request once the branch ruleset is active;
- `Paradise public premerge gate` executes release-control validation before merge;
- `scripts/validate-release-workflow-controls.mjs` checks the exact public-release workflow, four University workflows, premerge workflow, branch-scoped concurrency, exact-SHA gating, stale-head protection, non-force validated advancement, and the single-workflow `contents: write` invariant;
- after merge, the independent public release workflow again requires all four University workflows on the exact public source SHA before publication;
- a sufficiently privileged repository owner remains capable of intentionally editing repository rules or approving control-code changes. That is an administrative trust boundary, not a machine-closable repository defect.

For stronger CI-policy immutability in the future, a move to an organization/enterprise governance model can be evaluated separately. Do not claim that stronger model is active here.

## Required premerge check

The repository candidate contains:

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

Do not call repository governance closed until a readback confirms the branch ruleset is active on `paradise-canvass-manager-public` and an ordinary PR is actually blocked unless `Paradise public premerge gate` reports success.

Until that readback exists, status remains: **RULESET PREPARED, NOT APPLIED**.
