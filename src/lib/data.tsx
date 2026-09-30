import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { useAuth } from './auth'
import { supabase } from './supabase'
import type { Actual, ActualInput, Budget, BudgetInput, Item, ItemInput } from './types'

interface DataState {
  items: Item[]
  budgets: Budget[]
  actuals: Actual[]
  /** null = settings 沒有 usd_twd_rate */
  rate: number | null
  loading: boolean
  error: string | null
  reload(): Promise<void>
  /** 成功回 null,失敗回錯誤訊息 */
  saveItem(input: ItemInput, id?: number): Promise<string | null>
  deleteItem(id: number): Promise<string | null>
  saveRate(rate: number): Promise<string | null>
  saveBudget(input: BudgetInput, id?: number): Promise<string | null>
  deleteBudget(id: number): Promise<string | null>
  saveActual(input: ActualInput, id?: number): Promise<string | null>
  deleteActual(id: number): Promise<string | null>
}

const DataContext = createContext<DataState | null>(null)

/** 只在登入後拉資料;登出時清空。 */
export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [items, setItems] = useState<Item[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [actuals, setActuals] = useState<Actual[]>([])
  const [rate, setRate] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    const [itemsRes, rateRes, budgetsRes, linksRes, actualsRes] = await Promise.all([
      supabase.from('items').select('*').order('id'),
      supabase.from('settings').select('value').eq('key', 'usd_twd_rate').maybeSingle(),
      supabase.from('budgets').select('*').order('start_date', { ascending: false }),
      supabase.from('budget_items').select('budget_id,item_id'),
      supabase.from('actuals').select('*').order('spent_on', { ascending: false }).order('id', { ascending: false }),
    ])
    const failed = [
      ['項目', itemsRes.error], ['匯率', rateRes.error], ['預算', budgetsRes.error],
      ['預算項目', linksRes.error], ['實際動用', actualsRes.error],
    ].find(([, e]) => e) as [string, { message: string }] | undefined
    if (failed) {
      setError(`讀取${failed[0]}失敗:${failed[1].message}`)
    } else {
      setItems((itemsRes.data ?? []).map(normalize))
      setRate(rateRes.data ? Number(rateRes.data.value) : null)
      const links = new Map<number, number[]>()
      for (const l of linksRes.data ?? []) {
        const b = Number(l.budget_id)
        links.set(b, [...(links.get(b) ?? []), Number(l.item_id)])
      }
      setBudgets((budgetsRes.data ?? []).map((r) => normalizeBudget(r, links.get(Number(r.id)) ?? [])))
      setActuals((actualsRes.data ?? []).map(normalizeActual))
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (user) {
      void reload()
    } else {
      setItems([])
      setBudgets([])
      setActuals([])
      setRate(null)
      setError(null)
    }
  }, [user, reload])

  const saveItem = async (input: ItemInput, id?: number) => {
    const q = id === undefined
      ? supabase.from('items').insert(input)
      : supabase.from('items').update(input).eq('id', id)
    const { error } = await q
    if (error) return `儲存失敗:${error.message}`
    await reload()
    return null
  }

  const deleteItem = async (id: number) => {
    const { error } = await supabase.from('items').delete().eq('id', id)
    if (error) return `刪除失敗:${error.message}`
    await reload()
    return null
  }

  const saveRate = async (value: number) => {
    const { error } = await supabase.from('settings').upsert({ key: 'usd_twd_rate', value })
    if (error) return `儲存匯率失敗:${error.message}`
    await reload()
    return null
  }

  const saveBudget = async (input: BudgetInput, id?: number) => {
    const { item_ids, ...row } = input
    let budgetId = id
    if (budgetId === undefined) {
      const { data, error } = await supabase.from('budgets').insert(row).select('id').single()
      if (error) return `儲存預算失敗:${error.message}`
      budgetId = Number(data.id)
    } else {
      const { error } = await supabase.from('budgets').update(row).eq('id', budgetId)
      if (error) return `儲存預算失敗:${error.message}`
      const del = await supabase.from('budget_items').delete().eq('budget_id', budgetId)
      if (del.error) return `更新預算項目失敗:${del.error.message}`
    }
    if (item_ids.length > 0) {
      const { error } = await supabase.from('budget_items').insert(item_ids.map((item_id) => ({ budget_id: budgetId, item_id })))
      if (error) return `更新預算項目失敗:${error.message}`
    }
    await reload()
    return null
  }

  const deleteBudget = async (id: number) => {
    const { error } = await supabase.from('budgets').delete().eq('id', id)
    if (error) return `刪除預算失敗:${error.message}`
    await reload()
    return null
  }

  const saveActual = async (input: ActualInput, id?: number) => {
    const q = id === undefined
      ? supabase.from('actuals').insert(input)
      : supabase.from('actuals').update(input).eq('id', id)
    const { error } = await q
    if (error) return `儲存失敗:${error.message}`
    await reload()
    return null
  }

  const deleteActual = async (id: number) => {
    const { error } = await supabase.from('actuals').delete().eq('id', id)
    if (error) return `刪除失敗:${error.message}`
    await reload()
    return null
  }

  return (
    <DataContext.Provider value={{
      items, budgets, actuals, rate, loading, error, reload,
      saveItem, deleteItem, saveRate, saveBudget, deleteBudget, saveActual, deleteActual,
    }}>
      {children}
    </DataContext.Provider>
  )
}

/** PostgREST 的 numeric 會以字串回來,轉成 number。 */
function normalize(row: Record<string, unknown>): Item {
  return {
    id: Number(row.id),
    kind: row.kind as Item['kind'],
    provider: (row.provider ?? '') as Item['provider'],
    category: String(row.category ?? ''),
    name: String(row.name ?? ''),
    spec: String(row.spec ?? ''),
    quantity: Number(row.quantity),
    unit_price: Number(row.unit_price),
    currency: row.currency as Item['currency'],
    billing: row.billing as Item['billing'],
    note: String(row.note ?? ''),
  }
}

function normalizeBudget(row: Record<string, unknown>, item_ids: number[]): Budget {
  return {
    id: Number(row.id),
    name: String(row.name ?? ''),
    amount: Number(row.amount),
    start_date: String(row.start_date),
    end_date: String(row.end_date),
    note: String(row.note ?? ''),
    item_ids,
  }
}

function normalizeActual(row: Record<string, unknown>): Actual {
  return {
    id: Number(row.id),
    budget_id: Number(row.budget_id),
    item_id: row.item_id === null || row.item_id === undefined ? null : Number(row.item_id),
    spent_on: String(row.spent_on),
    amount: Number(row.amount),
    note: String(row.note ?? ''),
  }
}

export function useData(): DataState {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData 必須在 DataProvider 內使用')
  return ctx
}
