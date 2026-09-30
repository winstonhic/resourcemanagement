-- 2026-09-30 核定預算與實際動用。可重複執行。

create table if not exists public.budgets (
  id          bigint generated always as identity primary key,
  name        text not null,
  amount      numeric not null check (amount >= 0),          -- 核定金額 TWD
  start_date  date not null,
  end_date    date not null,
  note        text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  check (end_date >= start_date)
);

-- 預算 ↔ 項目(預計動用在哪些項目)
create table if not exists public.budget_items (
  budget_id bigint not null references public.budgets(id) on delete cascade,
  item_id   bigint not null references public.items(id) on delete cascade,
  primary key (budget_id, item_id)
);
create index if not exists budget_items_item_id_idx on public.budget_items (item_id);

-- 實際動用:台幣實付金額
create table if not exists public.actuals (
  id          bigint generated always as identity primary key,
  budget_id   bigint not null references public.budgets(id) on delete cascade,
  item_id     bigint references public.items(id) on delete set null,
  spent_on    date not null,
  amount      numeric not null check (amount >= 0),
  note        text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists actuals_budget_id_idx on public.actuals (budget_id);
create index if not exists actuals_item_id_idx on public.actuals (item_id);

drop trigger if exists budgets_set_updated_at on public.budgets;
create trigger budgets_set_updated_at before update on public.budgets
  for each row execute function public.set_updated_at();
drop trigger if exists actuals_set_updated_at on public.actuals;
create trigger actuals_set_updated_at before update on public.actuals
  for each row execute function public.set_updated_at();

-- RLS:登入者可看可改(與 items 相同口徑)
alter table public.budgets enable row level security;
alter table public.budget_items enable row level security;
alter table public.actuals enable row level security;

drop policy if exists budgets_all on public.budgets;
create policy budgets_all on public.budgets for all to authenticated using (true) with check (true);
drop policy if exists budget_items_all on public.budget_items;
create policy budget_items_all on public.budget_items for all to authenticated using (true) with check (true);
drop policy if exists actuals_all on public.actuals;
create policy actuals_all on public.actuals for all to authenticated using (true) with check (true);

grant select, insert, update, delete on public.budgets, public.budget_items, public.actuals to authenticated;
revoke all on public.budgets, public.budget_items, public.actuals from anon;
