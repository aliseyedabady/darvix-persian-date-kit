import type * as React from 'react'

/**
 * Popover positioning options.
 */
export type PopoverConfig = {
  /**
   * Render popover in a portal (default: `true`).
   * Portals help with z-index and overflow issues, but may cause issues in SSR.
   */
  portal?: boolean
  /**
   * Gap between anchor and popover (default: `8`).
   */
  gutter?: number
  /**
   * Minimum padding from viewport edges (default: `8`).
   */
  padding?: number
  /**
   * Positioning strategy: `fixed` (default) or `absolute`.
   */
  strategy?: 'fixed' | 'absolute'
  /**
   * Preferred placements in order (default: `['bottom', 'top', 'left', 'right']`).
   */
  placements?: Array<'bottom' | 'top' | 'left' | 'right'>
  /**
   * Alignment on the cross axis (default: `'end'`).
   */
  align?: 'start' | 'center' | 'end'
}

/**
 * Common props shared between date picker components.
 */
export type BasePickerProps = {
  /**
   * Minimum selectable date (Gregorian).
   */
  minDate?: Date
  /**
   * Maximum selectable date (Gregorian).
   */
  maxDate?: Date
  /**
   * Disable the picker.
   */
  disabled?: boolean
  /**
   * Control the open state of the calendar popover (popover mode only).
   * If provided, the component becomes controlled for open/close.
   */
  open?: boolean
  /**
   * Callback when open state changes (popover mode only).
   */
  onOpenChange?: (open: boolean) => void
  /**
   * Rendering mode:
   * - `popover`: default input + popover calendar
   * - `inline`: always-visible calendar, no input
   */
  mode?: 'popover' | 'inline'
  /**
   * Theme mode for default stylesheet (default: `'light'`).
   * - `light`: force light theme regardless of OS color scheme
   * - `dark`: force dark theme regardless of OS color scheme
   * - `auto`: follow `prefers-color-scheme`
   *
   * Note: this only affects the bundled `styles.css` variables/classes.
   */
  theme?: 'light' | 'dark' | 'auto'
  /**
   * Popover positioning options (popover mode only).
   */
  popover?: PopoverConfig
  /**
   * Formats a Date for display in inputs.
   * Default: numeric Jalali `YYYY/MM/DD` (no locale month/day names).
   */
  formatValue?: (date: Date) => string
  /**
   * Parses user text into a Gregorian Date.
   * Default: parses numeric Jalali `YYYY/MM/DD` (also accepts loose separators).
   */
  parseValue?: (text: string) => Date | null
  /**
   * Weekday headers. If omitted, numeric headers are used.
   * Provide 7 items matching the calendar grid order.
   */
  weekdays?: string[]
  /**
   * Month labels (index 0 => month 1). If omitted, month numbers are shown.
   * Provide 12 items.
   */
  monthLabels?: string[]
  /**
   * Month label renderer (e.g. supply localized month name).
   * Default: `jy / jm` numeric.
   */
  renderMonthLabel?: (jy: number, jm: number) => React.ReactNode
  /**
   * Custom navigation icons for previous/next month (and year panel paging).
   */
  prevIcon?: React.ReactNode
  nextIcon?: React.ReactNode
  /**
   * Additional CSS class for the root element.
   */
  className?: string
}

/**
 * Base classes structure for styling customization.
 */
export type BasePickerClasses = {
  root?: string
  input?: string
  button?: string
  popover?: string
  header?: string
  navButton?: string
  monthLabel?: string
  grid?: string
  weekday?: string
  day?: string
  dayOutside?: string
  dayDisabled?: string
  dayToday?: string
}

