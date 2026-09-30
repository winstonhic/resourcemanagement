# ResourceManagement 初版 實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 做出可上線的初版:不登入可看總費用 / 雲端服務 / 設備採購三頁,登入者可增改刪,部署到 GitHub Pages。

**Architecture:** 純靜態 SPA(Vite + React + TS)直接用 supabase-js 連 Supabase;資料兩張表(items、settings),RLS 讓 anon 唯讀、authenticated 可寫;費用換算全在前端純函式 `cost.ts`。

**Tech Stack:** bun、Vite 8、React 19、react-router-dom 7(HashRouter)、@supabase/supabase-js 2.117、vitest 5、TypeScript 7。

**Spec:** `docs/superpowers/specs/2026-09-30-resource-management-design.md`

## Global Constraints

- 所有套件釘死版本(package.json 不用 ^),commit `bun.lock`。
- Vite `base: '/resourcemanagement/'`,路由用 HashRouter。
- Supabase URL:`https://bvgcypegebslxcrproee.supabase.co`;key 用 publishable key(或 legacy anon),放 `.env.production`。service key 絕不進 repo。
- 金額欄位 DB 用 numeric,前端算完用 `Math.round` 到整數 TWD 顯示。
- 表與欄位一律小寫 snake_case。
- 介面文字繁體中文。
- 每個 Task 結束 commit,訊息附 Co-Authored-By 與 Claude-Session 兩行。

## Review Focus

1. 未登入者用 REST 直接 POST /rest/v1/items 必須被拒(RLS + grant),不能只靠前端藏按鈕。→ Task 8 手動驗證。
2. quantity 或 unit_price 輸入空字串、負數、非數字:表單要擋,DB 也要 check。→ Task 2 check constraint、Task 5 表單驗證測試。
3. 匯率被改成 0 或負數:總額會歸零或變負且看不出來。→ Task 2 check、Task 3 cost 測試對 rate<=0 丟錯。
4. items 為空或 settings 沒有 usd_twd_rate 列:首頁不能白頁。→ Task 3 空清單測試、Task 6 fallback 顯示「匯率未設定」。
5. 登入 token 過期後按儲存:要顯示錯誤訊息而不是靜默失敗。→ Task 5 寫入失敗要 alert 錯誤文字。

---

### Task 1: 專案骨架

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `.env.production`, `.env.example`, `.gitignore`

**Interfaces:**
- Produces: `bun run dev` / `bun run build` / `bun run test` 可用;`import.meta.env.VITE_SUPABASE_URL`、`VITE_SUPABASE_KEY`。

- [ ] **Step 1: 建立 package.json(釘版本)**

```json
{
  "name": "resourcemanagement",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "dependencies": {
    "@supabase/supabase-js": "2.117.2",
    "react": "19.3.0",
    "react-dom": "19.3.0",
    "react-router-dom": "7.18.4"
  },
  "devDependencies": {
    "@types/react": "19.2.14",
    "@types/react-dom": "19.2.3",
    "@vitejs/plugin-react": "6.1.1",
    "typescript": "7.0.2",
    "vite": "8.3.1",
    "vitest": "5.0.2"
  }
}
```

(`@types/react*` 版本以 `npm view` 當下查到的最新為準。)

- [ ] **Step 2: vite.config.ts**

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/resourcemanagement/',
  test: { environment: 'node' },
})
```

- [ ] **Step 3: tsconfig.json、index.html、src/main.tsx、src/App.tsx(App 先只放「ResourceManagement」文字)、.env.example(兩個變數空值)、.env.production(真實 URL + key)、.gitignore(node_modules、dist、.env.local)**

- [ ] **Step 4: `bun install` 後 `bun run build` 成功、`bun run dev` 開得起來**

- [ ] **Step 5: Commit** `chore: Vite + React + TS 骨架`

---

### Task 2: 資料表 SQL

**Files:**
- Create: `supabase/migrations/0001_init.sql`

**Interfaces:**
- Produces: `public.items`、`public.settings` 兩表;前端讀寫用 supabase-js `.from('items')`、`.from('settings')`。

- [ ] **Step 1: 寫 SQL**

```sql
-- items
create table if not exists public.items (
  id          bigint generated always as identity primary key,
  kind        text not null check (kind in ('cloud', 'equipment')),
  category    text not null default '',
  name        text not null,
  spec        text not null default '',
  quantity    numeric not null default 1 check (quantity >= 0),
  unit_price  numeric not null check (unit_price >= 0),
  currency    text not null check (currency in ('USD', 'TWD')),
  billing     text not null check (billing in ('monthly', 'one_time')),
  note        text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists items_kind_idx on public.items (kind);

-- settings (key/value)
create table if not exists public.settings (
  key        text primary key,
  value      numeric not null,
  updated_at timestamptz not null default now()
);
insert into public.settings (key, value) values ('usd_twd_rate', 32.5)
  on conflict (key) do nothing;

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists items_set_updated_at on public.items;
create trigger items_set_updated_at before update on public.items
  for each row execute function public.set_updated_at();
drop trigger if exists settings_set_updated_at on public.settings;
create trigger settings_set_updated_at before update on public.settings
  for each row execute function public.set_updated_at();

-- RLS:anon 唯讀、authenticated 可寫。
-- 設計決定:本專案關閉開放註冊,帳號由管理者建,所以「已登入」即「允許編輯」,
-- 不再做 per-row 擁有者檢查。
alter table public.items enable row level security;
alter table public.settings enable row level security;

drop policy if exists items_read on public.items;
create policy items_read on public.items for select to anon, authenticated using (true);
drop policy if exists items_write on public.items;
create policy items_write on public.items for all to authenticated using (true) with check (true);

drop policy if exists settings_read on public.settings;
create policy settings_read on public.settings for select to anon, authenticated using (true);
drop policy if exists settings_write on public.settings;
create policy settings_write on public.settings for all to authenticated using (true) with check (true);

-- Data API grants(新專案不一定自動給)
grant usage on schema public to anon, authenticated;
grant select on public.items, public.settings to anon;
grant select, insert, update, delete on public.items, public.settings to authenticated;
```

- [ ] **Step 2: 在 Supabase SQL Editor(或 MCP execute_sql)執行;再執行一次確認 idempotent 不報錯**

- [ ] **Step 3: 驗證** `curl "$URL/rest/v1/settings?select=*" -H "apikey: $KEY"` 回 `usd_twd_rate 32.5`;`curl -X POST .../rest/v1/items` 以 anon 回 401/403。

- [ ] **Step 4: Commit** `feat: items/settings 資料表、RLS、grants`

---

### Task 3: 費用計算 cost.ts(TDD)

**Files:**
- Create: `src/lib/types.ts`, `src/lib/cost.ts`, `src/lib/cost.test.ts`

**Interfaces:**
- Produces:
```ts
export type Kind = 'cloud' | 'equipment'
export type Currency = 'USD' | 'TWD'
export type Billing = 'monthly' | 'one_time'
export interface Item { id: number; kind: Kind; category: string; name: string; spec: string;
  quantity: number; unit_price: number; currency: Currency; billing: Billing; note: string }
export type ItemInput = Omit<Item, 'id'>

export function subtotalTwd(item: Pick<Item,'quantity'|'unit_price'|'currency'>, rate: number): number
export interface Totals { monthly: number; yearly: number; oneTime: number }
export function totals(items: Item[], rate: number): Totals
export function groupByCategory(items: Item[], kind: Kind, billing: Billing, rate: number): { category: string; total: number }[]
```

- [ ] **Step 1: 寫失敗測試 `src/lib/cost.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { subtotalTwd, totals, groupByCategory } from './cost'
import type { Item } from './types'

const base: Item = { id: 1, kind: 'cloud', category: 'AWS', name: 'vm', spec: '', quantity: 2,
  unit_price: 100, currency: 'USD', billing: 'monthly', note: '' }

describe('subtotalTwd', () => {
  it('USD 乘匯率', () => expect(subtotalTwd(base, 32.5)).toBe(6500))
  it('TWD 不乘', () => expect(subtotalTwd({ ...base, currency: 'TWD' }, 32.5)).toBe(200))
  it('rate<=0 丟錯', () => expect(() => subtotalTwd(base, 0)).toThrow())
})

describe('totals', () => {
  it('空清單全 0', () => expect(totals([], 32.5)).toEqual({ monthly: 0, yearly: 0, oneTime: 0 }))
  it('monthly/one_time 分流,yearly=monthly*12', () => {
    const items: Item[] = [base, { ...base, id: 2, kind: 'equipment', billing: 'one_time', currency: 'TWD', unit_price: 50000, quantity: 1 }]
    expect(totals(items, 32.5)).toEqual({ monthly: 6500, yearly: 78000, oneTime: 50000 })
  })
})

describe('groupByCategory', () => {
  it('依 kind+billing 篩選後按 category 加總,金額大到小', () => {
    const items: Item[] = [base, { ...base, id: 2, category: 'GCP', unit_price: 300 }, { ...base, id: 3, category: 'AWS', unit_price: 10 },
      { ...base, id: 4, kind: 'equipment', billing: 'one_time' }]
    expect(groupByCategory(items, 'cloud', 'monthly', 32.5)).toEqual([
      { category: 'GCP', total: 19500 }, { category: 'AWS', total: 7150 }])
  })
})
```

- [ ] **Step 2: `bun run test` 失敗(模組不存在)**

- [ ] **Step 3: 實作 `types.ts` 與 `cost.ts`**

```ts
export function subtotalTwd(item, rate) {
  if (!(rate > 0)) throw new Error('匯率必須大於 0')
  const raw = item.quantity * item.unit_price
  return item.currency === 'USD' ? raw * rate : raw
}
export function totals(items, rate) {
  let monthly = 0, oneTime = 0
  for (const it of items) (it.billing === 'monthly' ? (monthly += subtotalTwd(it, rate)) : (oneTime += subtotalTwd(it, rate)))
  return { monthly, yearly: monthly * 12, oneTime }
}
export function groupByCategory(items, kind, billing, rate) {
  const m = new Map<string, number>()
  for (const it of items) if (it.kind === kind && it.billing === billing)
    m.set(it.category, (m.get(it.category) ?? 0) + subtotalTwd(it, rate))
  return [...m].map(([category, total]) => ({ category, total })).sort((a, b) => b.total - a.total)
}
```

- [ ] **Step 4: `bun run test` 全綠**
- [ ] **Step 5: Commit** `feat: 費用計算純函式與測試`

---

### Task 4: Supabase client、登入狀態、登入頁

**Files:**
- Create: `src/lib/supabase.ts`, `src/lib/auth.tsx`, `src/pages/Login.tsx`

**Interfaces:**
- Produces: `supabase` client;`useAuth(): { user: User | null; loading: boolean; signIn(email, pw): Promise<string | null>; signOut(): Promise<void> }`(signIn 回錯誤訊息或 null);`<AuthProvider>`。

- [ ] **Step 1: supabase.ts**

```ts
import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_KEY)
```

- [ ] **Step 2: auth.tsx** 用 `supabase.auth.getSession()` 初始化、`onAuthStateChange` 更新 user;`signInWithPassword`;錯誤回 `error.message`。

- [ ] **Step 3: Login.tsx** email + 密碼兩欄、送出鈕、錯誤一行紅字;成功後 `navigate('/')`。

- [ ] **Step 4: 手動:用後台建的帳號登入成功、錯密碼顯示錯誤、重新整理仍登入中。**
- [ ] **Step 5: Commit** `feat: Supabase client 與登入`

---

### Task 5: 資料存取、表格、表單、雲端/設備頁

**Files:**
- Create: `src/lib/data.tsx`(DataProvider + useData)、`src/components/ItemTable.tsx`、`src/components/ItemForm.tsx`、`src/pages/ItemsPage.tsx`、`src/lib/validate.ts`、`src/lib/validate.test.ts`

**Interfaces:**
- Consumes: Task 3 型別與 `subtotalTwd`;Task 4 `useAuth`。
- Produces:
```ts
useData(): { items: Item[]; rate: number | null; loading: boolean; error: string | null;
  reload(): Promise<void>; saveItem(input: ItemInput, id?: number): Promise<string | null>;
  deleteItem(id: number): Promise<string | null>; saveRate(rate: number): Promise<string | null> }
validateItem(raw: Record<string, string>): { ok: true; value: ItemInput } | { ok: false; errors: string[] }
<ItemsPage kind="cloud" | "equipment" />
```

- [ ] **Step 1: validate 測試** 空 name、quantity 非數字、unit_price 負數、正常輸入四個 case。
- [ ] **Step 2: validate.ts 實作使測試綠。**
- [ ] **Step 3: data.tsx** 進站拉 `items` 依 id 排序與 `settings` 的 usd_twd_rate;寫入用 `insert`/`update().eq('id')`/`delete().eq('id')`,錯誤回 message,成功後 reload。
- [ ] **Step 4: ItemTable** 欄:類別、名稱、規格、數量、單價、幣別、計費、小計(TWD)、備註、(登入時)操作;表尾每月 TWD / 一次性 TWD 合計;外層 `overflow-x:auto`。
- [ ] **Step 5: ItemForm** `<dialog>` 元素,新增/編輯共用;category 用 `<input list>` datalist:cloud 給 AWS/Azure/GCP/GitHub/Claude Code/Codex/其他,equipment 給 伺服器/GPU/儲存/網路/其他;送出前 validateItem,錯誤列在表單內;寫入失敗顯示回傳的訊息。
- [ ] **Step 6: ItemsPage** 組合以上;`useAuth().user` 為 null 時不 render 新增/編輯/刪除;刪除前 `confirm()`。
- [ ] **Step 7: 手動:未登入無按鈕;登入後新增一筆 USD 每月、一筆 TWD 一次性,小計正確;編輯、刪除各一次。**
- [ ] **Step 8: Commit** `feat: 雲端/設備頁增改刪`

---

### Task 6: 總費用首頁、版面與路由

**Files:**
- Create: `src/pages/Summary.tsx`, `src/components/Layout.tsx`, `src/index.css`
- Modify: `src/App.tsx`, `src/main.tsx`

**Interfaces:**
- Consumes: `totals`、`groupByCategory`、`useData`、`useAuth`。

- [ ] **Step 1: Layout** 頂端導覽三連結(NavLink,選中加底線)、右側登入鈕或 email + 登出;`<Outlet/>`;載入中顯示「載入中」、error 顯示訊息 + 重試鈕(呼叫 reload)。
- [ ] **Step 2: Summary** 三個大數字卡(每月 / 每年 / 一次性,TWD 千分位整數);匯率列:未登入顯示數字,登入顯示 `<input type=number step=0.01>` + 儲存鈕;rate 為 null 顯示「匯率未設定」且三卡顯示「—」;兩張分組表(雲端每月 / 設備一次性)。
- [ ] **Step 3: App.tsx** HashRouter:`/` Summary、`/cloud` ItemsPage cloud、`/equipment` ItemsPage equipment、`/login` Login;AuthProvider 包 DataProvider。
- [ ] **Step 4: index.css** 系統字型、最大寬 1100px、16px 邊距、表格斑馬紋、數字欄右對齊、手機寬度導覽可換行。
- [ ] **Step 5: 手動:三頁切換、改匯率後三頁數字同步變、手機寬度(DevTools 375px)可看。**
- [ ] **Step 6: Commit** `feat: 總費用首頁與版面`

---

### Task 7: GitHub Pages 部署與 README

**Files:**
- Create: `.github/workflows/deploy.yml`, `README.md`

- [ ] **Step 1: deploy.yml**

```yaml
name: deploy
on: { push: { branches: [main] }, workflow_dispatch: {} }
permissions: { contents: read, pages: write, id-token: write }
concurrency: { group: pages, cancel-in-progress: true }
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install --frozen-lockfile
      - run: bun run test
      - run: bun run build
      - uses: actions/upload-pages-artifact@v3
        with: { path: dist }
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: { name: github-pages, url: ${{ steps.deployment.outputs.page_url }} }
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: README** 寫:網址、本機跑法、怎麼在 Supabase 後台建帳號(Authentication → Users → Add user,並在 Sign In / Providers 關閉 Allow new users to sign up)、匯率在首頁改、資料表 SQL 位置。
- [ ] **Step 3: push;請使用者在 repo Settings → Pages → Source 選 GitHub Actions;Actions 綠燈後開網址。**
- [ ] **Step 4: Commit** `ci: GitHub Pages 部署`

---

### Task 8: 上線驗證

- [ ] 未登入開站:三頁可看、無編輯鈕。
- [ ] `curl -X POST "$URL/rest/v1/items" -H "apikey: $KEY" -H "Content-Type: application/json" -d '{"kind":"cloud","name":"x","unit_price":1,"currency":"USD","billing":"monthly"}'` → 401/403,items 沒多一筆。
- [ ] 登入後新增/編輯/刪除/改匯率,重新整理仍在。
- [ ] Supabase 後台確認 Allow new users to sign up 已關。
