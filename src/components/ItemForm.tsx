import { useEffect, useRef, useState, type FormEvent } from 'react'
import { validateItem } from '../lib/validate'
import { PROVIDERS, type Item, type ItemInput, type Kind } from '../lib/types'

const CATEGORY_OPTIONS: Record<Kind, string[]> = {
  cloud: ['澎湖 QA', '金門 QA', '科技執法 QA', '共用', 'Claude Code', 'Codex', 'GitHub', '其他'],
  equipment: ['自建伺服器', '自建儲存', 'GPU', '網路', '其他'],
}

interface Props {
  kind: Kind
  /** undefined = 新增 */
  editing?: Item
  open: boolean
  onClose(): void
  /** 成功回 null,失敗回錯誤訊息 */
  onSave(input: ItemInput, id?: number): Promise<string | null>
}

type Form = Record<'provider' | 'category' | 'name' | 'spec' | 'quantity' | 'unit_price' | 'currency' | 'billing' | 'note', string>

function emptyForm(kind: Kind): Form {
  return {
    provider: kind === 'cloud' ? 'AWS' : '',
    category: '', name: '', spec: '', quantity: '1', unit_price: '',
    currency: kind === 'cloud' ? 'USD' : 'TWD',
    billing: kind === 'cloud' ? 'monthly' : 'one_time',
    note: '',
  }
}

function fromItem(it: Item): Form {
  return {
    provider: it.provider,
    category: it.category, name: it.name, spec: it.spec,
    quantity: String(it.quantity), unit_price: String(it.unit_price),
    currency: it.currency, billing: it.billing, note: it.note,
  }
}

export default function ItemForm({ kind, editing, open, onClose, onSave }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const [form, setForm] = useState<Form>(emptyForm(kind))
  const [errors, setErrors] = useState<string[]>([])
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(editing ? fromItem(editing) : emptyForm(kind))
      setErrors([])
      ref.current?.showModal()
    } else {
      ref.current?.close()
    }
  }, [open, editing, kind])

  const set = (k: keyof Form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const r = validateItem({ ...form, kind })
    if (!r.ok) {
      setErrors(r.errors)
      return
    }
    setBusy(true)
    const err = await onSave(r.value, editing?.id)
    setBusy(false)
    if (err) setErrors([err])
    else onClose()
  }

  const listId = `cat-${kind}`
  return (
    <dialog ref={ref} onClose={onClose}>
      <form onSubmit={submit} className="item-form">
        <h3>{editing ? '編輯項目' : '新增項目'}</h3>
        {kind === 'cloud' && (
          <label>
            大類 *
            <select value={form.provider} onChange={set('provider')}>
              {PROVIDERS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
        )}
        <label>
          {kind === 'cloud' ? '小類(站台 / 用途)' : '類別'}
          <input list={listId} value={form.category} onChange={set('category')} />
          <datalist id={listId}>
            {CATEGORY_OPTIONS[kind].map((c) => <option key={c} value={c} />)}
          </datalist>
        </label>
        <label>
          名稱 *
          <input value={form.name} onChange={set('name')} required />
        </label>
        <label>
          規格
          <textarea value={form.spec} onChange={set('spec')} rows={2} />
        </label>
        <div className="row">
          <label>
            數量
            <input type="number" min="0" step="any" value={form.quantity} onChange={set('quantity')} />
          </label>
          <label>
            單價 *
            <input type="number" min="0" step="any" value={form.unit_price} onChange={set('unit_price')} required />
          </label>
        </div>
        <div className="row">
          <label>
            幣別
            <select value={form.currency} onChange={set('currency')}>
              <option value="USD">USD</option>
              <option value="TWD">TWD</option>
            </select>
          </label>
          <label>
            計費
            <select value={form.billing} onChange={set('billing')}>
              <option value="monthly">每月</option>
              <option value="one_time">一次性</option>
            </select>
          </label>
        </div>
        <label>
          備註
          <textarea value={form.note} onChange={set('note')} rows={2} />
        </label>
        {errors.length > 0 && (
          <ul className="error">
            {errors.map((e) => <li key={e}>{e}</li>)}
          </ul>
        )}
        <div className="actions">
          <button type="button" onClick={onClose} disabled={busy}>取消</button>
          <button type="submit" disabled={busy}>{busy ? '儲存中…' : '儲存'}</button>
        </div>
      </form>
    </dialog>
  )
}
