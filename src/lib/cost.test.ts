import { describe, it, expect } from 'vitest'
import { subtotalTwd, totals, groupByCategory } from './cost'
import type { Item } from './types'

const base: Item = {
  id: 1, kind: 'cloud', category: 'AWS', name: 'vm', spec: '',
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
