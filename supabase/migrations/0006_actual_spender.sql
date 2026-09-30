-- 2026-09-30 實際動用要記動用人。可重複執行。
alter table public.actuals add column if not exists spender text not null default '';
