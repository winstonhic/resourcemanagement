-- 2026-09-30 使用者定案:Codex 走 ChatGPT Business,4 個 Standard 座位,年繳
-- 牌價:chatgpt.com/pricing 2026-09-30 查(台灣),Standard seat NT$ 630 / 人 / 月(年繳;月繳 790)
-- 先執行 migrations/0007_provider_openai.sql
insert into public.items (kind, provider, category, name, spec, quantity, unit_price, currency, billing, note) values
('cloud', 'OpenAI', 'Codex', 'ChatGPT Business Standard 座位(含 Codex)', 'Standard seat;數量 = 人數', 4, 630, 'TWD', 'monthly', '年繳牌價 630 TWD/人/月,月繳 790;Premium 座位 3,150 用量 5 倍');
