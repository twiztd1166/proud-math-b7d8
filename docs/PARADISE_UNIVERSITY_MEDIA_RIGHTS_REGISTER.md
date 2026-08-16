# Paradise University v1 — Media Rights Register

Status: WORKING BRANCH CONTROL — NOT LIVE / NOT PROMOTED

As of: 2026-08-16

Technical baseline entering this register: `ca6c3c14ef8fd0878336554ef150c80dac39915c` passed the complete `Validate Paradise University v1` workflow, including syntax/build boundary, training hardening, controlled field baseline, release isolation, production bundle, iPhone field regression, iPhone offline regression, Paradise University iPhone regression, and device matrix.

## Release rule

Possession in Paradise Google Drive, attendance at a vendor program, purchase of a training package, receipt of a workbook/manual, an invoice, or an internal reference to a trainer does **not** by itself establish Paradise's right to reproduce or re-host a separate copyrighted recording inside Paradise University.

Employee-app playback is therefore deny-by-default. A media item becomes launch-ready only when controlled metadata records one of these bases:

- `PARADISE_OWNED` — Paradise owns the training recording and may host it internally.
- `APPROVED_INTERNAL_HOSTING` — written permission/agreement expressly covers Paradise internal employee-app hosting/reproduction of the exact asset.
- `EXTERNAL_LINK_ONLY` — the rights holder controls a stable public source and Paradise links to that source rather than copying/re-hosting it.

`RIGHTS_UNVERIFIED` remains metadata/reference only and is not playable.

## Current curated media disposition

All 12 curated third-party recordings remain `RIGHTS_UNVERIFIED` at this checkpoint. Their metadata and curriculum lineage are retained; copied-file playback and copied-file source links are withheld.

| Media ID | Trainer | Title | Authority | Current disposition | Acceptable resolution |
|---|---|---|---|---|---|
| `grosso-tonality-audio` | Grosso University | Tonality and Body Language — audio | REFERENCE | RIGHTS_UNVERIFIED | Exact written internal-hosting grant; Paradise-owned replacement; or separate official public Grosso resource classified EXTERNAL_LINK_ONLY |
| `grosso-tonality-video` | Grosso University | Tonality and Body Language — video | REFERENCE | RIGHTS_UNVERIFIED | Same |
| `grosso-objections-audio` | Grosso University | Formula For Handling Objections — audio | REFERENCE | RIGHTS_UNVERIFIED | Exact written internal-hosting grant; Paradise-owned replacement; or separate official public Grosso objection-training resource classified EXTERNAL_LINK_ONLY |
| `grosso-objections-video` | Grosso University | Formula For Handling Objections — video | REFERENCE | RIGHTS_UNVERIFIED | Same |
| `grosso-good-lead-audio` | Grosso University | Definition of a Good Lead — audio | REFERENCE | RIGHTS_UNVERIFIED | Exact written internal-hosting grant; Paradise-owned replacement; or separate rights-holder-hosted public resource if a sufficiently equivalent item is verified |
| `grosso-good-lead-video` | Grosso University | Definition of a Good Lead — video | REFERENCE | RIGHTS_UNVERIFIED | Same |
| `dave-science-canvassing-video` | Dave Yoho Associates | The Science of Successful Canvassing | REFERENCE | RIGHTS_UNVERIFIED | Exact written internal-hosting grant; Paradise-owned canvassing systems replacement; or a separate official Dave Yoho public resource if an equivalent free item is verified |
| `tony-welcome-onboarding` | Tony Hoty | Canvassing Welcome Onboarding | REFERENCE | RIGHTS_UNVERIFIED | Exact written internal-hosting grant; Paradise-owned onboarding replacement; or separate official Tony Hoty public resource classified EXTERNAL_LINK_ONLY |
| `tony-canvassing-101` | Tony Hoty | Canvassing 101 | REFERENCE | RIGHTS_UNVERIFIED | Same |
| `tony-new-canvasser-process` | Tony Hoty | New Canvasser Training — Process | REFERENCE | RIGHTS_UNVERIFIED | Same |
| `tony-10-step-canvassing` | Tony Hoty | 10 Step Canvassing Approach | HISTORICAL | RIGHTS_UNVERIFIED | Prefer Paradise-owned current rewrite/recording; otherwise exact permission or separate official public reference link only |
| `tony-canvass-set` | Tony Hoty | Canvass Set | HISTORICAL | RIGHTS_UNVERIFIED | Prefer Paradise-owned current rewrite/recording; otherwise exact permission or separate official public reference link only |

## Source-family evidence boundary

### Tony Hoty

The controlled source set contains Tony Hoty / Sales-Lead Consultants material carrying an `All Rights Reserved` notice. Current public Tony Hoty pages also market the canvassing package as a paid training product containing manuals, instructional videos, recorded sound bites, and other package assets. That supports a conservative distinction between lawful access to purchased/delivered training and a separate right to reproduce/re-host recordings inside a Paradise-created app. No explicit Paradise internal-app hosting grant for the curated recordings was recovered in the rights audit.

Official public candidate sources identified for possible `EXTERNAL_LINK_ONLY` use — **not automatic replacements for the copied recordings**:

- Tony Hoty official canvassing overview: `https://tonyhoty.com/canvassing/`
- Tony Hoty official site: `https://tonyhoty.com/`
- Tony Hoty public Home Service Expert interview identified through Tony's own LinkedIn post: `https://youtu.be/gcldgfkPi-Q`

Any candidate must be reviewed for curriculum fit before being added. A public link does not convert the underlying copied file into a cleared asset.

### Dave Yoho Associates

Dave Yoho Associates currently markets `The Science of Successful Canvassing` as a paid video program and separately publishes free thought-leadership material. The audit recovered Paradise use of Dave Yoho materials/services, but not an explicit right allowing Paradise to re-host the curated paid-program recording in its own employee app.

Official public candidate sources identified for possible external-reference use — **not equivalent replacements unless content review supports that conclusion**:

- Dave Yoho Associates main site / Thought Leadership entry point: `https://www.daveyoho.com/`
- Dave Yoho Associates events / past webinar path: `https://www.daveyoho.com/events/`

The paid program page remains evidence that the exact canvassing video is a commercial training product, not evidence of Paradise re-hosting permission.

### Grosso University

Current Grosso University communications and site materials use copyright/all-rights-reserved language and market proprietary training programs. The rights audit recovered Paradise participation/access but no explicit redistribution or internal-app re-hosting grant for the copied recordings.

Grosso does publish current public training/insight pages on its own site. These can be evaluated as separate `EXTERNAL_LINK_ONLY` resources because the rights holder controls the public page. They must not be represented as the same asset as Paradise's copied Drive recordings.

Official public candidates identified:

- Objection training article with rights-holder-hosted full-training path: `https://www.grossouniversity.com/insights/the-easiest-way-to-overcome-objections-in-one-call-close-home-improvement-sales/`
- Needs-analysis / guarded-homeowner article: `https://www.grossouniversity.com/how-to-extract-information-from-guarded-homeowners-without-triggering-resistance/`
- Sales Academy overview: `https://www.grossouniversity.com/sales-academy/`
- MasterClass overview: `https://www.grossouniversity.com/masterclass/`

## Preferred resolution order

1. **Paradise-owned remake for core required training.** For anything essential to Foundation / Field Ready / Certified Canvasser / Manager certification, Paradise should ultimately own the current recording. This gives the cleanest authority, rights, versioning, transcript, chapter, offline, accessibility, and retirement control.
2. **Explicit vendor permission for high-value proprietary material.** If Paradise wants the exact Tony/Dave/Grosso recording in-app, obtain a written grant covering internal employee-app reproduction/hosting for the exact asset or defined library.
3. **Official external links for optional reference material.** When the trainer publishes useful public content, link to the rights-holder-controlled page instead of copying it. Classify it REFERENCE/HISTORICAL as appropriate and keep Paradise-approved lessons above it in search/ranking.
4. **Do not solve the blocker by moving the copied file to another host, renaming it, embedding the Drive preview, or treating purchase/attendance as permission.** Those actions do not resolve the missing rights basis.

## Paradise-owned remake priorities

To restore useful media without depending on third-party rights, record short Paradise-approved modules in this order:

1. Field opening, pace, distance, tonality, and respectful exit.
2. Refusal vs hesitation and the stop/leave rule.
3. Project discovery and appointment quality.
4. Five Appointment Commitments — Paradise-approved adaptation only.
5. New-canvasser route preparation and municipality Lookup discipline.
6. Manager ride-along coaching and one-behavior feedback loop.
7. Appointment-quality audit and funnel diagnosis.
8. Sales Apprentice boundary: sales education does not authorize doorstep selling/pricing/financing.

Each Paradise-owned recording should carry: owner = Paradise Exteriors, authority = `PARADISE_APPROVED`, rights status = `PARADISE_OWNED`, content version, approval date, approver, transcript, chapters when useful, and retirement/supersession metadata.

## Release status

- Curated third-party media reviewed: **12**
- Third-party copied media playable: **0**
- Third-party copied media on rights hold: **12**
- Paradise-owned approved media currently loaded: **0**
- Media player infrastructure: retained for future cleared/Paradise-owned streams
- Lesson progression: blocked reference media is non-required/non-blocking
- Live validated field branch: unchanged
- Promotion status: **NOT AUTHORIZED / NOT PERFORMED**

This register is a release-control record, not a legal opinion. A vendor agreement or written rights grant should be reviewed on its actual language before changing an asset to `APPROVED_INTERNAL_HOSTING`.