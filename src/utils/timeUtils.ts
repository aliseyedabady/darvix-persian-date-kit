/**
 * Utility functions for time handling in date pickers.
 */

/**
 * Formats a Date's time component as a string.
 * @param date - The date to format
 * @param format - Format string: 'HH:mm' or 'HH:mm:ss'
 * @returns Formatted time string (e.g., "14:30" or "14:30:45")
 */
export function formatTime(date: Date, format: 'HH:mm' | 'HH:mm:ss' = 'HH:mm'): string {
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  
  if (format === 'HH:mm:ss') {
    const second = String(date.getSeconds()).padStart(2, '0')
    return `${hour}:${minute}:${second}`
  }
  
  return `${hour}:${minute}`
}

/**
 * Parses a time string into hour, minute, and optional second.
 * @param text - Time string (e.g., "14:30" or "14:30:45")
 * @returns Object with hour, minute, and optional second, or null if invalid
 */
export function parseTime(text: string): { hour: number; minute: number; second?: number } | null {
  const cleaned = text.trim()
  if (!cleaned) return null

  // Match HH:mm or HH:mm:ss
  const match = cleaned.match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/)
  if (!match) return null

  const hour = Number(match[1])
  const minute = Number(match[2])
  const second = match[3] ? Number(match[3]) : undefined

  // Validate ranges
  if (hour < 0 || hour > 23) return null
  if (minute < 0 || minute > 59) return null
  if (second !== undefined && (second < 0 || second > 59)) return null

  return { hour, minute, second }
}

/**
 * Normalizes time values to valid ranges.
 * @param hour - Hour (0-23)
 * @param minute - Minute (0-59)
 * @param second - Optional second (0-59)
 * @returns Normalized time object
 */
export function normalizeTime(
  hour: number,
  minute: number,
  second?: number
): { hour: number; minute: number; second: number } {
  let normalizedHour = Math.max(0, Math.min(23, Math.floor(hour)))
  let normalizedMinute = Math.max(0, Math.min(59, Math.floor(minute)))
  let normalizedSecond = second !== undefined ? Math.max(0, Math.min(59, Math.floor(second))) : 0

  return {
    hour: normalizedHour,
    minute: normalizedMinute,
    second: normalizedSecond,
  }
}

/**
 * Adds time components to a Date object.
 * @param date - Base date
 * @param hours - Hours to add
 * @param minutes - Minutes to add
 * @param seconds - Optional seconds to add
 * @returns New Date with added time
 */
export function addTime(date: Date, hours: number, minutes: number, seconds?: number): Date {
  const newDate = new Date(date)
  newDate.setHours(
    newDate.getHours() + hours,
    newDate.getMinutes() + minutes,
    seconds !== undefined ? newDate.getSeconds() + seconds : newDate.getSeconds(),
    0 // reset milliseconds
  )
  return newDate
}

/**
 * Sets time on a Date object, preserving the date part.
 * @param date - Base date
 * @param hour - Hour (0-23)
 * @param minute - Minute (0-59)
 * @param second - Optional second (0-59)
 * @returns New Date with time set
 */
export function setTime(date: Date, hour: number, minute: number, second?: number): Date {
  const newDate = new Date(date)
  newDate.setHours(hour, minute, second ?? 0, 0)
  return newDate
}

