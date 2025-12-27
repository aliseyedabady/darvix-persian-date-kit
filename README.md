# persian-date-kit

Production-ready Persian (Jalali) date pickers for React.

[![GitHub](https://img.shields.io/github/stars/aliseyedabady/darvix-persian-date-kit?style=social)](https://github.com/aliseyedabady/darvix-persian-date-kit)

**Repository:** [https://github.com/aliseyedabady/darvix-persian-date-kit](https://github.com/aliseyedabady/darvix-persian-date-kit)

## Key principles
- **Gregorian-only internally**: component values are always `Date | null` (Gregorian). Jalali is only for display/input.
- **Controlled components**: you own the state (`value` + `onChange`).
- **Logic separated from UI**: calendar grid/conversions are reusable utilities.
- **SSR-safe**: no `window` usage during render.
- **RTL-first**: `dir="rtl"` by default.
- **Optional styles**: ship CSS variables + minimal classes; you can override everything.

## Install

```bash
npm i persian-date-kit
```

## Styles (optional)
If you want the default look, import the stylesheet:

```ts
import 'persian-date-kit/styles.css'
```

If you skip it, you can style via your own CSS + the `classes` prop.

## Usage

### Single date picker

```tsx
import { useState } from 'react'
import { PersianDatePicker } from 'persian-date-kit'
import 'persian-date-kit/styles.css'

const monthLabels = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
]

export function Example() {
  const [value, setValue] = useState<Date | null>(new Date())

  return (
    <PersianDatePicker
      value={value}
      onChange={setValue}
      placeholder="YYYY/MM/DD"
      monthLabels={monthLabels}
      weekdays={['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج']}
      minDate={new Date(2020, 0, 1)}
      maxDate={new Date(2030, 11, 31)}
    />
  )
}
```

### Inline calendar (no input)

```tsx
import { useState } from 'react'
import { PersianDatePicker } from 'persian-date-kit'

export function InlineCalendar() {
  const [value, setValue] = useState<Date | null>(new Date())
  return <PersianDatePicker mode="inline" value={value} onChange={setValue} />
}
```

### Range picker (start/end)

```tsx
import { useState } from 'react'
import { PersianDateRangePicker, type PersianDateRange } from 'persian-date-kit'

export function RangeExample() {
  const [range, setRange] = useState<PersianDateRange>({ start: null, end: null })

  return (
    <PersianDateRangePicker
      value={range}
      onChange={setRange}
      // inputVariant="two" (default) => two inputs
      inputVariant="single"
      placeholder="بازه (YYYY/MM/DD - YYYY/MM/DD)"
    />
  )
}
```

## React Hook Form (optional adapter)
The core package has **no required** form dependency.
If you want React Hook Form integration, import from the subpath:

```bash
npm i react-hook-form
```

```tsx
import { useForm } from 'react-hook-form'
import { RHF_PersianDatePicker } from 'persian-date-kit/react-hook-form'

type FormValues = { birthDate: Date | null }

export function RHFExample() {
  const { control, handleSubmit } = useForm<FormValues>({ defaultValues: { birthDate: null } })

  return (
    <form onSubmit={handleSubmit(console.log)}>
      <RHF_PersianDatePicker name="birthDate" control={control} placeholder="YYYY/MM/DD" />
      <button type="submit">Submit</button>
    </form>
  )
}
```

## Props reference

All values you receive in `onChange` are **Gregorian** (`Date | null`). Jalali is only used for display/input.

### `PersianDatePicker`

#### Required props
- **`value`**: `Date | null` — controlled value (Gregorian)
- **`onChange`**: `(date: Date | null) => void` — controlled change handler

#### Extra props (single picker)
- **`placeholder?`**: `string` — input placeholder (popover mode)
- **`classes?`**: `PersianDatePickerClasses` — per-slot class overrides

### `PersianDateRangePicker`

#### Required props
- **`value`**: `{ start: Date | null; end: Date | null }` — controlled range (Gregorian)
- **`onChange`**: `(range: { start: Date | null; end: Date | null }) => void`

#### Extra props (range picker)
- **`inputVariant?`**: `'two' | 'single'` — two inputs (default) or one combined input
- **`placeholder?`**: `string` — used for single-input mode
- **`rangeSeparator?`**: `string` — separator for single-input text (default: `" - "`)
- **`placeholderStart?` / `placeholderEnd?`**: `string` — used for two-input mode
- **`classes?`**: `PersianDateRangePickerClasses` — per-slot class overrides

### Shared props (`BasePickerProps`)

These props exist on both pickers:

- **`minDate?` / `maxDate?`**: `Date` — limits selectable days (Gregorian)
- **`disabled?`**: `boolean`
- **`mode?`**: `'popover' | 'inline'` — default is `'popover'`
- **`open?` / `onOpenChange?`**: control popover open state (only meaningful in popover mode)
- **`popover?`**: `PopoverConfig` — positioning options (popover mode)
- **`formatValue?`**: `(date: Date) => string` — formats input text (default: numeric Jalali `YYYY/MM/DD`)
- **`parseValue?`**: `(text: string) => Date | null` — parses input text into Gregorian (default: numeric Jalali `YYYY/MM/DD`)
- **`weekdays?`**: `string[]` — 7 labels for weekday header (if omitted, the picker uses numeric labels)
- **`monthLabels?`**: `string[]` — 12 labels (index 0 => month 1). If omitted, month numbers are shown.
- **`renderMonthLabel?`**: `(jy: number, jm: number) => React.ReactNode` — custom header label
- **`prevIcon?` / `nextIcon?`**: `React.ReactNode` — customize navigation icons
- **`className?`**: `string` — extra class on root

### `PopoverConfig`

- **`portal?`**: `boolean` (default: `true`) — recommended inside modals / overflow containers
- **`gutter?`**: `number` (default: `8`) — gap between anchor and popover
- **`padding?`**: `number` (default: `8`) — minimum distance from viewport edges (clamping)
- **`strategy?`**: `'fixed' | 'absolute'` (default: `'fixed'`)
- **`placements?`**: `Array<'bottom' | 'top' | 'left' | 'right'>` (default: `['bottom','top','left','right']`)
- **`align?`**: `'start' | 'center' | 'end'` (default: `'end'`)

### Styling slots (`classes`)

You can override the class names per slot:

- **Base slots** (`BasePickerClasses`):
  - `root`, `input`, `button`, `popover`, `header`, `navButton`, `monthLabel`, `grid`, `weekday`
  - `day`, `dayOutside`, `dayDisabled`, `dayToday`
- **Single picker extra slots** (`PersianDatePickerClasses`):
  - `daySelected`
- **Range picker extra slots** (`PersianDateRangePickerClasses`):
  - `dayRangeStart`, `dayRangeEnd`, `dayInRange`

## Styling / Theming

### 1) Use the default styles (recommended)

```ts
import 'persian-date-kit/styles.css'
```

The default CSS is built around **CSS variables**, so it’s easy to theme.

### 2) Theme via CSS variables (quickest)

These variables control most of the look:

- `--dvx-pdp-bg`
- `--dvx-pdp-fg`
- `--dvx-pdp-muted`
- `--dvx-pdp-border`
- `--dvx-pdp-shadow`
- `--dvx-pdp-accent`
- `--dvx-pdp-accentFg`
- `--dvx-pdp-ring`
- `--dvx-pdp-dayHover`

Example:

```css
:root {
  --dvx-pdp-accent: #16a34a;
  --dvx-pdp-ring: rgba(22, 163, 74, 0.25);
}
```

### 3) Override per-slot classes (`classes` prop)

If you use Tailwind (or your own utility classes), pass overrides:

```tsx
<PersianDatePicker
  value={value}
  onChange={setValue}
  classes={{
    input: 'w-full rounded-xl border border-slate-300 bg-white px-3 py-2',
    popover: 'z-[9999]',
    daySelected: '!bg-emerald-600 !text-white',
  }}
/>
```

### 4) Fully custom CSS (no default stylesheet)

If you **don’t** import `styles.css`, you should provide your own CSS for the
component class hooks (ex: `.dvx-pdp`, `.dvx-pdp__input`, `.dvx-pdp__day`, ...),
or rely entirely on `classes` and your own styles.

## Development (this repo)

Clone the repository:

```bash
git clone https://github.com/aliseyedabady/darvix-persian-date-kit.git
cd darvix-persian-date-kit
npm install
```

Run development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT © [Darvix](https://github.com/aliseyedabady/darvix-persian-date-kit)

---

_Dedicated to the beautiful soul of my grandfather_ ❤️
