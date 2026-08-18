-- Paradise Performance v1 security hardening before first controlled backend application.
-- Close SECURITY DEFINER default-execute exposure and bind correction resolution to the actual manager actor.

-- Postgres grants EXECUTE to PUBLIC on new functions by default, so remove that implicit surface.
revoke execute on function public.performance_current_employee_id() from public, anon;
revoke execute on function public.performance_current_role() from public, anon;
revoke execute on function public.performance_is_manager() from public, anon;
revoke execute on function public.performance_is_admin() from public, anon;

grant execute on function public.performance_current_employee_id() to authenticated;
grant execute on function public.performance_current_role() to authenticated;
grant execute on function public.performance_is_manager() to authenticated;
grant execute on function public.performance_is_admin() to authenticated;

-- Only managers/admins may resolve requests, and the resolver must be the current actor.
drop policy if exists performance_correction_requests_update_authorized on public.performance_correction_requests;
create policy performance_correction_requests_update_authorized on public.performance_correction_requests
for update to authenticated
using (public.performance_is_manager())
with check (
  public.performance_is_manager()
  and resolved_by = public.performance_current_employee_id()
  and status in ('approved','rejected')
  and resolved_at is not null
);

-- Keep public schema CREATE closed to API roles.
revoke create on schema public from anon;
revoke create on schema public from authenticated;

-- Security invariant: privileged helper execution and manager attribution must remain explainable and non-impersonable.
-- No helper function relies on user-editable JWT user_metadata for authorization.