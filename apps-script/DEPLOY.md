# Paradise Canvass Manager — Central Daily Release Intake

This endpoint is intentionally narrow. The public mobile app never receives Google credentials and never receives general write access to the controlled workbook. The Apps Script runs as the workbook owner and writes only the Daily Release Log input fields: A:F, J:N, and P. G:I and O remain controlled formulas.

## One-time deployment

1. Open https://script.google.com/ while signed into the Google account that owns the controlled canvass register.
2. Create a new standalone Apps Script project named `Paradise Canvass Manager Central Intake`.
3. Replace the default `Code.gs` with the contents of this repository's `apps-script/Code.gs`.
4. In Project Settings, set the time zone to `America/New_York`.
5. Click **Deploy → New deployment → Web app**.
6. Set **Execute as:** `Me`.
7. Set **Who has access:** `Anyone`.
8. Deploy and approve the Google authorization prompts.
9. Copy the final `/exec` web-app URL.
10. Put that URL in `central-config.js` and change `enabled:false` to `enabled:true`.

Example only:

```js
window.PCM_CENTRAL={
  endpoint:'https://script.google.com/macros/s/DEPLOYMENT_ID/exec',
  enabled:true,
  timeoutMs:15000
};
```

## Required validation before field release

After activation, use a test GO municipality and complete a test Daily Release. The phone must display `SAVED CENTRALLY` with a receipt. Confirm the corresponding row appears in `Daily Release Log` and verify:

- A:F contain the submitted date/manager/team/route/address/city.
- G:I remain formulas and resolve legal jurisdiction, lookup row, and current release from `Manager Lookup`.
- J:N contain the five submitted checks.
- O remains the controlled final-decision formula and matches the app result.
- P starts with `APP-ID=` and contains the app snapshot and server save timestamp.

Then submit the same record again/retry sync and confirm it returns the existing receipt rather than creating a duplicate row.

## Fail-closed behavior

The endpoint rejects a submission when:

- app schema is not recognized;
- snapshot is not `2026-08-13`;
- municipality is not present in `Manager Lookup`;
- the workbook's current release or manager class changed after the app snapshot was published;
- exact address/route boundary is missing;
- any check contains a value other than blank, PASS, STOP, or ESCALATE;
- the app's final decision does not match the server recomputation;
- the Sheet formula output does not match the server recomputation;
- the intake reaches its daily safety limit.

The server does not accept client-supplied legal-jurisdiction or final-release values as authoritative. The workbook formulas remain controlling.

## Public-access boundary

Because the manager app requires no login, the web-app endpoint is also publicly callable. The protection is scope limitation and server-side validation, not user identity. The endpoint cannot alter the legal register or arbitrary workbook ranges through the published code. If stronger abuse resistance is later required without requiring user login, add a server-verified challenge such as Cloudflare Turnstile in front of the endpoint.
