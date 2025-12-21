import * as React from 'react'
import type { Control, FieldValues, Path, RegisterOptions } from 'react-hook-form'
import { useController } from 'react-hook-form'
import { PersianDatePicker, type PersianDatePickerProps } from './components/PersianDatePicker'

export type RHFDateValue = Date | null

export type UsePersianDatePickerControllerParams<TFieldValues extends FieldValues> = {
  name: Path<TFieldValues>
  control: Control<TFieldValues>
  rules?: RegisterOptions<TFieldValues, Path<TFieldValues>>
  defaultValue?: RHFDateValue
  shouldUnregister?: boolean
} & Omit<PersianDatePickerProps, 'value' | 'onChange'>

/**
 * RHF adapter hook for `PersianDatePicker`.
 *
 * Assumes field value is `Date | null`.
 */
export function usePersianDatePickerController<TFieldValues extends FieldValues>(
  params: UsePersianDatePickerControllerParams<TFieldValues>,
) {
  const { name, control, rules, defaultValue, shouldUnregister, disabled, ...pickerProps } = params

  const { field, fieldState, formState } = useController({
    name,
    control,
    rules,
    defaultValue: (defaultValue ?? null) as never,
    shouldUnregister,
    disabled,
  })

  const value = (field.value ?? null) as RHFDateValue

  const onChange = React.useCallback(
    (date: RHFDateValue) => {
      field.onChange(date)
    },
    [field],
  )

  return {
    field,
    fieldState,
    formState,
    pickerProps: {
      ...pickerProps,
      value,
      onChange,
      disabled,
    } satisfies PersianDatePickerProps,
  }
}

export type RHF_PersianDatePickerProps<TFieldValues extends FieldValues> = UsePersianDatePickerControllerParams<TFieldValues>

/**
 * RHF adapter component for `PersianDatePicker`.
 *
 * Assumes field value is `Date | null`.
 */
export function RHF_PersianDatePicker<TFieldValues extends FieldValues>(props: RHF_PersianDatePickerProps<TFieldValues>) {
  const { pickerProps } = usePersianDatePickerController(props)
  return <PersianDatePicker {...pickerProps} />
}


