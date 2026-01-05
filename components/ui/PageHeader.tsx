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
    <div className="mb-8">
      {breadcrumb && breadcrumb.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-4">
          <ol className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {breadcrumb.map((item, index) => (
              <li key={item.href} className="flex items-center gap-2">
                {index > 0 && <span aria-hidden="true">/</span>}
                <Link
                  href={item.href}
                  className="hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                  style={{ outlineColor: 'var(--color-focus-ring)' }}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ol>
        </nav>
      )}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1
            className="mb-2"
            style={{
              fontSize: 'var(--font-size-2xl)',
              lineHeight: 'var(--line-height-tight)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--color-text-primary)',
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              className="mt-1"
              style={{
                fontSize: 'var(--font-size-base)',
                color: 'var(--color-text-secondary)',
                lineHeight: 'var(--line-height-normal)',
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    </div>
  )
}

