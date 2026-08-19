# Paradise Performance v1 — Controlled Store Assets

Status: **ISOLATED STORE-ASSET CANDIDATE / NOT RELEASED / NOT SUBMITTED**

Date: 2026-08-19

Stable validated application entering this tranche: `d332f862c438c56aefb1887beb18dccbd683b0ca`.

Public metadata head entering this tranche: `cee0b636c0dfb98bd8361e74b3074528e44400da`.

## Scope

This tranche resolves deterministic app-icon / launcher-asset plumbing only.

It does **not** change runtime behavior, field data, Paradise University, Supabase, employee/customer data, location behavior, KPI/pay, store privacy answers, retention policy, production signing, store submission, physical-hardware acceptance, or release authorization.

## Approved-source candidate

Google Drive already contains an existing square Paradise favicon mark:

- file: `Paradise-png-Favicon-528.png`
- Drive file ID: `1CsDZmKJWC6BUgszGD3NZ8BKG_m_B5Wz8`
- native source dimensions: `528 x 528`
- source bytes: `44,927`
- SHA-256: `75e563729b9d0771335930a9e0c97eed3c2f37dd3b4a855f998201a8009f0c13`

The image was visually checked before this tranche. It is an existing standalone Paradise house/P favicon mark rather than a full Paradise Exteriors wordmark.

Several files named `logo only` or `without lettering` were also checked and rejected for app-icon use because they still contained the full wordmark. Filenames are not treated as approval evidence.

The recent Paradise brand-guidelines image was also visually checked. It shows the square house/P mark as an approved logo example on a white background; this tranche therefore uses white for the iOS opaque flatten and Android adaptive-icon background rather than inventing a new treatment.

## Source preservation

The Drive favicon is private and is not anonymously downloadable by CI. To make the build reproducible without publishing the Drive file itself, the exact PNG bytes are preserved as **17 ordered base64 text segments** under:

`store/paradise-performance/brand/source/`

The canonical encoded stream is exactly `59,904` base64 characters and decodes to exactly `44,927` bytes.

`scripts/prepare-performance-store-assets.mjs` reconstructs only the explicitly ordered segment list in `store-brand-assets-v1.json` and fails closed unless all of the following match the approved source record:

- exactly 17 ordered source segments;
- exact encoded length `59,904`;
- canonical base64 round-trip;
- exact byte count `44,927`;
- exact SHA-256 `75e563729b9d0771335930a9e0c97eed3c2f37dd3b4a855f998201a8009f0c13`;
- PNG signature / IHDR;
- exact source dimensions `528 x 528`.

A source-only validation does not require an image-processing dependency.

## Derivation rule

No redraw, recolor, distortion, wordmark crop, or invented brand geometry is allowed.

Permitted transformations are limited to deterministic resizing, centering, transparent padding for Android adaptive-icon safe area, and an opaque white flatten for the iOS AppIcon requirement.

The 528 source is **not** represented as a native 1024 source. The iOS 1024 image is explicitly a deterministic derivative from the verified 528 origin.

## iOS

The generated Capacitor iOS shell currently declares one universal 1024 x 1024 AppIcon resource at:

`ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png`

The store-assets script:

1. verifies that the generated AppIcon set still declares the expected 1024 x 1024 file;
2. reconstructs and verifies the exact Paradise source;
3. resizes it deterministically to 1024 x 1024;
4. flattens it onto white and removes alpha;
5. verifies the generated icon is opaque 1024 x 1024;
6. writes a non-submission review copy under `store-build/` for visual QC.

## Android

The script replaces generated launcher assets in the temporary Capacitor Android shell only.

Legacy launcher sizes:

- mdpi — 48 px
- hdpi — 72 px
- xhdpi — 96 px
- xxhdpi — 144 px
- xxxhdpi — 192 px

Adaptive foreground canvases:

- mdpi — 108 px
- hdpi — 162 px
- xhdpi — 216 px
- xxhdpi — 324 px
- xxxhdpi — 432 px

The complete existing Paradise mark is centered at the controlled adaptive safe-mark ratio; the mark itself is not cropped or redrawn. The adaptive background is white.

A 512 x 512 32-bit PNG Google Play listing-icon review derivative is generated under `store-build/`; it is validated with alpha and is not automatically submitted or published.

## Launch / splash art

**OPEN.**

This tranche does not invent launch/splash artwork. A splash/launch composition must come from a separately approved source/design decision and remains outside this app-icon control.

## Validation required before merge

The PR must pass on its exact final head:

- controlled Paradise source reconstruction / encoded-length / byte-count / hash validation;
- native Performance/store controls;
- unsigned Android Release AAB build with the generated Paradise launcher resources;
- unsigned generic-iPhone Release build with the generated Paradise AppIcon;
- full public field / offline / Paradise University / device / adversarial browser regression gate;
- exact diff / zero-behind / merge-tree readback before merge.

The generated Apple and Google icon-review artifacts must be visually inspected before merge. A machine PASS alone is not final visual approval.

After merge, controlled publication remains a separate exact-SHA action. Do not move `paradise-canvass-manager-validated` manually.

## Release boundary

Final visual approval of the generated platform icon previews remains required before treating the icon package as submission-ready.

Production signing, official Apple/Google account access, substantive privacy-policy publication, review credentials, screenshots, employee rollout, and official store submission remain separate gates.
