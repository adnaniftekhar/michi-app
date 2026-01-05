'use client'

import { useEffect, useState } from 'react'
import { Button } from './Button'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

let toastListeners: ((toasts: Toast[]) => void)[] = []
let toasts: Toast[] = []

function notify() {
  toastListeners.forEach((listener) => listener([...toasts]))
}

export function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
  const id = `toast-${Date.now()}-${Math.random()}`
  toasts = [...toasts, { id, message, type }]
  notify()

  // Auto-dismiss after 3 seconds
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id)
    notify()
  }, 3000)
}

export function ToastContainer() {
  const [currentToasts, setCurrentToasts] = useState<Toast[]>([])

  useEffect(() => {
    const listener = (newToasts: Toast[]) => {
      setCurrentToasts(newToasts)
    }
    toastListeners.push(listener)
    listener(toasts)

    return () => {
      toastListeners = toastListeners.filter((l) => l !== listener)
    }
  }, [])

  if (currentToasts.length === 0) return null

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2"
      role="status"
      aria-live="polite"
      aria-atomic="false"
    >
      {currentToasts.map((toast) => (
        <div
          key={toast.id}
          className="flex items-center gap-3 px-4 py-3 rounded-lg shadow-md max-w-md"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <div
            className="flex-1"
            style={{
              color: 'var(--color-text-primary)',
              fontSize: 'var(--font-size-sm)',
            }}
          >
            {toast.message}
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
            toasts = toasts.filter((t) => t.id !== toast.id)
            notify()
          }}
            aria-label="Dismiss"
          >
            ×
          </Button>
        </div>
      ))}
    </div>
  )
}

