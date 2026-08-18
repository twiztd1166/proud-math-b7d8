-- Paradise Performance v1 enrollment advisor hardening.
-- Keep the server-only enrollment-token table explicitly deny-all for API roles,
-- and add covering indexes for every newly introduced foreign key.

create policy performance_enrollment_tokens_deny_client
on public.performance_enrollment_tokens
for all
to anon, authenticated
using (false)
with check (false);

create index if not exists performance_enrollment_tokens_revoked_by_idx
  on public.performance_enrollment_tokens(revoked_by)
  where revoked_by is not null;

create index if not exists performance_enrollment_tokens_used_auth_user_idx
  on public.performance_enrollment_tokens(used_auth_user_id)
  where used_auth_user_id is not null;

-- The deny policy is defense in depth: public/anon/authenticated table privileges
-- remain revoked. service_role is the only API role granted enrollment-token access.
