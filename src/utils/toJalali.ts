import { formatJalali, toJalaliParts, type JalaliParts } from '../adapters/dayjsAdapter'
import { formatTime } from './timeUtils'

export type ToJalaliResult = JalaliParts & { formatted: string }

export function toJalali(gregorian: Date): ToJalaliResult {
  const parts = toJalaliParts(gregorian)
  return { ...parts, formatted: formatJalali(parts) }
}

/**
 * Formats a Gregorian date as Jalali date string with optional time component.
 * @param date - The date to format
 * @param timeFormat - Optional time format: 'HH:mm' or 'HH:mm:ss'. If provided, time is included.
 * @returns Formatted string (e.g., "1403/10/15" or "1403/10/15 14:30" or "1403/10/15 14:30:45")
 */
export function formatJalaliWithTime(
  date: Date,
  timeFormat?: 'HH:mm' | 'HH:mm:ss'
): string {
  const jalali = toJalali(date)
  if (timeFormat) {
    const time = formatTime(date, timeFormat)
    return `${jalali.formatted} ${time}`
  }
  return jalali.formatted
}


