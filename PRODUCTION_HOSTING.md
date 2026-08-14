# Paradise Canvass Manager — Production Hosting Control

Target public URL: `https://canvass.paradiseexteriors.com`

## Current rule

Do not replace the validated field link or master-SOP link with the Paradise domain until the Cloudflare deployment completes and the public smoke test passes without authentication.

## Prepared deployment

The isolated production package uses:

- `wrangler.canvass.jsonc`
- `canvass-worker.js`
- `scripts/build-canvass-site.mjs`
- `.github/workflows/deploy-canvass-cloudflare.yml`

The deployment workflow is manual and requires the operator to type `DEPLOY`. Before publishing, it verifies the validated dataset hash chain and the controlled 78 / 76 / 2 baseline, including Punta Gorda and Tarpon Springs as the two NO-GO jurisdictions.

## Required GitHub repository secrets

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

The Cloudflare API token must be limited to the permissions needed to deploy the `paradise-canvass-manager` Worker and manage the custom domain in the Paradise Exteriors zone.

## DNS / Cloudflare prerequisite

`paradiseexteriors.com` must be available in the Cloudflare account used by the deployment credentials so Wrangler can bind the custom domain `canvass.paradiseexteriors.com`.

## Release test

The deploy workflow performs a public unauthenticated request to `https://canvass.paradiseexteriors.com/` and must find the Canvass Manager page before the permanent-domain deployment is considered complete.

Do not use the permanent domain in the controlled master PDF until that test passes.
