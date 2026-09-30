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
