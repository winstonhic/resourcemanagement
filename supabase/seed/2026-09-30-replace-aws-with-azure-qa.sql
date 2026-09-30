-- 2026-09-30 使用者定案:以「公有雲 QA 測試區」Azure DevTest Labs 精簡版取代原 AWS 台北區澎湖/台南 19 筆
-- 來源:docs/AzureDevTestLab_v3.md「每月雲端預估費用分析(精簡版 QA 區,10 台,建議)」
-- 口徑:平日 08–18 開機,每月 220 小時算力;磁碟與 VPN 全月計費;Azure East US 2 牌價;簡報匯率 32。
--       簡報只給區塊月費,故一區塊一筆,數量 1、單價 = 該區塊月費 USD。
-- 在 Supabase SQL Editor 執行一次。

begin;

delete from public.items where kind = 'cloud' and category in ('AWS(澎湖)', 'AWS(台南)');

insert into public.items (kind, category, name, spec, quantity, unit_price, currency, billing, note) values
('cloud', 'Azure(澎湖 QA)', '澎湖 QA 區 2 台 VM', '8 vCPU / 24 GB / 800 GB;網站、DB 各 1 台,其餘工具合併;1 台 Windows 4 vCPU;Standard_D 系列', 1, 185, 'USD', 'monthly', '每月 220 h 算力 + 磁碟全月;正式環境 5 台精簡為 2 台'),
('cloud', 'Azure(金門 QA)', '金門 QA 區 2 台 VM', '12 vCPU / 36 GB / 900 GB;查詢叢集 3 台精簡為 1 台,其餘合併;1 台 Windows 4 vCPU', 1, 235, 'USD', 'monthly', '每月 220 h 算力 + 磁碟全月;正式環境 6 台精簡為 2 台'),
('cloud', 'Azure(科技執法 QA)', '科技執法平台 QA 區 6 台 VM', '32 vCPU / 96 GB / 2,500 GB;Kafka / DB 去 HA 各留 1 台,Log / NFS / SFTP 合併;全 Linux', 1, 525, 'USD', 'monthly', '每月 220 h 算力 + 磁碟全月;正式環境 18 台精簡為 6 台'),
('cloud', 'Azure(共用)', 'AKS 控制面', '免費層;容器跑在上列 VM,另建 Node Pool 需另計', 1, 0, 'USD', 'monthly', 'AWS EKS 對照為 73 USD/月'),
('cloud', 'Azure(共用)', 'Site-to-Site VPN Gateway', 'VpnGw1,24 小時計費', 1, 150, 'USD', 'monthly', '地端 QA 終端與雲端互連;AWS S2S VPN 對照為 37 USD/月');

commit;
