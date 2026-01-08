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

type DemoSection = {
  id: string;
  title: string;
  description: string;
  props?: Array<{ name: string; type: string; default?: string; description: string }>;
  example?: string;
};

const demoSections: DemoSection[] = [
  {
    id: "single",
    title: "تاریخ تکی (Popover)",
    description: "انتخاب یک تاریخ با حالت popover و input",
    props: [
      { name: "value", type: "Date | null", description: "مقدار کنترل شده (Gregorian)" },
      { name: "onChange", type: "(date: Date | null) => void", description: "تابع تغییر مقدار" },
      { name: "placeholder", type: "string", default: "undefined", description: "متن placeholder" },
      { name: "minDate", type: "Date", default: "undefined", description: "حداقل تاریخ قابل انتخاب" },
      { name: "maxDate", type: "Date", default: "undefined", description: "حداکثر تاریخ قابل انتخاب" },
    ],
  },
  {
    id: "inline",
    title: "تقویم Inline",
    description: "نمایش تقویم بدون input، همیشه باز",
    props: [
      { name: "mode", type: "'inline'", description: "حالت نمایش inline" },
      { name: "value", type: "Date | null", description: "مقدار کنترل شده" },
      { name: "onChange", type: "(date: Date | null) => void", description: "تابع تغییر مقدار" },
    ],
  },
  {
    id: "range",
    title: "انتخاب بازه (Range)",
    description: "انتخاب بازه تاریخ با start و end",
    props: [
      { name: "value", type: "{ start: Date | null; end: Date | null }", description: "بازه انتخاب شده" },
      { name: "onChange", type: "(range: { start: Date | null; end: Date | null }) => void", description: "تابع تغییر بازه" },
      { name: "inputVariant", type: "'two' | 'single'", default: "'two'", description: "نوع input: دو فیلد یا یک فیلد" },
    ],
  },
  {
    id: "multiple",
    title: "انتخاب چندتایی",
    description: "انتخاب چند تاریخ به صورت همزمان",
    props: [
      { name: "multiple", type: "boolean", default: "false", description: "فعال‌سازی انتخاب چندتایی" },
      { name: "value", type: "Date[]", description: "آرایه تاریخ‌های انتخاب شده" },
      { name: "onChange", type: "(dates: Date[]) => void", description: "تابع تغییر تاریخ‌ها" },
      { name: "maxSelections", type: "number", default: "undefined", description: "حداکثر تعداد انتخاب" },
    ],
  },
  {
    id: "time",
    title: "تاریخ + زمان",
    description: "انتخاب تاریخ و زمان با Time Picker",
    props: [
      { name: "timePicker", type: "TimePickerConfig | boolean", default: "undefined", description: "تنظیمات Time Picker" },
      { name: "timePicker.enabled", type: "boolean", description: "فعال‌سازی Time Picker" },
      { name: "timePicker.format", type: "'HH:mm' | 'HH:mm:ss'", default: "'HH:mm'", description: "فرمت زمان" },
      { name: "timePicker.defaultTime", type: "{ hour: number; minute: number; second?: number }", description: "زمان پیش‌فرض" },
    ],
  },
  {
    id: "disabled",
    title: "غیرفعال",
    description: "حالت غیرفعال کامپوننت",
    props: [
      { name: "disabled", type: "boolean", default: "false", description: "غیرفعال کردن کامپوننت" },
    ],
  },
];

function App() {
  const [theme, setTheme] = useState<"light" | "dark" | "auto">("light");
  const [activeSection, setActiveSection] = useState<string>("single");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
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

  const activeSectionData = demoSections.find(s => s.id === activeSection);

  // Wrapper functions to handle type compatibility
  const handleSingleChange = (date: Date | null | Date[]) => {
    if (Array.isArray(date)) {
      setValue(date[0] || null);
    } else {
      setValue(date);
    }
  };

  const handleInlineChange = (date: Date | null | Date[]) => {
    if (Array.isArray(date)) {
      setInlineValue(date[0] || null);
    } else {
      setInlineValue(date);
    }
  };

  const handleTimeChange = (date: Date | null | Date[]) => {
    if (Array.isArray(date)) {
      setTimeValue(date[0] || null);
    } else {
      setTimeValue(date);
    }
  };

  const handleTimeWithSecondsChange = (date: Date | null | Date[]) => {
    if (Array.isArray(date)) {
      setTimeValueWithSeconds(date[0] || null);
    } else {
      setTimeValueWithSeconds(date);
    }
  };

  const handleTimeCustomChange = (date: Date | null | Date[]) => {
    if (Array.isArray(date)) {
      setTimeValueCustom(date[0] || null);
    } else {
      setTimeValueCustom(date);
    }
  };

  const handleMultipleChange = (date: Date | null | Date[]) => {
    if (Array.isArray(date)) {
      setMultipleDates(date);
    } else if (date) {
      setMultipleDates([date]);
    } else {
      setMultipleDates([]);
    }
  };

  const handleEdgeChange = (date: Date | null | Date[]) => {
    if (Array.isArray(date)) {
      setEdgeValue(date[0] || null);
    } else {
      setEdgeValue(date);
    }
  };

  const handleEdgeNoPortalChange = (date: Date | null | Date[]) => {
    if (Array.isArray(date)) {
      setEdgeValueNoPortal(date[0] || null);
    } else {
      setEdgeValueNoPortal(date);
    }
  };

  const handleModalChange = (date: Date | null | Date[]) => {
    if (Array.isArray(date)) {
      setModalValue(date[0] || null);
    } else {
      setModalValue(date);
    }
  };

  return (
    <div className="demo-page" dir="rtl">
      {/* Sidebar */}
      <aside className={`demo-sidebar ${sidebarOpen ? 'demo-sidebar--open' : ''}`}>
        <div className="demo-sidebar-header">
          <h2 className="demo-sidebar-title">مستندات</h2>
          <button
            className="demo-sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? '←' : '→'}
          </button>
        </div>
        
        {sidebarOpen && (
          <nav className="demo-sidebar-nav">
            {demoSections.map((section) => (
              <button
                key={section.id}
                className={`demo-sidebar-item ${activeSection === section.id ? 'demo-sidebar-item--active' : ''}`}
                onClick={() => setActiveSection(section.id)}
              >
                <span className="demo-sidebar-item-title">{section.title}</span>
                <span className="demo-sidebar-item-desc">{section.description}</span>
              </button>
            ))}
          </nav>
        )}
      </aside>

      {/* Main Content */}
      <div className="demo-main">
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
              <div className="demo-kpiValue">Range + RHF + Time + Multiple</div>
          </div>
        </div>
      </section>

        {/* Active Section Content */}
        {activeSection === "single" && (
        <section className="demo-card">
          <div className="demo-cardTitle">
            <span>تاریخ تکی (Popover)</span>
            <span className="demo-muted">controlled: Date | null</span>
          </div>
            {activeSectionData && (
              <div className="demo-section-info">
                <p className="demo-section-description">{activeSectionData.description}</p>
                {activeSectionData.props && (
                  <div className="demo-props-table">
                    <h4 className="demo-props-title">Props:</h4>
                    <table className="demo-table">
                      <thead>
                        <tr>
                          <th>نام</th>
                          <th>نوع</th>
                          <th>پیش‌فرض</th>
                          <th>توضیحات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeSectionData.props.map((prop) => (
                          <tr key={prop.name}>
                            <td><code>{prop.name}</code></td>
                            <td><code>{prop.type}</code></td>
                            <td>{prop.default || '—'}</td>
                            <td>{prop.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          <div className="demo-row">
            <PersianDatePicker
              theme={theme}
              value={value}
              onChange={handleSingleChange}
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
        )}

        {activeSection === "inline" && (
        <section className="demo-card">
          <div className="demo-cardTitle">
            <span>تقویم Inline</span>
            <span className="demo-muted">بدون input</span>
          </div>
            {activeSectionData && (
              <div className="demo-section-info">
                <p className="demo-section-description">{activeSectionData.description}</p>
                {activeSectionData.props && (
                  <div className="demo-props-table">
                    <h4 className="demo-props-title">Props:</h4>
                    <table className="demo-table">
                      <thead>
                        <tr>
                          <th>نام</th>
                          <th>نوع</th>
                          <th>پیش‌فرض</th>
                          <th>توضیحات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeSectionData.props.map((prop) => (
                          <tr key={prop.name}>
                            <td><code>{prop.name}</code></td>
                            <td><code>{prop.type}</code></td>
                            <td>{prop.default || '—'}</td>
                            <td>{prop.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          <PersianDatePicker
            mode="inline"
            theme={theme}
            value={inlineValue}
              onChange={handleInlineChange}
            monthLabels={persianMonthLabels}
            weekdays={["ش", "ی", "د", "س", "چ", "پ", "ج"]}
            minDate={minDate}
            maxDate={maxDate}
          />
        </section>
        )}

        {activeSection === "range" && (
        <section className="demo-card">
          <div className="demo-cardTitle">
            <span>انتخاب بازه (Range)</span>
            <span className="demo-muted">start/end</span>
          </div>
            {activeSectionData && (
              <div className="demo-section-info">
                <p className="demo-section-description">{activeSectionData.description}</p>
                {activeSectionData.props && (
                  <div className="demo-props-table">
                    <h4 className="demo-props-title">Props:</h4>
                    <table className="demo-table">
                      <thead>
                        <tr>
                          <th>نام</th>
                          <th>نوع</th>
                          <th>پیش‌فرض</th>
                          <th>توضیحات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeSectionData.props.map((prop) => (
                          <tr key={prop.name}>
                            <td><code>{prop.name}</code></td>
                            <td><code>{prop.type}</code></td>
                            <td>{prop.default || '—'}</td>
                            <td>{prop.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
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
        )}

        {activeSection === "multiple" && (
          <section className="demo-card">
            <div className="demo-cardTitle">
              <span>انتخاب چندتایی (Multiple Selection)</span>
              <span className="demo-muted">multiple dates</span>
            </div>
            {activeSectionData && (
              <div className="demo-section-info">
                <p className="demo-section-description">{activeSectionData.description}</p>
                {activeSectionData.props && (
                  <div className="demo-props-table">
                    <h4 className="demo-props-title">Props:</h4>
                    <table className="demo-table">
                      <thead>
                        <tr>
                          <th>نام</th>
                          <th>نوع</th>
                          <th>پیش‌فرض</th>
                          <th>توضیحات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeSectionData.props.map((prop) => (
                          <tr key={prop.name}>
                            <td><code>{prop.name}</code></td>
                            <td><code>{prop.type}</code></td>
                            <td>{prop.default || '—'}</td>
                            <td>{prop.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
            <div className="demo-row">
              <PersianDatePicker
                theme={theme}
                value={multipleDates}
                onChange={handleMultipleChange}
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
        )}

        {activeSection === "time" && (
          <>
            <section className="demo-card">
              <div className="demo-cardTitle">
                <span>تاریخ + زمان (Time Picker)</span>
                <span className="demo-muted">timePicker enabled</span>
              </div>
              {activeSectionData && (
                <div className="demo-section-info">
                  <p className="demo-section-description">{activeSectionData.description}</p>
                  {activeSectionData.props && (
                    <div className="demo-props-table">
                      <h4 className="demo-props-title">Props:</h4>
                      <table className="demo-table">
                        <thead>
                          <tr>
                            <th>نام</th>
                            <th>نوع</th>
                            <th>پیش‌فرض</th>
                            <th>توضیحات</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activeSectionData.props.map((prop) => (
                            <tr key={prop.name}>
                              <td><code>{prop.name}</code></td>
                              <td><code>{prop.type}</code></td>
                              <td>{prop.default || '—'}</td>
                              <td>{prop.description}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
              <div className="demo-row">
                <PersianDatePicker
                  theme={theme}
                  value={timeValue}
                  onChange={handleTimeChange}
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
                  onChange={handleTimeWithSecondsChange}
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
                  onChange={handleTimeCustomChange}
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
          </>
        )}

        {activeSection === "disabled" && (
        <section className="demo-card">
          <div className="demo-cardTitle">
            <span>غیرفعال</span>
            <span className="demo-muted">disabled</span>
          </div>
            {activeSectionData && (
              <div className="demo-section-info">
                <p className="demo-section-description">{activeSectionData.description}</p>
                {activeSectionData.props && (
                  <div className="demo-props-table">
                    <h4 className="demo-props-title">Props:</h4>
                    <table className="demo-table">
                      <thead>
                        <tr>
                          <th>نام</th>
                          <th>نوع</th>
                          <th>پیش‌فرض</th>
                          <th>توضیحات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeSectionData.props.map((prop) => (
                          <tr key={prop.name}>
                            <td><code>{prop.name}</code></td>
                            <td><code>{prop.type}</code></td>
                            <td>{prop.default || '—'}</td>
                            <td>{prop.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          <PersianDatePicker
            theme={theme}
            value={null}
            onChange={() => {}}
            disabled
            placeholder="Disabled"
            monthLabels={persianMonthLabels}
          />
        </section>
        )}

        {showEdgeTest && (
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
                onChange={handleEdgeChange}
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
        )}

        {showEdgeTest && (
        <div className="demo-edgeStage" aria-hidden="false">
          <div className="demo-edgeStageCard">
            <div className="demo-cardTitle" style={{ marginBottom: 8 }}>
              <span>گوشه پایین راست</span>
              <span className="demo-muted">portal: true</span>
            </div>
            <PersianDatePicker
              theme={theme}
              value={edgeValue}
                onChange={handleEdgeChange}
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
                onChange={handleEdgeNoPortalChange}
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
        )}

        {modalOpen && (
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
                      onChange={handleModalChange}
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
        )}
      </div>
    </div>
  );
}

export default App;
