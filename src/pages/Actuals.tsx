import { useEffect, useState } from 'react'
import ActualForm from '../components/ActualForm'
import { useData } from '../lib/data'
import { fmtTwd } from '../lib/format'
import { SCOPE_LABEL, type Actual } from '../lib/types'

export default function Actuals() {
  const { budgets, actuals, saveActual, deleteActual } = useData()
  const [budgetId, setBudgetId] = useState<number | null>(null)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Actual | undefined>()
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    if (budgetId === null && budgets.length > 0) setBudgetId(budgets[0].id)
    if (budgetId !== null && !budgets.some((b) => b.id === budgetId)) setBudgetId(budgets[0]?.id ?? null)
  }, [budgets, budgetId])

  const budget = budgets.find((b) => b.id === budgetId)
  const rows = actuals.filter((a) => a.budget_id === budgetId)
  const spent = rows.reduce((s, a) => s + a.amount, 0)

  const onDelete = async (a: Actual) => {
    if (!confirm(`確定刪除 ${a.spent_on} 的 ${fmtTwd(a.amount)}?`)) return
    setMsg(await deleteActual(a.id))
  }

  if (budgets.length === 0) {
    return (
      <section>
        <h2>實際動用</h2>
        <p className="empty">要先有核定預算才能登記動用。請到「核定預算」新增一筆。</p>
      </section>
    )
  }

  return (
    <section>
      <div className="page-head">
        <h2>實際動用</h2>
        <button type="button" onClick={() => { setEditing(undefined); setOpen(true) }}>新增動用紀錄</button>
      </div>
      <div className="pick-budget">
        <label>
          預算
          <select value={budgetId ?? ''} onChange={(e) => setBudgetId(Number(e.target.value))}>
            {budgets.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </label>
        {budget && (
          <dl className="figures inline">
            <div><dt>核定</dt><dd>{fmtTwd(budget.amount)}</dd></div>
            <div><dt>已動用</dt><dd>{fmtTwd(spent)}</dd></div>
            <div><dt>{spent > budget.amount ? '超支' : '剩餘'}</dt><dd className={spent > budget.amount ? 'bad' : ''}>{fmtTwd(Math.abs(budget.amount - spent))}</dd></div>
          </dl>
        )}
      </div>
      {msg && <p className="error">{msg}</p>}
      {rows.length === 0 ? <p className="empty">這筆預算還沒有動用紀錄。</p> : (
        <div className="table-wrap">
          <table className="actuals">
            <thead>
              <tr><th>日期</th><th>大類</th><th className="num">實付金額</th><th>動用人</th><th>說明</th><th>操作</th></tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id}>
                  <td>{a.spent_on}</td>
                  <td>{a.scope ? SCOPE_LABEL[a.scope] : <span className="hint">未指定</span>}</td>
                  <td className="num">{fmtTwd(a.amount)}</td>
                  <td>{a.spender}</td>
                  <td className="note">{a.note}</td>
                  <td className="actions">
                    <button type="button" className="quiet" onClick={() => { setEditing(a); setOpen(true) }}>編輯</button>
                    <button type="button" className="danger" onClick={() => onDelete(a)}>刪除</button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr><td colSpan={2}>合計</td><td className="num">{fmtTwd(spent)}</td><td colSpan={3} /></tr>
            </tfoot>
          </table>
        </div>
      )}
      <ActualForm budgets={budgets} defaultBudgetId={budgetId} editing={editing} open={open} onClose={() => setOpen(false)} onSave={saveActual} />
    </section>
  )
}
