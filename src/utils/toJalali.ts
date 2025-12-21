import { formatJalali, toJalaliParts, type JalaliParts } from '../adapters/dayjsAdapter'

export type ToJalaliResult = JalaliParts & { formatted: string }

export function toJalali(gregorian: Date): ToJalaliResult {
  const parts = toJalaliParts(gregorian)
  return { ...parts, formatted: formatJalali(parts) }
}


