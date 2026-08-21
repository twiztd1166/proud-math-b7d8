-- Paradise Performance v1 — one-time out-of-band proof for the first real test admin.
-- Stores only SHA-256 hashes; plaintext proof/email credentials are never stored here.

create table if not exists public.performance_bootstrap_challenges (
  id uuid primary key default gen_random_uuid(),
  proof_hash text not null unique,
  email_hash text not null,
  employee_id uuid not null references public.performance_employees(id) on delete cascade,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint performance_bootstrap_challenges_proof_hash_ck check (proof_hash ~ '^[0-9a-f]{64}$'),
  constraint performance_bootstrap_challenges_email_hash_ck check (email_hash ~ '^[0-9a-f]{64}$'),
  constraint performance_bootstrap_challenges_expiry_ck check (expires_at > created_at)
);

alter table public.performance_bootstrap_challenges enable row level security;

revoke all on table public.performance_bootstrap_challenges from public, anon, authenticated;
grant select, insert, update, delete on table public.performance_bootstrap_challenges to service_role;

create policy performance_bootstrap_challenges_deny_client
on public.performance_bootstrap_challenges
for all
to anon, authenticated
using (false)
with check (false);

create index if not exists performance_bootstrap_challenges_expires_idx
  on public.performance_bootstrap_challenges (expires_at)
  where consumed_at is null;

comment on table public.performance_bootstrap_challenges is
  'One-time hashed out-of-band proof records for first real Performance admin bootstrap; service-role only; not an employee credential store.';
