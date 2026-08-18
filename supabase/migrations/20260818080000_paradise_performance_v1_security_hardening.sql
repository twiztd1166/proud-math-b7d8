-- Paradise Performance v1 security hardening before first controlled backend application.
-- Close SECURITY DEFINER default-execute exposure and bind correction resolution to the actual manager actor.

-- SECURITY DEFINER helpers are intentionally callable only by authenticated Performance users.
-- Postgres grants EXECUTE to PUBLIC on new functions by default, so remove that implicit surface.
revoke execute on function public.performance_current_employee_id() from public, anon;
revoke execute on function public.performance_current_role() from public, anon;
revoke execute on function public.performance_is_manager() from public, anon;
revoke execute on function public.performance_is_admin() from public, anon;

grant execute on function public.performance_current_employee_id() to authenticated;
grant execute on function public.performance_current_role() to authenticated;
grant execute on function public.performance_is_manager() to authenticated;
grant execute on function public.performance_is_admin() to authenticated;

-- A manager resolving a correction request may not attribute that resolution to another employee.
drop policy if exists performance_correction_requests_update_authorized on public.performance_correction_requests;
create policy performance_correction_requests_update_authorized on public.performance_correction_requests
for update to authenticated
using (public.performance_is_manager())
with check (
  public.performance_is_manager()
  and (
    (
      status in ('approved','rejected')
      and resolved_by = public.performance_current_employee_id()
      and resolved_at is not null
    )
    or (
      status in ('open','withdrawn')
      and resolved_by is null
    )
  )
);

-- Security invariant: privileged helper execution and manager attribution must remain explainable and non-impersonable.
