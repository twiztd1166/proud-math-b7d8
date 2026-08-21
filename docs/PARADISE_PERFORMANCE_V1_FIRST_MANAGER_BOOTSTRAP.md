# Paradise Performance v1 — First Manager Trusted-Device Bootstrap

Status: WORKING CONTROL / NOT EMPLOYEE-ROLLOUT AUTHORIZATION

## Purpose

Normal Paradise Performance enrollment is intentionally manager/admin-issued. A signed-in, currently enrolled manager/admin calls `performance-enrollment-mint`, which creates a short-lived one-time enrollment secret for an active employee. That model creates an unavoidable initialization problem when a fresh environment has no trusted manager/admin device yet.

`performance-first-manager-bootstrap-mint` is the bounded initialization path for that single condition. It does not create a normal employee password account and it does not replace the ordinary manager-issued enrollment flow.

## Preconditions

All of the following must be true before use:

1. An approved real Paradise manager/admin exists in `performance_employees`, is active, and has the correct role.
2. The selected employee must not be either synthetic store-review identity.
3. No live privileged Performance actor identity may already exist.
4. The selected real manager/admin must never previously have had a Performance actor identity. If a manager was already enrolled and later revoked, use the ordinary manager/admin recovery path rather than initial bootstrap.
5. A temporary Supabase Auth user must be created through a supported Supabase Dashboard/Auth Admin route. Do not create or modify `auth.users` with SQL.
6. The temporary Auth user must receive administrator-controlled `app_metadata` exactly identifying the bootstrap purpose and the approved real manager employee UUID:

   - `paradise_performance_first_manager_bootstrap = true`
   - `performance_bootstrap_manager_employee_id = <approved real manager/admin employee UUID>`

7. Do not place the temporary Auth password, recovery material, session token, service-role key, signing secret, or resulting enrollment token in GitHub, Drive, chat, screenshots, or logs.

## Controlled sequence

1. Human operator creates the temporary bootstrap Auth user with the exact `app_metadata` above using Supabase Dashboard/Auth Admin.
2. From a trusted operator environment, sign in as that temporary Auth user and obtain its normal user JWT.
3. Invoke `performance-first-manager-bootstrap-mint` with that JWT. The request body does not choose an employee; the target comes only from administrator-controlled `app_metadata`.
4. The Edge function independently reads the current Auth user, verifies the bootstrap flag, resolves the target manager/admin from `performance_employees`, rejects synthetic review identities, and refuses to run if a privileged actor already exists or if the target manager has any historical actor identity.
5. If permitted, the function revokes any older unused bootstrap enrollment token for that target, mints a fresh high-entropy 10-minute one-time enrollment secret, stores only its SHA-256 hash, then disables the temporary bootstrap Auth identity by clearing the bootstrap metadata and applying a long ban.
6. If temporary-identity disabling fails, the newly minted enrollment token is revoked and the function returns no usable bootstrap result.
7. Immediately enter the returned one-time token into the ordinary Paradise Performance trusted-device enrollment screen on the manager's intended browser/device.
8. `performance-enrollment-redeem` creates the ordinary hidden device Auth user, actor identity, trusted-device row, and normal user session. From that point forward, the manager uses the ordinary Performance manager enrollment flow to enroll employees and additional managers.
9. Read back the resulting manager actor identity/device and confirm the temporary bootstrap Auth user is disabled before considering bootstrap complete.

## Current isolated-project boundary

As of the rollout-readiness check that produced this control, the isolated Supabase project contained:

- 0 Auth users
- 0 Auth sessions
- 0 Performance actor identities
- 0 Performance devices
- 0 live enrollment tokens
- 2 active `performance_employees`, both synthetic store-review identities
- no approved real employee/manager roster

Therefore this source architecture can be prepared and validated now, but it cannot be used for employee rollout until an approved real manager/admin employee row exists and the temporary Auth user is created through a supported Auth Admin route.

## Hard prohibitions

- Never insert, update, or delete managed `auth.*` records directly with SQL for bootstrap.
- Never use a `SECURITY DEFINER` database function as a human-auth provisioning shortcut.
- Never ship a service-role/secret key to the browser or app.
- Never reuse the synthetic marketplace-review employee or issuer for real employee rollout.
- Never turn this function into a general employee enrollment endpoint.
- Never use it after a real privileged Performance actor has been established.
- Never treat successful bootstrap as employee-rollout authorization, Privacy/HR approval, or native background-GPS validation.

## Completion evidence

Bootstrap is complete only when all are true:

- approved real manager/admin employee row is present;
- supported temporary Auth user/app_metadata readback is verified;
- bootstrap mint succeeds;
- temporary bootstrap Auth identity is disabled;
- ordinary trusted-device redemption succeeds;
- real manager actor identity/device readback is correct;
- manager can mint a fresh ordinary employee enrollment token;
- no synthetic review identity was used;
- no credentials or privileged secrets were stored in controlled documents or source;
- employee rollout has separate explicit authorization.
