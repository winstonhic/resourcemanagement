# ResourceManagement 資源與費用規劃

團隊不用登入就能看:要租哪些雲端服務、預計買哪些設備、加總每月 / 每年 / 一次性要花多少台幣。
少數幾人登入後可以新增修改。

- 網站:https://winstonhic.github.io/resourcemanagement/
- 資料:Supabase 專案 `bvgcypegebslxcrproee`
- 設計:`docs/superpowers/specs/2026-09-30-resource-management-design.md`

## 本機開發

```bash
bun install
bun run dev      # http://localhost:5173/resourcemanagement/
bun run test     # 費用計算與表單驗證的單元測試
bun run build
```

`.env.production` 放 Supabase URL 與 publishable key(公開金鑰,寫入權限靠 RLS 擋)。

## 第一次建置 Supabase

1. SQL Editor 執行 `supabase/migrations/0001_init.sql`(可重複執行)。
2. Authentication → Sign In / Providers → Email:關掉 **Allow new users to sign up**。
3. Authentication → Users → **Add user**:建立可編輯的人的 email + 密碼(勾 Auto Confirm)。

登入者就是可編輯者,沒有另外的權限等級。

## 日常維護

- 匯率:首頁登入後直接改,存進 `settings.usd_twd_rate`。
- 加人:Supabase 後台 Authentication → Users → Add user。
- 改資料表:新增 `supabase/migrations/000N_*.sql`,在 SQL Editor 執行後 commit。

## 部署

push 到 `main` 就由 GitHub Actions 建置並發佈到 GitHub Pages。
第一次要在 repo **Settings → Pages → Source** 選 **GitHub Actions**。
