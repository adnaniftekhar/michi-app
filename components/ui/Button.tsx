import { ButtonHTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'
import { LoadingSpinner } from './LoadingSpinner'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
  isLoading?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  disabled,
  isLoading,
  ...props
}: ButtonProps) {
  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 'var(--radius-button)',
    transition: 'all 0.2s ease',
    border: 'none',
    cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
    opacity: disabled || isLoading ? 0.4 : 1,
    gap: 'var(--spacing-2)',
  }

  const sizeStyles = {
    sm: {
      height: '32px',
      padding: '0 var(--spacing-3)',
      fontSize: 'var(--font-size-sm)',
    },
    md: {
      height: '40px',
      padding: '0 var(--spacing-4)',
      fontSize: 'var(--font-size-base)',
    },
    lg: {
      height: '48px',
      padding: '0 var(--spacing-6)',
      fontSize: 'var(--font-size-lg)',
    },
  }

  const variantStyles = {
    primary: {
      backgroundColor: 'var(--color-michi-green)',
      color: 'var(--color-background)',
      fontWeight: 'var(--font-weight-semibold)',
    },
    secondary: {
      backgroundColor: 'transparent',
      color: 'var(--color-text-primary)',
      border: '1px solid var(--color-border)',
      fontWeight: 'var(--font-weight-normal)',
    },
    tertiary: {
      backgroundColor: 'transparent',
      color: 'var(--color-text-secondary)',
      border: 'none',
      fontWeight: 'var(--font-weight-normal)',
    },
    danger: {
      backgroundColor: 'var(--color-danger)',
      color: '#ffffff',
      fontWeight: 'var(--font-weight-semibold)',
    },
  }

  return (
    <button
      className={clsx(
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
        className
      )}
      style={{
        ...baseStyles,
        ...sizeStyles[size],
        ...variantStyles[variant],
        ...props.style, // Allow inline styles to override
      } as React.CSSProperties}
      disabled={disabled}
      onMouseEnter={(e) => {
        if (!disabled && !isLoading) {
          if (variant === 'primary') {
            e.currentTarget.style.backgroundColor = 'var(--color-michi-green-hover)'
          } else if (variant === 'danger') {
            e.currentTarget.style.backgroundColor = 'var(--color-danger-hover)'
          } else if (variant === 'secondary') {
            e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'
          } else if (variant === 'tertiary') {
            e.currentTarget.style.color = 'var(--color-text-primary)'
          }
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !isLoading) {
          if (variant === 'primary') {
            e.currentTarget.style.backgroundColor = 'var(--color-michi-green)'
          } else if (variant === 'danger') {
            e.currentTarget.style.backgroundColor = 'var(--color-danger)'
          } else if (variant === 'secondary') {
            e.currentTarget.style.backgroundColor = 'transparent'
          } else if (variant === 'tertiary') {
            e.currentTarget.style.color = 'var(--color-text-secondary)'
          }
        }
      }}
      {...props}
    >
      {isLoading ? (
        <>
          <LoadingSpinner size="sm" />
          <span>{children}</span>
        </>
      ) : (
        children
      )}
    </button>
  )
}

