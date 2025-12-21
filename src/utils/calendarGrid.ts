import { fromJalaliParts, toJalaliParts, type JalaliParts } from '../adapters/dayjsAdapter'

const MS_PER_DAY = 24 * 60 * 60 * 1000

function utcDayStamp(d: Date) {
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())
}

export function compareDays(a: Date, b: Date): number {
  const da = utcDayStamp(a)
  const db = utcDayStamp(b)
  return da === db ? 0 : da < db ? -1 : 1
}

export function isSameDay(a: Date, b: Date): boolean {
  return compareDays(a, b) === 0
}

export function addDays(date: Date, deltaDays: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + deltaDays)
  return next
}

export function isWithinRange(date: Date, minDate?: Date, maxDate?: Date): boolean {
  if (minDate && compareDays(date, minDate) < 0) return false
  if (maxDate && compareDays(date, maxDate) > 0) return false
  return true
}

export function clampToRange(date: Date, minDate?: Date, maxDate?: Date): Date {
  if (minDate && compareDays(date, minDate) < 0) return new Date(minDate)
  if (maxDate && compareDays(date, maxDate) > 0) return new Date(maxDate)
  return new Date(date)
}

export type CalendarDayCell = {
  gregorian: Date
  jalali: JalaliParts
  inCurrentMonth: boolean
}

export type BuildJalaliMonthGridOptions = {
  jy: number
  jm: number
  /**
   * 0=Sunday ... 6=Saturday. Defaults to 6 (Saturday), common in Iran.
   */
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6
}

function addJalaliMonthsParts(
  month: { jy: number; jm: number },
  deltaMonths: number,
): { jy: number; jm: number } {
  // jm is 1..12
  const zeroBased = (month.jy * 12 + (month.jm - 1)) + deltaMonths
  const jy = Math.floor(zeroBased / 12)
  const jm = (zeroBased % 12 + 12) % 12 + 1
  return { jy, jm }
}

export function getJalaliMonthLength(jy: number, jm: number): number {
  const start = fromJalaliParts({ jy, jm, jd: 1 })
  const next = addJalaliMonthsParts({ jy, jm }, 1)
  const nextStart = fromJalaliParts({ jy: next.jy, jm: next.jm, jd: 1 })
  return Math.round((utcDayStamp(nextStart) - utcDayStamp(start)) / MS_PER_DAY)
}

export function addJalaliMonths(date: Date, deltaMonths: number): Date {
  const p = toJalaliParts(date)
  const targetMonth = addJalaliMonthsParts({ jy: p.jy, jm: p.jm }, deltaMonths)
  const maxDay = getJalaliMonthLength(targetMonth.jy, targetMonth.jm)
  const jd = Math.min(p.jd, maxDay)
  return fromJalaliParts({ jy: targetMonth.jy, jm: targetMonth.jm, jd })
}

export function buildJalaliMonthGrid(opts: BuildJalaliMonthGridOptions): CalendarDayCell[][] {
  const { jy, jm } = opts
  const weekStartsOn = opts.weekStartsOn ?? 6

  const firstOfMonth = fromJalaliParts({ jy, jm, jd: 1 })
  const firstDow = firstOfMonth.getDay() // 0..6
  const leading = (firstDow - weekStartsOn + 7) % 7
  const start = addDays(firstOfMonth, -leading)

  const rows: CalendarDayCell[][] = []
  for (let r = 0; r < 6; r++) {
    const row: CalendarDayCell[] = []
    for (let c = 0; c < 7; c++) {
      const i = r * 7 + c
      const gregorian = addDays(start, i)
      const jalali = toJalaliParts(gregorian)
      row.push({
        gregorian,
        jalali,
        inCurrentMonth: jalali.jy === jy && jalali.jm === jm,
      })
    }
    rows.push(row)
  }
  return rows
}


