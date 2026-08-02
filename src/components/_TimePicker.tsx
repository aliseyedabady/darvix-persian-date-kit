import * as React from 'react'
import { normalizeTime, setTime } from '../utils/timeUtils'
import type { TimePickerClasses, TimePickerVariant } from '../types/shared'

export type TimePickerProps = {
  value: Date
  onChange: (date: Date) => void
  format?: 'HH:mm' | 'HH:mm:ss'
  showSeconds?: boolean
  defaultTime?: { hour: number; minute: number; second?: number }
  hourStep?: number
  minuteStep?: number
  secondStep?: number
  /**
   * UI variant:
   * - `wheel`: scroll columns (default)
   * - `dropdown`: editable inputs with option lists
   */
  variant?: TimePickerVariant
  disabled?: boolean
  classes?: TimePickerClasses
}

const ITEM_HEIGHT = 36
const VISIBLE_COUNT = 3
const PAD = Math.floor(VISIBLE_COUNT / 2)
const SCROLL_SETTLE_MS = 100

function cx(...parts: Array<string | undefined | false>) {
  return parts.filter(Boolean).join(' ')
}

function buildValues(max: number, step: number): number[] {
  const safeStep = Math.max(1, Math.floor(step) || 1)
  const values: number[] = []
  for (let i = 0; i <= max; i += safeStep) {
    values.push(i)
  }
  return values
}

function nearestValue(values: number[], target: number): number {
  if (values.length === 0) return target
  let best = values[0]
  let bestDist = Math.abs(best - target)
  for (let i = 1; i < values.length; i++) {
    const dist = Math.abs(values[i] - target)
    if (dist < bestDist) {
      best = values[i]
      bestDist = dist
    }
  }
  return best
}

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

type WheelColumnProps = {
  values: number[]
  value: number
  onChange: (next: number) => void
  disabled?: boolean
  ariaLabel: string
  className?: string
  itemClassName?: string
  itemSelectedClassName?: string
}

function WheelColumn(props: WheelColumnProps) {
  const {
    values,
    value,
    onChange,
    disabled = false,
    ariaLabel,
    className,
    itemClassName,
    itemSelectedClassName,
  } = props

  const scrollerRef = React.useRef<HTMLDivElement>(null)
  const isProgrammaticRef = React.useRef(false)
  const settleTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const valueRef = React.useRef(value)
  valueRef.current = value

  const scrollToIndex = React.useCallback((index: number, behavior: ScrollBehavior = 'auto') => {
    const el = scrollerRef.current
    if (!el) return
    const clamped = Math.max(0, Math.min(values.length - 1, index))
    isProgrammaticRef.current = true
    el.scrollTo({ top: clamped * ITEM_HEIGHT, behavior })
    window.setTimeout(() => {
      isProgrammaticRef.current = false
    }, behavior === 'smooth' ? 180 : 0)
  }, [values.length])

  React.useEffect(() => {
    const index = values.indexOf(value)
    if (index < 0) return
    const el = scrollerRef.current
    if (!el) return
    const expected = index * ITEM_HEIGHT
    if (Math.abs(el.scrollTop - expected) > 1) {
      scrollToIndex(index, 'auto')
    }
  }, [value, values, scrollToIndex])

  React.useEffect(() => {
    return () => {
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current)
    }
  }, [])

  function commitFromScroll() {
    const el = scrollerRef.current
    if (!el || disabled) return
    const index = Math.round(el.scrollTop / ITEM_HEIGHT)
    const clamped = Math.max(0, Math.min(values.length - 1, index))
    const next = values[clamped]
    if (Math.abs(el.scrollTop - clamped * ITEM_HEIGHT) > 0.5) {
      isProgrammaticRef.current = true
      el.scrollTop = clamped * ITEM_HEIGHT
      isProgrammaticRef.current = false
    }
    if (next !== valueRef.current) {
      onChange(next)
    }
  }

  function handleScroll() {
    if (disabled || isProgrammaticRef.current) return
    if (settleTimerRef.current) clearTimeout(settleTimerRef.current)
    settleTimerRef.current = setTimeout(commitFromScroll, SCROLL_SETTLE_MS)
  }

  function selectIndex(index: number) {
    if (disabled) return
    const clamped = Math.max(0, Math.min(values.length - 1, index))
    scrollToIndex(clamped, 'smooth')
    const next = values[clamped]
    if (next !== valueRef.current) {
      onChange(next)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (disabled) return
    const currentIndex = Math.max(0, values.indexOf(value))
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      selectIndex(currentIndex - 1)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      selectIndex(currentIndex + 1)
    } else if (e.key === 'Home') {
      e.preventDefault()
      selectIndex(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      selectIndex(values.length - 1)
    } else if (e.key === 'PageUp') {
      e.preventDefault()
      selectIndex(currentIndex - 5)
    } else if (e.key === 'PageDown') {
      e.preventDefault()
      selectIndex(currentIndex + 5)
    }
  }

  return (
    <div
      className={cx('dvx-pdp__timeColumn', className)}
      role="listbox"
      aria-label={ariaLabel}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={handleKeyDown}
    >
      <div
        ref={scrollerRef}
        className="dvx-pdp__timeScroller"
        onScroll={handleScroll}
        style={{ height: ITEM_HEIGHT * VISIBLE_COUNT }}
      >
        <div className="dvx-pdp__timePad" style={{ height: PAD * ITEM_HEIGHT }} aria-hidden="true" />
        {values.map((item, index) => {
          const selected = item === value
          return (
            <div
              key={item}
              role="option"
              aria-selected={selected}
              className={cx(
                'dvx-pdp__timeItem',
                itemClassName,
                selected && 'dvx-pdp__timeItem--selected',
                selected && itemSelectedClassName
              )}
              style={{ height: ITEM_HEIGHT }}
              onClick={() => selectIndex(index)}
            >
              {pad2(item)}
            </div>
          )
        })}
        <div className="dvx-pdp__timePad" style={{ height: PAD * ITEM_HEIGHT }} aria-hidden="true" />
      </div>
    </div>
  )
}

type DropdownFieldProps = {
  values: number[]
  value: number
  onChange: (next: number) => void
  disabled?: boolean
  ariaLabel: string
  max: number
  open: boolean
  onOpenChange: (open: boolean) => void
  classes?: TimePickerClasses
}

function DropdownField(props: DropdownFieldProps) {
  const {
    values,
    value,
    onChange,
    disabled = false,
    ariaLabel,
    max,
    open,
    onOpenChange,
    classes,
  } = props

  const rootRef = React.useRef<HTMLDivElement>(null)
  const listRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [draft, setDraft] = React.useState(pad2(value))

  React.useEffect(() => {
    if (!open) setDraft(pad2(value))
  }, [value, open])

  React.useEffect(() => {
    if (!open || !listRef.current) return
    const selected = listRef.current.querySelector<HTMLElement>('[aria-selected="true"]')
    selected?.scrollIntoView({ block: 'nearest' })
  }, [open, value])

  React.useEffect(() => {
    if (!open) return
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        onOpenChange(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open, onOpenChange])

  function commitDraft(raw: string = draft) {
    const parsed = parseInt(raw.replace(/\D/g, ''), 10)
    if (Number.isNaN(parsed) || parsed < 0 || parsed > max) {
      setDraft(pad2(value))
      return
    }
    const next = nearestValue(values, parsed)
    setDraft(pad2(next))
    if (next !== value) onChange(next)
  }

  function selectValue(next: number) {
    onChange(next)
    setDraft(pad2(next))
    onOpenChange(false)
    inputRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (disabled) return
    const currentIndex = Math.max(0, values.indexOf(value))

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!open) {
        onOpenChange(true)
        return
      }
      const next = values[Math.min(values.length - 1, currentIndex + 1)]
      if (next !== undefined) onChange(next)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (!open) {
        onOpenChange(true)
        return
      }
      const next = values[Math.max(0, currentIndex - 1)]
      if (next !== undefined) onChange(next)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      commitDraft()
      onOpenChange(false)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setDraft(pad2(value))
      onOpenChange(false)
    }
  }

  const listId = React.useId()

  return (
    <div
      ref={rootRef}
      className={cx('dvx-pdp__timeDropdown', open && 'dvx-pdp__timeDropdown--open', classes?.dropdown)}
    >
      <div className={cx('dvx-pdp__timeDropdownTrigger', classes?.dropdownTrigger)}>
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          spellCheck={false}
          className={cx('dvx-pdp__timeDropdownInput', classes?.dropdownInput)}
          value={draft}
          disabled={disabled}
          aria-label={ariaLabel}
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          role="combobox"
          onChange={(e) => {
            const next = e.target.value.replace(/[^\d]/g, '').slice(0, 2)
            setDraft(next)
            if (!open) onOpenChange(true)
          }}
          onFocus={() => {
            if (!disabled) onOpenChange(true)
          }}
          onBlur={() => {
            // Delay so option click can fire first
            window.setTimeout(() => {
              if (!rootRef.current?.contains(document.activeElement)) {
                commitDraft()
              }
            }, 0)
          }}
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          className="dvx-pdp__timeDropdownCaret"
          tabIndex={-1}
          disabled={disabled}
          aria-label={`${ariaLabel} — باز کردن لیست`}
          onMouseDown={(e) => {
            e.preventDefault()
            if (disabled) return
            onOpenChange(!open)
            inputRef.current?.focus()
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
            <path d="M2.5 4.5 L6 8 L9.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {open && !disabled && (
        <div
          ref={listRef}
          id={listId}
          className={cx('dvx-pdp__timeDropdownList', classes?.dropdownList)}
          role="listbox"
          aria-label={ariaLabel}
        >
          {values.map((item) => {
            const selected = item === value
            return (
              <button
                key={item}
                type="button"
                role="option"
                aria-selected={selected}
                className={cx(
                  'dvx-pdp__timeDropdownOption',
                  classes?.dropdownOption,
                  selected && 'dvx-pdp__timeDropdownOption--selected',
                  selected && classes?.dropdownOptionSelected
                )}
                onMouseDown={(e) => {
                  e.preventDefault()
                  selectValue(item)
                }}
              >
                {pad2(item)}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function TimeWheel(props: {
  hourValues: number[]
  minuteValues: number[]
  secondValues: number[]
  hour: number
  minute: number
  second: number
  withSeconds: boolean
  disabled: boolean
  emit: (h: number, m: number, s: number) => void
  classes?: TimePickerClasses
}) {
  const {
    hourValues,
    minuteValues,
    secondValues,
    hour,
    minute,
    second,
    withSeconds,
    disabled,
    emit,
    classes,
  } = props

  return (
    <>
      <div className="dvx-pdp__timeWheels">
        <div
          className={cx('dvx-pdp__timeHighlight', classes?.highlight)}
          aria-hidden="true"
        />

        <WheelColumn
          values={hourValues}
          value={hour}
          onChange={(h) => emit(h, minute, second)}
          disabled={disabled}
          ariaLabel="ساعت"
          className={classes?.column}
          itemClassName={classes?.item}
          itemSelectedClassName={classes?.itemSelected}
        />

        <span className={cx('dvx-pdp__timeSeparator', classes?.separator)} aria-hidden="true">
          :
        </span>

        <WheelColumn
          values={minuteValues}
          value={minute}
          onChange={(m) => emit(hour, m, second)}
          disabled={disabled}
          ariaLabel="دقیقه"
          className={classes?.column}
          itemClassName={classes?.item}
          itemSelectedClassName={classes?.itemSelected}
        />

        {withSeconds && (
          <>
            <span className={cx('dvx-pdp__timeSeparator', classes?.separator)} aria-hidden="true">
              :
            </span>
            <WheelColumn
              values={secondValues}
              value={second}
              onChange={(s) => emit(hour, minute, s)}
              disabled={disabled}
              ariaLabel="ثانیه"
              className={classes?.column}
              itemClassName={classes?.item}
              itemSelectedClassName={classes?.itemSelected}
            />
          </>
        )}
      </div>

      <div className="dvx-pdp__timeLabels" aria-hidden="true">
        <span className={cx('dvx-pdp__timeLabel', classes?.label)}>ساعت</span>
        <span className="dvx-pdp__timeLabelSpacer" />
        <span className={cx('dvx-pdp__timeLabel', classes?.label)}>دقیقه</span>
        {withSeconds && (
          <>
            <span className="dvx-pdp__timeLabelSpacer" />
            <span className={cx('dvx-pdp__timeLabel', classes?.label)}>ثانیه</span>
          </>
        )}
      </div>
    </>
  )
}

function TimeDropdown(props: {
  hourValues: number[]
  minuteValues: number[]
  secondValues: number[]
  hour: number
  minute: number
  second: number
  withSeconds: boolean
  disabled: boolean
  emit: (h: number, m: number, s: number) => void
  classes?: TimePickerClasses
}) {
  const {
    hourValues,
    minuteValues,
    secondValues,
    hour,
    minute,
    second,
    withSeconds,
    disabled,
    emit,
    classes,
  } = props

  const [openField, setOpenField] = React.useState<'hour' | 'minute' | 'second' | null>(null)

  return (
    <div className="dvx-pdp__timeDropdownRow">
      <div className="dvx-pdp__timeDropdownGroup">
        <DropdownField
          values={hourValues}
          value={hour}
          onChange={(h) => emit(h, minute, second)}
          disabled={disabled}
          ariaLabel="ساعت"
          max={23}
          open={openField === 'hour'}
          onOpenChange={(next) => setOpenField(next ? 'hour' : null)}
          classes={classes}
        />
        <span className={cx('dvx-pdp__timeLabel', classes?.label)}>ساعت</span>
      </div>

      <span className={cx('dvx-pdp__timeSeparator', 'dvx-pdp__timeSeparator--dropdown', classes?.separator)} aria-hidden="true">
        :
      </span>

      <div className="dvx-pdp__timeDropdownGroup">
        <DropdownField
          values={minuteValues}
          value={minute}
          onChange={(m) => emit(hour, m, second)}
          disabled={disabled}
          ariaLabel="دقیقه"
          max={59}
          open={openField === 'minute'}
          onOpenChange={(next) => setOpenField(next ? 'minute' : null)}
          classes={classes}
        />
        <span className={cx('dvx-pdp__timeLabel', classes?.label)}>دقیقه</span>
      </div>

      {withSeconds && (
        <>
          <span className={cx('dvx-pdp__timeSeparator', 'dvx-pdp__timeSeparator--dropdown', classes?.separator)} aria-hidden="true">
            :
          </span>
          <div className="dvx-pdp__timeDropdownGroup">
            <DropdownField
              values={secondValues}
              value={second}
              onChange={(s) => emit(hour, minute, s)}
              disabled={disabled}
              ariaLabel="ثانیه"
              max={59}
              open={openField === 'second'}
              onOpenChange={(next) => setOpenField(next ? 'second' : null)}
              classes={classes}
            />
            <span className={cx('dvx-pdp__timeLabel', classes?.label)}>ثانیه</span>
          </div>
        </>
      )}
    </div>
  )
}

export function TimePicker(props: TimePickerProps) {
  const {
    value,
    onChange,
    format = 'HH:mm',
    showSeconds = false,
    hourStep = 1,
    minuteStep = 1,
    secondStep = 1,
    variant = 'wheel',
    disabled = false,
    classes,
  } = props

  const withSeconds = Boolean(showSeconds) || format === 'HH:mm:ss'

  const hourValues = React.useMemo(() => buildValues(23, hourStep), [hourStep])
  const minuteValues = React.useMemo(() => buildValues(59, minuteStep), [minuteStep])
  const secondValues = React.useMemo(() => buildValues(59, secondStep), [secondStep])

  const rawHour = value.getHours()
  const rawMinute = value.getMinutes()
  const rawSecond = value.getSeconds()

  const hour = nearestValue(hourValues, rawHour)
  const minute = nearestValue(minuteValues, rawMinute)
  const second = nearestValue(secondValues, rawSecond)

  function emit(nextHour: number, nextMinute: number, nextSecond: number) {
    const normalized = normalizeTime(
      nextHour,
      nextMinute,
      withSeconds ? nextSecond : undefined
    )
    onChange(setTime(value, normalized.hour, normalized.minute, normalized.second))
  }

  // Wheel only: snap value onto the configured step grid when it drifts
  React.useEffect(() => {
    if (disabled || variant !== 'wheel') return
    if (
      hour !== rawHour ||
      minute !== rawMinute ||
      (withSeconds && second !== rawSecond)
    ) {
      emit(hour, minute, second)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hour, minute, second, rawHour, rawMinute, rawSecond, withSeconds, disabled, variant])

  return (
    <div
      className={cx(
        'dvx-pdp__time',
        variant === 'dropdown' && 'dvx-pdp__time--dropdown',
        classes?.root
      )}
      aria-label="انتخاب زمان"
      data-variant={variant}
    >
      {variant === 'dropdown' ? (
        <TimeDropdown
          hourValues={hourValues}
          minuteValues={minuteValues}
          secondValues={secondValues}
          hour={hour}
          minute={minute}
          second={second}
          withSeconds={withSeconds}
          disabled={disabled}
          emit={emit}
          classes={classes}
        />
      ) : (
        <TimeWheel
          hourValues={hourValues}
          minuteValues={minuteValues}
          secondValues={secondValues}
          hour={hour}
          minute={minute}
          second={second}
          withSeconds={withSeconds}
          disabled={disabled}
          emit={emit}
          classes={classes}
        />
      )}
    </div>
  )
}
