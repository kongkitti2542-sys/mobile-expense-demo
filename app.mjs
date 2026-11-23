import { makeEntry, summarize, forMonth, money, csv } from './model.mjs'

const key = 'pocket-expense-v1'
const form = document.querySelector('#entry')
const status = document.querySelector('#status')
const month = document.querySelector('#month')
const list = document.querySelector('#entries')
const cancel = document.querySelector('#cancel')
let entries = []
let editing = -1

function clearForm() {
  form.reset()
  editing = -1
  cancel.hidden = true
}
function button(label, action) {
  const element = document.createElement('button')
  element.textContent = label
  element.addEventListener('click', action)
  return element
}
function render() {
  const visible = forMonth(entries, month.value)
  const { income, expense, balance } = summarize(visible)
  document.querySelector('#totals').textContent =
    `รายรับ ${money(income)} บาท · รายจ่าย ${money(expense)} บาท · คงเหลือ ${money(balance)} บาท`
  list.replaceChildren()
  if (!visible.length) {
    const empty = document.createElement('li')
    empty.textContent = 'ไม่มีรายการในช่วงที่เลือก'
    list.append(empty)
  }
  for (const entry of visible) {
    const index = entries.indexOf(entry)
    const item = document.createElement('li')
    item.textContent = `${entry.date} · ${entry.kind === 'income' ? 'รายรับ' : 'รายจ่าย'} · ${entry.category} · ${money(entry.satang)} บาท `
    item.append(button('แก้ไข', () => {
      editing = index
      for (const name of ['kind', 'category', 'date']) form.elements[name].value = entry[name]
      form.elements.amount.value = money(entry.satang)
      cancel.hidden = false
      form.elements.amount.focus()
    }), button('ลบ', () => {
      if (confirm('ลบรายการนี้หรือไม่')) save(entries.filter((_, i) => i !== index))
    }))
    list.append(item)
  }
}
function save(next) {
  try {
    localStorage.setItem(key, JSON.stringify(next))
    entries = next
    clearForm()
    render()
    status.textContent = 'บันทึกแล้ว'
  } catch {
    status.textContent = 'บันทึกไม่ได้ ตรวจพื้นที่และสิทธิ์เก็บข้อมูลของเบราว์เซอร์'
  }
}
form.addEventListener('submit', event => {
  event.preventDefault()
  try {
    const entry = makeEntry(Object.fromEntries(new FormData(form)))
    const next = [...entries]
    next[editing < 0 ? next.length : editing] = entry
    save(next)
  } catch (error) {
    status.textContent = error.message
  }
})
cancel.addEventListener('click', clearForm)
month.addEventListener('change', render)
document.querySelector('#clear').addEventListener('click', () => { month.value = ''; render() })
document.querySelector('#export').addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob(['\uFEFF', csv(forMonth(entries, month.value))], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = 'pocket-expense.csv'
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
})
try {
  const saved = JSON.parse(localStorage.getItem(key) ?? '[]')
  if (!Array.isArray(saved) || !saved.every(row => Number.isSafeInteger(row?.satang) &&
    makeEntry({ ...row, amount: money(row.satang) }).satang === row.satang)) throw Error()
  entries = saved
} catch {
  status.textContent = 'อ่านข้อมูลเดิมไม่ได้ ระบบปิดการแก้ไขเพื่อรักษาข้อมูลเดิม'
  for (const control of form.elements) control.disabled = true
}
render()
