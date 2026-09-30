-- 2026-09-30 使用者定案:預算不對到細項,只對到大類(Azure / AWS / Claude / 其他 / equipment=自建設備)
-- 三張表此時仍是空的,直接改結構。可重複執行。

alter table public.budgets add column if not exists scopes text[] not null default '{}';
drop table if exists public.budget_items;

alter table public.actuals drop column if exists item_id;
alter table public.actuals add column if not exists scope text not null default '';
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'actuals_scope_check') then
    alter table public.actuals add constraint actuals_scope_check
      check (scope in ('', 'Azure', 'AWS', 'Claude', '其他', 'equipment'));
  end if;
end $$;
