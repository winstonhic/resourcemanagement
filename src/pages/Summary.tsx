import { useEffect, useState } from 'react'
import { groupByCategory, totals } from '../lib/cost'
import { useAuth } from '../lib/auth'
import { useData } from '../lib/data'
import { fmtTwd } from '../lib/format'
import type { CategoryTotal } from '../lib/cost'

function GroupTable({ title, rows, unit }: { title: string; rows: CategoryTotal[]; unit: string }) {
  return (
    <div className="group">
      <h3>{title}</h3>
      {rows.length === 0 ? (
        <p className="empty">沒有項目。</p>
      ) : (
        <table>
          <thead>
            <tr><th>類別</th><th className="num">{unit}</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.category || '(未分類)'}>
                <td>{r.category || '(未分類)'}</td>
                <td className="num">{fmtTwd(r.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default function Summary() {
  const { user } = useAuth()
  const { items, rate, saveRate } = useData()
  const [rateInput, setRateInput] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setRateInput(rate === null ? '' : String(rate))
  }, [rate])

  const t = rate === null ? null : totals(items, rate)
  const cloudMonthly = rate === null ? [] : groupByCategory(items, 'cloud', 'monthly', rate)
  const equipOneTime = rate === null ? [] : groupByCategory(items, 'equipment', 'one_time', rate)

  const submitRate = async () => {
    const n = Number(rateInput)
    if (!(n > 0)) {
      setMsg('匯率必須是大於 0 的數字')
      return
    }
    setBusy(true)
    const err = await saveRate(n)
    setBusy(false)
    setMsg(err ?? '匯率已更新')
  }

  return (
    <section>
      <h2>總費用彙整</h2>
      <div className="cards">
        <div className="card">
          <div className="label">每月經常費用</div>
          <div className="value">{t ? fmtTwd(t.monthly) : '—'}</div>
        </div>
        <div className="card">
          <div className="label">每年經常費用</div>
          <div className="value">{t ? fmtTwd(t.yearly) : '—'}</div>
          <div className="sub">每月 × 12</div>
        </div>
        <div className="card">
          <div className="label">一次性費用</div>
          <div className="value">{t ? fmtTwd(t.oneTime) : '—'}</div>
        </div>
      </div>

      <div className="rate">
        <span>美金匯率(1 USD = ? TWD):</span>
        {user ? (
          <>
            <input
              type="number"
              step="0.01"
              min="0"
              value={rateInput}
              onChange={(e) => setRateInput(e.target.value)}
            />
            <button type="button" onClick={submitRate} disabled={busy}>{busy ? '儲存中…' : '儲存'}</button>
          </>
        ) : (
          <strong>{rate === null ? '匯率未設定' : rate}</strong>
        )}
        {msg && <span className="hint">{msg}</span>}
      </div>
      {rate === null && <p className="error">settings 沒有 usd_twd_rate,金額無法換算。</p>}

      <div className="groups">
        <GroupTable title="雲端服務 每月小計" rows={cloudMonthly} unit="每月 (TWD)" />
        <GroupTable title="設備採購 一次性小計" rows={equipOneTime} unit="一次性 (TWD)" />
      </div>
    </section>
  )
}
