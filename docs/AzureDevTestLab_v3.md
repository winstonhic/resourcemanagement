---
marp: true
theme: default
paginate: true
header: "公有雲 QA 測試區建置與資源池評估報告"
footer: "Azure DevTest Labs vs. AWS"
style: |
  section {
    font-family: 'Segoe UI', 'Microsoft JhengHei', sans-serif;
    padding: 70px 60px 60px;
    font-size: 28px;
  }
  h1 { color: #0078D4; }
  h2 { color: #2B579A; }
  table {
    font-size: 80%;
  }
  /* 重點標示：紅 = 關鍵數字／風險、藍 = 建議方案／關鍵名詞、綠 = 節省效益 */
  .r { color: #C62828; font-weight: bold; }
  .b { color: #0063B1; font-weight: bold; }
  .g { color: #2E7D32; font-weight: bold; }
---

<!-- _paginate: false -->
<!-- _header: "" -->

# 公有雲 QA 測試區建置與資源池評估報告

## Azure DevTest Labs vs. AWS 解決方案架構與費用精算

---

## 專案目標與評估摘要

<style scoped>
section { font-size: 24px; }
</style>

- **建立專屬 QA 測試環境**
  為澎湖、金門及科技執法平台（正式環境共 <span class="r">29 台 VM</span> 規模）建立高效率、低成本之測試驗證區。
- **四大核心需求回應**
  - **資源池概念**：以訂閱與預算上限（Quota/Budget）達到 vCPU / RAM / Disk 總量管控。
  - **自主配置**：支援自主建立 Windows/Linux VMs 與 AKS/EKS 託管 Container。
  - **狀態保存與關機**：下班時間關機即<span class="g">停止算力計費</span>，重啟時完整保留系統設定與 Disk 資料。
  - **FinOps 費用監管**：精準預算告警（如 80% 門檻告警）與成本優化。
- **效益亮點**
  透過排程自動關機（每週運作 50 小時），算力費用可省約 <span class="g">70%</span>，含儲存與網路之總費用約省 <span class="g">62%</span>。

---

## 需求對照與雲端服務選型 (Azure vs. AWS)

| 需求項目             | Azure 解決方案                  | AWS 解決方案                           | 評估建議                                                                  |
| :------------------- | :------------------------------ | :------------------------------------- | :------------------------------------------------------------------------ |
| **資源池管理**       | Subscriptions / Resource Groups | AWS Accounts / Resource Groups         | 兩者皆可透過配額上限（Quotas）達成資源池總量管控                          |
| **VMs / Containers** | DevTest Labs + AKS              | Service Catalog + EKS                  | <span class="b">Azure DevTest Labs</span> 對多 VM 快速派發與管理介面更直覺 |
| **關機與狀態保留**   | Auto-shutdown + Managed Disks   | EventBridge + Resource Scheduler + EBS | 兩者皆可在停止計費同時保留 Disk 靜態資料                                  |
| **費用告警與監管**   | Azure Cost Management & Budgets | AWS Budgets + Cost Anomaly Detection   | 均支援自訂金額（如 NT$ 10,000）與多階層（80%）告警                        |

---

## Azure DevTest Labs 架構與生命週期管理

<style scoped>
section { font-size: 24px; }
</style>

- **集中化 Labs 管理**（DevTest Labs 為 Azure 內的管理服務，底層 VM / Disk 即一般 Azure 資源）
  - **自訂範本 (Custom Images/ARM/Bicep)**：將各平台系統配置封裝為範本，<span class="b">一鍵快速派發</span>。
  - **預算與配額限制**：為每位 QA 人員或測試專案設定 VM 數量上限與規格限制。
- **自動化關機與狀態保留 (State Preservation)**
  - **運作模式**：平日 <span class="b">08:00 自動啟動、18:00 自動 Deallocate VM</span>（停止算力計費，每日 10 小時），週末不開機。
  - **資料不遺失**：OS Disk 與 Data Disk 資料持續保留在 Managed Disks，重啟後即可接續測試。
- **容器 (Container) 整合**
  - 支援直接在 VM 內運行 Docker/Compose，亦可快速串接 **AKS** 進行微服務測試。

---

## 正式環境規格彙整表

<style scoped>
section { font-size: 23px; }
</style>

- **澎湖區 (5 台)**
  - **規格總計**：28 vCPU / 88 GB RAM / 1,700 GB Storage (3 Win / 2 Linux)
  - **對應機型**：Azure Standard_D8s_v5 / Standard_D4s_v5
- **金門區 (6 台)**
  - **規格總計**：38 vCPU / 116 GB RAM / 2,200 GB Storage (1 Win / 5 Linux)
  - **對應機型**：Azure Standard_D8s_v5 / Standard_D2s_v5 / Standard_D4s_v5
- **科技執法平台 (18 台)**
  - **包含角色**：Frontend/Backend (3)、Kafka (3)、DB (3)、Log (1)、NFS/SFTP (1) 等共 18 台
  - **規格總計**：116 vCPU / 384 GB RAM / 6,800 GB Storage (全數 Linux)
  - **對應機型**：Azure Dsv5 系列（依各角色規格對應）
- **總規模小計**：<span class="r">29 台 VM | 182 vCPU | 588 GB RAM | 10.7 TB SSD Storage</span>

_註：RAM 為各主機實際需求量；Dsv5 為 4 GB/vCPU 固定比例，實際配置之 RAM 會大於表列值（費用以 vCPU 計，不受影響）。_

---

## 測試環境規格評估方法 (Sizing Methodology)

<style scoped>
section { font-size: 22px; }
table { font-size: 85%; }
</style>

- **評估步驟**：① 盤點各主機角色與近 30 天 CPU/RAM 使用率 (取 P95) → ② 移除 HA 冗餘節點 → ③ 依下表比例縮減並對應最小 Azure SKU → ④ 合併輔助服務

| 評估面向            | 正式環境設計依據             | 測試環境評估原則                                         |                建議比例                 |
| :------------------ | :--------------------------- | :------------------------------------------------------- | :-------------------------------------: |
| **HA 叢集節點**     | Kafka / DB / 查詢叢集 3 節點 | 功能測試保留 1 節點；需驗證 Failover 時再臨時擴回 3 節點 | <span class="r">節點數 1/3</span>       |
| **vCPU**            | 尖峰併發量                   | 以正式環境 P95 使用量 × 1.3 緩衝估算，最小 2 vCPU        | <span class="r">約 25%~35%</span>       |
| **RAM**             | 尖峰負載 + 快取              | 需滿足中介軟體最低需求 (如 DB ≥ 16 GB、Kafka ≥ 8 GB)     | <span class="r">約 25%~35%</span>       |
| **Disk**            | 資料保存年限                 | 測試資料集大小 + 30% 成長空間，資料保留 30 天            | <span class="r">約 40%</span>           |
| **輔助服務**        | Log / NFS / SFTP 各自獨立    | 合併至同一台主機或改以容器 (Docker / AKS) 部署           |                  合併                   |
| **壓力 / 效能測試** | 依 SLA 規劃                  | 不列入常駐規格，以 DevTest Labs 範本臨時擴建，測完即刪除 |                  按需                   |

- **一致性原則**：OS、DB 與中介軟體<span class="r">版本須與正式環境一致</span>，僅縮減「規模」不改變「架構元件」，確保測試結果具代表性。

---

## 測試環境規格精簡對照 (Production vs. QA)

- **日常 QA 功能驗證**：無需高可用性 (HA) 冗餘與高併發算力，採用精簡版架構即可涵蓋 <span class="b">90% 以上</span>測試需求。

| 區域 / 平台      |     正式環境 (Production)     |                精簡版 QA 環境 (建議)                 | 精簡優化策略                                         |
| :--------------- | :---------------------------: | :--------------------------------------------------: | :--------------------------------------------------- |
| **澎湖 QA 區**   |    5 台 (28 vCPU / 88 GB)     |              **2 台** (8 vCPU / 24 GB)               | 網站/DB 各 1 台，其餘工具合併                        |
| **金門 QA 區**   |    6 台 (38 vCPU / 116 GB)    |              **2 台** (12 vCPU / 36 GB)              | 查詢叢集 3 台精簡為 1 台，其餘合併                   |
| **科技執法平台** |   18 台 (116 vCPU / 384 GB)   |              **6 台** (32 vCPU / 96 GB)              | Kafka/DB 去 HA 留 1 台，服務整合                     |
| **總規模小計**   | **29 台 (182 vCPU / 588 GB)** | <span class="b">10 台 (52 vCPU / 156 GB)</span>      | <span class="g">算力與記憶體資源降幅達 70%+</span>   |

_註：RAM 為需求量；以 Dsv5 (4 GB/vCPU) 實際配置約 208 GB。_

---

## 每月雲端預估費用分析 (精簡版 QA 區，10 台，建議)

<style scoped>
section { font-size: 22px; }
</style>

- **費用計算基準**：平日每週 5 天 × 每日 10 小時，每月以 22 天計，共 <span class="r">220 小時/月</span>（算力按 220h 計費，磁碟與 VPN 全月 730h 計費）。

| 區塊 / 服務          |  VM 數量  | 總規格 (vCPU/RAM/Disk)        |              Azure 月預估 (USD) |                AWS 月預估 (USD) |
| :------------------- | :-------: | :---------------------------- | ------------------------------: | ------------------------------: |
| **澎湖 QA 區**       |   2 台    | 8 vCPU / 24 GB / 800 GB       |                            $185 |                            $189 |
| **金門 QA 區**       |   2 台    | 12 vCPU / 36 GB / 900 GB      |                            $235 |                            $239 |
| **科技執法平台**     |   6 台    | 32 vCPU / 96 GB / 2,500 GB    |                            $525 |                            $538 |
| **AKS / EKS 控制面** |     -     | -                             |                       $0 (Free) |                             $73 |
| **Site-to-Site VPN** |     -     | VpnGw1 / AWS S2S VPN          |                            $150 |                             $37 |
| **合計總費用 (USD)** | **10 台** | **52 vCPU / 156 GB / 4.2 TB** |                     **~$1,095** |                     **~$1,076** |
| **折合台幣 (TWD)**   |     -     | -                             | <span class="r">約 NT$ 35,000</span> | <span class="r">約 NT$ 34,400</span> |

_註：Windows 以澎湖、金門各 1 台 (4 vCPU) 估算，其餘為 Linux；AKS/EKS 僅列控制面，容器以表列 VM 承載，若另建 Node Pool 需另計；價格基準與假設詳見下頁。_

---

## 每月雲端預估費用分析 (完整規格 QA 區，29 台)

<style scoped>
section { font-size: 22px; }
</style>

- **適用情境**：與正式環境同規格（不精簡），用於需完整 HA 切換或效能驗證之測試；計費時數同上頁。

| 區塊 / 服務          |  VM 數量  | 總規格 (vCPU/RAM/Disk)          |               Azure 月預估 (USD) |                 AWS 月預估 (USD) |
| :------------------- | :-------: | :------------------------------ | -------------------------------: | -------------------------------: |
| **澎湖區 (完整)**    |   5 台    | 28 vCPU / 88 GB / 1.7 TB        |                             $585 |                             $594 |
| **金門區 (完整)**    |   6 台    | 38 vCPU / 116 GB / 2.2 TB       |                             $647 |                             $658 |
| **科技執法 (完整)**  |   18 台   | 116 vCPU / 384 GB / 6.8 TB      |                           $1,735 |                           $1,769 |
| **AKS / EKS 控制面** |     -     | -                               |                        $0 (Free) |                              $73 |
| **Site-to-Site VPN** |     -     | VpnGw1 / AWS S2S VPN            |                             $150 |                              $37 |
| **合計總費用 (USD)** | **29 台** | **182 vCPU / 588 GB / 10.7 TB** |                      **~$3,117** |                      **~$3,131** |
| **折合台幣 (TWD)**   |     -     | -                               | <span class="r">約 NT$ 99,700</span> | <span class="r">約 NT$ 100,200</span> |

_註：2026-09 公開牌價，區域採最低價之 Azure East US 2 / AWS us-east-1；機型 Azure Dsv5 / AWS m6i (Linux US$0.048、Windows US$0.094 / vCPU·h)；磁碟 Azure Standard SSD / AWS gp3；Windows 以澎湖 16 vCPU、金門 8 vCPU 估算；未含資料傳輸費；1 USD = 32 TWD。_

---

## 成本效益比對與省錢策略

<style scoped>
section { font-size: 24px; }
</style>

- **成本比對 (以完整規格 29 台為例)**
  - **24/7 每天 24 小時全開**：約 <span class="r">NT$ 260,300 / 月</span>
  - **搭配排程自動關機 (每月 220h)**：約 <span class="r">NT$ 99,700 / 月</span>（總費用省約 <span class="g">62%</span>，其中算力省約 <span class="g">70%</span>）
- **節省成本的核心策略**
  1. **自動排程關機**：每月省下約 <span class="g">NT$ 160,600</span>；磁碟與 VPN Gateway 關機仍計費，屬固定成本。
  2. **Azure Dev/Test 訂閱方案**：Windows VM 以 Linux 費率計價，每月再省約 <span class="g">NT$ 2,600（精簡）~ 7,800（完整）</span>；<span class="r">需具 Visual Studio 訂閱</span>。
  3. **DevTest Labs 免託管費**：服務本身免費，僅收底層 VM 與 Storage 費用；AKS 控制面亦提供免費層。
  4. **磁碟類型選擇**：QA 採 <span class="b">Standard SSD</span> 即可；若改用 Premium SSD，每月增加約 <span class="r">NT$ 6,000（精簡）~ 15,400（完整）</span>，P30 以上可搭 1 年期預留折扣。

---

## 網路架構與資料備份策略 (Storage & Backup)

<style scoped>
section { font-size: 23px; }
</style>

- **網路混合連線 (Hybrid Networking)**
  透過 <span class="b">Azure VPN Gateway (VpnGw1)</span>（約 US$150/月，24 小時計費）與地端 QA 測試終端安全互連；ExpressRoute 費用較高，QA 用途不建議。
- **測試資料與影像備份評估**
  - **情境 A：內部自行處理 (Self-managed)**
    - 使用現有 NFS/SFTP 伺服器掛載 EBS/Azure Managed Disk，測試結束後手動清理。
    - **優點**：架構簡單、無額外平台服務費；**缺點**：<span class="r">維運成本高、容量滿載時需手動擴充</span>。
  - **情境 B：採用公有雲原生服務 (Cloud Native - Azure Blob / AWS S3)**
    - 將大量測試影像/Log 上傳至 Blob Storage (Hot/Cool Tier)，搭配 Lifecycle Policy 自動 30 天刪除。
    - **優點**：<span class="g">彈性擴充、成本極低 (每 GB/月 約 $0.02 USD)</span>、支援自動化備份快照 (Snapshot)。
    - **費用**：依實際上傳量計費，未列入前述月費估算（每 1 TB 約 US$20 / 月）。

---

## FinOps 費用監管與多階層告警機制

<style scoped>
section { font-size: 25px; }
</style>

- **費用監管機制設定**
  在 Azure Cost Management / AWS Budgets 設定每月 QA 測試區預算門檻。
- **多階層告警邏輯（以精簡版每月預算 <span class="r">NT$ 40,000</span> 為例）**
  - **50% 門檻 (NT$ 20,000)**
    發送 Email 通知測試群組，確認本月預估用量正常。
  - **80% 門檻 (NT$ 32,000)**
    觸發<span class="r">高優先度通知</span> (Email / Teams)，提醒 QA 主管檢視是否有未關機之測試機。
  - **100% 門檻 (NT$ 40,000)**
    發送<span class="r">緊急告警</span>，並可選擇觸發自動化腳本 (Azure Automation) 阻止建立新 VM。
- **完整規格 29 台**：預算門檻建議設為 <span class="r">NT$ 110,000</span>，告警比例相同。

---

## 資安與合規考量

<style scoped>
section { font-size: 24px; }
</style>

- **部署區域**
  - 費用以最低價之美東區域估算，<span class="r">資料將存放於境外</span>，台灣連線延遲約 150~200 ms。
  - 須確認符合機關雲端服務使用規範；若改選 Japan East，算力費用約增加 30%。
  - AWS 已設有<span class="b">台北區域 (ap-east-2)</span>，若須資料留存境內，應另行估算該區域費用並納入選型比較。
- **測試資料去識別化**
  - 科技執法影像含車牌、人臉等個資，<span class="r">上雲前應遮蔽處理或改用合成測試資料</span>。
- **存取控管**
  - 以 Microsoft Entra ID + RBAC + MFA 管理 QA 人員權限；VM 不配置公有 IP，一律經 VPN 連線。
- **資料加密**
  - Managed Disk / Blob 預設靜態加密 (SSE)，傳輸過程以 IPsec VPN / TLS 保護。

---

## 評估結論

<style scoped>
section { font-size: 26px; }
</style>

- **方案建議**
  - <span class="b">Azure DevTest Labs</span> 在開箱即用度、原生排程關機與 UI 操作上優於 AWS，<span class="b">為首選推薦方案</span>。
  - **月費比較**：兩者差距在 <span class="r">2% 以內</span>（精簡版 AWS 略低、完整規格 Azure 略低）；若已具 Visual Studio 訂閱並採用 Azure Dev/Test 方案，Azure 更具成本優勢。
  - **資料落地考量**：若須資料留存境內，需另評估 AWS 台北區域。
- **兩種規模（搭配預算告警與排程關機）**
  - <span class="b">精簡版 QA 區 (10 台，建議)</span>：每月約 <span class="r">NT$ 35,000</span>，預算門檻建議設 **NT$ 40,000**。
  - **完整規格 QA 區 (29 台)**：每月約 <span class="r">NT$ 99,700</span>，預算門檻建議設 **NT$ 110,000**。

---

## 下一步行動計畫 (POC)

- <span class="b">Phase 1 (Week 1)</span>
  建立 Azure 測試訂閱戶與 DevTest Labs，設定 NT$ 10,000 費用告警測試。
- <span class="b">Phase 2 (Week 2)</span>
  匯入澎湖 QA 區 (精簡版 2 台) 的 Custom Image，驗證自動關機與資料重啟完整性。
- <span class="b">Phase 3 (Week 3-4)</span>
  部署 AKS 與科技執法平台，進行完整 QA 自動化流程驗證。

---

## 附錄 A：實體主機（地端自建）成本粗估

<style scoped>
section { font-size: 19px; }
section table td, section table th { padding: 5px 12px; }
table { font-size: 90%; }
</style>

- **建置假設**：以 Proxmox VE / Hyper-V 虛擬化承載同等規格 VM，主機 24/7 運轉，含 3 年保固，使用既有機房。

| 成本項目                  | 精簡版 (10 VM / 52 vCPU)            | 完整規格 (29 VM / 182 vCPU)             |
| :------------------------ | :---------------------------------- | :-------------------------------------- |
| **實體伺服器**            | 2 台 (2×16C / 256 GB / 8 TB SSD)，約 NT$ 90 萬 | 3 台 (2×24C / 512 GB / 8 TB SSD)，約 NT$ 225 萬 |
| **網路 / 機櫃 / UPS**     | 約 NT$ 20 萬                        | 約 NT$ 30 萬                            |
| **軟體授權 (Windows Server)** | 約 NT$ 8 萬                     | 約 NT$ 25 萬                            |
| **一次性建置 (CapEx)**    | <span class="r">約 NT$ 118 萬</span> | <span class="r">約 NT$ 280 萬</span>   |
| 月攤提 (3 年)             | NT$ 32,800                          | NT$ 77,800                              |
| 電力 + 空調 (PUE 1.5)     | NT$ 4,000                           | NT$ 9,000                               |
| 維運人力 (0.1 / 0.15 人月) | NT$ 10,000                         | NT$ 15,000                              |
| **月均成本 (3 年攤提)**   | <span class="r">約 NT$ 46,800</span> | <span class="r">約 NT$ 101,800</span>  |
| **月均成本 (5 年攤提)**   | 約 NT$ 33,700                       | 約 NT$ 70,700                           |
| **公有雲 Azure (220h 排程)** | <span class="b">約 NT$ 35,000</span> | <span class="b">約 NT$ 99,700</span> |

_註：硬體單價為市場行情粗估，實際以廠商報價為準（近期記憶體價格波動大）；5 年攤提未含第 4~5 年延長保固費用；公有雲方案未計維運人力。_

---

## 附錄 B：公有雲 vs. 實體主機 比較

<style scoped>
section { font-size: 23px; }
</style>

- **成本面**
  - **3 年內**：精簡版<span class="b">公有雲較省</span>（約 NT$ 35,000 vs. 46,800 / 月）；完整規格兩者<span class="b">相當</span>（約 NT$ 99,700 vs. 101,800 / 月）。
  - **損益平衡點**：精簡版約 <span class="r">4.7 年</span>、完整規格約 <span class="r">3.1 年</span>後，實體主機累計成本才低於公有雲。
- **實體主機**
  - **優點**：<span class="g">資料留存境內</span>、無 VPN 費用與跨國延遲、可 24/7 運轉不另計費。
  - **缺點**：<span class="r">需一次性預算 118~280 萬、採購建置約 2~3 個月</span>、擴縮彈性低、硬體故障與汰換需自行處理。
- **公有雲**
  - **優點**：<span class="g">零前期投入、按需擴縮</span>、效能測試可臨時擴建後刪除、POC 可立即啟動。
  - **缺點**：資料存放境外（美東）、長期使用總成本可能高於自建。
- **建議**：短中期 (3 年內) 或需求尚未穩定時，<span class="b">優先採用公有雲</span>；若 QA 規模長期固定、預計使用 5 年以上且已有機房，可評估改為實體主機。
