import { ReactNode } from 'react'
import Link from 'next/link'
import clsx from 'clsx'

interface CardProps {
  children: ReactNode
  href?: string
  onClick?: () => void
  className?: string
  style?: React.CSSProperties
}

export function Card({ children, href, onClick, className, style }: CardProps) {
  const baseStyles = {
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-card)',
    padding: 'var(--spacing-4)',
  }

  const interactiveStyles = href || onClick ? {
    cursor: 'pointer',
    transition: 'background-color 0.2s ease, border-color 0.2s ease',
  } : {}

  const content = (
    <div
      className={clsx('focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2', className)}
      style={{
        ...baseStyles,
        ...interactiveStyles,
        outlineColor: 'var(--color-focus-ring)',
        ...style,
      } as React.CSSProperties}
      onClick={onClick}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && onClick) {
          e.preventDefault()
          onClick()
        }
      }}
      onMouseEnter={(e) => {
        if (href || onClick) {
          e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'
          e.currentTarget.style.borderColor = 'var(--color-border)'
        }
      }}
      onMouseLeave={(e) => {
        if (href || onClick) {
          e.currentTarget.style.backgroundColor = 'var(--color-surface)'
          e.currentTarget.style.borderColor = 'var(--color-border)'
        }
      }}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? 'button' : undefined}
    >
      {children}
    </div>
  )

  if (href) {
    return (
      <Link
        href={href}
        className="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        style={{ 
          outlineColor: 'var(--color-focus-ring)',
          textDecoration: 'none',
        }}
      >
        {content}
      </Link>
    )
  }

  return content
}

