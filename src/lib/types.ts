export type Kind = 'cloud' | 'equipment'
export type Currency = 'USD' | 'TWD'
export type Billing = 'monthly' | 'one_time'
export type Provider = '' | 'Azure' | 'AWS' | 'Claude' | '其他'
export const PROVIDERS: Exclude<Provider, ''>[] = ['Azure', 'AWS', 'Claude', '其他']

export interface Item {
  id: number
  kind: Kind
  /** 雲端的大類(供應商);設備為空字串 */
  provider: Provider
  category: string
  name: string
  spec: string
  quantity: number
  unit_price: number
  currency: Currency
  billing: Billing
  note: string
}

export type ItemInput = Omit<Item, 'id'>

export interface Budget {
  id: number
  name: string
  /** 核定金額 TWD */
  amount: number
  /** YYYY-MM-DD */
  start_date: string
  end_date: string
  note: string
  /** 預計動用的項目 id */
  item_ids: number[]
}
export type BudgetInput = Omit<Budget, 'id'>

export interface Actual {
  id: number
  budget_id: number
  item_id: number | null
  /** YYYY-MM-DD */
  spent_on: string
  /** 實付 TWD */
  amount: number
  note: string
}
export type ActualInput = Omit<Actual, 'id'>
