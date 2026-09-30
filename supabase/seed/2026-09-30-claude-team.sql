-- Claude Code Team 方案,4 個 Standard 座位(使用者 2026-09-30 定案)
-- 牌價:anthropic.com/pricing 2026-09-30 查,Standard seat USD 25 / 人 / 月,年繳
-- 在 Supabase SQL Editor 執行一次。
insert into public.items (kind, category, name, spec, quantity, unit_price, currency, billing, note) values
('cloud', 'Claude Code', 'Claude Team 方案 Standard 座位', 'Standard seat,含 Claude Code;數量 = 人數', 4, 25, 'USD', 'monthly', '年繳牌價 25 USD/人/月(月繳較貴);Premium 座位 100 USD 用量 5 倍,需要再升');
