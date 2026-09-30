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
