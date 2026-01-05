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
    <section style={{ marginBottom: 'var(--spacing-8)' }}>
      <div
        className="flex items-start justify-between gap-4"
        style={{ 
          marginBottom: 'var(--spacing-6)',
          paddingBottom: 'var(--spacing-4)',
          borderBottom: '1px solid var(--color-border-subtle)',
        }}
      >
        <div>
          <h2
            style={{
              fontSize: 'var(--font-size-xl)',
              lineHeight: 'var(--line-height-tight)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--color-text-primary)',
              marginBottom: 'var(--spacing-1)',
            }}
          >
            {title}
          </h2>
          {description && (
            <p
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-secondary)',
                lineHeight: 'var(--line-height-normal)',
                marginTop: 'var(--spacing-1)',
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
          className="text-center rounded-lg"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px dashed var(--color-border)',
            borderRadius: 'var(--radius-card)',
            padding: 'var(--spacing-12) var(--spacing-4)',
          }}
        >
          <p
            style={{
              color: 'var(--color-text-secondary)',
              fontSize: 'var(--font-size-base)',
              lineHeight: 'var(--line-height-normal)',
              marginBottom: 'var(--spacing-6)',
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

