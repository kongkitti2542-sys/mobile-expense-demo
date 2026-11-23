export const categories = ['งาน', 'อาหาร', 'เดินทาง', 'อื่น ๆ']

export function makeEntry({ kind, category, date, amount }) {
  const raw = String(amount).trim()
  const [whole, fraction = ''] = raw.split('.')
  const satang = Number(whole) * 100 + Number(fraction.padEnd(2, '0'))
  if (!/^[0-9]{1,7}(\.[0-9]{1,2})?$/.test(raw) || satang <= 0) throw Error('กรอกเงินมากกว่า 0 และใช้ทศนิยมไม่เกินสองตำแหน่ง')
  if (!['income', 'expense'].includes(kind) || !categories.includes(category)) throw Error('เลือกประเภทและหมวดหมู่จากรายการ')
  const parsed = new Date(date)
  if (!/^20\d{2}-\d{2}-\d{2}$/.test(date) || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) throw Error('เลือกวันที่ที่ถูกต้อง')
  return { kind, category, date, satang }
}

export function summarize(entries) {
  let income = 0
  let expense = 0
  for (const entry of entries) {
    if (entry.kind === 'income') income += entry.satang
    else expense += entry.satang
  }
  return { income, expense, balance: income - expense }
}

export const forMonth = (entries, month) => entries.filter(entry => !month || entry.date.startsWith(month))
export const money = satang => (satang / 100).toFixed(2)
export const csv = entries => [
  ['date', 'kind', 'category', 'baht'],
  ...entries.map(({ date, kind, category, satang }) => [date, kind, category, money(satang)])
].map(row => row.map(value => '"' + value.replaceAll('"', '""') + '"').join(',')).join('\r\n')
