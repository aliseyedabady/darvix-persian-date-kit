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

## API notes

### `PersianDatePicker`
- **`value`**: `Date | null`
- **`onChange`**: `(date: Date | null) => void`
- **`minDate` / `maxDate`**: limit selectable dates (Gregorian dates)
- **`mode`**: `'popover' | 'inline'`
- **`monthLabels`**: 12 strings (no hardcoded locale in the library)
- **`weekdays`**: 7 strings

### `PersianDateRangePicker`
- **`value`**: `{ start: Date | null; end: Date | null }`
- **`onChange`**: `(range) => void`
- **`inputVariant`**: `'two' | 'single'`

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
