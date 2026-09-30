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
  /** 預計動用的大類:Azure / AWS / Claude / 其他 / equipment(自建設備) */
  scopes: Scope[]
}
export type BudgetInput = Omit<Budget, 'id'>

export type Scope = Exclude<Provider, ''> | 'equipment'
export const SCOPES: Scope[] = ['Azure', 'AWS', 'Claude', '其他', 'equipment']
export const SCOPE_LABEL: Record<Scope, string> = { Azure: 'Azure', AWS: 'AWS', Claude: 'Claude', 其他: '其他雲端', equipment: '自建設備' }
/** 項目屬於哪個大類 */
export function scopeOf(it: Pick<Item, 'kind' | 'provider'>): Scope {
  return it.kind === 'cloud' ? ((it.provider || '其他') as Scope) : 'equipment'
}

export interface Actual {
  id: number
  budget_id: number
  /** 對應大類;'' = 未指定 */
  scope: Scope | ''
  /** YYYY-MM-DD */
  spent_on: string
  /** 實付 TWD */
  amount: number
  note: string
}
export type ActualInput = Omit<Actual, 'id'>
