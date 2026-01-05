import { InputHTMLAttributes, forwardRef, useId } from 'react'
import clsx from 'clsx'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  helperText?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, helperText, error, className, id, ...props }, ref) => {
    const generatedId = useId()
    const inputId = id || generatedId

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
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
        <input
          ref={ref}
          id={inputId}
          className={clsx(
            'w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
            className
          )}
          style={{
            padding: 'var(--spacing-2) var(--spacing-3)',
            fontSize: 'var(--font-size-base)',
            lineHeight: 'var(--line-height-normal)',
            border: `1px solid ${error ? 'var(--color-danger)' : 'var(--color-border)'}`,
            borderRadius: 'var(--radius-input)',
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text-primary)',
            '--tw-outline-color': 'var(--color-focus-ring)',
          } as React.CSSProperties}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error || helperText ? `${inputId}-help` : undefined}
          {...props}
        />
        {(error || helperText) && (
          <p
            id={`${inputId}-help`}
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

Input.displayName = 'Input'

