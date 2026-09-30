import { Link } from 'react-router-dom'
import { plannedInPeriod } from '../lib/cost'
import { fmtPct, fmtTwd } from '../lib/format'
import { SCOPE_LABEL, type Actual, type Budget, type Item } from '../lib/types'

interface Props {
  budgets: Budget[]
  actuals: Actual[]
  items: Item[]
  rate: number
}

/** 總覽用:每筆預算一列,核定 / 已動用 / 規劃三者關係。 */
export default function BudgetOverview({ budgets, actuals, items, rate }: Props) {
  if (budgets.length === 0) {
    return (
      <section className="where">
        <h3>預算執行</h3>
        <p className="empty">還沒有核定預算。到 <Link to="/budgets">核定預算</Link> 新增後,這裡會顯示核定與實際動用的對照。</p>
      </section>
    )
  }
  return (
    <section className="where">
      <h3>預算執行</h3>
      <ol className="budget-rows">
        {budgets.map((b) => {
          const spent = actuals.filter((a) => a.budget_id === b.id).reduce((s, a) => s + a.amount, 0)
          const planned = plannedInPeriod(items, b.scopes, rate, b.start_date, b.end_date)
          const base = Math.max(b.amount, spent, planned, 1)
          const spentPct = (spent / base) * 100
          const approvedPct = (b.amount / base) * 100
          const plannedPct = (planned / base) * 100
          const over = spent > b.amount
          const usage = b.amount > 0 ? spent / b.amount : 0
          return (
            <li key={b.id} className={over ? 'over' : ''}>
              <div className="head">
                <div>
                  <strong>{b.name}</strong>
                  <span className="sub">{b.start_date} 到 {b.end_date}。{b.scopes.map((s) => SCOPE_LABEL[s]).join('、') || '未指定大類'}</span>
                </div>
                <div className="usage">
                  <span className="big">{fmtPct(usage)}</span>
                  <span className="sub">已動用 / 核定</span>
                </div>
              </div>
              <div className="track" role="img" aria-label={`核定 ${fmtTwd(b.amount)},已動用 ${fmtTwd(spent)},規劃 ${fmtTwd(planned)}`}>
                <span className="approved" style={{ width: `${approvedPct}%` }} />
                <span className="spent" style={{ width: `${spentPct}%` }} />
                <span className="planned" style={{ left: `${plannedPct}%` }} title={`規劃 ${fmtTwd(planned)}`} />
              </div>
              <dl className="figures">
                <div><dt><i className="swatch approved" />核定</dt><dd>{fmtTwd(b.amount)}</dd></div>
                <div><dt><i className="swatch rec" />已動用</dt><dd>{fmtTwd(spent)}</dd></div>
                <div><dt><i className="swatch tick" />照規劃會用到</dt><dd>{fmtTwd(planned)}</dd></div>
                <div><dt>{over ? '超支' : '剩餘'}</dt><dd className={over ? 'bad' : ''}>{fmtTwd(Math.abs(b.amount - spent))}</dd></div>
              </dl>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
