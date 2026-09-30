import { describe, it, expect } from 'vitest'
import { validateItem } from './validate'

const good = {
  kind: 'cloud', category: 'AWS', name: 'm6i.xlarge', spec: '4 vCPU', quantity: '2',
  unit_price: '150', currency: 'USD', billing: 'monthly', note: '',
}

describe('validateItem', () => {
  it('正常輸入轉成數字', () => {
    const r = validateItem(good)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value).toMatchObject({ quantity: 2, unit_price: 150, currency: 'USD', billing: 'monthly' })
  })
  it('空 name 擋掉', () => {
    const r = validateItem({ ...good, name: '   ' })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors.join()).toContain('名稱')
  })
  it('quantity 非數字擋掉', () => {
    const r = validateItem({ ...good, quantity: 'abc' })
    expect(r.ok).toBe(false)
  })
  it('unit_price 負數擋掉', () => {
    const r = validateItem({ ...good, unit_price: '-5' })
    expect(r.ok).toBe(false)
  })
  it('unit_price 空字串擋掉', () => {
    expect(validateItem({ ...good, unit_price: '' }).ok).toBe(false)
  })
  it('currency / billing 亂值擋掉', () => {
    expect(validateItem({ ...good, currency: 'JPY' }).ok).toBe(false)
    expect(validateItem({ ...good, billing: 'yearly' }).ok).toBe(false)
  })
  it('文字欄位 trim', () => {
    const r = validateItem({ ...good, name: '  x  ', category: ' AWS ' })
    if (r.ok) expect(r.value).toMatchObject({ name: 'x', category: 'AWS' })
  })
})
