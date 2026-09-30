export type Kind = 'cloud' | 'equipment'
export type Currency = 'USD' | 'TWD'
export type Billing = 'monthly' | 'one_time'

export interface Item {
  id: number
  kind: Kind
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
