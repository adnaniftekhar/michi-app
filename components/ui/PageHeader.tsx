import { ReactNode } from 'react'
import Link from 'next/link'

interface PageHeaderProps {
  title: string
  subtitle?: string
  breadcrumb?: { label: string; href: string }[]
  action?: ReactNode
}

export function PageHeader({ title, subtitle, breadcrumb, action }: PageHeaderProps) {
  return (
    <div style={{ marginBottom: 'var(--spacing-8)' }}>
      {breadcrumb && breadcrumb.length > 0 && (
        <nav aria-label="Breadcrumb" style={{ marginBottom: 'var(--spacing-4)' }}>
          <ol className="flex items-center gap-2" style={{ 
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)',
          }}>
            {breadcrumb.map((item, index) => (
              <li key={item.href} className="flex items-center gap-2">
                {index > 0 && <span aria-hidden="true" style={{ color: 'var(--color-text-tertiary)' }}>/</span>}
                <Link
                  href={item.href}
                  className="hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition-colors"
                  style={{ 
                    outlineColor: 'var(--color-focus-ring)',
                    color: index === breadcrumb.length - 1 ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                  }}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ol>
        </nav>
      )}
      <div className="flex items-baseline justify-between gap-6">
        <div className="flex-1 min-w-0">
          <h1
            style={{
              fontSize: 'var(--font-size-2xl)',
              lineHeight: 'var(--line-height-tight)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--color-text-primary)',
              marginBottom: subtitle ? 'var(--spacing-1)' : '0',
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              style={{
                fontSize: 'var(--font-size-base)',
                color: 'var(--color-text-secondary)',
                lineHeight: 'var(--line-height-normal)',
                marginTop: 'var(--spacing-1)',
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
        {action && (
          <div className="flex-shrink-0" style={{ alignSelf: 'flex-start', paddingTop: '2px' }}>
            {action}
          </div>
        )}
      </div>
    </div>
  )
}

