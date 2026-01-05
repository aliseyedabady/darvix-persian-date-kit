import * as React from 'react'
import { normalizeTime, setTime, addTime } from '../utils/timeUtils'
import type { TimePickerClasses } from '../types/shared'

export type TimePickerProps = {
  value: Date
  onChange: (date: Date) => void
  format?: 'HH:mm' | 'HH:mm:ss'
  showSeconds?: boolean
  defaultTime?: { hour: number; minute: number; second?: number }
  hourStep?: number
  minuteStep?: number
  secondStep?: number
  disabled?: boolean
  classes?: TimePickerClasses
}

function cx(...parts: Array<string | undefined | false>) {
  return parts.filter(Boolean).join(' ')
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
    disabled = false,
    classes,
  } = props

  const hour = value.getHours()
  const minute = value.getMinutes()
  const second = value.getSeconds()

  const hourIntervalRef = React.useRef<NodeJS.Timeout | null>(null)
  const minuteIntervalRef = React.useRef<NodeJS.Timeout | null>(null)
  const secondIntervalRef = React.useRef<NodeJS.Timeout | null>(null)
  const speedUp1Ref = React.useRef<NodeJS.Timeout | null>(null)
  const speedUp2Ref = React.useRef<NodeJS.Timeout | null>(null)
  const speedRef = React.useRef(200)
  const startTimeRef = React.useRef<number | null>(null)

  // Cleanup intervals on unmount
  React.useEffect(() => {
    return () => {
      if (hourIntervalRef.current) clearInterval(hourIntervalRef.current)
      if (minuteIntervalRef.current) clearInterval(minuteIntervalRef.current)
      if (secondIntervalRef.current) clearInterval(secondIntervalRef.current)
      if (speedUp1Ref.current) clearTimeout(speedUp1Ref.current)
      if (speedUp2Ref.current) clearTimeout(speedUp2Ref.current)
    }
  }, [])

  function stopAllIntervals() {
    if (hourIntervalRef.current) {
      clearInterval(hourIntervalRef.current)
      hourIntervalRef.current = null
    }
    if (minuteIntervalRef.current) {
      clearInterval(minuteIntervalRef.current)
      minuteIntervalRef.current = null
    }
    if (secondIntervalRef.current) {
      clearInterval(secondIntervalRef.current)
      secondIntervalRef.current = null
    }
    if (speedUp1Ref.current) {
      clearTimeout(speedUp1Ref.current)
      speedUp1Ref.current = null
    }
    if (speedUp2Ref.current) {
      clearTimeout(speedUp2Ref.current)
      speedUp2Ref.current = null
    }
    speedRef.current = 200
    startTimeRef.current = null
  }

  function startIncrement(
    field: 'hour' | 'minute' | 'second',
    delta: number
  ) {
    if (disabled) return

    // Stop any existing intervals
    stopAllIntervals()

    // Immediate update
    updateTime(field, delta)

    startTimeRef.current = Date.now()
    speedRef.current = 200

    // Create a function to run the interval with current speed (recursive setTimeout)
    const runInterval = () => {
      if (!startTimeRef.current) return
      
      updateTime(field, delta)
      
      // Schedule next update with current speed
      const currentSpeed = speedRef.current
      const timeoutId = setTimeout(() => {
        runInterval()
      }, currentSpeed)

      if (field === 'hour') {
        hourIntervalRef.current = timeoutId
      } else if (field === 'minute') {
        minuteIntervalRef.current = timeoutId
      } else {
        secondIntervalRef.current = timeoutId
      }
    }

    // Start the interval
    runInterval()

    // Accelerate after delays
    speedUp1Ref.current = setTimeout(() => {
      if (startTimeRef.current) {
        speedRef.current = 50
      }
    }, 500)

    speedUp2Ref.current = setTimeout(() => {
      if (startTimeRef.current) {
        speedRef.current = 20
      }
    }, 1000)
  }

  function updateTime(field: 'hour' | 'minute' | 'second', delta: number) {
    const step =
      field === 'hour'
        ? hourStep
        : field === 'minute'
        ? minuteStep
        : secondStep

    const actualDelta = delta * step

    if (field === 'hour') {
      const newHour = (hour + actualDelta + 24) % 24
      const normalized = normalizeTime(newHour, minute, showSeconds ? second : undefined)
      onChange(setTime(value, normalized.hour, normalized.minute, normalized.second))
    } else if (field === 'minute') {
      const newMinute = (minute + actualDelta + 60) % 60
      const normalized = normalizeTime(hour, newMinute, showSeconds ? second : undefined)
      onChange(setTime(value, normalized.hour, normalized.minute, normalized.second))
    } else {
      const newSecond = (second + actualDelta + 60) % 60
      const normalized = normalizeTime(hour, minute, newSecond)
      onChange(setTime(value, normalized.hour, normalized.minute, normalized.second))
    }
  }

  function handleHourChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (disabled) return
    const newHour = parseInt(e.target.value, 10)
    if (!isNaN(newHour) && newHour >= 0 && newHour <= 23) {
      const normalized = normalizeTime(newHour, minute, showSeconds ? second : undefined)
      onChange(setTime(value, normalized.hour, normalized.minute, normalized.second))
    }
  }

  function handleMinuteChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (disabled) return
    const newMinute = parseInt(e.target.value, 10)
    if (!isNaN(newMinute) && newMinute >= 0 && newMinute <= 59) {
      const normalized = normalizeTime(hour, newMinute, showSeconds ? second : undefined)
      onChange(setTime(value, normalized.hour, normalized.minute, normalized.second))
    }
  }

  function handleSecondChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (disabled) return
    const newSecond = parseInt(e.target.value, 10)
    if (!isNaN(newSecond) && newSecond >= 0 && newSecond <= 59) {
      const normalized = normalizeTime(hour, minute, newSecond)
      onChange(setTime(value, normalized.hour, normalized.minute, normalized.second))
    }
  }

  function handleHourKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (disabled) return
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      updateTime('hour', 1)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      updateTime('hour', -1)
    }
  }

  function handleMinuteKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (disabled) return
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      updateTime('minute', 1)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      updateTime('minute', -1)
    }
  }

  function handleSecondKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (disabled) return
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      updateTime('second', 1)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      updateTime('second', -1)
    }
  }

  function handleWheel(e: React.WheelEvent<HTMLInputElement>, field: 'hour' | 'minute' | 'second') {
    if (disabled) return
    e.preventDefault()
    const delta = e.deltaY > 0 ? -1 : 1
    updateTime(field, delta)
  }

  return (
    <div className={cx('dvx-pdp__time', classes?.root)}>
      {/* Hour Stepper */}
      <div className={cx('dvx-pdp__timeStepper', classes?.stepper)}>
        <button
          type="button"
          className={cx('dvx-pdp__timeStepperButton', classes?.stepperButton, classes?.stepperButtonUp)}
          onMouseDown={(e) => {
            e.preventDefault()
            startIncrement('hour', 1)
          }}
          onMouseUp={stopAllIntervals}
          onMouseLeave={stopAllIntervals}
          disabled={disabled}
          aria-label="افزایش ساعت"
        >
          ▲
        </button>
        <input
          type="number"
          className={cx('dvx-pdp__timeStepperInput', classes?.stepperInput)}
          value={String(hour).padStart(2, '0')}
          onChange={handleHourChange}
          onKeyDown={handleHourKeyDown}
          onWheel={(e) => handleWheel(e, 'hour')}
          min={0}
          max={23}
          disabled={disabled}
          aria-label="ساعت"
        />
        <button
          type="button"
          className={cx('dvx-pdp__timeStepperButton', classes?.stepperButton, classes?.stepperButtonDown)}
          onMouseDown={(e) => {
            e.preventDefault()
            startIncrement('hour', -1)
          }}
          onMouseUp={stopAllIntervals}
          onMouseLeave={stopAllIntervals}
          disabled={disabled}
          aria-label="کاهش ساعت"
        >
          ▼
        </button>
      </div>

      <span className={cx('dvx-pdp__timeSeparator', classes?.separator)}>:</span>

      {/* Minute Stepper */}
      <div className={cx('dvx-pdp__timeStepper', classes?.stepper)}>
        <button
          type="button"
          className={cx('dvx-pdp__timeStepperButton', classes?.stepperButton, classes?.stepperButtonUp)}
          onMouseDown={(e) => {
            e.preventDefault()
            startIncrement('minute', 1)
          }}
          onMouseUp={stopAllIntervals}
          onMouseLeave={stopAllIntervals}
          disabled={disabled}
          aria-label="افزایش دقیقه"
        >
          ▲
        </button>
        <input
          type="number"
          className={cx('dvx-pdp__timeStepperInput', classes?.stepperInput)}
          value={String(minute).padStart(2, '0')}
          onChange={handleMinuteChange}
          onKeyDown={handleMinuteKeyDown}
          onWheel={(e) => handleWheel(e, 'minute')}
          min={0}
          max={59}
          disabled={disabled}
          aria-label="دقیقه"
        />
        <button
          type="button"
          className={cx('dvx-pdp__timeStepperButton', classes?.stepperButton, classes?.stepperButtonDown)}
          onMouseDown={(e) => {
            e.preventDefault()
            startIncrement('minute', -1)
          }}
          onMouseUp={stopAllIntervals}
          onMouseLeave={stopAllIntervals}
          disabled={disabled}
          aria-label="کاهش دقیقه"
        >
          ▼
        </button>
      </div>

      {/* Second Stepper (if enabled) */}
      {showSeconds && format === 'HH:mm:ss' && (
        <>
          <span className={cx('dvx-pdp__timeSeparator', classes?.separator)}>:</span>
          <div className={cx('dvx-pdp__timeStepper', classes?.stepper)}>
            <button
              type="button"
              className={cx('dvx-pdp__timeStepperButton', classes?.stepperButton, classes?.stepperButtonUp)}
              onMouseDown={(e) => {
                e.preventDefault()
                startIncrement('second', 1)
              }}
              onMouseUp={stopAllIntervals}
              onMouseLeave={stopAllIntervals}
              disabled={disabled}
              aria-label="افزایش ثانیه"
            >
              ▲
            </button>
            <input
              type="number"
              className={cx('dvx-pdp__timeStepperInput', classes?.stepperInput)}
              value={String(second).padStart(2, '0')}
              onChange={handleSecondChange}
              onKeyDown={handleSecondKeyDown}
              onWheel={(e) => handleWheel(e, 'second')}
              min={0}
              max={59}
              disabled={disabled}
              aria-label="ثانیه"
            />
            <button
              type="button"
              className={cx('dvx-pdp__timeStepperButton', classes?.stepperButton, classes?.stepperButtonDown)}
              onMouseDown={(e) => {
                e.preventDefault()
                startIncrement('second', -1)
              }}
              onMouseUp={stopAllIntervals}
              onMouseLeave={stopAllIntervals}
              disabled={disabled}
              aria-label="کاهش ثانیه"
            >
              ▼
            </button>
          </div>
        </>
      )}
    </div>
  )
}

