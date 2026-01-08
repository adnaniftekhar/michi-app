'use client'

import { useState, useRef, useEffect, ReactNode } from 'react'
import { useId } from 'react'
import type React from 'react'

interface TooltipProps {
  content: string
  children: ReactNode
  id?: string
}

export function Tooltip({ content, children, id }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState<'top' | 'bottom'>('top')
  const tooltipRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLDivElement>(null)
  const generatedId = useId()
  const tooltipId = id || `tooltip-${generatedId}`

  useEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect()
      const tooltipRect = tooltipRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight

      // Check if there's enough space above
      if (triggerRect.top < tooltipRect.height + 8) {
        setPosition('bottom')
      } else {
        setPosition('top')
      }
    }
  }, [isVisible])

  const handleMouseEnter = () => {
    setIsVisible(true)
  }

  const handleMouseLeave = () => {
    setIsVisible(false)
  }

  const handleFocus = () => {
    setIsVisible(true)
  }

  const handleBlur = () => {
    setIsVisible(false)
  }

  return (
    <div
      ref={triggerRef}
      className="inline-flex items-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      {children}
      {isVisible && (
        <div
          ref={tooltipRef}
          id={tooltipId}
          role="tooltip"
          className="absolute z-50 max-w-xs"
          style={{
            [position === 'top' ? 'bottom' : 'top']: '100%',
            marginTop: position === 'bottom' ? '8px' : undefined,
            marginBottom: position === 'top' ? '8px' : undefined,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: 'var(--spacing-2) var(--spacing-3)',
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            fontSize: 'var(--font-size-sm)',
            lineHeight: 'var(--line-height-normal)',
            color: 'var(--color-text-primary)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            pointerEvents: 'none',
          }}
        >
          {content}
        </div>
      )}
    </div>
  )
}

interface InfoIconProps {
  tooltipContent: string
  fieldId?: string
  'aria-label'?: string
}

export function InfoIcon({ tooltipContent, fieldId, 'aria-label': ariaLabel }: InfoIconProps) {
  const iconId = useId()
  const tooltipId = `tooltip-${iconId}`
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState<'top' | 'bottom'>('top')
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({})
  const tooltipRef = useRef<HTMLDivElement>(null)
  const iconRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (isVisible && iconRef.current) {
      // Set initial position immediately to avoid hiccup
      const iconRect = iconRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const viewportWidth = window.innerWidth
      const estimatedTooltipWidth = 280
      const estimatedTooltipHeight = 80

      // Quick initial calculation
      const spaceAbove = iconRect.top
      const spaceBelow = viewportHeight - iconRect.bottom
      const shouldUseBottom = spaceAbove < estimatedTooltipHeight + 16 && spaceBelow > spaceAbove
      const newPosition = shouldUseBottom ? 'bottom' : 'top'

      // Initial horizontal position (centered on icon)
      let left = iconRect.left + iconRect.width / 2 - estimatedTooltipWidth / 2
      if (left < 8) left = 8
      if (left + estimatedTooltipWidth > viewportWidth - 8) {
        left = viewportWidth - estimatedTooltipWidth - 8
      }

      // Set initial position immediately
      setPosition(newPosition)
      setTooltipStyle({
        position: 'fixed',
        left: `${left}px`,
        [newPosition === 'top' ? 'bottom' : 'top']: newPosition === 'top' 
          ? `${viewportHeight - iconRect.top + 8}px`
          : `${iconRect.bottom + 8}px`,
        zIndex: 9999,
        opacity: 0, // Start invisible, fade in after measurement
      })

      // Refine position after tooltip is rendered and measured
      requestAnimationFrame(() => {
        if (!iconRef.current || !tooltipRef.current) return

        const refinedIconRect = iconRef.current.getBoundingClientRect()
        const tooltipRect = tooltipRef.current.getBoundingClientRect()
        const refinedViewportWidth = window.innerWidth

        const refinedTooltipWidth = tooltipRect.width
        let refinedLeft = refinedIconRect.left + refinedIconRect.width / 2 - refinedTooltipWidth / 2
        if (refinedLeft < 8) refinedLeft = 8
        if (refinedLeft + refinedTooltipWidth > refinedViewportWidth - 8) {
          refinedLeft = refinedViewportWidth - refinedTooltipWidth - 8
        }

        setTooltipStyle({
          position: 'fixed',
          left: `${refinedLeft}px`,
          [newPosition === 'top' ? 'bottom' : 'top']: newPosition === 'top' 
            ? `${window.innerHeight - refinedIconRect.top + 8}px`
            : `${refinedIconRect.bottom + 8}px`,
          zIndex: 9999,
          opacity: 1,
          transition: 'opacity 0.1s ease',
        })
      })
    } else {
      setTooltipStyle({})
    }
  }, [isVisible])

  const handleMouseEnter = () => {
    setIsVisible(true)
  }

  const handleMouseLeave = () => {
    setIsVisible(false)
  }

  const handleFocus = () => {
    setIsVisible(true)
  }

  const handleBlur = () => {
    setIsVisible(false)
  }

  return (
    <span className="relative inline-flex items-center" style={{ marginLeft: 'var(--spacing-2)', position: 'relative' }}>
      <button
        ref={iconRef}
        type="button"
        aria-label={ariaLabel || 'More information'}
        aria-describedby={isVisible ? tooltipId : undefined}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 rounded-full"
        style={{
          width: '18px',
          height: '18px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'help',
          color: 'var(--color-text-secondary)',
          outlineColor: 'var(--color-focus-ring)',
          transition: 'color 0.2s ease',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.color = 'var(--color-text-primary)'
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.color = 'var(--color-text-secondary)'
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <circle
            cx="7"
            cy="7"
            r="6"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
          />
          <path
            d="M7 4.5C7.28 4.5 7.5 4.72 7.5 5C7.5 5.28 7.28 5.5 7 5.5C6.72 5.5 6.5 5.28 6.5 5C6.5 4.72 6.72 4.5 7 4.5Z"
            fill="currentColor"
          />
          <path
            d="M7 6.5V9.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
      {isVisible && (
        <div
          ref={tooltipRef}
          id={tooltipId}
          role="tooltip"
          style={{
            ...tooltipStyle,
            width: 'max-content',
            maxWidth: '280px',
            padding: 'var(--spacing-2) var(--spacing-3)',
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            fontSize: 'var(--font-size-sm)',
            lineHeight: 'var(--line-height-normal)',
            color: 'var(--color-text-primary)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            pointerEvents: 'none',
            whiteSpace: 'normal',
          }}
        >
          {tooltipContent}
        </div>
      )}
    </span>
  )
}
