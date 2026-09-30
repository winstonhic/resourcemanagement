-- 有了大類之後,小類名稱不必再帶「Azure(...)」前綴
update public.items set category = '澎湖 QA'     where category = 'Azure(澎湖 QA)';
update public.items set category = '金門 QA'     where category = 'Azure(金門 QA)';
update public.items set category = '科技執法 QA' where category = 'Azure(科技執法 QA)';
update public.items set category = '共用'        where category = 'Azure(共用)';
