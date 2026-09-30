-- 2026-09-30 雲端項目加「大類」provider(Azure / AWS / Claude / 其他);設備項目留空字串。
-- 可重複執行。
alter table public.items add column if not exists provider text not null default '';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'items_provider_check') then
    alter table public.items add constraint items_provider_check
      check (provider in ('', 'Azure', 'AWS', 'Claude', '其他'));
  end if;
end $$;

-- 既有資料回填
update public.items set provider = 'Azure'  where kind = 'cloud' and provider = '' and category like 'Azure%';
update public.items set provider = 'AWS'    where kind = 'cloud' and provider = '' and category like 'AWS%';
update public.items set provider = 'Claude' where kind = 'cloud' and provider = '' and category like 'Claude%';
update public.items set provider = '其他'   where kind = 'cloud' and provider = '';
