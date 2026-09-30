const twd = new Intl.NumberFormat('zh-TW', { maximumFractionDigits: 0 })

export function fmtTwd(n: number): string {
  return `NT$ ${twd.format(Math.round(n))}`
}

export function fmtNumber(n: number): string {
  return new Intl.NumberFormat('zh-TW', { maximumFractionDigits: 2 }).format(n)
}

export const BILLING_LABEL = { monthly: '每月', one_time: '一次性' } as const
export const KIND_LABEL = { cloud: '雲端與訂閱', equipment: '設備採購' } as const

/** 約 xx 萬(一位小數;不足一萬顯示千分位整數) */
export function fmtWan(n: number): string {
  const v = Math.round(n)
  if (Math.abs(v) < 10000) return `${twd.format(v)} 元`
  const wan = v / 10000
  return `約 ${wan >= 100 ? Math.round(wan) : Math.round(wan * 10) / 10} 萬`
}

export function fmtPct(share: number): string {
  return `${Math.round(share * 100)}%`
}
