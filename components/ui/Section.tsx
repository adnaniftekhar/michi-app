import { ReactNode } from 'react'

interface SectionProps {
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
  emptyState?: {
    message: string
    action?: ReactNode
  }
  isEmpty?: boolean
}

export function Section({ title, description, action, children, emptyState, isEmpty }: SectionProps) {
  return (
    <section className="mb-8">
      <div
        className="mb-4 pb-4 border-b flex items-start justify-between gap-4"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div>
          <h2
            className="mb-1"
            style={{
              fontSize: 'var(--font-size-xl)',
              lineHeight: 'var(--line-height-tight)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--color-text-primary)',
            }}
          >
            {title}
          </h2>
          {description && (
            <p
              className="text-sm mt-1"
              style={{
                color: 'var(--color-text-secondary)',
                lineHeight: 'var(--line-height-normal)',
              }}
            >
              {description}
            </p>
          )}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
      {isEmpty && emptyState ? (
        <div
          className="text-center py-12 px-4 rounded-lg"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-card)',
          }}
        >
          <p
            className="mb-4"
            style={{
              color: 'var(--color-text-secondary)',
              fontSize: 'var(--font-size-base)',
            }}
          >
            {emptyState.message}
          </p>
          {emptyState.action}
        </div>
      ) : (
        <div>{children}</div>
      )}
    </section>
  )
}

