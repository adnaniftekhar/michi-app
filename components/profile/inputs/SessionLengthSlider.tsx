'use client'

import { useState, useEffect } from 'react'

interface SessionLengthSliderProps {
  value: number // in minutes
  onChange: (minutes: number) => void
  label?: string
  helperText?: string
}

const durationMap: Record<'short' | 'medium' | 'long', number> = {
  short: 30,
  medium: 60,
  long: 90,
}

export function SessionLengthSlider({
  value,
  onChange,
  label = 'Typical Session Length',
  helperText = 'Used by AI to size daily learning blocks.',
}: SessionLengthSliderProps) {
  const [sliderValue, setSliderValue] = useState(value || 60)

  useEffect(() => {
    setSliderValue(value || 60)
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value)
    setSliderValue(newValue)
    onChange(newValue)
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <label
          className="block font-medium"
          style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-primary)',
          }}
        >
          {label}
        </label>
        <span
          className="font-semibold"
          style={{
            fontSize: 'var(--font-size-base)',
            color: 'var(--color-michi-green)',
          }}
        >
          {sliderValue} min
        </span>
      </div>
      <input
        type="range"
        min="15"
        max="120"
        step="5"
        value={sliderValue}
        onChange={handleChange}
        className="w-full h-2 rounded-lg appearance-none cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        style={{
          background: `linear-gradient(to right, var(--color-michi-green) 0%, var(--color-michi-green) ${((sliderValue - 15) / (120 - 15)) * 100}%, var(--color-border) ${((sliderValue - 15) / (120 - 15)) * 100}%, var(--color-border) 100%)`,
          outlineColor: 'var(--color-focus-ring)',
        }}
        aria-label={label}
      />
      <div className="flex justify-between mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
        <span>15 min</span>
        <span>120 min</span>
      </div>
      {helperText && (
        <p
          className="mt-2 text-sm"
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

