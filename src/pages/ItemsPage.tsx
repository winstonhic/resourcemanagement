import { useState } from 'react'
import ItemForm from '../components/ItemForm'
import ItemTable from '../components/ItemTable'
import { useAuth } from '../lib/auth'
import { useData } from '../lib/data'
import { KIND_LABEL } from '../lib/format'
import type { Item, Kind } from '../lib/types'

export default function ItemsPage({ kind }: { kind: Kind }) {
  const { user } = useAuth()
  const { items, rate, saveItem, deleteItem } = useData()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Item | undefined>()
  const [msg, setMsg] = useState<string | null>(null)

  const list = items.filter((i) => i.kind === kind)
  const canEdit = user !== null

  const onDelete = async (it: Item) => {
    if (!confirm(`確定刪除「${it.name}」?`)) return
    const err = await deleteItem(it.id)
    setMsg(err)
  }

  return (
    <section>
      <div className="page-head">
        <h2>{KIND_LABEL[kind]}</h2>
        {canEdit && (
          <button type="button" onClick={() => { setEditing(undefined); setOpen(true) }}>
            新增
          </button>
        )}
      </div>
      {msg && <p className="error">{msg}</p>}
      <ItemTable
        items={list}
        rate={rate}
        canEdit={canEdit}
        onEdit={(it) => { setEditing(it); setOpen(true) }}
        onDelete={onDelete}
      />
      {canEdit && (
        <ItemForm
          kind={kind}
          editing={editing}
          open={open}
          onClose={() => setOpen(false)}
          onSave={saveItem}
        />
      )}
    </section>
  )
}
