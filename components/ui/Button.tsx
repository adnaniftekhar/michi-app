import { ButtonHTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'var(--font-weight-normal)',
    borderRadius: 'var(--radius-button)',
    transition: 'all 0.2s',
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
  }

  const sizeStyles = {
    sm: {
      padding: 'var(--spacing-2) var(--spacing-3)',
      fontSize: 'var(--font-size-sm)',
    },
    md: {
      padding: 'var(--spacing-2) var(--spacing-4)',
      fontSize: 'var(--font-size-base)',
    },
    lg: {
      padding: 'var(--spacing-3) var(--spacing-6)',
      fontSize: 'var(--font-size-lg)',
    },
  }

  const variantStyles = {
    primary: {
      backgroundColor: 'var(--color-michi-green)',
      color: '#0F1419',
      fontWeight: 'var(--font-weight-semibold)',
    },
    secondary: {
      backgroundColor: 'transparent',
      color: 'var(--color-text-primary)',
      border: '1px solid var(--color-border)',
    },
    danger: {
      backgroundColor: 'var(--color-danger)',
      color: '#ffffff',
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
      } as React.CSSProperties}
      disabled={disabled}
      onMouseEnter={(e) => {
        if (!disabled) {
          if (variant === 'primary') {
            e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)'
          } else if (variant === 'danger') {
            e.currentTarget.style.backgroundColor = 'var(--color-danger-hover)'
          } else {
            e.currentTarget.style.backgroundColor = 'var(--color-surface)'
          }
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          if (variant === 'primary') {
            e.currentTarget.style.backgroundColor = 'var(--color-michi-green)'
          } else if (variant === 'danger') {
            e.currentTarget.style.backgroundColor = 'var(--color-danger)'
          } else {
            e.currentTarget.style.backgroundColor = 'transparent'
          }
        }
      }}
      {...props}
    >
      {children}
    </button>
  )
}

