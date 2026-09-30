import { PROVIDERS, type Billing, type Currency, type ItemInput, type Kind, type Provider } from './types'

export type ValidateResult =
  | { ok: true; value: ItemInput }
  | { ok: false; errors: string[] }

const KINDS: Kind[] = ['cloud', 'equipment']
const CURRENCIES: Currency[] = ['USD', 'TWD']
const BILLINGS: Billing[] = ['monthly', 'one_time']

function toNonNegativeNumber(raw: string | undefined, label: string, errors: string[]): number {
  const s = (raw ?? '').trim()
  if (s === '') {
    errors.push(`${label}不可空白`)
    return 0
  }
  const n = Number(s)
  if (!Number.isFinite(n)) {
    errors.push(`${label}必須是數字`)
    return 0
  }
  if (n < 0) {
    errors.push(`${label}不可為負數`)
    return 0
  }
  return n
}

/** 把表單的字串欄位轉成 ItemInput,同時檢查。 */
export function validateItem(raw: Record<string, string | undefined>): ValidateResult {
  const errors: string[] = []
  const name = (raw.name ?? '').trim()
  if (!name) errors.push('名稱不可空白')

  const kind = raw.kind as Kind
  if (!KINDS.includes(kind)) errors.push('kind 不正確')
  const currency = raw.currency as Currency
  if (!CURRENCIES.includes(currency)) errors.push('幣別必須是 USD 或 TWD')
  const billing = raw.billing as Billing
  if (!BILLINGS.includes(billing)) errors.push('計費方式必須是每月或一次性')

  let provider: Provider = ''
  if (kind === 'cloud') {
    const p = (raw.provider ?? '').trim() as Provider
    if (!PROVIDERS.includes(p as Exclude<Provider, ''>)) errors.push('雲端項目必須選大類(Azure / AWS / Claude / 其他)')
    else provider = p
  }

  const quantity = toNonNegativeNumber(raw.quantity, '數量', errors)
  const unit_price = toNonNegativeNumber(raw.unit_price, '單價', errors)

  if (errors.length) return { ok: false, errors }
  return {
    ok: true,
    value: {
      kind,
      provider,
      category: (raw.category ?? '').trim(),
      name,
      spec: (raw.spec ?? '').trim(),
      quantity,
      unit_price,
      currency,
      billing,
      note: (raw.note ?? '').trim(),
    },
  }
}
