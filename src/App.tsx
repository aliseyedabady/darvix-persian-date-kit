import { useEffect, useMemo, useState } from "react";
import { PersianDatePicker } from "./components/PersianDatePicker";
import { PersianDateRangePicker } from "./components/PersianDateRangePicker";
import "./styles/base.css";
import "./demo.css";

const persianMonthLabels = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];

function App() {
  const [theme, setTheme] = useState<"light" | "dark" | "auto">("light");
  const [value, setValue] = useState<Date | null>(new Date());
  const [inlineValue, setInlineValue] = useState<Date | null>(new Date());
  const [rangeValue, setRangeValue] = useState<{
    start: Date | null;
    end: Date | null;
  }>({ start: null, end: null });
  const [modalOpen, setModalOpen] = useState(false);
  const [modalValue, setModalValue] = useState<Date | null>(new Date());
  const [modalRange, setModalRange] = useState<{
    start: Date | null;
    end: Date | null;
  }>({ start: null, end: null });

  const minDate = useMemo(() => new Date(2020, 0, 1), []);
  const maxDate = useMemo(() => new Date(2030, 11, 31), []);
  const [edgeValue, setEdgeValue] = useState<Date | null>(new Date());
  const [edgeValueNoPortal, setEdgeValueNoPortal] = useState<Date | null>(
    new Date()
  );
  const [showEdgeTest, setShowEdgeTest] = useState(false);
  const [timeValue, setTimeValue] = useState<Date | null>(new Date());
  const [timeValueWithSeconds, setTimeValueWithSeconds] = useState<Date | null>(new Date());
  const [timeValueCustom, setTimeValueCustom] = useState<Date | null>(new Date());
  const [multipleDates, setMultipleDates] = useState<Date[]>([]);

  useEffect(() => {
    if (!modalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModalOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [modalOpen]);

  return (
    <div className="demo-page" dir="rtl">
      <section className="demo-hero">
        <div className="demo-header">
          <div>
            <h1 className="demo-title">persian-date-kit</h1>
            <p className="demo-subtitle">
              یک Date Picker حرفه‌ای برای ری‌اکت با نمایش جلالی و ذخیره‌سازی
              گرگوری. RTL-first، کنترل‌شده، SSR-safe و مناسب انتشار روی npm.
            </p>
          </div>
          <div className="demo-actions">
            <div className="demo-row" style={{ gap: 6 }}>
              <button
                type="button"
                className="demo-button"
                onClick={() => setTheme("light")}
              >
                Theme: Light
              </button>
              <button
                type="button"
                className="demo-button"
                onClick={() => setTheme("dark")}
              >
                Dark
              </button>
              <button
                type="button"
                className="demo-button"
                onClick={() => setTheme("auto")}
              >
                Auto
              </button>
            </div>
            <button
              type="button"
              className="demo-button demo-buttonPrimary"
              onClick={() => setShowEdgeTest((v) => !v)}
            >
              {showEdgeTest ? "بستن تست Edge" : "نمایش تست Edge"}
            </button>
            <button
              type="button"
              className="demo-button"
              onClick={() => setModalOpen(true)}
            >
              تست داخل Modal
            </button>
          </div>
        </div>

        <div className="demo-kpis">
          <div className="demo-kpi">
            <div className="demo-kpiLabel">Internal value</div>
            <div className="demo-kpiValue">Gregorian Date</div>
          </div>
          <div className="demo-kpi">
            <div className="demo-kpiLabel">Display / input</div>
            <div className="demo-kpiValue">Jalali</div>
          </div>
          <div className="demo-kpi">
            <div className="demo-kpiLabel">Modes</div>
            <div className="demo-kpiValue">Popover / Inline</div>
          </div>
          <div className="demo-kpi">
            <div className="demo-kpiLabel">Extras</div>
            <div className="demo-kpiValue">Range + RHF</div>
          </div>
        </div>
      </section>

      {/*
        React Hook Form (example):

        import { useForm } from 'react-hook-form'
        import { RHF_PersianDatePicker } from '@darvix/persian-date-kit/react-hook-form'
        import '@darvix/persian-date-kit/styles.css'

        type FormValues = { birthDate: Date | null }

        const { control, handleSubmit } = useForm<FormValues>({
          defaultValues: { birthDate: null },
        })

        <form onSubmit={handleSubmit(console.log)}>
          <RHF_PersianDatePicker
            name="birthDate"
            control={control}
            monthLabels={persianMonthLabels}
            placeholder="YYYY/MM/DD"
          />
          <button type="submit">submit</button>
        </form>
      */}

      <div className="demo-grid">
        <section className="demo-card">
          <div className="demo-cardTitle">
            <span>تاریخ تکی (Popover)</span>
            <span className="demo-muted">controlled: Date | null</span>
          </div>
          <div className="demo-row">
            <PersianDatePicker
              theme={theme}
              value={value}
              onChange={setValue}
              minDate={minDate}
              maxDate={maxDate}
              placeholder="YYYY/MM/DD"
              monthLabels={persianMonthLabels}
              weekdays={["ش", "ی", "د", "س", "چ", "پ", "ج"]}
              popover={{
                portal: true,
                padding: 8,
                gutter: 8,
                strategy: "fixed",
              }}
            />
          </div>
          <pre className="demo-code">{`Gregorian: ${
            value ? value.toISOString() : "null"
          }`}</pre>
        </section>

        <section className="demo-card">
          <div className="demo-cardTitle">
            <span>تقویم Inline</span>
            <span className="demo-muted">بدون input</span>
          </div>
          <PersianDatePicker
            mode="inline"
            theme={theme}
            value={inlineValue}
            onChange={setInlineValue}
            monthLabels={persianMonthLabels}
            weekdays={["ش", "ی", "د", "س", "چ", "پ", "ج"]}
            minDate={minDate}
            maxDate={maxDate}
          />
        </section>

        <section className="demo-card">
          <div className="demo-cardTitle">
            <span>انتخاب بازه (Range)</span>
            <span className="demo-muted">start/end</span>
          </div>
          <PersianDateRangePicker
            theme={theme}
            value={rangeValue}
            onChange={setRangeValue}
            monthLabels={persianMonthLabels}
            weekdays={["ش", "ی", "د", "س", "چ", "پ", "ج"]}
            inputVariant="single"
            placeholder="بازه (YYYY/MM/DD - YYYY/MM/DD)"
            minDate={minDate}
            maxDate={maxDate}
            popover={{ portal: true, padding: 8, gutter: 8, strategy: "fixed" }}
          />
          <pre className="demo-code">{`start: ${
            rangeValue.start ? rangeValue.start.toISOString() : "null"
          }\nend:   ${
            rangeValue.end ? rangeValue.end.toISOString() : "null"
          }`}</pre>
        </section>

        <section className="demo-card">
          <div className="demo-cardTitle">
            <span>غیرفعال</span>
            <span className="demo-muted">disabled</span>
          </div>
          <PersianDatePicker
            theme={theme}
            value={null}
            onChange={() => {}}
            disabled
            placeholder="Disabled"
            monthLabels={persianMonthLabels}
          />
        </section>

        <section className="demo-card">
          <div className="demo-cardTitle">
            <span>انتخاب چندتایی (Multiple Selection)</span>
            <span className="demo-muted">multiple dates</span>
          </div>
          <div className="demo-row">
            <PersianDatePicker
              theme={theme}
              value={multipleDates}
              onChange={setMultipleDates}
              multiple={true}
              maxSelections={5}
              placeholder="انتخاب چند تاریخ"
              monthLabels={persianMonthLabels}
              weekdays={["ش", "ی", "د", "س", "چ", "پ", "ج"]}
              popover={{
                portal: true,
                padding: 8,
                gutter: 8,
                strategy: "fixed",
              }}
            />
          </div>
          <pre className="demo-code">{`Selected: ${multipleDates.length} date(s)
${multipleDates.map(d => d.toISOString()).join('\n')}`}</pre>
        </section>

        <section className="demo-card">
          <div className="demo-cardTitle">
            <span>تاریخ + زمان (Time Picker)</span>
            <span className="demo-muted">timePicker enabled</span>
          </div>
          <div className="demo-row">
            <PersianDatePicker
              theme={theme}
              value={timeValue}
              onChange={setTimeValue}
              placeholder="YYYY/MM/DD HH:mm"
              monthLabels={persianMonthLabels}
              weekdays={["ش", "ی", "د", "س", "چ", "پ", "ج"]}
              timePicker={true}
              popover={{
                portal: true,
                padding: 8,
                gutter: 8,
                strategy: "fixed",
              }}
            />
          </div>
          <pre className="demo-code">{`Gregorian: ${
            timeValue ? timeValue.toISOString() : "null"
          }`}</pre>
        </section>

        <section className="demo-card">
          <div className="demo-cardTitle">
            <span>تاریخ + زمان (با ثانیه)</span>
            <span className="demo-muted">HH:mm:ss format</span>
          </div>
          <div className="demo-row">
            <PersianDatePicker
              theme={theme}
              value={timeValueWithSeconds}
              onChange={setTimeValueWithSeconds}
              placeholder="YYYY/MM/DD HH:mm:ss"
              monthLabels={persianMonthLabels}
              weekdays={["ش", "ی", "د", "س", "چ", "پ", "ج"]}
              timePicker={{
                enabled: true,
                format: 'HH:mm:ss',
                showSeconds: true,
              }}
              popover={{
                portal: true,
                padding: 8,
                gutter: 8,
                strategy: "fixed",
              }}
            />
          </div>
          <pre className="demo-code">{`Gregorian: ${
            timeValueWithSeconds ? timeValueWithSeconds.toISOString() : "null"
          }`}</pre>
        </section>

        <section className="demo-card">
          <div className="demo-cardTitle">
            <span>تاریخ + زمان (سفارشی)</span>
            <span className="demo-muted">custom steps & defaultTime</span>
          </div>
          <div className="demo-row">
            <PersianDatePicker
              theme={theme}
              value={timeValueCustom}
              onChange={setTimeValueCustom}
              placeholder="YYYY/MM/DD HH:mm"
              monthLabels={persianMonthLabels}
              weekdays={["ش", "ی", "د", "س", "چ", "پ", "ج"]}
              timePicker={{
                enabled: true,
                format: 'HH:mm',
                defaultTime: { hour: 12, minute: 0 },
                hourStep: 1,
                minuteStep: 5,
              }}
              popover={{
                portal: true,
                padding: 8,
                gutter: 8,
                strategy: "fixed",
              }}
            />
          </div>
          <pre className="demo-code">{`Gregorian: ${
            timeValueCustom ? timeValueCustom.toISOString() : "null"
          }`}</pre>
        </section>
      </div>

      {showEdgeTest ? (
        <section className="demo-card" style={{ marginTop: 14 }}>
          <div className="demo-cardTitle">
            <span>تست جلوگیری از بیرون‌زدگی پاپ‌اور (Edge)</span>
            <span className="demo-muted">portal + flip + clamp</span>
          </div>
          <div className="demo-edgeBox">
            <div className="demo-muted">
              این تست را فعال کن، سپس تقویم را باز کن و اسکرول/ریزایز کن تا
              رفتار clamp/flip را ببینی.
            </div>
            <PersianDatePicker
              theme={theme}
              value={edgeValue}
              onChange={setEdgeValue}
              placeholder="YYYY/MM/DD"
              monthLabels={persianMonthLabels}
              weekdays={["ش", "ی", "د", "س", "چ", "پ", "ج"]}
              popover={{
                portal: true,
                padding: 8,
                gutter: 8,
                strategy: "fixed",
                placements: ["bottom", "top", "left", "right"],
                align: "end",
              }}
            />
          </div>
        </section>
      ) : null}

      {showEdgeTest ? (
        <div className="demo-edgeStage" aria-hidden="false">
          <div className="demo-edgeStageCard">
            <div className="demo-cardTitle" style={{ marginBottom: 8 }}>
              <span>گوشه پایین راست</span>
              <span className="demo-muted">portal: true</span>
            </div>
            <PersianDatePicker
              theme={theme}
              value={edgeValue}
              onChange={setEdgeValue}
              placeholder="YYYY/MM/DD"
              monthLabels={persianMonthLabels}
              weekdays={["ش", "ی", "د", "س", "چ", "پ", "ج"]}
              popover={{
                portal: true,
                padding: 8,
                gutter: 8,
                strategy: "fixed",
                placements: ["bottom", "top", "left", "right"],
                align: "end",
              }}
            />
          </div>

          <div className="demo-edgeStageCard">
            <div className="demo-cardTitle" style={{ marginBottom: 8 }}>
              <span>گوشه پایین چپ</span>
              <span className="demo-muted">portal: false</span>
            </div>
            <PersianDatePicker
              theme={theme}
              value={edgeValueNoPortal}
              onChange={setEdgeValueNoPortal}
              placeholder="YYYY/MM/DD"
              monthLabels={persianMonthLabels}
              weekdays={["ش", "ی", "د", "س", "چ", "پ", "ج"]}
              popover={{
                portal: false,
                padding: 8,
                gutter: 8,
                strategy: "fixed",
                placements: ["bottom", "top", "left", "right"],
                align: "end",
              }}
            />
          </div>
        </div>
      ) : null}

      {modalOpen ? (
        <div
          className="demo-modalOverlay"
          role="dialog"
          aria-modal="true"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="demo-modal"
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="demo-modalHeader">
              <div>
                <div style={{ fontWeight: 800 }}>نمونه استفاده داخل Modal</div>
                <div className="demo-muted" style={{ marginTop: 2 }}>
                  برای جلوگیری از clipping داخل کانتینرهای overflow، پیشنهاد:
                  <code> portal: true </code>
                </div>
              </div>
              <button
                type="button"
                className="demo-modalClose"
                onClick={() => setModalOpen(false)}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            <div className="demo-modalBody">
              <div
                className="demo-row"
                style={{ justifyContent: "space-between" }}
              >
                <div style={{ display: "grid", gap: 8 }}>
                  <div className="demo-muted">Single</div>
                  <PersianDatePicker
                    theme={theme}
                    value={modalValue}
                    onChange={setModalValue}
                    placeholder="YYYY/MM/DD"
                    monthLabels={persianMonthLabels}
                    weekdays={["ش", "ی", "د", "س", "چ", "پ", "ج"]}
                    popover={{
                      portal: true,
                      padding: 8,
                      gutter: 8,
                      strategy: "fixed",
                      placements: ["bottom", "top", "left", "right"],
                      align: "end",
                    }}
                  />
                </div>

                <div style={{ display: "grid", gap: 8 }}>
                  <div className="demo-muted">Range</div>
                  <PersianDateRangePicker
                    theme={theme}
                    value={modalRange}
                    onChange={setModalRange}
                    placeholder="بازه (YYYY/MM/DD - YYYY/MM/DD)"
                    inputVariant="single"
                    monthLabels={persianMonthLabels}
                    weekdays={["ش", "ی", "د", "س", "چ", "پ", "ج"]}
                    popover={{
                      portal: true,
                      padding: 8,
                      gutter: 8,
                      strategy: "fixed",
                      placements: ["bottom", "top", "left", "right"],
                      align: "end",
                    }}
                  />
                </div>
              </div>

              <pre className="demo-code">{`single: ${
                modalValue ? modalValue.toISOString() : "null"
              }\nrange:  ${
                modalRange.start ? modalRange.start.toISOString() : "null"
              } - ${
                modalRange.end ? modalRange.end.toISOString() : "null"
              }`}</pre>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default App;
