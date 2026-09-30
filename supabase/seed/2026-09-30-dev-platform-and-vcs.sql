-- 初始資料:澎湖 / 台南測試區最小申裝 VM(AWS 台北區 ap-east-2)+ 版控實體設備
-- 來源:SiteManage sites/penghu/plan/2026-09-16-aws-taipei-price-check.md
--       SiteManage sites/tainan/plan/2026-09-15-public-cloud-spec-minimal.md
--       SiteManage sites/tainan/plan/2026-09-15-aws-taipei-price-check.md
--       SiteManage sites/vcs/plan/2026-09-15-vcs-hardware-spec.md
-- 口徑:雲端 VM 照 2026-09-14 定案「平常全關、每月開 5 天 × 10 小時 = 50 小時」,
--       數量欄 = 每月開機小時數、單價欄 = AWS 隨需 USD/小時;磁碟/VPN/IP 關機照付,數量 = GB 或 730 小時。
-- 在 Supabase SQL Editor 執行一次。重複執行會重複插入,請勿執行第二次。

insert into public.items (kind, category, name, spec, quantity, unit_price, currency, billing, note) values
-- ===== 澎湖測試區(5 顆 VM,28 vCPU / 88 GB / 1.7 TB)=====
('cloud', 'AWS(澎湖)', 'Web / API:IIS 31 個應用程式 + MQTT', 'c6i.2xlarge Windows,8 vCPU / 16 GB,磁碟 300 GB', 50, 0.7532, 'USD', 'monthly', '每月開 5 天 × 10 h;含 Windows 授權'),
('cloud', 'AWS(澎湖)', 'SQL Server 平台庫', 'm6i.xlarge Windows,4 vCPU / 16 GB,磁碟 200 GB', 50, 0.4072, 'USD', 'monthly', '每月開 5 天 × 10 h;SQL Developer 版免費'),
('cloud', 'AWS(澎湖)', 'SQL Server 事件庫', 'm6i.2xlarge Windows,8 vCPU / 32 GB,磁碟 500 GB', 50, 0.8144, 'USD', 'monthly', '每月開 5 天 × 10 h'),
('cloud', 'AWS(澎湖)', '事件源重放 + 對外端點 mock', 'c6i.xlarge Linux,4 vCPU / 8 GB,磁碟 200 GB', 50, 0.1926, 'USD', 'monthly', '每月開 5 天 × 10 h'),
('cloud', 'AWS(澎湖)', '開發工具', 'm6i.xlarge Linux,4 vCPU / 16 GB,磁碟 500 GB', 50, 0.2232, 'USD', 'monthly', '每月開 5 天 × 10 h'),
('cloud', 'AWS(澎湖)', 'EBS gp3 磁碟(關機照付)', '1,700 GB,USD/GB-月', 1700, 0.0864, 'USD', 'monthly', '五顆 VM 磁碟合計;轉快照冷藏可再省約 2,000 元/月'),
('cloud', 'AWS(澎湖)', 'EBS 快照(匯入映像)', '500 GB,USD/GB-月', 500, 0.045, 'USD', 'monthly', ''),
('cloud', 'AWS(澎湖)', 'Site-to-Site VPN', '一條,USD/小時 × 730 h', 730, 0.05, 'USD', 'monthly', ''),
('cloud', 'AWS(澎湖)', '固定公共 IPv4', '一個,USD/小時 × 730 h', 730, 0.005, 'USD', 'monthly', ''),
-- ===== 台南測試區 最小版(6 顆 VM,32 vCPU / 116 GB / 1.1 TB)=====
('cloud', 'AWS(台南)', 'solr:SolrCloud 單節點 + ZK + Cloudera Manager + 查詢 API', 'm6i.2xlarge Linux,8 vCPU / 32 GB,磁碟 200 GB,CentOS 7.5 匯入', 50, 0.4464, 'USD', 'monthly', '每月開 5 天 × 10 h'),
('cloud', 'AWS(台南)', 'indexer:dragon indexer + CSV 備份 + 可疑車牌告警', 'c6i.large Linux,2 vCPU / 4 GB,磁碟 50 GB,CentOS 6.5 匯入', 50, 0.0963, 'USD', 'monthly', '每月開 5 天 × 10 h'),
('cloud', 'AWS(台南)', 'spark:單節點 CDH 5.15 + PostgreSQL + Hotarea', 'm6i.2xlarge Linux,8 vCPU / 32 GB,磁碟 300 GB,CentOS 7.5 匯入', 50, 0.4464, 'USD', 'monthly', '每月開 5 天 × 10 h'),
('cloud', 'AWS(台南)', 'tools:git / CI / registry / 跳板 / 監控 + 事件源重放 + mock', 'c6i.xlarge Linux,4 vCPU / 8 GB,磁碟 300 GB,Ubuntu', 50, 0.1926, 'USD', 'monthly', '每月開 5 天 × 10 h'),
('cloud', 'AWS(台南)', 'lpr2:二次車辨(選配)', 'm6i.large Linux,2 vCPU / 8 GB,磁碟 50 GB,Ubuntu', 50, 0.1116, 'USD', 'monthly', '每月開 5 天 × 10 h;USB 硬體鎖無法直通,只能驗授權失效路徑,可不租'),
('cloud', 'AWS(台南)', 'win:IIS 整套 + SQL Server Developer 同機', 'm6i.2xlarge Windows,8 vCPU / 32 GB,磁碟 200 GB,Windows Server 2012 R2 匯入', 50, 0.8144, 'USD', 'monthly', '每月開 5 天 × 10 h;含 Windows 授權'),
('cloud', 'AWS(台南)', 'EBS gp3 磁碟(關機照付)', '1,100 GB,USD/GB-月', 1100, 0.0864, 'USD', 'monthly', '六顆 VM 磁碟合計'),
('cloud', 'AWS(台南)', 'EBS 快照(匯入映像)', '500 GB,USD/GB-月', 500, 0.045, 'USD', 'monthly', 'CentOS 6.5 / 7.5、Win 2012 R2 映像'),
('cloud', 'AWS(台南)', 'Site-to-Site VPN', '一條,USD/小時 × 730 h', 730, 0.05, 'USD', 'monthly', ''),
('cloud', 'AWS(台南)', '固定公共 IPv4', '一個,USD/小時 × 730 h', 730, 0.005, 'USD', 'monthly', ''),
-- ===== 版控組實體設備(Gitea + CI runner + registry)=====
('equipment', '伺服器', '版控主機(Gitea + CI runner + registry 三顆 VM)', '16 核 / 32 緒單路、128 GB RAM、2×480 GB SSD 鏡像(系統)、2×1.92 TB 企業級 SSD 鏡像、2×20 TB SATA HDD 鏡像、雙埠 10 GbE、雙電源、1U/2U 機架', 1, 380000, 'TWD', 'one_time', '概估 22–38 萬,取上限;價差在 SSD 企業級或消費級;採購前以當日報價驗證'),
('equipment', '儲存', '版控備份 NAS', '4 槽 × 8 TB,RAID5 可用約 22 TB;與主機分開放', 1, 80000, 'TWD', 'one_time', '概估 5–8 萬,取上限;只備 Gitea dump、PostgreSQL dump、LFS、vendor image');
