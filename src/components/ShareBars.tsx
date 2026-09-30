import type { ProviderShare } from '../lib/cost'
import { fmtPct, fmtTwd } from '../lib/format'

/** 「錢花在哪裡」橫條圖:每列一個大類,條長 = 佔比,尾端標金額與百分比;大類下縮排列小類。 */
export default function ShareBars({ rows }: { rows: ProviderShare[] }) {
  if (rows.length === 0) return <p className="empty">這段期間沒有支出。</p>
  const max = rows[0].share || 1
  return (
    <ol className="share-bars">
      {rows.map((r) => (
        <li key={r.label} title={`${r.label}:${fmtTwd(r.total)}(${fmtPct(r.share)})`}>
          <span className="cat">{r.label}</span>
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
          {r.children.length > 0 && (
            <ul className="children">
              {r.children.map((c) => (
                <li key={c.category}>
                  <span>{c.category}</span>
                  <span>{fmtTwd(c.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ol>
  )
}
