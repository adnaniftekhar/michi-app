export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }

  return (
    <div className="flex items-center justify-center">
      <div
        className={`${sizeClasses[size]} border-4 border-t-transparent rounded-full animate-spin`}
        style={{
          borderColor: 'var(--color-border)',
          borderTopColor: 'var(--color-primary)',
        }}
        aria-label="Loading"
        role="status"
      >
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  )
}

