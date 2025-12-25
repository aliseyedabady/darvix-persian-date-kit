import { useMemo, useState } from "react";
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
  const [value, setValue] = useState<Date | null>(new Date());
  const [inlineValue, setInlineValue] = useState<Date | null>(new Date());
  const [rangeValue, setRangeValue] = useState<{
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
            <button
              type="button"
              className="demo-button demo-buttonPrimary"
              onClick={() => setShowEdgeTest((v) => !v)}
            >
              {showEdgeTest ? "بستن تست Edge" : "نمایش تست Edge"}
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
            value={null}
            onChange={() => {}}
            disabled
            placeholder="Disabled"
            monthLabels={persianMonthLabels}
          />
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
    </div>
  );
}

export default App;
