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


