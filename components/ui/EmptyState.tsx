import { ReactNode } from 'react'

interface EmptyStateProps {
  message: string
  action?: ReactNode
}

export function EmptyState({ message, action }: EmptyStateProps) {
  return (
    <div
      className="text-center py-12 px-4 rounded-lg"
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px dashed var(--color-border)',
        borderRadius: 'var(--radius-card)',
      }}
    >
      <p
        className="mb-4"
        style={{
          color: 'var(--color-text-secondary)',
          fontSize: 'var(--font-size-base)',
          lineHeight: 'var(--line-height-normal)',
        }}
      >
        {message}
      </p>
      {action && <div>{action}</div>}
    </div>
  )
}

