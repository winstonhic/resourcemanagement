import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { Actual, ActualInput, Budget, Item } from '../lib/types'

interface Props {
  budgets: Budget[]
  items: Item[]
  defaultBudgetId: number | null
  editing?: Actual
  open: boolean
  onClose(): void
  onSave(input: ActualInput, id?: number): Promise<string | null>
}

interface Form { budget_id: string; item_id: string; spent_on: string; amount: string; note: string }

export default function ActualForm({ budgets, items, defaultBudgetId, editing, open, onClose, onSave }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const [form, setForm] = useState<Form>({ budget_id: '', item_id: '', spent_on: '', amount: '', note: '' })
  const [errors, setErrors] = useState<string[]>([])
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(editing
        ? { budget_id: String(editing.budget_id), item_id: editing.item_id === null ? '' : String(editing.item_id), spent_on: editing.spent_on, amount: String(editing.amount), note: editing.note }
        : { budget_id: defaultBudgetId === null ? '' : String(defaultBudgetId), item_id: '', spent_on: new Date().toISOString().slice(0, 10), amount: '', note: '' })
      setErrors([])
      ref.current?.showModal()
    } else {
      ref.current?.close()
    }
  }, [open, editing, defaultBudgetId])

  const set = (k: keyof Form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }))

  // 只列出該預算勾選的項目;沒勾任何項目就列全部
  const budget = budgets.find((b) => String(b.id) === form.budget_id)
  const pickable = budget && budget.item_ids.length > 0 ? items.filter((i) => budget.item_ids.includes(i.id)) : items

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
      item_id: form.item_id === '' ? null : Number(form.item_id),
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
          項目(選填)
          <select value={form.item_id} onChange={set('item_id')}>
            <option value="">不指定</option>
            {pickable.map((i) => <option key={i.id} value={i.id}>{i.kind === 'cloud' ? `${i.provider} / ` : ''}{i.category} — {i.name}</option>)}
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
