import * as React from "react";
import { createPortal } from "react-dom";
import { toJalali, formatJalaliWithTime } from "../utils/toJalali";
import { parseJalaliText, parseJalaliTextWithTime } from "../utils/toGregorian";
import {
  addDays,
  addJalaliMonths,
  buildJalaliMonthGrid,
  compareDays,
  isSameDay,
  isWithinRange,
  type CalendarDayCell,
} from "../utils/calendarGrid";
import { fromJalaliParts, toJalaliParts } from "../adapters/dayjsAdapter";
import { usePopoverPosition } from "../utils/usePopoverPosition";
import { TimePicker } from "./_TimePicker";
import { setTime } from "../utils/timeUtils";
import type { BasePickerProps, BasePickerClasses, TimePickerConfig } from "../types/shared";

export type PersianDatePickerClasses = Partial<
  BasePickerClasses & {
    daySelected: string;
  }
>;

export type PersianDatePickerProps = BasePickerProps & {
  value: Date | null | Date[];
  onChange: (date: Date | null | Date[]) => void;
  placeholder?: string;
  multiple?: boolean;
  maxSelections?: number;
  timePicker?: TimePickerConfig;
  classes?: PersianDatePickerClasses;
  /**
   * Show/hide the calendar button (default: `true`).
   */
  showCalendarButton?: boolean;
  /**
   * Custom calendar icon. If not provided, default calendar icon is used.
   */
  calendarIcon?: React.ReactNode;
};

function cx(...parts: Array<string | undefined | false>) {
  return parts.filter(Boolean).join(" ");
}

function defaultFormatValue(date: Date, timeConfig?: { enabled: boolean; format?: 'HH:mm' | 'HH:mm:ss' }) {
  if (timeConfig?.enabled) {
    return formatJalaliWithTime(date, timeConfig.format);
  }
  return toJalali(date).formatted;
}

function defaultParseValue(text: string, timeConfig?: { enabled: boolean; format?: 'HH:mm' | 'HH:mm:ss' }) {
  if (timeConfig?.enabled) {
    return parseJalaliTextWithTime(text, { 
      allowLooseSeparators: true,
      timeFormat: timeConfig.format 
    });
  }
  return parseJalaliText(text, { allowLooseSeparators: true });
}

function normalizeInputValue(
  next: Date,
  minDate?: Date,
  maxDate?: Date
): Date | null {
  if (!isWithinRange(next, minDate, maxDate)) return null;
  return next;
}

function getInitialViewMonth(value: Date | null): { jy: number; jm: number } {
  const base = value ?? new Date();
  const p = toJalaliParts(base);
  return { jy: p.jy, jm: p.jm };
}

function getToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function PersianDatePicker(props: PersianDatePickerProps) {
  const {
    value,
    onChange,
    minDate,
    maxDate,
    disabled,
    placeholder,
    open: openProp,
    onOpenChange,
    mode = "popover",
    theme = "light",
    popover,
    multiple = false,
    maxSelections,
    timePicker,
    formatValue,
    parseValue,
    weekdays,
    monthLabels,
    renderMonthLabel,
    prevIcon,
    nextIcon,
    showCalendarButton = false,
    calendarIcon,
    className,
    classes,
  } = props;

  // Disable time picker in multiple mode
  const effectiveTimePicker = multiple ? undefined : timePicker;

  // Normalize timePicker config
  const timeConfig = React.useMemo(() => {
    if (multiple) return { enabled: false };
    if (typeof effectiveTimePicker === 'boolean') {
      return effectiveTimePicker ? { enabled: true } : { enabled: false };
    }
    return effectiveTimePicker ?? { enabled: false };
  }, [effectiveTimePicker, multiple]);

  // Create formatValue and parseValue with timeConfig
  const effectiveFormatValue = React.useCallback(
    (date: Date) => {
      if (formatValue) {
        return formatValue(date);
      }
      return defaultFormatValue(date, timeConfig);
    },
    [formatValue, timeConfig]
  );

  const effectiveParseValue = React.useCallback(
    (text: string) => {
      if (parseValue) {
        return parseValue(text);
      }
      return defaultParseValue(text, timeConfig);
    },
    [parseValue, timeConfig]
  );

  const themeClass =
    theme === "dark"
      ? "dvx-pdp--theme-dark"
      : theme === "auto"
      ? "dvx-pdp--theme-auto"
      : undefined;

  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const popoverRef = React.useRef<HTMLDivElement | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const calendarRef = React.useRef<HTMLDivElement | null>(null);
  const isEditingRef = React.useRef(false);
  const [mounted, setMounted] = React.useState(false);

  const [openUncontrolled, setOpenUncontrolled] = React.useState(false);
  const open = mode === "inline" ? true : openProp ?? openUncontrolled;

  const setOpen = React.useCallback(
    (next: boolean) => {
      onOpenChange?.(next);
      if (mode === "inline") return;
      if (openProp === undefined) setOpenUncontrolled(next);
    },
    [mode, onOpenChange, openProp]
  );

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const getInitialDate = React.useCallback(() => {
    if (multiple) {
      return Array.isArray(value) && value.length > 0 ? value[0] : getToday();
    }
    return (value as Date | null) ?? getToday();
  }, [value, multiple]);

  const [viewMonth, setViewMonth] = React.useState(() =>
    getInitialViewMonth(getInitialDate())
  );
  const [focusedDate, setFocusedDate] = React.useState<Date>(() => {
    return getInitialDate();
  });
  // Format value for display
  const formatValueForDisplay = React.useCallback((val: Date | null | Date[]) => {
    if (multiple) {
      const dates = Array.isArray(val) ? val : [];
      if (dates.length === 0) return "";
      if (dates.length === 1) return effectiveFormatValue(dates[0]);
      if (dates.length <= 3) {
        return dates.map(d => effectiveFormatValue(d)).join(", ");
      }
      return `${dates.length} روز انتخاب شده`;
    }
    return val ? effectiveFormatValue(val as Date) : "";
  }, [multiple, effectiveFormatValue]);

  const [text, setText] = React.useState<string>(() =>
    formatValueForDisplay(value)
  );
  const [panel, setPanel] = React.useState<"days" | "years" | "months">("days");
  const [yearPageStart, setYearPageStart] = React.useState(() => {
    const jy = getInitialViewMonth(getInitialDate()).jy;
    return jy - (jy % 12);
  });
  const [pendingYear, setPendingYear] = React.useState<number>(
    () => getInitialViewMonth(getInitialDate()).jy
  );

  // Keep input text in sync with controlled value (unless the user is actively editing).
  React.useEffect(() => {
    if (isEditingRef.current) return;
    setText(formatValueForDisplay(value));
    // For multiple mode, use first date or today for view month
    const anchorDate = multiple
      ? (Array.isArray(value) && value.length > 0 ? value[0] : getToday())
      : (value as Date | null) ?? getToday();
    setViewMonth(getInitialViewMonth(anchorDate));
    setFocusedDate(anchorDate);
    const jy = getInitialViewMonth(anchorDate).jy;
    setPendingYear(jy);
    setYearPageStart(jy - (jy % 12));
  }, [value, formatValueForDisplay, multiple]);

  // Close on outside click (SSR-safe because effect only runs on client).
  React.useEffect(() => {
    if (mode !== "popover") return;
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const el = rootRef.current;
      if (!el) return;
      const pop = popoverRef.current;
      if (
        e.target instanceof Node &&
        !el.contains(e.target) &&
        !(pop && pop.contains(e.target))
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [mode, open, setOpen]);

  // Focus calendar container when opened so arrow keys work immediately.
  React.useEffect(() => {
    if (!open) return;
    calendarRef.current?.focus();
  }, [open]);

  const popoverOpts = popover ?? {};
  const usePortal = popoverOpts.portal ?? true;
  const { style: popoverStyle } = usePopoverPosition(
    mode === "popover" && open,
    inputRef,
    popoverRef,
    {
      gutter: popoverOpts.gutter,
      padding: popoverOpts.padding,
      // If we're not using a portal, `absolute` would require offset-parent math.
      // Force `fixed` so we can clamp reliably to the viewport.
      strategy: usePortal ? popoverOpts.strategy : "fixed",
      placements: popoverOpts.placements,
      align: popoverOpts.align ?? "end",
    }
  );

  const monthLabel = React.useMemo(() => {
    if (renderMonthLabel) return renderMonthLabel(viewMonth.jy, viewMonth.jm);
    if (monthLabels && monthLabels.length === 12) {
      const m = monthLabels[viewMonth.jm - 1] ?? String(viewMonth.jm);
      return `${m} ${viewMonth.jy}`;
    }
    return `${viewMonth.jy} / ${viewMonth.jm}`;
  }, [monthLabels, renderMonthLabel, viewMonth.jm, viewMonth.jy]);

  const weekdayLabels = React.useMemo(() => {
    if (weekdays && weekdays.length === 7) return weekdays;
    // Default to numeric headers to avoid hardcoded locale strings.
    return ["1", "2", "3", "4", "5", "6", "7"];
  }, [weekdays]);

  const grid = React.useMemo(
    () => buildJalaliMonthGrid({ jy: viewMonth.jy, jm: viewMonth.jm }),
    [viewMonth.jm, viewMonth.jy]
  );

  // Normalize value for single/multiple mode
  const selectedDates = React.useMemo((): Date[] => {
    if (multiple) {
      return Array.isArray(value) ? value : [];
    }
    return value ? [value as Date] : [];
  }, [value, multiple]);

  const selected = multiple ? null : (value as Date | null) ?? null;
  const today = React.useMemo(() => getToday(), []);

  function setViewByAnchor(anchor: Date) {
    const p = toJalaliParts(anchor);
    setViewMonth({ jy: p.jy, jm: p.jm });
  }

  function openCalendar() {
    if (disabled) return;
    setOpen(true);
    const anchor = multiple
      ? (selectedDates.length > 0 ? selectedDates[0] : focusedDate ?? today)
      : (selected ?? focusedDate ?? today);
    setViewByAnchor(anchor);
    setPanel("days");
    const jy = toJalaliParts(anchor).jy;
    setPendingYear(jy);
    setYearPageStart(jy - (jy % 12));
  }

  function closeCalendar() {
    setOpen(false);
    setPanel("days");
    inputRef.current?.focus();
  }

  function commitFromText(nextText: string) {
    // In multiple mode, don't allow text input (only calendar selection)
    if (multiple) {
      setText(formatValueForDisplay(value));
      return;
    }

    const trimmed = nextText.trim();
    if (!trimmed) {
      // If time is enabled, we should set a date with default time instead of null
      if (timeConfig.enabled && timeConfig.defaultTime) {
        const today = new Date();
        const dateWithTime = setTime(today, timeConfig.defaultTime.hour, timeConfig.defaultTime.minute, timeConfig.defaultTime.second);
        onChange(dateWithTime);
      } else {
      onChange(null);
      }
      return;
    }

    const parsed = effectiveParseValue(trimmed);
    if (!parsed) {
      // Invalid: revert to controlled value on blur.
      setText(selected ? effectiveFormatValue(selected as Date) : trimmed);
      return;
    }

    const next = normalizeInputValue(parsed, minDate, maxDate);
    if (!next) {
      setText(selected ? effectiveFormatValue(selected as Date) : trimmed);
      return;
    }

    onChange(next);
  }

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (disabled) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      openCalendar();
      return;
    }
    if (e.key === "Escape") {
      if (open) {
        e.preventDefault();
        closeCalendar();
      }
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      commitFromText(text);
      return;
    }
  }

  function onCalendarKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (!open) return;
    if (disabled) return;

    if (e.key === "Escape") {
      e.preventDefault();
      closeCalendar();
      return;
    }

    if (panel !== "days") {
      // Keep it simple: keyboard navigation is implemented for the day grid only.
      return;
    }

    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setFocusedDate((d) => addDays(d, -1));
      return;
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      setFocusedDate((d) => addDays(d, 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedDate((d) => addDays(d, -7));
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedDate((d) => addDays(d, 7));
      return;
    }
    if (e.key === "PageUp") {
      e.preventDefault();
      navigateMonth(-1);
      return;
    }
    if (e.key === "PageDown") {
      e.preventDefault();
      navigateMonth(1);
      return;
    }
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!isWithinRange(focusedDate, minDate, maxDate)) return;
      
      if (multiple) {
        // Toggle selection in multiple mode
        const currentDates = selectedDates;
        const isSelected = currentDates.some(d => isSameDay(d, focusedDate));
        
        if (isSelected) {
          // Remove from selection
          const newDates = currentDates.filter((d): d is Date => !isSameDay(d, focusedDate));
          onChange(newDates as Date | null | Date[]);
          setText(formatValueForDisplay(newDates));
        } else {
          // Add to selection (check maxSelections limit)
          if (maxSelections && currentDates.length >= maxSelections) {
            return; // Don't add if limit reached
          }
          const newDates = [...currentDates, focusedDate].sort((a, b) => a.getTime() - b.getTime());
          onChange(newDates as Date | null | Date[]);
          setText(formatValueForDisplay(newDates));
        }
        // Don't close calendar in multiple mode
      } else {
        // Single selection mode
        let dateToSet = focusedDate;
        const singleValue = value as Date | null;
        if (timeConfig.enabled && singleValue) {
          dateToSet = setTime(focusedDate, singleValue.getHours(), singleValue.getMinutes(), singleValue.getSeconds());
        } else if (timeConfig.enabled && timeConfig.defaultTime) {
          dateToSet = setTime(focusedDate, timeConfig.defaultTime.hour, timeConfig.defaultTime.minute, timeConfig.defaultTime.second);
        }
        onChange(dateToSet);
        setText(effectiveFormatValue(dateToSet));
      closeCalendar();
      }
    }
  }

  React.useEffect(() => {
    // Keep the visible month aligned with keyboard focus when crossing month boundaries.
    // Note: this effect must *not* fight explicit month navigation (prev/next buttons).
    if (!open) return;
    const p = toJalaliParts(focusedDate);
    setViewMonth((m) =>
      m.jy === p.jy && m.jm === p.jm ? m : { jy: p.jy, jm: p.jm }
    );
  }, [focusedDate, open]);

  function selectCell(cell: CalendarDayCell) {
    if (disabled) return;
    if (!isWithinRange(cell.gregorian, minDate, maxDate)) return;
    
    if (multiple) {
      // Toggle selection in multiple mode
      const currentDates = selectedDates;
      const isSelected = currentDates.some(d => isSameDay(d, cell.gregorian));
      
      if (isSelected) {
        // Remove from selection
        const newDates = currentDates.filter((d): d is Date => !isSameDay(d, cell.gregorian));
        onChange(newDates as Date | null | Date[]);
        setText(formatValueForDisplay(newDates));
      } else {
        // Add to selection (check maxSelections limit)
        if (maxSelections && currentDates.length >= maxSelections) {
          return; // Don't add if limit reached
        }
        const newDates = [...currentDates, cell.gregorian].sort((a, b) => a.getTime() - b.getTime());
        onChange(newDates as Date | null | Date[]);
        setText(formatValueForDisplay(newDates));
      }
    setFocusedDate(cell.gregorian);
      // Don't close calendar in multiple mode
    } else {
      // Single selection mode
      let dateToSet = cell.gregorian;
      const singleValue = value as Date | null;
      if (timeConfig.enabled && singleValue) {
        dateToSet = setTime(cell.gregorian, singleValue.getHours(), singleValue.getMinutes(), singleValue.getSeconds());
      } else if (timeConfig.enabled && timeConfig.defaultTime) {
        dateToSet = setTime(cell.gregorian, timeConfig.defaultTime.hour, timeConfig.defaultTime.minute, timeConfig.defaultTime.second);
      }
      onChange(dateToSet);
      setText(effectiveFormatValue(dateToSet));
      setFocusedDate(dateToSet);
    setOpen(false);
    inputRef.current?.focus();
    }
  }

  function isCellDisabled(cell: CalendarDayCell) {
    if (disabled) return true;
    return !isWithinRange(cell.gregorian, minDate, maxDate);
  }

  function navigateMonth(delta: -1 | 1) {
    const anchor = fromJalaliParts({
      jy: viewMonth.jy,
      jm: viewMonth.jm,
      jd: 1,
    });
    const nextMonthAnchor = addJalaliMonths(anchor, delta);
    const nextMonthParts = toJalaliParts(nextMonthAnchor);
    setViewMonth({ jy: nextMonthParts.jy, jm: nextMonthParts.jm });

    setFocusedDate((curr) => {
      const currParts = toJalaliParts(curr);
      const currIsInView =
        currParts.jy === viewMonth.jy && currParts.jm === viewMonth.jm;
      return currIsInView ? addJalaliMonths(curr, delta) : nextMonthAnchor;
    });
  }

  function goPrevMonth() {
    navigateMonth(-1);
  }

  function goNextMonth() {
    navigateMonth(1);
  }

  function getRangeForJalaliYear(jy: number): {
    start: Date;
    endExclusive: Date;
  } {
    const start = fromJalaliParts({ jy, jm: 1, jd: 1 });
    const endExclusive = fromJalaliParts({ jy: jy + 1, jm: 1, jd: 1 });
    return { start, endExclusive };
  }

  function getRangeForJalaliMonth(
    jy: number,
    jm: number
  ): { start: Date; endExclusive: Date } {
    const start = fromJalaliParts({ jy, jm, jd: 1 });
    const next = jm === 12 ? { jy: jy + 1, jm: 1 } : { jy, jm: jm + 1 };
    const endExclusive = fromJalaliParts({ jy: next.jy, jm: next.jm, jd: 1 });
    return { start, endExclusive };
  }

  function rangeIntersectsPickerLimits(range: {
    start: Date;
    endExclusive: Date;
  }) {
    // Intersects if rangeEndExclusive > min AND rangeStart <= max
    if (minDate && compareDays(range.endExclusive, minDate) <= 0) return false;
    if (maxDate && compareDays(range.start, maxDate) > 0) return false;
    return true;
  }

  function toggleMonthYearPanel() {
    if (panel === "days") {
      setPanel("years");
      const baseJy = viewMonth.jy;
      setPendingYear(baseJy);
      setYearPageStart(baseJy - (baseJy % 12));
    } else {
      setPanel("days");
    }
  }

  function selectYear(jy: number) {
    setPendingYear(jy);
    setPanel("months");
  }

  function selectMonth(jm: number) {
    const nextView = { jy: pendingYear, jm };
    setViewMonth(nextView);
    setFocusedDate(() => {
      const currentDay = toJalaliParts(focusedDate).jd;
      try {
        return fromJalaliParts({
          jy: nextView.jy,
          jm: nextView.jm,
          jd: currentDay,
        });
      } catch {
        return fromJalaliParts({ jy: nextView.jy, jm: nextView.jm, jd: 1 });
      }
    });
    setPanel("days");
  }

  const calendarUi = (
    <div
      ref={calendarRef}
      tabIndex={-1}
      className="dvx-pdp__calendar"
      onKeyDown={onCalendarKeyDown}
    >
      <div className={cx("dvx-pdp__header", classes?.header)}>
        <button
          type="button"
          className={cx("dvx-pdp__nav", classes?.navButton)}
          onClick={
            panel === "days"
              ? goPrevMonth
              : () => setYearPageStart((s) => s - 12)
          }
          aria-label="Previous month"
        >
          {prevIcon ?? "‹"}
        </button>
        <button
          type="button"
          className={cx("dvx-pdp__monthLabel", classes?.monthLabel)}
          onClick={toggleMonthYearPanel}
          aria-label="Choose month and year"
        >
          {panel === "days" ? monthLabel : pendingYear}
        </button>
        <button
          type="button"
          className={cx("dvx-pdp__nav", classes?.navButton)}
          onClick={
            panel === "days"
              ? goNextMonth
              : () => setYearPageStart((s) => s + 12)
          }
          aria-label="Next month"
        >
          {nextIcon ?? "›"}
        </button>
      </div>

      {panel === "days" ? (
        <>
        <div className={cx("dvx-pdp__grid", classes?.grid)}>
          <div className="dvx-pdp__weekdays" aria-hidden="true">
            {weekdayLabels.map((w, idx) => (
              <div
                key={idx}
                className={cx("dvx-pdp__weekday", classes?.weekday)}
              >
                {w}
              </div>
            ))}
          </div>

          <div className="dvx-pdp__days">
            {grid.map((row, r) => (
              <div className="dvx-pdp__row" key={r}>
                {row.map((cell) => {
                  const cellDisabled = isCellDisabled(cell);
                  const isSelected = multiple
                    ? selectedDates.some(d => isSameDay(cell.gregorian, d))
                    : selected
                    ? isSameDay(cell.gregorian, selected)
                    : false;
                  const isToday = isSameDay(cell.gregorian, today);
                  const isFocused = isSameDay(cell.gregorian, focusedDate);

                  return (
                    <button
                      key={`${cell.jalali.jy}-${cell.jalali.jm}-${cell.jalali.jd}`}
                      type="button"
                      className={cx(
                        "dvx-pdp__day",
                        classes?.day,
                        !cell.inCurrentMonth &&
                          cx("dvx-pdp__day--outside", classes?.dayOutside),
                        cellDisabled &&
                          cx("dvx-pdp__day--disabled", classes?.dayDisabled),
                        isSelected &&
                          cx("dvx-pdp__day--selected", classes?.daySelected),
                        isToday && cx("dvx-pdp__day--today", classes?.dayToday),
                        isFocused && "dvx-pdp__day--focused"
                      )}
                      disabled={cellDisabled}
                      onClick={() => selectCell(cell)}
                      onMouseEnter={() => {
                        // Prevent accidental month switching when hovering the leading/trailing days
                        // from adjacent months (they are rendered in the grid).
                        if (cell.inCurrentMonth) setFocusedDate(cell.gregorian);
                      }}
                      aria-pressed={isSelected}
                    >
                      {cell.jalali.jd}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
          {timeConfig.enabled && !multiple && (() => {
            // Ensure we have a date value for TimePicker (only in single mode)
            const singleValue = value as Date | null;
            const timePickerValue = singleValue ?? (() => {
              const today = new Date();
              if (timeConfig.defaultTime) {
                return setTime(today, timeConfig.defaultTime.hour, timeConfig.defaultTime.minute, timeConfig.defaultTime.second);
              }
              return today;
            })();
            
            return (
              <TimePicker
                value={timePickerValue}
                onChange={(newDate) => {
                  onChange(newDate);
                  setText(effectiveFormatValue(newDate));
                }}
                format={timeConfig.format}
                showSeconds={timeConfig.showSeconds}
                hourStep={timeConfig.hourStep}
                minuteStep={timeConfig.minuteStep}
                secondStep={timeConfig.secondStep}
                disabled={disabled}
                classes={{
                  root: classes?.timePicker,
                  stepper: classes?.timeStepper,
                  stepperButton: classes?.timeStepperButton,
                  stepperInput: classes?.timeStepperInput,
                  separator: classes?.timeSeparator,
                }}
              />
            );
          })()}
        </>
      ) : panel === "years" ? (
        <div className="dvx-pdp__panel">
          <div className="dvx-pdp__panelGrid">
            {Array.from({ length: 12 }).map((_, i) => {
              const jy = yearPageStart + i;
              const enabled = rangeIntersectsPickerLimits(
                getRangeForJalaliYear(jy)
              );
              const isActive = jy === viewMonth.jy;
              return (
                <button
                  key={jy}
                  type="button"
                  className={cx(
                    "dvx-pdp__cell",
                    isActive && "dvx-pdp__cell--active"
                  )}
                  disabled={!enabled}
                  onClick={() => selectYear(jy)}
                >
                  {jy}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="dvx-pdp__panel">
          <div className="dvx-pdp__panelGrid">
            {Array.from({ length: 12 }).map((_, i) => {
              const jm = i + 1;
              const enabled = rangeIntersectsPickerLimits(
                getRangeForJalaliMonth(pendingYear, jm)
              );
              const isActive =
                pendingYear === viewMonth.jy && jm === viewMonth.jm;
              const monthText =
                monthLabels && monthLabels.length === 12
                  ? monthLabels[jm - 1] ?? String(jm)
                  : String(jm);
              return (
                <button
                  key={jm}
                  type="button"
                  className={cx(
                    "dvx-pdp__cell",
                    isActive && "dvx-pdp__cell--active"
                  )}
                  disabled={!enabled}
                  onClick={() => selectMonth(jm)}
                >
                  {monthText}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div
      ref={rootRef}
      className={cx(
        "dvx-pdp",
        themeClass,
        mode === "inline" && "dvx-pdp--inline",
        className,
        classes?.root
      )}
      dir="rtl"
    >
      {mode === "inline" ? null : (
        <div className="dvx-pdp__control">
          <input
            ref={inputRef}
            className={cx("dvx-pdp__input", classes?.input)}
            disabled={disabled}
            readOnly={multiple}
            placeholder={placeholder}
            inputMode={multiple ? undefined : "numeric"}
            autoComplete="off"
            value={text}
            onChange={(e) => {
              if (!multiple) setText(e.target.value);
            }}
            onClick={() => {
              if (!open) openCalendar();
            }}
            onFocus={() => {
              if (!multiple) isEditingRef.current = true;
            }}
            onBlur={() => {
              if (!multiple) {
              isEditingRef.current = false;
              commitFromText(text);
              }
            }}
            onKeyDown={onInputKeyDown}
            aria-haspopup="dialog"
            aria-expanded={open}
          />
          {showCalendarButton && (
          <button
            type="button"
            className={cx("dvx-pdp__button", classes?.button)}
            onClick={() => (open ? setOpen(false) : openCalendar())}
            disabled={disabled}
            aria-label="Open calendar"
          >
              {calendarIcon || (
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path
                fill="currentColor"
                d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1.5A2.5 2.5 0 0 1 22 6.5v13A2.5 2.5 0 0 1 19.5 22h-15A2.5 2.5 0 0 1 2 19.5v-13A2.5 2.5 0 0 1 4.5 4H6V3a1 1 0 0 1 1-1Zm0 6H4v11.5c0 .276.224.5.5.5h15c.276 0 .5-.224.5-.5V8H7Zm-2.5-2c-.276 0-.5.224-.5.5V6h16v.5c0-.276-.224-.5-.5-.5H4.5Z"
              />
            </svg>
              )}
          </button>
          )}
        </div>
      )}

      {mode === "inline" ? (
        calendarUi
      ) : open ? (
        usePortal && mounted ? (
          createPortal(
            <div
              ref={popoverRef}
              className={cx(
                "dvx-pdp",
                "dvx-pdp__popover",
                "dvx-pdp__popover--portal",
                themeClass,
                classes?.popover
              )}
              dir="rtl"
              style={{ ...popoverStyle, right: "auto", bottom: "auto" }}
              role="dialog"
              aria-modal="false"
            >
              {calendarUi}
            </div>,
            document.body
          )
        ) : (
          <div
            ref={popoverRef}
            className={cx("dvx-pdp__popover", classes?.popover)}
            style={{ ...popoverStyle, right: "auto", bottom: "auto" }}
            role="dialog"
            aria-modal="false"
          >
            {calendarUi}
          </div>
        )
      ) : null}
    </div>
  );
}
