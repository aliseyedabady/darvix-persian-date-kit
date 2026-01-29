import dayjs from 'dayjs'
import jalaliday from 'jalaliday/dayjs'

dayjs.extend(jalaliday)

export type JalaliParts = { jy: number; jm: number; jd: number }

export type FormatJalaliOptions = {
  separator?: string
}

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

function pad4(n: number) {
  return String(n).padStart(4, '0')
}

export function toJalaliParts(gregorian: Date): JalaliParts {
  const d = dayjs(gregorian).calendar('jalali')
  return { jy: d.year(), jm: d.month() + 1, jd: d.date() }
}

export function fromJalaliParts(parts: JalaliParts): Date {
  const { jy, jm, jd } = parts
  const ymd = `${pad4(jy)}-${pad2(jm)}-${pad2(jd)}`
  const d = dayjs(ymd, { jalali: true }).calendar('gregory').startOf('day')

  // If parsing fails, dayjs returns an invalid date; surface it early.
  if (!d.isValid()) {
    throw new Error(`Invalid Jalali date parts: ${ymd}`)
  }

  const date = d.toDate()
  // Use noon local time so the calendar day is stable across timezones and DST.
  // Otherwise date-only parsing can be interpreted as UTC midnight and show as
  // the previous day in timezones behind UTC (e.g. Americas).
  date.setHours(12, 0, 0, 0)
  return date
}

export function formatJalali(parts: JalaliParts, opts: FormatJalaliOptions = {}): string {
  const sep = opts.separator ?? '/'
  return `${pad4(parts.jy)}${sep}${pad2(parts.jm)}${sep}${pad2(parts.jd)}`
}


