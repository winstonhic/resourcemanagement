import { subtotalTwd } from '../lib/cost'
import { BILLING_LABEL, fmtNumber, fmtTwd } from '../lib/format'
import type { Item } from '../lib/types'

interface Props {
  items: Item[]
  rate: number | null
  canEdit: boolean
  onEdit(item: Item): void
  onDelete(item: Item): void
}

export default function ItemTable({ items, rate, canEdit, onEdit, onDelete }: Props) {
  const sub = (it: Item) => (rate === null ? null : subtotalTwd(it, rate))
  const monthly = items.filter((i) => i.billing === 'monthly').reduce((s, i) => s + (sub(i) ?? 0), 0)
  const oneTime = items.filter((i) => i.billing === 'one_time').reduce((s, i) => s + (sub(i) ?? 0), 0)

  if (items.length === 0) return <p className="empty">目前沒有項目。</p>

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>類別</th>
            <th>名稱</th>
            <th>規格</th>
            <th className="num">數量</th>
            <th className="num">單價</th>
            <th>幣別</th>
            <th>計費</th>
            <th className="num">小計 (TWD)</th>
            <th>備註</th>
            {canEdit && <th>操作</th>}
          </tr>
        </thead>
        <tbody>
          {items.map((it) => {
            const s = sub(it)
            return (
              <tr key={it.id}>
                <td>{it.category}</td>
                <td>{it.name}</td>
                <td className="spec">{it.spec}</td>
                <td className="num">{fmtNumber(it.quantity)}</td>
                <td className="num">{fmtNumber(it.unit_price)}</td>
                <td>{it.currency}</td>
                <td>{BILLING_LABEL[it.billing]}</td>
                <td className="num">{s === null ? '—' : fmtTwd(s)}</td>
                <td className="note">{it.note}</td>
                {canEdit && (
                  <td className="actions">
                    <button type="button" onClick={() => onEdit(it)}>編輯</button>
                    <button type="button" className="danger" onClick={() => onDelete(it)}>刪除</button>
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={7}>合計 每月</td>
            <td className="num">{rate === null ? '—' : fmtTwd(monthly)}</td>
            <td colSpan={canEdit ? 2 : 1} />
          </tr>
          <tr>
            <td colSpan={7}>合計 一次性</td>
            <td className="num">{rate === null ? '—' : fmtTwd(oneTime)}</td>
            <td colSpan={canEdit ? 2 : 1} />
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
