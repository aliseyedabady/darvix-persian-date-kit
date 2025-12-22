import * as React from "react";
import { createPortal } from "react-dom";
import { toJalali } from "../utils/toJalali";
import { parseJalaliText } from "../utils/toGregorian";
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

export type PersianDatePickerClasses = Partial<{
  root: string;
  input: string;
  button: string;
  popover: string;
  header: string;
  navButton: string;
  monthLabel: string;
  grid: string;
  weekday: string;
  day: string;
  dayOutside: string;
  daySelected: string;
  dayDisabled: string;
  dayToday: string;
}>;

export type PersianDatePickerProps = {
  value: Date | null;
  onChange: (date: Date | null) => void;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  placeholder?: string;
  /**
   * Control the open state of the calendar popover.
   * If provided, the component becomes controlled for open/close.
   */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /**
   * Rendering mode:
   * - `popover`: default input + popover calendar
   * - `inline`: always-visible calendar, no input
   */
  mode?: "popover" | "inline";

  popover?: {
    portal?: boolean;
    gutter?: number;
    padding?: number;
    strategy?: "fixed" | "absolute";
    placements?: Array<"bottom" | "top" | "left" | "right">;
    align?: "start" | "center" | "end";
  };

  /**
   * Formats the controlled `value` for display in the input.
   * Default: numeric Jalali `YYYY/MM/DD` (no locale month/day names).
   */
  formatValue?: (date: Date) => string;

  /**
   * Parses user input into a Gregorian Date.
   * Default: parses numeric Jalali `YYYY/MM/DD` (also accepts loose separators).
   */
  parseValue?: (text: string) => Date | null;

  /**
   * Weekday headers. If omitted, numeric headers are used.
   * Provide 7 items matching the calendar grid order.
   */
  weekdays?: string[];

  /**
   * Month labels (index 0 => month 1). If omitted, month numbers are shown.
   * Provide 12 items.
   */
  monthLabels?: string[];

  /**
   * Month label renderer (e.g. supply localized month name).
   * Default: `jy / jm` numeric.
   */
  renderMonthLabel?: (jy: number, jm: number) => React.ReactNode;

  className?: string;
  classes?: PersianDatePickerClasses;
};

function cx(...parts: Array<string | undefined | false>) {
  return parts.filter(Boolean).join(" ");
}

function defaultFormatValue(date: Date) {
  return toJalali(date).formatted;
}

function defaultParseValue(text: string) {
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
    popover,
    formatValue = defaultFormatValue,
    parseValue = defaultParseValue,
    weekdays,
    monthLabels,
    renderMonthLabel,
    className,
    classes,
  } = props;

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

  const [viewMonth, setViewMonth] = React.useState(() =>
    getInitialViewMonth(value)
  );
  const [focusedDate, setFocusedDate] = React.useState<Date>(() => {
    const base = value ?? getToday();
    return base;
  });
  const [text, setText] = React.useState<string>(() =>
    value ? formatValue(value) : ""
  );
  const [panel, setPanel] = React.useState<"days" | "years" | "months">("days");
  const [yearPageStart, setYearPageStart] = React.useState(() => {
    const jy = getInitialViewMonth(value).jy;
    return jy - (jy % 12);
  });
  const [pendingYear, setPendingYear] = React.useState<number>(
    () => getInitialViewMonth(value).jy
  );

  // Keep input text in sync with controlled value (unless the user is actively editing).
  React.useEffect(() => {
    if (isEditingRef.current) return;
    setText(value ? formatValue(value) : "");
    setViewMonth(getInitialViewMonth(value));
    setFocusedDate(value ?? getToday());
    const jy = getInitialViewMonth(value).jy;
    setPendingYear(jy);
    setYearPageStart(jy - (jy % 12));
  }, [value, formatValue]);

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
    mode === "popover" && open && usePortal,
    inputRef,
    popoverRef,
    {
      gutter: popoverOpts.gutter,
      padding: popoverOpts.padding,
      strategy: popoverOpts.strategy,
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

  const selected = value ?? null;
  const today = React.useMemo(() => getToday(), []);

  function setViewByAnchor(anchor: Date) {
    const p = toJalaliParts(anchor);
    setViewMonth({ jy: p.jy, jm: p.jm });
  }

  function openCalendar() {
    if (disabled) return;
    setOpen(true);
    const anchor = selected ?? focusedDate ?? today;
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
    const trimmed = nextText.trim();
    if (!trimmed) {
      onChange(null);
      return;
    }

    const parsed = parseValue(trimmed);
    if (!parsed) {
      // Invalid: revert to controlled value on blur.
      setText(selected ? formatValue(selected) : trimmed);
      return;
    }

    const next = normalizeInputValue(parsed, minDate, maxDate);
    if (!next) {
      setText(selected ? formatValue(selected) : trimmed);
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
    if (e.key === "Enter") {
      e.preventDefault();
      if (!isWithinRange(focusedDate, minDate, maxDate)) return;
      onChange(focusedDate);
      setText(formatValue(focusedDate));
      closeCalendar();
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
    onChange(cell.gregorian);
    setText(formatValue(cell.gregorian));
    setFocusedDate(cell.gregorian);
    setOpen(false);
    inputRef.current?.focus();
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
          ‹
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
          ›
        </button>
      </div>

      {panel === "days" ? (
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
                  const isSelected = selected
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
            placeholder={placeholder}
            inputMode="numeric"
            autoComplete="off"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onClick={() => {
              if (!open) openCalendar();
            }}
            onFocus={() => {
              isEditingRef.current = true;
            }}
            onBlur={() => {
              isEditingRef.current = false;
              commitFromText(text);
            }}
            onKeyDown={onInputKeyDown}
            aria-haspopup="dialog"
            aria-expanded={open}
          />
          <button
            type="button"
            className={cx("dvx-pdp__button", classes?.button)}
            onClick={() => (open ? setOpen(false) : openCalendar())}
            disabled={disabled}
            aria-label="Open calendar"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path
                fill="currentColor"
                d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1.5A2.5 2.5 0 0 1 22 6.5v13A2.5 2.5 0 0 1 19.5 22h-15A2.5 2.5 0 0 1 2 19.5v-13A2.5 2.5 0 0 1 4.5 4H6V3a1 1 0 0 1 1-1Zm0 6H4v11.5c0 .276.224.5.5.5h15c.276 0 .5-.224.5-.5V8H7Zm-2.5-2c-.276 0-.5.224-.5.5V6h16v.5c0-.276-.224-.5-.5-.5H4.5Z"
              />
            </svg>
          </button>
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
                "dvx-pdp__popover",
                "dvx-pdp__popover--portal",
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
