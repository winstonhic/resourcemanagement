-- 2026-09-30 使用者追加:Claude Code Team Premium 座位 1 位(估計)
-- 牌價:anthropic.com/pricing 2026-09-30 查,Premium seat USD 100 / 人 / 月(年繳),月繳 125
insert into public.items (kind, category, name, spec, quantity, unit_price, currency, billing, note) values
('cloud', 'Claude Code', 'Claude Team 方案 Premium 座位', 'Premium seat,用量為 Standard 的 5 倍;數量 = 人數', 1, 100, 'USD', 'monthly', '年繳牌價 100 USD/人/月,月繳 125');
