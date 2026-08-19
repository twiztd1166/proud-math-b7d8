-- Paradise Performance v1 KPI version grouping hardening.
-- One shift pins one KPI version label; that label must be able to carry one row per KPI metric.
-- No numeric KPI standards are seeded by this migration.

alter table public.performance_kpi_standard_versions
  drop constraint if exists performance_kpi_standard_versions_version_label_key;

alter table public.performance_kpi_standard_versions
  add constraint performance_kpi_standard_versions_version_metric_key
  unique (version_label, metric_key);
