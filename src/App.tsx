import { useMemo, useState } from "react";
import { PersianDatePicker } from "./components/PersianDatePicker";
import { PersianDateRangePicker } from "./components/PersianDateRangePicker";
import "./styles/base.css";

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

  return (
    <div style={{ padding: 24, maxWidth: 520, margin: "0 auto" }} dir="rtl">
      <h2 style={{ marginBottom: 12 }}>PersianDatePicker demo</h2>

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

      <div style={{ marginBottom: 10, opacity: 0.9 }}>نمونهٔ ساده</div>
      <PersianDatePicker
        value={value}
        onChange={setValue}
        minDate={minDate}
        maxDate={maxDate}
        placeholder="YYYY/MM/DD"
        monthLabels={persianMonthLabels}
      />

      <div
        style={{
          marginTop: 16,
          fontFamily: "monospace",
          fontSize: 13,
          opacity: 0.9,
        }}
      >
        <div>Gregorian value:</div>
        <div>{value ? value.toISOString() : "null"}</div>
      </div>

      <div style={{ marginTop: 24 }}>
        <div style={{ marginBottom: 10, opacity: 0.9 }}>
          تقویم Inline (بدون input)
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
      </div>

      <div style={{ marginTop: 24 }}>
        <div style={{ marginBottom: 10, opacity: 0.9 }}>
          انتخاب بازه (Range)
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
        />
        <div
          style={{
            marginTop: 8,
            fontFamily: "monospace",
            fontSize: 13,
            opacity: 0.9,
          }}
        >
          <div>
            start: {rangeValue.start ? rangeValue.start.toISOString() : "null"}
          </div>
          <div>
            end: {rangeValue.end ? rangeValue.end.toISOString() : "null"}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <div style={{ marginBottom: 10, opacity: 0.9 }}>
          تست جلوگیری از بیرون‌زدگی پاپ‌اور (Edge)
        </div>
        <div
          style={{
            position: "fixed",
            right: 8,
            bottom: 8,
            width: 260,
            padding: 8,
            border: "1px dashed #999",
            background: "rgba(255,255,255,0.85)",
          }}
        >
          <div style={{ marginBottom: 8, fontSize: 12, opacity: 0.8 }}>
            این باکس نزدیک گوشه‌ی صفحه است.
          </div>
          <PersianDatePicker
            value={edgeValue}
            onChange={setEdgeValue}
            placeholder="YYYY/MM/DD"
            monthLabels={persianMonthLabels}
            weekdays={["ش", "ی", "د", "س", "چ", "پ", "ج"]}
            popover={{ portal: true, padding: 8, gutter: 8, strategy: "fixed" }}
          />
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <div style={{ marginBottom: 10, opacity: 0.9 }}>غیرفعال</div>
        <PersianDatePicker
          value={null}
          onChange={() => {}}
          disabled
          placeholder="Disabled"
          monthLabels={persianMonthLabels}
        />
      </div>
    </div>
  );
}

export default App;
