-- 2026-09-30 使用者定案:設備類別改名,強調是自建(相對於雲端租用)
update public.items set category = '自建伺服器' where category = '伺服器';
update public.items set category = '自建儲存'   where category = '儲存';
