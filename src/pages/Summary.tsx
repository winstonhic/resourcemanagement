import React, { useEffect, useState } from 'react'
import ShareBars from '../components/ShareBars'
import { periodTotals, providerBreakdown, totals } from '../lib/cost'
import { useAuth } from '../lib/auth'
import { useData } from '../lib/data'
import { fmtTwd, fmtWan } from '../lib/format'
import type { PeriodTotals, ProviderShare } from '../lib/cost'

const PERIODS = [
  { key: 'q4', title: '2026 第四季', sub: '10 月到 12 月,3 個月', months: 3, includeOneTime: false },
  { key: 'y27', title: '2027 全年', sub: '1 月到 12 月,12 個月;設備第一季購入', months: 12, includeOneTime: true },
] as const

function PeriodCard({ title, sub, months, t }: { title: string; sub: string; months: number; t: PeriodTotals }) {
  const recShare = t.total > 0 ? (t.recurring / t.total) * 100 : 0
  return (
    <section className="period">
      <header>
        <h3>{title}</h3>
        <span className="sub">{sub}</span>
      </header>
      <div className="hero">
        <span className="amount">{fmtTwd(t.total)}</span>
        <span className="wan">{fmtWan(t.total)}</span>
      </div>
      <div className="split" role="img" aria-label={`雲端與訂閱 ${fmtTwd(t.recurring)},設備採購 ${fmtTwd(t.oneTime)}`}>
        <span className="seg rec" style={{ width: `${recShare}%` }} />
        <span className="seg one" style={{ width: `${100 - recShare}%` }} />
      </div>
      <dl className="legend">
        <div>
          <dt><i className="swatch rec" />雲端與訂閱,{months} 個月</dt>
          <dd>{fmtTwd(t.recurring)}</dd>
        </div>
        <div>
          <dt><i className="swatch one" />設備採購</dt>
          <dd>{t.oneTime > 0 ? fmtTwd(t.oneTime) : '這段期間沒有'}</dd>
        </div>
      </dl>
    </section>
  )
}

function GroupTable({ title, rows, unit }: { title: string; rows: ProviderShare[]; unit: string }) {
  if (rows.length === 0) return null
  return (
    <div className="group">
      <h4>{title}</h4>
      <table>
        <thead><tr><th>大類 / 小類</th><th className="num">{unit}</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <React.Fragment key={r.label}>
              <tr className="group-head">
                <td>{r.label}</td>
                <td className="num">{fmtTwd(r.total)}</td>
              </tr>
              {r.children.map((c) => (
                <tr key={c.category}>
                  <td className="indent">{c.category || '(未分類)'}</td>
                  <td className="num">{fmtTwd(c.total)}</td>
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
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

  if (rate === null) {
    return (
      <section>
        <h2>資源與費用規劃</h2>
        <p className="error">還沒有設定美金匯率,金額無法換算。{user ? '請在下方輸入匯率。' : '請登入後設定。'}</p>
        {user && (
          <div className="rate">
            <input type="number" step="0.01" min="0" value={rateInput} onChange={(e) => setRateInput(e.target.value)} />
            <button type="button" onClick={submitRate} disabled={busy}>儲存匯率</button>
            {msg && <span className="hint">{msg}</span>}
          </div>
        )}
      </section>
    )
  }

  const periods = PERIODS.map((p) => ({ ...p, t: periodTotals(items, rate, p.months, p.includeOneTime) }))
  const grand = periods.reduce((s, p) => s + p.t.total, 0)
  const unit = totals(items, rate)

  return (
    <div className="summary">
      <div className="title-row">
        <h2>資源與費用規劃</h2>
        <p className="lede">2026 年第四季到 2027 年底,雲端租用、AI 工具訂閱與設備採購合計 <strong>{fmtTwd(grand)}</strong>({fmtWan(grand)})。設備採購安排在 2027 年第一季。</p>
      </div>

      <div className="periods">
        {periods.map((p) => <PeriodCard key={p.key} title={p.title} sub={p.sub} months={p.months} t={p.t} />)}
      </div>

      <section className="where">
        <h3>錢花在哪裡</h3>
        <div className="where-grid">
          {periods.map((p) => (
            <div key={p.key}>
              <h4>{p.title}</h4>
              <ShareBars rows={providerBreakdown(items, rate, p.months, p.includeOneTime)} />
            </div>
          ))}
        </div>
      </section>

      <section className="basis">
        <h3>計算口徑</h3>
        <ul>
          <li>每月經常費用 <b>{fmtTwd(unit.monthly)}</b>,一年 <b>{fmtTwd(unit.yearly)}</b>;一次性 <b>{fmtTwd(unit.oneTime)}</b>。</li>
          <li>
            美金匯率 1 USD = {user ? (
              <>
                <input className="inline" type="number" step="0.01" min="0" value={rateInput} onChange={(e) => setRateInput(e.target.value)} />
                <button type="button" onClick={submitRate} disabled={busy}>{busy ? '儲存中…' : '儲存'}</button>
                {msg && <span className="hint">{msg}</span>}
              </>
            ) : <b>{rate}</b>} TWD。
          </li>
          <li>雲端 VM 依各評估文件口徑(平日上班時段開機、磁碟與 VPN 全月計費);設備金額取概估上限,以實際報價為準。</li>
        </ul>
        <details>
          <summary>各類別小計</summary>
          <div className="groups">
            <GroupTable title="雲端與訂閱,每月" rows={providerBreakdown(items.filter((i) => i.kind === 'cloud'), rate, 1, false)} unit="每月 (TWD)" />
            <GroupTable title="設備採購,一次性" rows={providerBreakdown(items.filter((i) => i.kind === 'equipment'), rate, 0, true)} unit="一次性 (TWD)" />
          </div>
        </details>
      </section>
    </div>
  )
}
