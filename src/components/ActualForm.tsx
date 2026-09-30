import { useEffect, useRef, useState, type FormEvent } from 'react'
import { SCOPES, SCOPE_LABEL, type Actual, type ActualInput, type Budget, type Scope } from '../lib/types'

interface Props {
  budgets: Budget[]
  defaultBudgetId: number | null
  editing?: Actual
  open: boolean
  onClose(): void
  onSave(input: ActualInput, id?: number): Promise<string | null>
}

interface Form { budget_id: string; scope: string; spent_on: string; amount: string; note: string }

export default function ActualForm({ budgets, defaultBudgetId, editing, open, onClose, onSave }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const [form, setForm] = useState<Form>({ budget_id: '', scope: '', spent_on: '', amount: '', note: '' })
  const [errors, setErrors] = useState<string[]>([])
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(editing
        ? { budget_id: String(editing.budget_id), scope: editing.scope, spent_on: editing.spent_on, amount: String(editing.amount), note: editing.note }
        : { budget_id: defaultBudgetId === null ? '' : String(defaultBudgetId), scope: '', spent_on: new Date().toISOString().slice(0, 10), amount: '', note: '' })
      setErrors([])
      ref.current?.showModal()
    } else {
      ref.current?.close()
    }
  }, [open, editing, defaultBudgetId])

  const set = (k: keyof Form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }))

  // 只列出該預算涵蓋的大類;沒勾任何大類就列全部
  const budget = budgets.find((b) => String(b.id) === form.budget_id)
  const pickable: Scope[] = budget && budget.scopes.length > 0 ? budget.scopes : SCOPES

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const errs: string[] = []
    if (!form.budget_id) errs.push('要選一筆預算')
    if (!form.spent_on) errs.push('日期不可空白')
    const amount = Number(form.amount)
    if (form.amount.trim() === '' || !Number.isFinite(amount) || amount < 0) errs.push('金額必須是不小於 0 的數字')
    if (errs.length) {
      setErrors(errs)
      return
    }
    setBusy(true)
    const err = await onSave({
      budget_id: Number(form.budget_id),
      scope: form.scope as Actual['scope'],
      spent_on: form.spent_on,
      amount,
      note: form.note.trim(),
    }, editing?.id)
    setBusy(false)
    if (err) setErrors([err])
    else onClose()
  }

  return (
    <dialog ref={ref} onClose={onClose}>
      <form onSubmit={submit} className="item-form">
        <h3>{editing ? '編輯動用紀錄' : '新增動用紀錄'}</h3>
        <label>
          預算 *
          <select value={form.budget_id} onChange={set('budget_id')} required>
            <option value="">請選擇</option>
            {budgets.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </label>
        <label>
          大類(選填)
          <select value={form.scope} onChange={set('scope')}>
            <option value="">不指定</option>
            {pickable.map((sc) => <option key={sc} value={sc}>{SCOPE_LABEL[sc]}</option>)}
          </select>
        </label>
        <div className="row">
          <label>
            日期 *
            <input type="date" value={form.spent_on} onChange={set('spent_on')} required />
          </label>
          <label>
            實付金額(TWD)*
            <input type="number" min="0" step="1" value={form.amount} onChange={set('amount')} required />
          </label>
        </div>
        <label>
          說明
          <textarea value={form.note} onChange={set('note')} rows={2} placeholder="發票號、帳單月份…" />
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
