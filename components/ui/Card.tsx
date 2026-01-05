import { ReactNode } from 'react'
import Link from 'next/link'
import clsx from 'clsx'

interface CardProps {
  children: ReactNode
  href?: string
  onClick?: () => void
  className?: string
}

export function Card({ children, href, onClick, className }: CardProps) {
  const baseStyles = {
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-card)',
    padding: 'var(--spacing-4)',
  }

  const interactiveStyles = href || onClick ? {
    cursor: 'pointer',
    transition: 'all 0.2s',
  } : {}

  const content = (
    <div
      className={clsx('focus-within:ring-2 focus-within:ring-offset-2', className)}
      style={{
        ...baseStyles,
        ...interactiveStyles,
      } as React.CSSProperties}
      onClick={onClick}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && onClick) {
          e.preventDefault()
          onClick()
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
        style={{ outlineColor: 'var(--color-focus-ring)' }}
      >
        {content}
      </Link>
    )
  }

  return content
}

