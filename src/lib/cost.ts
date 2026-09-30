import type { Billing, Item, Kind } from './types'

/** 單筆小計換成 TWD。rate 必須 > 0。 */
export function subtotalTwd(
  item: Pick<Item, 'quantity' | 'unit_price' | 'currency'>,
  rate: number,
): number {
  if (!(rate > 0)) throw new Error('匯率必須大於 0')
  const raw = item.quantity * item.unit_price
  return item.currency === 'USD' ? raw * rate : raw
}

export interface Totals {
  monthly: number
  yearly: number
  oneTime: number
}

export function totals(items: Item[], rate: number): Totals {
  let monthly = 0
  let oneTime = 0
  for (const it of items) {
    if (it.billing === 'monthly') monthly += subtotalTwd(it, rate)
    else oneTime += subtotalTwd(it, rate)
  }
  return { monthly, yearly: monthly * 12, oneTime }
}

export interface CategoryTotal {
  category: string
  total: number
}

export function groupByCategory(
  items: Item[],
  kind: Kind,
  billing: Billing,
  rate: number,
): CategoryTotal[] {
  const m = new Map<string, number>()
  for (const it of items) {
    if (it.kind !== kind || it.billing !== billing) continue
    m.set(it.category, (m.get(it.category) ?? 0) + subtotalTwd(it, rate))
  }
  return [...m]
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total)
}

export interface PeriodTotals {
  /** 經常性:每月小計 × 月數 */
  recurring: number
  /** 一次性:includeOneTime 為 true 才計入 */
  oneTime: number
  total: number
}

/** 某段期間的總額(TWD)。months = 期間月數;includeOneTime = 一次性採購是否落在這段期間。 */
export function periodTotals(items: Item[], rate: number, months: number, includeOneTime: boolean): PeriodTotals {
  let recurring = 0
  let oneTime = 0
  for (const it of items) {
    if (it.billing === 'monthly') recurring += subtotalTwd(it, rate) * months
    else if (includeOneTime) oneTime += subtotalTwd(it, rate)
  }
  return { recurring, oneTime, total: recurring + oneTime }
}

export interface CategoryShare {
  category: string
  total: number
  /** 佔期間總額的比例 0–1;總額為 0 時為 0 */
  share: number
  /** 這個類別是不是一次性採購 */
  oneTime: boolean
}

/** 某段期間各類別的金額與佔比,大到小。 */
export function categoryBreakdown(items: Item[], rate: number, months: number, includeOneTime: boolean): CategoryShare[] {
  const m = new Map<string, { total: number; oneTime: boolean }>()
  for (const it of items) {
    let amount: number
    if (it.billing === 'monthly') amount = subtotalTwd(it, rate) * months
    else if (includeOneTime) amount = subtotalTwd(it, rate)
    else continue
    const cur = m.get(it.category) ?? { total: 0, oneTime: it.billing === 'one_time' }
    cur.total += amount
    m.set(it.category, cur)
  }
  const grand = [...m.values()].reduce((s, v) => s + v.total, 0)
  return [...m]
    .map(([category, v]) => ({ category, total: v.total, oneTime: v.oneTime, share: grand > 0 ? v.total / grand : 0 }))
    .sort((a, b) => b.total - a.total)
}

export interface ProviderShare {
  /** 雲端 = 大類(供應商);設備 = 類別 */
  label: string
  total: number
  share: number
  oneTime: boolean
  /** 大類底下的小類金額(大到小);只有一個小類或設備時為空 */
  children: { category: string; total: number }[]
}

/** 高層版分組:雲端依大類、設備依類別;每組附小類明細。 */
export function providerBreakdown(items: Item[], rate: number, months: number, includeOneTime: boolean): ProviderShare[] {
  const groups = new Map<string, { total: number; oneTime: boolean; sub: Map<string, number> }>()
  for (const it of items) {
    let amount: number
    if (it.billing === 'monthly') amount = subtotalTwd(it, rate) * months
    else if (includeOneTime) amount = subtotalTwd(it, rate)
    else continue
    const label = it.kind === 'cloud' ? (it.provider || '其他') : it.category
    const g = groups.get(label) ?? { total: 0, oneTime: it.billing === 'one_time', sub: new Map() }
    g.total += amount
    if (it.kind === 'cloud') g.sub.set(it.category, (g.sub.get(it.category) ?? 0) + amount)
    groups.set(label, g)
  }
  const grand = [...groups.values()].reduce((s, g) => s + g.total, 0)
  return [...groups]
    .map(([label, g]) => ({
      label,
      total: g.total,
      oneTime: g.oneTime,
      share: grand > 0 ? g.total / grand : 0,
      children: g.sub.size > 1
        ? [...g.sub].map(([category, total]) => ({ category, total })).sort((a, b) => b.total - a.total)
        : [],
    }))
    .sort((a, b) => b.total - a.total)
}

/** 起迄(YYYY-MM-DD)涵蓋幾個「月份」:同月算 1;迄日早於起日算 0。 */
export function monthsBetween(start: string, end: string): number {
  const [sy, sm] = start.split('-').map(Number)
  const [ey, em] = end.split('-').map(Number)
  const n = (ey - sy) * 12 + (em - sm) + 1
  return n > 0 ? n : 0
}

/** 某筆預算勾選項目在期間內的計畫金額(TWD):月費 × 月數 + 一次性。 */
export function plannedInPeriod(items: Item[], itemIds: number[], rate: number, start: string, end: string): number {
  const months = monthsBetween(start, end)
  const ids = new Set(itemIds)
  return periodTotals(items.filter((i) => ids.has(i.id)), rate, months, true).total
}
