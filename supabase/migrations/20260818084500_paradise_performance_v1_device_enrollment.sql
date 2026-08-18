-- Paradise Performance v1 trusted-device enrollment/session foundation.
-- Employees do not receive or manage a visible email/password account.
-- One-time enrollment tokens are high-entropy secrets; only SHA-256 hashes are stored.

alter table public.performance_devices
  add column if not exists device_public_id uuid not null default gen_random_uuid(),
  add column if not exists auth_user_id uuid references auth.users(id) on delete set null,
  add column if not exists credential_version text not null default 'device-credential-v1',
  add column if not exists revoked_reason text,
  add column if not exists revoked_by uuid references public.performance_employees(id);

create unique index if not exists performance_devices_public_id_unique
  on public.performance_devices(device_public_id);
create unique index if not exists performance_devices_auth_user_unique
  on public.performance_devices(auth_user_id)
  where auth_user_id is not null;
create index if not exists performance_devices_revoked_by_idx
  on public.performance_devices(revoked_by)
  where revoked_by is not null;

-- Auth identity and device status must both remain current. Role is derived from the
-- authoritative employee row so a role/active-status change takes effect immediately
-- without waiting for JWT refresh or rewriting every device identity.
create or replace function public.performance_current_employee_id()
returns uuid
language sql
stable
security invoker
set search_path = public
as $$
  select ai.employee_id
  from public.performance_actor_identities ai
  join public.performance_employees e on e.id = ai.employee_id
  where ai.auth_user_id = (select auth.uid())
    and ai.revoked_at is null
    and e.active is true
  limit 1
$$;

create or replace function public.performance_current_role()
returns text
language sql
stable
security invoker
set search_path = public
as $$
  select e.role
  from public.performance_actor_identities ai
  join public.performance_employees e on e.id = ai.employee_id
  where ai.auth_user_id = (select auth.uid())
    and ai.revoked_at is null
    and e.active is true
  limit 1
$$;

revoke execute on function public.performance_current_employee_id() from public, anon;
revoke execute on function public.performance_current_role() from public, anon;
grant execute on function public.performance_current_employee_id() to authenticated;
grant execute on function public.performance_current_role() to authenticated;

create table if not exists public.performance_enrollment_tokens (
  token_hash text primary key,
  token_prefix text not null,
  employee_id uuid not null references public.performance_employees(id),
  expires_at timestamptz not null,
  created_by uuid not null references public.performance_employees(id),
  created_at timestamptz not null default now(),
  used_at timestamptz,
  used_auth_user_id uuid references auth.users(id) on delete set null,
  used_device_id uuid references public.performance_devices(id),
  revoked_at timestamptz,
  revoked_by uuid references public.performance_employees(id),
  check (length(token_hash) = 64),
  check (length(token_prefix) between 6 and 12),
  check (expires_at > created_at),
  check (used_at is null or used_at >= created_at),
  check (revoked_at is null or revoked_at >= created_at)
);

create index if not exists performance_enrollment_tokens_employee_idx
  on public.performance_enrollment_tokens(employee_id, created_at desc);
create index if not exists performance_enrollment_tokens_expires_idx
  on public.performance_enrollment_tokens(expires_at)
  where used_at is null and revoked_at is null;
create index if not exists performance_enrollment_tokens_created_by_idx
  on public.performance_enrollment_tokens(created_by);
create index if not exists performance_enrollment_tokens_used_device_idx
  on public.performance_enrollment_tokens(used_device_id)
  where used_device_id is not null;

alter table public.performance_enrollment_tokens enable row level security;
revoke all on table public.performance_enrollment_tokens from public, anon, authenticated;
grant select, insert, update, delete on table public.performance_enrollment_tokens to service_role;

-- Device metadata is Performance-visible, but auth-user IDs and credential details are not.
revoke select on table public.performance_devices from authenticated;
grant select (
  id, employee_id, device_public_id, device_label, platform,
  enrolled_at, revoked_at, last_seen_at, app_version
) on public.performance_devices to authenticated;

create or replace function public.performance_finalize_device_enrollment(
  p_token_hash text,
  p_auth_user_id uuid,
  p_device_public_id uuid,
  p_platform text,
  p_device_label text default null
)
returns table(employee_id uuid, device_id uuid, display_name text, role text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_token public.performance_enrollment_tokens%rowtype;
  v_employee public.performance_employees%rowtype;
  v_device_id uuid;
begin
  if p_token_hash is null or length(p_token_hash) <> 64 then
    raise exception 'invalid enrollment token hash';
  end if;
  if p_device_public_id is null then
    raise exception 'device public id is required';
  end if;
  if p_platform not in ('ios','android','web-test','shared') then
    raise exception 'unsupported device platform';
  end if;

  select * into v_token
  from public.performance_enrollment_tokens
  where token_hash = p_token_hash
  for update;

  if not found then raise exception 'enrollment token not found'; end if;
  if v_token.revoked_at is not null then raise exception 'enrollment token revoked'; end if;
  if v_token.used_at is not null then raise exception 'enrollment token already used'; end if;
  if v_token.expires_at <= now() then raise exception 'enrollment token expired'; end if;

  select * into v_employee
  from public.performance_employees
  where id = v_token.employee_id
  for share;

  if not found or v_employee.active is not true then
    raise exception 'employee is not active';
  end if;

  if exists (
    select 1 from public.performance_actor_identities
    where auth_user_id = p_auth_user_id
  ) then
    raise exception 'auth identity already enrolled';
  end if;

  if exists (
    select 1 from public.performance_devices
    where device_public_id = p_device_public_id
  ) then
    raise exception 'device public id already enrolled';
  end if;

  insert into public.performance_actor_identities (
    auth_user_id, employee_id, role
  ) values (
    p_auth_user_id, v_employee.id, v_employee.role
  );

  insert into public.performance_devices (
    employee_id, device_public_id, auth_user_id, device_label,
    platform, credential_version, last_seen_at
  ) values (
    v_employee.id, p_device_public_id, p_auth_user_id, nullif(trim(p_device_label), ''),
    p_platform, 'device-credential-v1', now()
  ) returning id into v_device_id;

  update public.performance_enrollment_tokens
  set used_at = now(),
      used_auth_user_id = p_auth_user_id,
      used_device_id = v_device_id
  where token_hash = p_token_hash;

  return query
  select v_employee.id, v_device_id, v_employee.display_name, v_employee.role;
end;
$$;

revoke execute on function public.performance_finalize_device_enrollment(text, uuid, uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.performance_finalize_device_enrollment(text, uuid, uuid, text, text)
  to service_role;

create or replace function public.performance_revoke_device(
  p_device_id uuid,
  p_revoked_by uuid,
  p_reason text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_auth_user_id uuid;
  v_role text;
begin
  select role into v_role
  from public.performance_employees
  where id = p_revoked_by and active is true;

  if v_role not in ('manager','admin') then
    raise exception 'manager or admin required';
  end if;

  select auth_user_id into v_auth_user_id
  from public.performance_devices
  where id = p_device_id
  for update;

  if not found then raise exception 'device not found'; end if;

  update public.performance_devices
  set revoked_at = coalesce(revoked_at, now()),
      revoked_reason = coalesce(nullif(trim(p_reason), ''), 'revoked'),
      revoked_by = p_revoked_by
  where id = p_device_id;

  if v_auth_user_id is not null then
    update public.performance_actor_identities
    set revoked_at = coalesce(revoked_at, now())
    where auth_user_id = v_auth_user_id;
  end if;

  return v_auth_user_id;
end;
$$;

revoke execute on function public.performance_revoke_device(uuid, uuid, text)
  from public, anon, authenticated;
grant execute on function public.performance_revoke_device(uuid, uuid, text)
  to service_role;

-- Hard boundaries:
-- 1. Enrollment tokens are one-time, short-lived secrets and are never stored plaintext.
-- 2. A client receives only a publishable key + user session; no secret/service-role key ships to a device.
-- 3. Revoking the actor identity makes RLS access fail immediately even if an access JWT has not expired yet.
-- 4. Trusted-device identity authorizes Performance data only. It never authorizes or changes field Lookup instructions.
