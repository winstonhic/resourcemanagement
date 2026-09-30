-- 2026-09-30 大類加 OpenAI(Codex 訂閱)。可重複執行。
alter table public.items drop constraint if exists items_provider_check;
alter table public.items add constraint items_provider_check
  check (provider in ('', 'Azure', 'AWS', 'Claude', 'OpenAI', '其他'));
alter table public.actuals drop constraint if exists actuals_scope_check;
alter table public.actuals add constraint actuals_scope_check
  check (scope in ('', 'Azure', 'AWS', 'Claude', 'OpenAI', '其他', 'equipment'));
