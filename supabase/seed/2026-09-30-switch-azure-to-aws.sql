-- 2026-09-30 使用者定案:雲端 QA 測試區由 Azure 改為 AWS
-- 來源:docs/AzureDevTestLab_v3.md「每月雲端預估費用分析(精簡版 QA 區,10 台)」AWS 欄
-- 口徑不變:平日 08–18 開機、每月 220 小時算力、磁碟與 VPN 全月;簡報以 us-east-1 牌價、匯率 32。
--       若要台北區(ap-east-2)價格需另查。
-- 在 Supabase SQL Editor 執行一次。

update public.items set provider = 'AWS', unit_price = 189,
  spec = '8 vCPU / 24 GB / 800 GB;網站、DB 各 1 台,其餘工具合併;1 台 Windows 4 vCPU;m6i 系列 + gp3'
  where kind = 'cloud' and category = '澎湖 QA';

update public.items set provider = 'AWS', unit_price = 239,
  spec = '12 vCPU / 36 GB / 900 GB;查詢叢集 3 台精簡為 1 台,其餘合併;1 台 Windows 4 vCPU;m6i 系列 + gp3'
  where kind = 'cloud' and category = '金門 QA';

update public.items set provider = 'AWS', unit_price = 538,
  spec = '32 vCPU / 96 GB / 2,500 GB;Kafka / DB 去 HA 各留 1 台,Log / NFS / SFTP 合併;全 Linux;m6i 系列 + gp3'
  where kind = 'cloud' and category = '科技執法 QA';

update public.items set provider = 'AWS', unit_price = 73,
  name = 'EKS 控制面', spec = '每叢集 0.10 USD/h;容器跑在上列 VM,另建 Node Group 需另計',
  note = 'Azure AKS 對照為免費層'
  where kind = 'cloud' and category = '共用' and name = 'AKS 控制面';

update public.items set provider = 'AWS', unit_price = 37,
  name = 'Site-to-Site VPN', spec = '一條 VPN 連線,24 小時計費',
  note = 'Azure VpnGw1 對照為 150 USD/月'
  where kind = 'cloud' and category = '共用' and name = 'Site-to-Site VPN Gateway';
