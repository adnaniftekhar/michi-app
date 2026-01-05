import { ReactNode } from 'react'
import clsx from 'clsx'

interface BadgeProps {
  children: ReactNode
  variant?: 'default' | 'draft' | 'success' | 'danger'
  className?: string
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const baseStyles = {
    display: 'inline-block',
    padding: 'var(--spacing-1) var(--spacing-2)',
    fontSize: 'var(--font-size-xs)',
    fontWeight: '500',
    borderRadius: 'var(--radius-sm)',
    lineHeight: 'var(--line-height-tight)',
  }

  const variantStyles = {
    default: {
      backgroundColor: 'var(--color-surface)',
      color: 'var(--color-text-secondary)',
      border: '1px solid var(--color-border)',
    },
    draft: {
      backgroundColor: 'var(--color-surface)',
      color: 'var(--color-michi-green)',
      border: '1px solid var(--color-michi-green)',
    },
    success: {
      backgroundColor: 'var(--color-success)',
      color: '#ffffff',
    },
    danger: {
      backgroundColor: 'var(--color-danger)',
      color: '#ffffff',
    },
  }

  return (
    <span
      className={className}
      style={{
        ...baseStyles,
        ...variantStyles[variant],
      }}
    >
      {children}
    </span>
  )
}

