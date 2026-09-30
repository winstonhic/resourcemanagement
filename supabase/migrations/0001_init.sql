-- ResourceManagement 初始資料表
-- 可重複執行(idempotent)。在 Supabase SQL Editor 貼上執行。

-- items:雲端服務與設備共用一張表,用 kind 分
create table if not exists public.items (
  id          bigint generated always as identity primary key,
  kind        text not null check (kind in ('cloud', 'equipment')),
  category    text not null default '',
  name        text not null,
  spec        text not null default '',
  quantity    numeric not null default 1 check (quantity >= 0),
  unit_price  numeric not null check (unit_price >= 0),
  currency    text not null check (currency in ('USD', 'TWD')),
  billing     text not null check (billing in ('monthly', 'one_time')),
  note        text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists items_kind_idx on public.items (kind);

-- settings:key/value,目前只有 usd_twd_rate
create table if not exists public.settings (
  key        text primary key,
  value      numeric not null check (value > 0),
  updated_at timestamptz not null default now()
);
insert into public.settings (key, value) values ('usd_twd_rate', 32.5)
  on conflict (key) do nothing;

-- updated_at 自動更新
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end
$$;
drop trigger if exists items_set_updated_at on public.items;
create trigger items_set_updated_at before update on public.items
  for each row execute function public.set_updated_at();
drop trigger if exists settings_set_updated_at on public.settings;
create trigger settings_set_updated_at before update on public.settings
  for each row execute function public.set_updated_at();

-- RLS:anon 唯讀、authenticated 可寫。
-- 設計決定:本專案在 Auth 關閉開放註冊,帳號由管理者在後台建,
-- 所以「已登入」即「允許編輯的人」,不做 per-row 擁有者檢查。
alter table public.items enable row level security;
alter table public.settings enable row level security;

drop policy if exists items_read on public.items;
create policy items_read on public.items
  for select to anon, authenticated using (true);
drop policy if exists items_write on public.items;
create policy items_write on public.items
  for all to authenticated using (true) with check (true);

drop policy if exists settings_read on public.settings;
create policy settings_read on public.settings
  for select to anon, authenticated using (true);
drop policy if exists settings_write on public.settings;
create policy settings_write on public.settings
  for all to authenticated using (true) with check (true);

-- Data API grants(新專案不一定自動給)
grant usage on schema public to anon, authenticated;
grant select on public.items, public.settings to anon;
grant select, insert, update, delete on public.items, public.settings to authenticated;
