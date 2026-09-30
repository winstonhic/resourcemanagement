-- 2026-09-30 使用者定案:沒登入什麼都看不到;登入者可看可改。
-- 收掉 anon 的讀取政策與 grant。可重複執行。

drop policy if exists items_read on public.items;
create policy items_read on public.items for select to authenticated using (true);

drop policy if exists settings_read on public.settings;
create policy settings_read on public.settings for select to authenticated using (true);

revoke all on public.items from anon;
revoke all on public.settings from anon;
