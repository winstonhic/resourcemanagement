import { describe, it, expect } from 'vitest'
import { subtotalTwd, totals, groupByCategory } from './cost'
import type { Item } from './types'

const base: Item = {
  id: 1, kind: 'cloud', provider: 'AWS', category: 'AWS', name: 'vm', spec: '',
  quantity: 2, unit_price: 100, currency: 'USD', billing: 'monthly', note: '',
}

describe('subtotalTwd', () => {
  it('USD 乘匯率', () => expect(subtotalTwd(base, 32.5)).toBe(6500))
  it('TWD 不乘', () => expect(subtotalTwd({ ...base, currency: 'TWD' }, 32.5)).toBe(200))
  it('rate<=0 丟錯', () => {
    expect(() => subtotalTwd(base, 0)).toThrow()
    expect(() => subtotalTwd(base, -1)).toThrow()
    expect(() => subtotalTwd(base, NaN)).toThrow()
  })
})

describe('totals', () => {
  it('空清單全 0', () => expect(totals([], 32.5)).toEqual({ monthly: 0, yearly: 0, oneTime: 0 }))
  it('monthly/one_time 分流,yearly=monthly*12', () => {
    const items: Item[] = [
      base,
      { ...base, id: 2, kind: 'equipment', billing: 'one_time', currency: 'TWD', unit_price: 50000, quantity: 1 },
    ]
    expect(totals(items, 32.5)).toEqual({ monthly: 6500, yearly: 78000, oneTime: 50000 })
  })
})

describe('groupByCategory', () => {
  it('依 kind+billing 篩選後按 category 加總,金額大到小', () => {
    const items: Item[] = [
      base,
      { ...base, id: 2, category: 'GCP', unit_price: 300 },
      { ...base, id: 3, category: 'AWS', unit_price: 10 },
      { ...base, id: 4, kind: 'equipment', billing: 'one_time' },
    ]
    expect(groupByCategory(items, 'cloud', 'monthly', 32.5)).toEqual([
      { category: 'GCP', total: 19500 },
      { category: 'AWS', total: 7150 },
    ])
  })
  it('沒有符合的回空陣列', () => expect(groupByCategory([base], 'equipment', 'one_time', 32.5)).toEqual([]))
})

import { periodTotals, categoryBreakdown } from './cost'

const cloud: Item = { ...base, id: 10, category: 'Azure(澎湖 QA)', unit_price: 100, quantity: 1 } // 3,250 TWD/月
const seats: Item = { ...base, id: 11, category: 'Claude Code', unit_price: 25, quantity: 4 } // 3,250 TWD/月
const server: Item = { ...base, id: 12, kind: 'equipment', category: '伺服器', billing: 'one_time', currency: 'TWD', unit_price: 380000, quantity: 1 }

describe('periodTotals', () => {
  it('3 個月含一次性', () => {
    expect(periodTotals([cloud, seats, server], 32.5, 3, true)).toEqual({ recurring: 19500, oneTime: 380000, total: 399500 })
  })
  it('12 個月不含一次性', () => {
    expect(periodTotals([cloud, seats, server], 32.5, 12, false)).toEqual({ recurring: 78000, oneTime: 0, total: 78000 })
  })
  it('空清單', () => expect(periodTotals([], 32.5, 3, true)).toEqual({ recurring: 0, oneTime: 0, total: 0 }))
})

describe('categoryBreakdown', () => {
  it('依類別加總、算佔比、大到小', () => {
    const r = categoryBreakdown([cloud, seats, server], 32.5, 3, true)
    expect(r.map((x) => x.category)).toEqual(['伺服器', 'Azure(澎湖 QA)', 'Claude Code'])
    expect(r[0]).toMatchObject({ total: 380000, oneTime: true })
    expect(r[1]).toMatchObject({ total: 9750, oneTime: false })
    expect(r[0].share).toBeCloseTo(380000 / 399500, 6)
  })
  it('不含一次性時設備不出現', () => {
    const r = categoryBreakdown([cloud, seats, server], 32.5, 12, false)
    expect(r.map((x) => x.category)).toEqual(['Azure(澎湖 QA)', 'Claude Code'])
  })
  it('總額 0 時佔比為 0 不是 NaN', () => {
    expect(categoryBreakdown([{ ...cloud, unit_price: 0 }], 32.5, 3, true)[0].share).toBe(0)
  })
})

import { providerBreakdown } from './cost'

describe('providerBreakdown', () => {
  const az1: Item = { ...base, id: 20, provider: 'Azure', category: '澎湖 QA', unit_price: 100, quantity: 1 } // 3,250/月
  const az2: Item = { ...base, id: 21, provider: 'Azure', category: '金門 QA', unit_price: 200, quantity: 1 } // 6,500/月
  const cl: Item = { ...base, id: 22, provider: 'Claude', category: 'Claude Code', unit_price: 25, quantity: 4 } // 3,250/月
  const srv: Item = { ...base, id: 23, kind: 'equipment', provider: '', category: '自建伺服器', billing: 'one_time', currency: 'TWD', unit_price: 380000, quantity: 1 }

  it('雲端依大類、設備依類別;大到小;子項照小類', () => {
    const r = providerBreakdown([az1, az2, cl, srv], 32.5, 12, true)
    expect(r.map((x) => x.label)).toEqual(['自建伺服器', 'Azure', 'Claude'])
    expect(r[1]).toMatchObject({ total: 117000, oneTime: false })
    expect(r[1].children).toEqual([{ category: '金門 QA', total: 78000 }, { category: '澎湖 QA', total: 39000 }])
    expect(r[0].children).toEqual([])
    expect(r[1].share).toBeCloseTo(117000 / (117000 + 39000 + 380000), 6)
  })
  it('單一小類的大類不列子項', () => {
    const r = providerBreakdown([cl], 32.5, 1, false)
    expect(r[0].children).toEqual([])
  })
})
