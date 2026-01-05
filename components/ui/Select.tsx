import { SelectHTMLAttributes, forwardRef, useId } from 'react'
import clsx from 'clsx'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  helperText?: string
  error?: string
  options: { value: string; label: string }[]
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, helperText, error, className, id, options, ...props }, ref) => {
    const generatedId = useId()
    const selectId = id || generatedId

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block mb-2 font-medium"
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-primary)',
            }}
          >
            {label}
            {props.required && <span aria-label="required" className="ml-1" style={{ color: 'var(--color-danger)' }}>*</span>}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={clsx(
            'w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
            className
          )}
          style={{
            padding: 'var(--spacing-2) var(--spacing-3)',
            fontSize: 'var(--font-size-base)',
            lineHeight: 'var(--line-height-normal)',
            border: `1px solid ${error ? 'var(--color-danger)' : 'var(--color-border)'}`,
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text-primary)',
            '--tw-outline-color': 'var(--color-focus-ring)',
          } as React.CSSProperties}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error || helperText ? `${selectId}-help` : undefined}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {(error || helperText) && (
          <p
            id={`${selectId}-help`}
            className="mt-1 text-sm"
            style={{
              color: error ? 'var(--color-danger)' : 'var(--color-text-secondary)',
            }}
            role={error ? 'alert' : undefined}
          >
            {error || helperText}
          </p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'

