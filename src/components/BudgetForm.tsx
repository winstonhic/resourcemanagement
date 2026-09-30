import { useEffect, useRef, useState, type FormEvent } from 'react'
import { subtotalTwd } from '../lib/cost'
import { fmtTwd } from '../lib/format'
import { SCOPES, SCOPE_LABEL, scopeOf, type Budget, type BudgetInput, type Item, type Scope } from '../lib/types'

interface Props {
  items: Item[]
  rate: number | null
  editing?: Budget
  open: boolean
  onClose(): void
  onSave(input: BudgetInput, id?: number): Promise<string | null>
}

interface Form { name: string; amount: string; start_date: string; end_date: string; note: string; scopes: Scope[] }

function empty(): Form {
  const y = new Date().getFullYear()
  return { name: '', amount: '', start_date: `${y}-01-01`, end_date: `${y}-12-31`, note: '', scopes: [] }
}

export default function BudgetForm({ items, rate, editing, open, onClose, onSave }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const [form, setForm] = useState<Form>(empty())
  const [errors, setErrors] = useState<string[]>([])
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(editing
        ? { name: editing.name, amount: String(editing.amount), start_date: editing.start_date, end_date: editing.end_date, note: editing.note, scopes: editing.scopes }
        : empty())
      setErrors([])
      ref.current?.showModal()
    } else {
      ref.current?.close()
    }
  }, [open, editing])

  const set = (k: keyof Form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const toggle = (sc: Scope) => setForm((f) => ({
    ...f, scopes: f.scopes.includes(sc) ? f.scopes.filter((x) => x !== sc) : [...f.scopes, sc],
  }))
  // 每個大類目前的每月 / 一次性小計,讓人勾的時候看得到量級
  const scopeSummary = (sc: Scope) => {
    const rows = items.filter((i) => scopeOf(i) === sc)
    if (rows.length === 0 || rate === null) return rows.length === 0 ? '目前沒有項目' : ''
    const monthly = rows.filter((i) => i.billing === 'monthly').reduce((s, i) => s + subtotalTwd(i, rate), 0)
    const once = rows.filter((i) => i.billing === 'one_time').reduce((s, i) => s + subtotalTwd(i, rate), 0)
    const parts = []
    if (monthly > 0) parts.push(`${fmtTwd(monthly)} 每月`)
    if (once > 0) parts.push(`${fmtTwd(once)} 一次性`)
    return `${rows.length} 筆,${parts.join(',') || 'NT$ 0'}`
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const errs: string[] = []
    const name = form.name.trim()
    if (!name) errs.push('名稱不可空白')
    const amount = Number(form.amount)
    if (form.amount.trim() === '' || !Number.isFinite(amount) || amount < 0) errs.push('核定金額必須是不小於 0 的數字')
    if (!form.start_date || !form.end_date) errs.push('起日與迄日都要填')
    else if (form.end_date < form.start_date) errs.push('迄日不可早於起日')
    if (errs.length) {
      setErrors(errs)
      return
    }
    setBusy(true)
    const err = await onSave({ name, amount, start_date: form.start_date, end_date: form.end_date, note: form.note.trim(), scopes: form.scopes }, editing?.id)
    setBusy(false)
    if (err) setErrors([err])
    else onClose()
  }

  return (
    <dialog ref={ref} onClose={onClose}>
      <form onSubmit={submit} className="item-form">
        <h3>{editing ? '編輯預算' : '新增預算'}</h3>
        <label>
          名稱 *
          <input value={form.name} onChange={set('name')} placeholder="例如 2027 年度資訊預算" required />
        </label>
        <div className="row">
          <label>
            核定金額(TWD)*
            <input type="number" min="0" step="1" value={form.amount} onChange={set('amount')} required />
          </label>
          <span />
        </div>
        <div className="row">
          <label>
            起日 *
            <input type="date" value={form.start_date} onChange={set('start_date')} required />
          </label>
          <label>
            迄日 *
            <input type="date" value={form.end_date} onChange={set('end_date')} required />
          </label>
        </div>
        <fieldset className="pick">
          <legend>預計動用在哪些大類</legend>
          {SCOPES.map((sc) => (
            <label key={sc} className="check">
              <input type="checkbox" checked={form.scopes.includes(sc)} onChange={() => toggle(sc)} />
              <span className="name">{SCOPE_LABEL[sc]}</span>
              <span className="amt">{scopeSummary(sc)}</span>
            </label>
          ))}
        </fieldset>
        <label>
          備註
          <textarea value={form.note} onChange={set('note')} rows={2} placeholder="核定文號、會議日期…" />
        </label>
        {errors.length > 0 && <ul className="error">{errors.map((e) => <li key={e}>{e}</li>)}</ul>}
        <div className="actions">
          <button type="button" onClick={onClose} disabled={busy}>取消</button>
          <button type="submit" disabled={busy}>{busy ? '儲存中…' : '儲存'}</button>
        </div>
      </form>
    </dialog>
  )
}
