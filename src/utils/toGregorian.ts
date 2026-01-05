import { fromJalaliParts, type JalaliParts } from '../adapters/dayjsAdapter'

export type ParseJalaliTextOptions = {
  /**
   * Accept `YYYY/MM/DD` or `YYYY-MM-DD` (any non-digit separator).
   */
  allowLooseSeparators?: boolean
}

function onlyDigitsOrSep(text: string) {
  return text.replace(/[^\d]+/g, '-')
}

export function toGregorian(parts: JalaliParts): Date {
  return fromJalaliParts(parts)
}

export function parseJalaliText(text: string, opts: ParseJalaliTextOptions = {}): Date | null {
  const cleaned = text.trim()
  if (!cleaned) return null

  const normalized = opts.allowLooseSeparators ? onlyDigitsOrSep(cleaned) : cleaned
  const m = normalized.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/)
  if (!m) return null

  const jy = Number(m[1])
  const jm = Number(m[2])
  const jd = Number(m[3])

  try {
    return fromJalaliParts({ jy, jm, jd })
  } catch {
    return null
  }
}

export type ParseJalaliTextWithTimeOptions = ParseJalaliTextOptions & {
  /**
   * Expected time format: 'HH:mm' or 'HH:mm:ss'
   */
  timeFormat?: 'HH:mm' | 'HH:mm:ss'
}

/**
 * Parses Jalali date text with optional time component.
 * Supports formats like "1403/10/15 14:30" or "1403/10/15 14:30:45"
 */
export function parseJalaliTextWithTime(
  text: string,
  opts: ParseJalaliTextWithTimeOptions = {}
): Date | null {
  const cleaned = text.trim()
  if (!cleaned) return null

  // Try to match date with time: "YYYY/MM/DD HH:mm" or "YYYY/MM/DD HH:mm:ss"
  const timeFormat = opts.timeFormat ?? 'HH:mm'
  const timePattern = timeFormat === 'HH:mm:ss' ? /(\d{1,2}):(\d{1,2}):(\d{1,2})/ : /(\d{1,2}):(\d{1,2})/
  
  const timeMatch = cleaned.match(timePattern)
  
  if (timeMatch) {
    // Extract date part (before time)
    const datePart = cleaned.substring(0, timeMatch.index).trim()
    const normalized = opts.allowLooseSeparators ? onlyDigitsOrSep(datePart) : datePart
    const dateMatch = normalized.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/)
    
    if (!dateMatch) return null

    const jy = Number(dateMatch[1])
    const jm = Number(dateMatch[2])
    const jd = Number(dateMatch[3])
    const hour = Number(timeMatch[1])
    const minute = Number(timeMatch[2])
    const second = timeFormat === 'HH:mm:ss' ? Number(timeMatch[3]) : 0

    // Validate time ranges
    if (hour < 0 || hour > 23) return null
    if (minute < 0 || minute > 59) return null
    if (second < 0 || second > 59) return null

    try {
      const date = fromJalaliParts({ jy, jm, jd })
      date.setHours(hour, minute, second, 0)
      return date
    } catch {
      return null
    }
  }

  // Fallback to date-only parsing
  return parseJalaliText(text, opts)
}


