import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { useAuth } from './auth'
import { supabase } from './supabase'
import type { Item, ItemInput } from './types'

interface DataState {
  items: Item[]
  /** null = settings 沒有 usd_twd_rate */
  rate: number | null
  loading: boolean
  error: string | null
  reload(): Promise<void>
  /** 成功回 null,失敗回錯誤訊息 */
  saveItem(input: ItemInput, id?: number): Promise<string | null>
  deleteItem(id: number): Promise<string | null>
  saveRate(rate: number): Promise<string | null>
}

const DataContext = createContext<DataState | null>(null)

/** 只在登入後拉資料;登出時清空。 */
export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [items, setItems] = useState<Item[]>([])
  const [rate, setRate] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    const [itemsRes, rateRes] = await Promise.all([
      supabase.from('items').select('*').order('id'),
      supabase.from('settings').select('value').eq('key', 'usd_twd_rate').maybeSingle(),
    ])
    if (itemsRes.error) {
      setError(`讀取項目失敗:${itemsRes.error.message}`)
    } else if (rateRes.error) {
      setError(`讀取匯率失敗:${rateRes.error.message}`)
    } else {
      setItems((itemsRes.data ?? []).map(normalize))
      setRate(rateRes.data ? Number(rateRes.data.value) : null)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (user) {
      void reload()
    } else {
      setItems([])
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

  return (
    <DataContext.Provider value={{ items, rate, loading, error, reload, saveItem, deleteItem, saveRate }}>
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

export function useData(): DataState {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData 必須在 DataProvider 內使用')
  return ctx
}
