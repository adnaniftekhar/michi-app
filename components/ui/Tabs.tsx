'use client'

import { ReactNode, useState } from 'react'
import clsx from 'clsx'

interface Tab {
  id: string
  label: string
  content: ReactNode
}

interface TabsProps {
  tabs: Tab[]
  defaultTab?: string
}

export function Tabs({ tabs, defaultTab }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id)

  const activeTabContent = tabs.find((tab) => tab.id === activeTab)?.content

  return (
    <div>
        <div
          role="tablist"
          className="flex gap-1"
          style={{ 
            marginBottom: 'var(--spacing-6)',
            borderBottom: '1px solid var(--color-border-subtle)',
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`tabpanel-${tab.id}`}
              id={`tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'px-4 py-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
                activeTab === tab.id
                  ? 'border-b-2'
                  : 'hover:opacity-80'
              )}
              style={{
                fontSize: 'var(--font-size-base)',
                fontWeight: activeTab === tab.id ? 'var(--font-weight-semibold)' : 'var(--font-weight-normal)',
                color: activeTab === tab.id ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                borderBottomColor: activeTab === tab.id ? 'var(--color-michi-green)' : 'transparent',
                borderBottomWidth: activeTab === tab.id ? '2px' : '0',
                outlineColor: 'var(--color-focus-ring)',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      <div
        role="tabpanel"
        id={`tabpanel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
      >
        {activeTabContent}
      </div>
    </div>
  )
}

