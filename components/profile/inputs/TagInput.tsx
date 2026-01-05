'use client'

import { useState, KeyboardEvent } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

interface TagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  helperText?: string
  label?: string
  'aria-label'?: string
}

export function TagInput({
  value,
  onChange,
  placeholder = 'Type and press Enter to add',
  helperText,
  label,
  'aria-label': ariaLabel,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('')

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault()
      const newTag = inputValue.trim()
      if (!value.includes(newTag)) {
        onChange([...value, newTag])
      }
      setInputValue('')
    } else if (e.key === 'Backspace' && inputValue === '' && value.length > 0) {
      // Remove last tag if input is empty and backspace is pressed
      onChange(value.slice(0, -1))
    }
  }

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove))
  }

  const inputId = `tag-input-${Math.random().toString(36).substr(2, 9)}`

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block mb-2 font-medium"
          style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-primary)',
          }}
        >
          {label}
        </label>
      )}
      <div
        className="flex flex-wrap items-center gap-2 p-3 rounded-lg border min-h-[48px] focus-within:outline focus-within:outline-2 focus-within:outline-offset-2"
        style={{
          borderColor: 'var(--color-border)',
          backgroundColor: 'var(--color-surface)',
          outlineColor: 'var(--color-focus-ring)',
        }}
      >
        {value.map((tag) => (
          <Badge
            key={tag}
            variant="default"
            className="flex items-center gap-1"
          >
            <span>{tag}</span>
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-1 hover:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 rounded"
              style={{
                outlineColor: 'var(--color-focus-ring)',
                fontSize: '14px',
                lineHeight: '1',
              }}
              aria-label={`Remove ${tag}`}
            >
              ×
            </button>
          </Badge>
        ))}
        <input
          id={inputId}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] bg-transparent border-none outline-none"
          style={{
            color: 'var(--color-text-primary)',
            fontSize: 'var(--font-size-base)',
          }}
          aria-label={ariaLabel || label || 'Tag input'}
        />
      </div>
      {helperText && (
        <p
          className="mt-1 text-sm"
          style={{
            color: 'var(--color-text-secondary)',
          }}
        >
          {helperText}
        </p>
      )}
    </div>
  )
}

