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
