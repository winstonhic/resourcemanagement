# ResourceManagement 設計 spec

日期:2026-09-30
狀態:初版,先做出來再調

## 目的

給團隊一個不用登入就能看的網站,呈現資源與費用規劃:要租哪些雲端服務、
預計買哪些設備、加總起來每月/每年/一次性要花多少台幣。少數幾人登入後可以
新增修改。

## 範圍

三個頁面:

1. **總費用彙整(首頁)**:每月經常費用、每年經常費用(=月×12)、一次性
   費用,三個大數字,單位 TWD;顯示目前匯率,登入者可改;下方兩張分組小計
   表(雲端依 category 每月小計、設備依 category 一次性小計)。
2. **雲端服務**:AWS / Azure / GCP VM、GitHub、Claude Code、Codex 等訂閱。
3. **設備採購**:預計購買的硬體。

雲端與設備兩頁用同一套表格與表單元件。

## 資料

Supabase 專案:https://bvgcypegebslxcrproee.supabase.co

### items

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | bigint identity PK | |
| kind | text, check in (cloud, equipment) | 分頁依據 |
| category | text | 供應商或類別,自由文字,表單給常用選項 |
| name | text not null | 名稱 |
| spec | text | 規格說明 |
| quantity | numeric not null default 1 | 數量 |
| unit_price | numeric not null | 單價 |
| currency | text, check in (USD, TWD) | 幣別 |
| billing | text, check in (monthly, one_time) | 每月 / 一次性 |
| note | text | 備註 |
| created_at / updated_at | timestamptz | |

### settings

key/value 表。目前只有 `usd_twd_rate`(預設 32.5)。

### 計算(前端,src/lib/cost.ts)

- 小計 = quantity × unit_price;currency=USD 時再 × 匯率。
- 每月經常 = 所有 billing=monthly 小計加總;每年 = 每月 × 12;
  一次性 = 所有 billing=one_time 小計加總。
- 分組小計依 kind + category。
- 資料量小(百筆內),前端一次全拉自己算,不做 DB view。

### 權限(RLS)

- 兩張表都開 RLS。
- anon:select。
- authenticated:select / insert / update / delete。
- Supabase Auth 關閉開放註冊,帳號由管理者在後台建。登入者 = 允許編輯的人。
- 登入方式:email + 密碼。

## 頁面行為

- 頂端導覽:總費用 / 雲端服務 / 設備採購;右側登入鈕,登入後顯示 email 與登出。
- 進站一次拉 items 與 settings,三頁共用;增改刪後重拉。
- 登入者才看得到新增 / 編輯 / 刪除;表單為彈出視窗,新增與編輯共用。
- 表尾合計列:每月 TWD、一次性 TWD。
- 手機寬度可看,表格可橫向捲動。
- 載入失敗顯示錯誤與重試,不留白頁。
- 登入頁只有 email + 密碼,無註冊、無忘記密碼。

## 技術與部署

- Vite + React + TypeScript,bun 管套件。
- 路由 hash 模式;Vite base = `/resourcemanagement/`。
  站址:https://winstonhic.github.io/resourcemanagement/
- Supabase URL 與 anon key 放 `.env.production` 進 repo(anon key 是公開金鑰,
  安全靠 RLS)。service key 不進 repo。
- GitHub Actions:push main → build → deploy 到 GitHub Pages。
  repo Settings → Pages → Source 需手動改成 GitHub Actions。
- 資料表:`supabase/migrations/0001_init.sql` 在 Supabase SQL Editor 執行。

## 測試

- `cost.ts` vitest 單元測試:USD 換算、monthly/one_time 分流、分組、空清單。
- 手動:未登入無編輯鈕;登入後增改刪;anon 用 REST 直接寫入被 RLS 擋。

## 不做

i18n、匯出 Excel、歷史版本、USD/TWD 以外幣別、起訖月份、第三方登入。
