import { useState } from 'react'
import BudgetForm from '../components/BudgetForm'
import { monthsBetween, plannedInPeriod, subtotalTwd } from '../lib/cost'
import { useData } from '../lib/data'
import { BILLING_LABEL, fmtTwd, fmtWan } from '../lib/format'
import type { Budget } from '../lib/types'

export default function Budgets() {
  const { items, budgets, actuals, rate, saveBudget, deleteBudget } = useData()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Budget | undefined>()
  const [msg, setMsg] = useState<string | null>(null)

  const onDelete = async (b: Budget) => {
    if (!confirm(`確定刪除預算「${b.name}」?底下的動用紀錄會一起刪除。`)) return
    setMsg(await deleteBudget(b.id))
  }

  return (
    <section>
      <div className="page-head">
        <h2>核定預算</h2>
        <button type="button" onClick={() => { setEditing(undefined); setOpen(true) }}>新增預算</button>
      </div>
      {msg && <p className="error">{msg}</p>}
      {budgets.length === 0 && <p className="empty">還沒有核定預算。按「新增預算」填入總預算、期間與預計動用的項目。</p>}

      <div className="budgets">
        {budgets.map((b) => {
          const spent = actuals.filter((a) => a.budget_id === b.id).reduce((s, a) => s + a.amount, 0)
          const planned = rate === null ? null : plannedInPeriod(items, b.item_ids, rate, b.start_date, b.end_date)
          const remaining = b.amount - spent
          const pct = b.amount > 0 ? Math.min((spent / b.amount) * 100, 100) : 0
          const over = spent > b.amount
          const months = monthsBetween(b.start_date, b.end_date)
          const picked = items.filter((i) => b.item_ids.includes(i.id))
          return (
            <article key={b.id} className={over ? 'budget over' : 'budget'}>
              <header>
                <div>
                  <h3>{b.name}</h3>
                  <span className="sub">{b.start_date} 到 {b.end_date},{months} 個月</span>
                </div>
                <div className="actions">
                  <button type="button" className="quiet" onClick={() => { setEditing(b); setOpen(true) }}>編輯</button>
                  <button type="button" className="danger" onClick={() => onDelete(b)}>刪除</button>
                </div>
              </header>
              <div className="hero">
                <span className="amount">{fmtTwd(b.amount)}</span>
                <span className="wan">核定,{fmtWan(b.amount)}</span>
              </div>
              <div className="progress" role="img" aria-label={`已動用 ${fmtTwd(spent)},佔核定 ${Math.round(pct)}%`}>
                <span style={{ width: `${pct}%` }} />
              </div>
              <dl className="figures">
                <div><dt>計畫金額</dt><dd>{planned === null ? '—' : fmtTwd(planned)}</dd></div>
                <div><dt>已動用</dt><dd>{fmtTwd(spent)}</dd></div>
                <div><dt>{over ? '超支' : '剩餘'}</dt><dd className={over ? 'bad' : ''}>{fmtTwd(Math.abs(remaining))}</dd></div>
              </dl>
              {planned !== null && planned > b.amount && (
                <p className="warn">計畫金額比核定多 {fmtTwd(planned - b.amount)},項目照現在的規劃會超過預算。</p>
              )}
              <details>
                <summary>預計動用的項目({picked.length})</summary>
                {picked.length === 0 ? <p className="hint">沒有勾選項目。</p> : (
                  <table className="plain">
                    <tbody>
                      {picked.map((i) => (
                        <tr key={i.id}>
                          <td>{i.kind === 'cloud' ? `${i.provider} / ` : ''}{i.category}</td>
                          <td>{i.name}</td>
                          <td className="num">{rate === null ? '—' : fmtTwd(subtotalTwd(i, rate))} {BILLING_LABEL[i.billing]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </details>
              {b.note && <p className="hint">{b.note}</p>}
            </article>
          )
        })}
      </div>

      <BudgetForm items={items} rate={rate} editing={editing} open={open} onClose={() => setOpen(false)} onSave={saveBudget} />
    </section>
  )
}
