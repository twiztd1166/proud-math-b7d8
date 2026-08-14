# Validated Canvass Release Control

The manager-facing stable app URL is backed by the `paradise-canvass-manager-validated` branch.

Release path:

1. Changes are made on `paradise-canvass-manager-public`.
2. The full `Validate canvass register` workflow must complete successfully.
3. Validated metadata must preserve the controlled register/hash chain.
4. Only then may `paradise-canvass-manager-validated` advance.
5. Operational Sheet/PDF links point to the validated branch, not to work-in-progress commits.

Cloudflare is not part of the active release path. Its workflow is manual-only.
