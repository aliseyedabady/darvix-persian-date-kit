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

export type PersianDateRange = {
  start: Date | null;
  end: Date | null;
};

export type PersianDateRangePickerClasses = Partial<{
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
  dayDisabled: string;
  dayToday: string;
  dayRangeStart: string;
  dayRangeEnd: string;
  dayInRange: string;
}>;

export type PersianDateRangePickerProps = {
  value: PersianDateRange;
  onChange: (range: PersianDateRange) => void;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;

  /**
   * Input layout:
   * - `two`: (default) two inputs (start/end)
   * - `single`: one input showing the range as text (e.g. `start - end`)
   */
  inputVariant?: "two" | "single";
  placeholder?: string;
  rangeSeparator?: string;

  placeholderStart?: string;
  placeholderEnd?: string;

  /**
   * Control the open state of the calendar popover (popover mode only).
   */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;

  /**
   * Rendering mode:
   * - `popover`: (default) two inputs + popover calendar
   * - `inline`: always-visible calendar, no inputs
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
   * Formats a Date for display in inputs.
   * Default: numeric Jalali `YYYY/MM/DD` (no locale month/day names).
   */
  formatValue?: (date: Date) => string;

  /**
   * Parses user text into a Gregorian Date.
   * Default: parses numeric Jalali `YYYY/MM/DD` (also accepts loose separators).
   */
  parseValue?: (text: string) => Date | null;

  weekdays?: string[];
  monthLabels?: string[];
  renderMonthLabel?: (jy: number, jm: number) => React.ReactNode;

  className?: string;
  classes?: PersianDateRangePickerClasses;
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

function getToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function normalizeRange(range: PersianDateRange): PersianDateRange {
  const { start, end } = range;
  if (start && end && compareDays(start, end) > 0) {
    return { start: end, end: start };
  }
  return range;
}

function isBetweenInclusive(d: Date, a: Date, b: Date) {
  const min = compareDays(a, b) <= 0 ? a : b;
  const max = compareDays(a, b) <= 0 ? b : a;
  return compareDays(d, min) >= 0 && compareDays(d, max) <= 0;
}

export function PersianDateRangePicker(props: PersianDateRangePickerProps) {
  const {
    value,
    onChange,
    minDate,
    maxDate,
    disabled,
    inputVariant = "two",
    placeholder,
    rangeSeparator = " - ",
    placeholderStart,
    placeholderEnd,
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
  const inputRangeRef = React.useRef<HTMLInputElement | null>(null);
  const inputStartRef = React.useRef<HTMLInputElement | null>(null);
  const inputEndRef = React.useRef<HTMLInputElement | null>(null);
  const calendarRef = React.useRef<HTMLDivElement | null>(null);
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

  const [activeField, setActiveField] = React.useState<"start" | "end">(
    "start"
  );
  const [panel, setPanel] = React.useState<"days" | "years" | "months">("days");
  const [yearPageStart, setYearPageStart] = React.useState(() => {
    const base = value.start ?? value.end ?? getToday();
    const jy = toJalaliParts(base).jy;
    return jy - (jy % 12);
  });
  const [pendingYear, setPendingYear] = React.useState<number>(() => {
    const base = value.start ?? value.end ?? getToday();
    return toJalaliParts(base).jy;
  });

  const [viewMonth, setViewMonth] = React.useState(() => {
    const base = value.start ?? value.end ?? getToday();
    const p = toJalaliParts(base);
    return { jy: p.jy, jm: p.jm };
  });
  const [focusedDate, setFocusedDate] = React.useState<Date>(
    () => value.start ?? value.end ?? getToday()
  );
  const [hoverDate, setHoverDate] = React.useState<Date | null>(null);

  const [textStart, setTextStart] = React.useState<string>(() =>
    value.start ? formatValue(value.start) : ""
  );
  const [textEnd, setTextEnd] = React.useState<string>(() =>
    value.end ? formatValue(value.end) : ""
  );
  const [textRange, setTextRange] = React.useState<string>(() => {
    const s = value.start ? formatValue(value.start) : "";
    const e = value.end ? formatValue(value.end) : "";
    if (!s && !e) return "";
    if (s && !e) return `${s}${rangeSeparator}`;
    return `${s}${rangeSeparator}${e}`;
  });

  // Sync texts from controlled value
  React.useEffect(() => {
    setTextStart(value.start ? formatValue(value.start) : "");
    setTextEnd(value.end ? formatValue(value.end) : "");
    const s = value.start ? formatValue(value.start) : "";
    const e = value.end ? formatValue(value.end) : "";
    if (!s && !e) setTextRange("");
    else if (s && !e) setTextRange(`${s}${rangeSeparator}`);
    else setTextRange(`${s}${rangeSeparator}${e}`);
    const base = value.start ?? value.end ?? getToday();
    const p = toJalaliParts(base);
    setViewMonth({ jy: p.jy, jm: p.jm });
    setFocusedDate(base);
    setPendingYear(p.jy);
    setYearPageStart(p.jy - (p.jy % 12));
  }, [formatValue, rangeSeparator, value.end, value.start]);

  // Close on outside click (popover only).
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
      )
        setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [mode, open, setOpen]);

  React.useEffect(() => {
    if (!open) return;
    calendarRef.current?.focus();
  }, [open]);

  const popoverOpts = popover ?? {};
  const usePortal = popoverOpts.portal ?? true;
  const popoverAnchorRef =
    inputVariant === "single"
      ? inputRangeRef
      : activeField === "start"
      ? inputStartRef
      : inputEndRef;
  const { style: popoverStyle } = usePopoverPosition(
    mode === "popover" && open && usePortal,
    popoverAnchorRef,
    popoverRef,
    {
      gutter: popoverOpts.gutter,
      padding: popoverOpts.padding,
      strategy: popoverOpts.strategy,
      placements: popoverOpts.placements,
      align: popoverOpts.align ?? "end",
    }
  );

  React.useEffect(() => {
    if (!open) return;
    const p = toJalaliParts(focusedDate);
    setViewMonth((m) =>
      m.jy === p.jy && m.jm === p.jm ? m : { jy: p.jy, jm: p.jm }
    );
  }, [focusedDate, open]);

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
    return ["1", "2", "3", "4", "5", "6", "7"];
  }, [weekdays]);

  const grid = React.useMemo(
    () => buildJalaliMonthGrid({ jy: viewMonth.jy, jm: viewMonth.jm }),
    [viewMonth.jm, viewMonth.jy]
  );

  function openCalendar(field: "start" | "end") {
    if (disabled) return;
    setActiveField(field);
    setOpen(true);
    const anchor =
      (field === "start" ? value.start : value.end) ??
      value.start ??
      value.end ??
      getToday();
    const p = toJalaliParts(anchor);
    setViewMonth({ jy: p.jy, jm: p.jm });
    setFocusedDate(anchor);
    setPanel("days");
    setPendingYear(p.jy);
    setYearPageStart(p.jy - (p.jy % 12));
  }

  function closeCalendar() {
    setOpen(false);
    setPanel("days");
    if (mode === "popover") {
      if (inputVariant === "single") inputRangeRef.current?.focus();
      else
        (activeField === "start"
          ? inputStartRef
          : inputEndRef
        ).current?.focus();
    }
  }

  function isCellDisabled(cell: CalendarDayCell) {
    if (disabled) return true;
    return !isWithinRange(cell.gregorian, minDate, maxDate);
  }

  function commitFieldText(field: "start" | "end", raw: string) {
    const text = raw.trim();
    if (!text) {
      const next = normalizeRange({ ...value, [field]: null });
      onChange(next);
      return;
    }
    const parsed = parseValue(text);
    if (!parsed) return;
    if (!isWithinRange(parsed, minDate, maxDate)) return;

    const next = normalizeRange({ ...value, [field]: parsed });
    onChange(next);
  }

  function commitRangeText(raw: string) {
    const text = raw.trim();
    if (!text) {
      onChange({ start: null, end: null });
      return;
    }

    // Extract up to two date-like tokens and parse them using the provided parseValue.
    const tokens = text.match(/\d{4}[^\d]\d{1,2}[^\d]\d{1,2}/g) ?? [];
    const startToken = tokens[0];
    const endToken = tokens[1];
    if (!startToken) return;

    const start = parseValue(startToken);
    const end = endToken ? parseValue(endToken) : null;
    if (!start) return;
    if (!isWithinRange(start, minDate, maxDate)) return;
    if (end && !isWithinRange(end, minDate, maxDate)) return;

    onChange(normalizeRange({ start, end }));
  }

  function onCalendarKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (!open) return;
    if (disabled) return;
    if (e.key === "Escape") {
      e.preventDefault();
      closeCalendar();
      return;
    }
    if (panel !== "days") return;

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
      selectDate(focusedDate);
    }
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
    setFocusedDate((curr) => addJalaliMonths(curr, delta));
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
    setFocusedDate(() =>
      fromJalaliParts({ jy: nextView.jy, jm: nextView.jm, jd: 1 })
    );
    setPanel("days");
  }

  function selectDate(date: Date) {
    if (!isWithinRange(date, minDate, maxDate)) return;

    const start = value.start;
    const end = value.end;

    if (!start || (start && end)) {
      onChange({ start: date, end: null });
      setActiveField("end");
      return;
    }

    // start exists and end is null: finalize range
    const next = normalizeRange({ start, end: date });
    onChange(next);

    if (mode === "popover") closeCalendar();
  }

  const previewEnd = value.end ?? hoverDate;
  const showPreview = Boolean(value.start && !value.end && hoverDate);

  function cellClass(cell: CalendarDayCell) {
    const base = cx(
      "dvx-pdp__day",
      classes?.day,
      !cell.inCurrentMonth && cx("dvx-pdp__day--outside", classes?.dayOutside),
      isCellDisabled(cell) &&
        cx("dvx-pdp__day--disabled", classes?.dayDisabled),
      isSameDay(cell.gregorian, getToday()) &&
        cx("dvx-pdp__day--today", classes?.dayToday)
    );

    const start = value.start;
    const endOrPreview = start ? previewEnd : null;
    if (start && isSameDay(cell.gregorian, start)) {
      return cx(base, "dvx-pdp__day--rangeStart", classes?.dayRangeStart);
    }
    if (endOrPreview && value.end && isSameDay(cell.gregorian, value.end)) {
      return cx(base, "dvx-pdp__day--rangeEnd", classes?.dayRangeEnd);
    }
    if (
      start &&
      endOrPreview &&
      (value.end || showPreview) &&
      isBetweenInclusive(cell.gregorian, start, endOrPreview)
    ) {
      return cx(base, "dvx-pdp__day--inRange", classes?.dayInRange);
    }
    return base;
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
              ? () => navigateMonth(-1)
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
              ? () => navigateMonth(1)
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
                  const isFocused = isSameDay(cell.gregorian, focusedDate);
                  return (
                    <button
                      key={`${cell.jalali.jy}-${cell.jalali.jm}-${cell.jalali.jd}`}
                      type="button"
                      className={cx(
                        cellClass(cell),
                        isFocused && "dvx-pdp__day--focused"
                      )}
                      disabled={cellDisabled}
                      onClick={() => selectDate(cell.gregorian)}
                      onMouseEnter={() => {
                        // Avoid month switching on hover of leading/trailing days.
                        if (!cell.inCurrentMonth) return;
                        setFocusedDate(cell.gregorian);
                        if (value.start && !value.end)
                          setHoverDate(cell.gregorian);
                      }}
                      onMouseLeave={() => setHoverDate(null)}
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
          {inputVariant === "single" ? (
            <input
              ref={inputRangeRef}
              className={cx("dvx-pdp__input", classes?.input)}
              disabled={disabled}
              placeholder={placeholder}
              inputMode="numeric"
              autoComplete="off"
              value={textRange}
              onChange={(e) => setTextRange(e.target.value)}
              onClick={() => openCalendar(activeField)}
              onBlur={() => commitRangeText(textRange)}
              aria-haspopup="dialog"
              aria-expanded={open}
            />
          ) : (
            <>
              <input
                ref={inputStartRef}
                className={cx("dvx-pdp__input", classes?.input)}
                disabled={disabled}
                placeholder={placeholderStart}
                inputMode="numeric"
                autoComplete="off"
                value={textStart}
                onChange={(e) => setTextStart(e.target.value)}
                onClick={() => openCalendar("start")}
                onBlur={() => commitFieldText("start", textStart)}
                aria-haspopup="dialog"
                aria-expanded={open}
              />
              <input
                ref={inputEndRef}
                className={cx("dvx-pdp__input", classes?.input)}
                disabled={disabled}
                placeholder={placeholderEnd}
                inputMode="numeric"
                autoComplete="off"
                value={textEnd}
                onChange={(e) => setTextEnd(e.target.value)}
                onClick={() => openCalendar("end")}
                onBlur={() => commitFieldText("end", textEnd)}
                aria-haspopup="dialog"
                aria-expanded={open}
              />
            </>
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
