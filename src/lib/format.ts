const twd = new Intl.NumberFormat('zh-TW', { maximumFractionDigits: 0 })

export function fmtTwd(n: number): string {
  return `NT$ ${twd.format(Math.round(n))}`
}

export function fmtNumber(n: number): string {
  return new Intl.NumberFormat('zh-TW', { maximumFractionDigits: 2 }).format(n)
}

export const BILLING_LABEL = { monthly: '每月', one_time: '一次性' } as const
export const KIND_LABEL = { cloud: '雲端服務', equipment: '設備採購' } as const
