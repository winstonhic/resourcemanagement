import type { CategoryShare } from '../lib/cost'
import { fmtPct, fmtTwd } from '../lib/format'

/** 「錢花在哪裡」橫條圖:每列一個類別,條長 = 佔比,尾端標金額與百分比。 */
export default function ShareBars({ rows }: { rows: CategoryShare[] }) {
  if (rows.length === 0) return <p className="empty">這段期間沒有支出。</p>
  const max = rows[0].share || 1
  return (
    <ol className="share-bars">
      {rows.map((r) => (
        <li key={r.category} title={`${r.category}:${fmtTwd(r.total)}(${fmtPct(r.share)})`}>
          <span className="cat">{r.category}</span>
          <span className="track">
            <span
              className={r.oneTime ? 'bar one-time' : 'bar'}
              style={{ width: `${(r.share / max) * 100}%` }}
            />
          </span>
          <span className="val">
            {fmtTwd(r.total)}
            <small>{fmtPct(r.share)}</small>
          </span>
        </li>
      ))}
    </ol>
  )
}
