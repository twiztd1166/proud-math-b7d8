-- Finalize the two remaining thin 2026 research contact routes with direct current contact channels.
do $$
declare
  visible_count integer;
  thin_count integer;
begin
  select count(*) into visible_count
  from public.shows_app_research_calendar_controls
  where active=true and calendar_visibility=true and plan_year=2026;

  select count(*) into thin_count
  from public.shows_app_research_calendar_controls
  where control_id in ('R2026-068-FREEDOM-5K','R2026-080-PSL-INTERNATIONAL')
    and active=true and calendar_visibility=true and plan_year=2026
    and (
      (control_id='R2026-068-FREEDOM-5K'
       and detail_data->>'contact_text'='Official RunSignup Race Director contact form · Freedom Isn''t Free Run 5K')
      or
      (control_id='R2026-080-PSL-INTERNATIONAL'
       and detail_data->>'contact_text'='Port St. Lucie Special Events Department')
    );

  if visible_count <> 117 then
    raise exception 'Expected 117 visible 2026 research controls; found %', visible_count;
  end if;
  if thin_count <> 2 then
    raise exception 'Expected both thin contact routes to match preconditions; matched %', thin_count;
  end if;
end $$;

update public.shows_app_research_calendar_controls
set
  detail_data = jsonb_set(
    jsonb_set(detail_data,'{contact_status}',to_jsonb('CURRENT OFFICIAL VERIFIED'::text),true),
    '{contact_text}',
    to_jsonb('Special Events Department · specialevents@cityofpsl.com · 772-344-4139'::text),
    true
  ),
  source_refs = case
    when exists (
      select 1 from jsonb_array_elements(coalesce(source_refs,'[]'::jsonb)) e
      where e->>'url'='https://www.cityofpsl.com/Government/Your-City-Government/Departments/Special-Events'
    ) then source_refs
    else coalesce(source_refs,'[]'::jsonb) || jsonb_build_array(jsonb_build_object(
      'url','https://www.cityofpsl.com/Government/Your-City-Government/Departments/Special-Events',
      'title','Port St. Lucie Special Events — International Fest and vendor contact',
      'checked_at','2026-09-30'
    ))
  end,
  updated_at=now()
where control_id='R2026-080-PSL-INTERNATIONAL';

update public.shows_app_research_calendar_controls
set
  detail_data = jsonb_set(
    jsonb_set(detail_data,'{contact_status}',to_jsonb('CURRENT OFFICIAL VERIFIED'::text),true),
    '{contact_text}',
    to_jsonb('Official RunSignup Race Director contact form; Treasure Coast Blue Star Mothers FL11 (beneficiary) · info.fl11@bluestarmothers.us · 772-301-8661'::text),
    true
  ),
  source_refs = (
    case
      when exists (
        select 1 from jsonb_array_elements(coalesce(source_refs,'[]'::jsonb)) e
        where e->>'url'='https://bluestarmothersfl11.org/service-projects'
      ) then coalesce(source_refs,'[]'::jsonb)
      else coalesce(source_refs,'[]'::jsonb) || jsonb_build_array(jsonb_build_object(
        'url','https://bluestarmothersfl11.org/service-projects',
        'title','Treasure Coast Blue Star Mothers FL11 — current chapter contact',
        'checked_at','2026-09-30'
      ))
    end
  ) ||
  case
    when exists (
      select 1 from jsonb_array_elements(coalesce(source_refs,'[]'::jsonb)) e
      where e->>'url'='https://www.bluestarmothers.org/index.php?id=60&option=com_content&view=article'
    ) then '[]'::jsonb
    else jsonb_build_array(jsonb_build_object(
      'url','https://www.bluestarmothers.org/index.php?id=60&option=com_content&view=article',
      'title','Blue Star Mothers of America — FL11 Treasure Coast chapter directory',
      'checked_at','2026-09-30'
    ))
  end,
  updated_at=now()
where control_id='R2026-068-FREEDOM-5K';

do $$
declare
  visible_count integer;
  route_only integer;
  placeholder_count integer;
begin
  select count(*) into visible_count
  from public.shows_app_research_calendar_controls
  where active=true and calendar_visibility=true and plan_year=2026;

  select count(*) into placeholder_count
  from public.shows_app_research_calendar_controls
  where active=true and calendar_visibility=true and plan_year=2026
    and (
      upper(coalesce(detail_data->>'contact_status',''))='NOT VERIFIED'
      or lower(trim(coalesce(detail_data->>'contact_text','')))='not verified'
      or nullif(trim(coalesce(detail_data->>'contact_text','')),'') is null
    );

  select count(*) into route_only
  from public.shows_app_research_calendar_controls
  where active=true and calendar_visibility=true and plan_year=2026
    and coalesce(detail_data->>'contact_text','') !~* '@'
    and regexp_replace(coalesce(detail_data->>'contact_text',''),'[^0-9]','','g') !~ '[0-9]{7}';

  if visible_count <> 117 then
    raise exception 'Visible research universe changed unexpectedly: %', visible_count;
  end if;
  if placeholder_count <> 0 then
    raise exception 'Contact placeholders remain: %', placeholder_count;
  end if;
  if route_only <> 0 then
    raise exception 'Contact routes without direct email or phone remain: %', route_only;
  end if;
end $$;
