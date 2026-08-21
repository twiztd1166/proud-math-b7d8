-- Paradise Performance — controlled admin trusted-device recovery.
-- This is a break-glass, operator-approved recovery path for the designated admin test cohort.
-- It never acts as first enrollment, never self-approves, and never exposes a service-role credential.

create table if not exists public.performance_admin_recovery_requests (
  id uuid primary key default gen_random_uuid(),
  request_reference text not null unique,
  secret_hash text not null,
  requested_device_public_id uuid not null,
  requested_at timestamptz not null default now(),
  expires_at timestamptz not null,
  approved_employee_id uuid references public.performance_employees(id),
  approved_at timestamptz,
  approved_by text,
  consumed_at timestamptz,
  finalized_device_id uuid references public.performance_devices(id),
  finalized_at timestamptz,
  revoked_at timestamptz,
  constraint performance_admin_recovery_reference_format
    check (request_reference ~ '^[A-Za-z0-9_-]{10,24}$'),
  constraint performance_admin_recovery_secret_hash_format
    check (secret_hash ~ '^[0-9a-f]{64}$'),
  constraint performance_admin_recovery_expiry_order
    check (expires_at > requested_at),
  constraint performance_admin_recovery_approval_pair
    check ((approved_at is null) = (approved_employee_id is null)),
  constraint performance_admin_recovery_finalize_pair
    check ((finalized_at is null) = (finalized_device_id is null))
);

create index if not exists performance_admin_recovery_pending_idx
  on public.performance_admin_recovery_requests (expires_at, requested_at)
  where consumed_at is null and finalized_at is null and revoked_at is null;

create index if not exists performance_admin_recovery_device_idx
  on public.performance_admin_recovery_requests (requested_device_public_id, requested_at desc);

alter table public.performance_admin_recovery_requests enable row level security;
revoke all on table public.performance_admin_recovery_requests from anon, authenticated;
grant select, insert, update, delete on table public.performance_admin_recovery_requests to service_role;

-- Operator approval is deliberately service-role only. The browser can create a request,
-- but no browser/session can approve its own request.
create or replace function public.performance_approve_admin_recovery(
  p_request_reference text,
  p_employee_id uuid,
  p_approved_by text
)
returns table(request_reference text, employee_id uuid, expires_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.performance_admin_recovery_requests%rowtype;
  v_employee public.performance_employees%rowtype;
begin
  if p_request_reference is null or p_request_reference !~ '^[A-Za-z0-9_-]{10,24}$' then
    raise exception 'INVALID_RECOVERY_REFERENCE';
  end if;
  if p_approved_by is null or length(trim(p_approved_by)) < 3 or length(p_approved_by) > 80 then
    raise exception 'INVALID_RECOVERY_APPROVER';
  end if;

  -- Controlled test cohort only. Josh cannot use recovery until he has first completed
  -- ordinary enrollment because the active-identity/device checks below remain mandatory.
  if p_employee_id not in (
    'a6eb5ecc-ca82-4b83-94f3-5a0a534e3f64'::uuid,
    'c10e9f21-e71e-4385-ab8b-855da0a506a3'::uuid
  ) then
    raise exception 'RECOVERY_EMPLOYEE_NOT_AUTHORIZED';
  end if;

  select * into v_request
  from public.performance_admin_recovery_requests r
  where r.request_reference = p_request_reference
  for update;

  if not found
     or v_request.revoked_at is not null
     or v_request.consumed_at is not null
     or v_request.finalized_at is not null
     or v_request.expires_at <= now()
     or v_request.approved_at is not null then
    raise exception 'RECOVERY_REQUEST_UNAVAILABLE';
  end if;

  select * into v_employee
  from public.performance_employees e
  where e.id = p_employee_id
    and e.active is true
    and e.role = 'admin';
  if not found then
    raise exception 'ACTIVE_ADMIN_REQUIRED';
  end if;

  -- Recovery is not bootstrap. There must already be an active privileged identity and
  -- an active trusted device for this exact employee.
  if not exists (
    select 1 from public.performance_actor_identities ai
    where ai.employee_id = p_employee_id and ai.revoked_at is null
  ) then
    raise exception 'ACTIVE_IDENTITY_REQUIRED';
  end if;
  if not exists (
    select 1 from public.performance_devices d
    where d.employee_id = p_employee_id and d.revoked_at is null
  ) then
    raise exception 'ACTIVE_DEVICE_REQUIRED';
  end if;

  update public.performance_admin_recovery_requests r
  set approved_employee_id = p_employee_id,
      approved_at = now(),
      approved_by = left(trim(p_approved_by), 80)
  where r.id = v_request.id;

  return query select v_request.request_reference, p_employee_id, v_request.expires_at;
end;
$$;

revoke all on function public.performance_approve_admin_recovery(text, uuid, text) from public, anon, authenticated;
grant execute on function public.performance_approve_admin_recovery(text, uuid, text) to service_role;

-- Exchanges an operator-approved request + browser-held secret for one ordinary short-lived
-- enrollment token. The plaintext token is generated in the Edge Function and never stored.
create or replace function public.performance_exchange_admin_recovery(
  p_request_reference text,
  p_secret_hash text,
  p_device_public_id uuid,
  p_token_hash text,
  p_token_prefix text,
  p_token_expires_at timestamptz
)
returns table(employee_id uuid, display_name text, role text, recovery_expires_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.performance_admin_recovery_requests%rowtype;
  v_employee public.performance_employees%rowtype;
  v_now timestamptz := now();
begin
  if p_request_reference is null or p_request_reference !~ '^[A-Za-z0-9_-]{10,24}$'
     or p_secret_hash is null or p_secret_hash !~ '^[0-9a-f]{64}$'
     or p_token_hash is null or p_token_hash !~ '^[0-9a-f]{64}$'
     or p_token_prefix is null or length(p_token_prefix) < 6 or length(p_token_prefix) > 12 then
    raise exception 'INVALID_RECOVERY_EXCHANGE_INPUT';
  end if;

  select * into v_request
  from public.performance_admin_recovery_requests r
  where r.request_reference = p_request_reference
  for update;

  if not found
     or v_request.revoked_at is not null
     or v_request.approved_at is null
     or v_request.approved_employee_id is null
     or v_request.consumed_at is not null
     or v_request.finalized_at is not null
     or v_request.expires_at <= v_now
     or v_request.secret_hash <> p_secret_hash
     or v_request.requested_device_public_id <> p_device_public_id then
    raise exception 'RECOVERY_EXCHANGE_UNAVAILABLE';
  end if;

  if v_request.approved_employee_id not in (
    'a6eb5ecc-ca82-4b83-94f3-5a0a534e3f64'::uuid,
    'c10e9f21-e71e-4385-ab8b-855da0a506a3'::uuid
  ) then
    raise exception 'RECOVERY_EMPLOYEE_NOT_AUTHORIZED';
  end if;

  select * into v_employee
  from public.performance_employees e
  where e.id = v_request.approved_employee_id
    and e.active is true
    and e.role = 'admin';
  if not found then
    raise exception 'ACTIVE_ADMIN_REQUIRED';
  end if;

  if not exists (
    select 1 from public.performance_actor_identities ai
    where ai.employee_id = v_employee.id and ai.revoked_at is null
  ) or not exists (
    select 1 from public.performance_devices d
    where d.employee_id = v_employee.id and d.revoked_at is null
  ) then
    raise exception 'RECOVERY_NO_LONGER_ELIGIBLE';
  end if;

  if p_token_expires_at <= v_now + interval '1 minute'
     or p_token_expires_at > least(v_request.expires_at, v_now + interval '10 minutes') then
    raise exception 'INVALID_RECOVERY_TOKEN_EXPIRY';
  end if;

  update public.performance_enrollment_tokens t
  set revoked_at = v_now,
      revoked_by = v_employee.id
  where t.employee_id = v_employee.id
    and t.used_at is null
    and t.revoked_at is null
    and t.expires_at > v_now;

  insert into public.performance_enrollment_tokens (
    token_hash, token_prefix, employee_id, expires_at, created_by
  ) values (
    p_token_hash, p_token_prefix, v_employee.id, p_token_expires_at, v_employee.id
  );

  update public.performance_admin_recovery_requests r
  set consumed_at = v_now
  where r.id = v_request.id;

  return query
  select v_employee.id, v_employee.display_name, v_employee.role, v_request.expires_at;
end;
$$;

revoke all on function public.performance_exchange_admin_recovery(text, text, uuid, text, text, timestamptz) from public, anon, authenticated;
grant execute on function public.performance_exchange_admin_recovery(text, text, uuid, text, text, timestamptz) to service_role;

-- Finalization runs only after ordinary enrollment has created and authenticated the replacement
-- device. It revokes every older device/identity for the recovered employee and returns old Auth
-- user IDs so the Edge Function can additionally ban them through the Auth Admin API.
create or replace function public.performance_finalize_admin_recovery(
  p_request_reference text,
  p_employee_id uuid,
  p_new_device_id uuid,
  p_new_auth_user_id uuid
)
returns table(finalized_device_id uuid, old_auth_user_ids uuid[])
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.performance_admin_recovery_requests%rowtype;
  v_old_auth_user_ids uuid[] := '{}'::uuid[];
  v_now timestamptz := now();
begin
  select * into v_request
  from public.performance_admin_recovery_requests r
  where r.request_reference = p_request_reference
  for update;

  if not found
     or v_request.revoked_at is not null
     or v_request.approved_employee_id <> p_employee_id
     or v_request.consumed_at is null
     or v_request.finalized_at is not null then
    raise exception 'RECOVERY_FINALIZE_UNAVAILABLE';
  end if;

  if not exists (
    select 1 from public.performance_devices d
    where d.id = p_new_device_id
      and d.employee_id = p_employee_id
      and d.auth_user_id = p_new_auth_user_id
      and d.device_public_id = v_request.requested_device_public_id
      and d.revoked_at is null
      and d.enrolled_at >= v_request.requested_at
  ) then
    raise exception 'RECOVERY_REPLACEMENT_DEVICE_INVALID';
  end if;

  if not exists (
    select 1 from public.performance_actor_identities ai
    where ai.auth_user_id = p_new_auth_user_id
      and ai.employee_id = p_employee_id
      and ai.revoked_at is null
  ) then
    raise exception 'RECOVERY_REPLACEMENT_IDENTITY_INVALID';
  end if;

  select coalesce(array_agg(distinct ai.auth_user_id), '{}'::uuid[])
    into v_old_auth_user_ids
  from public.performance_actor_identities ai
  where ai.employee_id = p_employee_id
    and ai.auth_user_id <> p_new_auth_user_id
    and ai.revoked_at is null;

  update public.performance_devices d
  set revoked_at = v_now,
      revoked_reason = 'admin_recovery_replaced',
      revoked_by = p_employee_id
  where d.employee_id = p_employee_id
    and d.id <> p_new_device_id
    and d.revoked_at is null;

  update public.performance_actor_identities ai
  set revoked_at = v_now
  where ai.employee_id = p_employee_id
    and ai.auth_user_id <> p_new_auth_user_id
    and ai.revoked_at is null;

  update public.performance_admin_recovery_requests r
  set finalized_device_id = p_new_device_id,
      finalized_at = v_now
  where r.id = v_request.id;

  return query select p_new_device_id, v_old_auth_user_ids;
end;
$$;

revoke all on function public.performance_finalize_admin_recovery(text, uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function public.performance_finalize_admin_recovery(text, uuid, uuid, uuid) to service_role;
