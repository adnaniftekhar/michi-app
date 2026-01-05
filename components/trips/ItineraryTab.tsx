'use client'

import { useState } from 'react'
import type { ItineraryItem } from '@/types'
import { Section } from '../ui/Section'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Input } from '../ui/Input'
import { EmptyState } from '../ui/EmptyState'
import { showToast } from '../ui/Toast'

interface ItineraryTabProps {
  itinerary: ItineraryItem[]
  onUpdate: (items: ItineraryItem[]) => void
  timezone: string
}

export function ItineraryTab({ itinerary, onUpdate, timezone }: ItineraryTabProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: timezone,
    }) + ` (${timezone})`
  }

  const handleAddItem = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    const dateTime = formData.get('dateTime') as string
    const title = formData.get('title') as string
    const location = formData.get('location') as string
    const notes = formData.get('notes') as string

    const newItem: ItineraryItem = {
      id: `itinerary-${Date.now()}`,
      dateTime: new Date(dateTime).toISOString(),
      title,
      location,
      notes,
      createdAt: new Date().toISOString(),
    }

    const updated = [...itinerary, newItem].sort(
      (a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
    )
    onUpdate(updated)
    setShowForm(false)
    form.reset()
    showToast('Itinerary item added', 'success')
  }

  const handleEditItem = (item: ItineraryItem) => {
    setEditingItemId(item.id)
  }

  const handleSaveItem = (e: React.FormEvent<HTMLFormElement>, itemId: string) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    const dateTime = formData.get('dateTime') as string
    const title = formData.get('title') as string
    const location = formData.get('location') as string
    const notes = formData.get('notes') as string

    const updated = itinerary.map(item =>
      item.id === itemId
        ? { ...item, dateTime: new Date(dateTime).toISOString(), title, location, notes }
        : item
    ).sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())
    
    onUpdate(updated)
    setEditingItemId(null)
    showToast('Itinerary item updated', 'success')
  }

  const handleDeleteItem = (itemId: string) => {
    if (confirm('Are you sure you want to delete this itinerary item?')) {
      const updated = itinerary.filter(item => item.id !== itemId)
      onUpdate(updated)
      showToast('Itinerary item deleted', 'success')
    }
  }

  return (
    <Section
      title="Itinerary"
      description={`Items sorted by date and time (${timezone})`}
      action={
        !showForm && (
          <Button onClick={() => setShowForm(true)}>Add Item</Button>
        )
      }
      emptyState={{
        message: 'No itinerary items yet. Add your first item to get started.',
        action: !showForm && (
          <Button onClick={() => setShowForm(true)}>Add Item</Button>
        ),
      }}
      isEmpty={!showForm && itinerary.length === 0}
    >
      {showForm && (
        <Card className="mb-6">
          <form onSubmit={handleAddItem} className="space-y-4">
            <Input
              label="Date & Time (Local)"
              type="datetime-local"
              name="dateTime"
              required
            />
            <Input
              label="Title"
              type="text"
              name="title"
              required
            />
            <Input
              label="Location"
              type="text"
              name="location"
              required
            />
            <div>
              <label
                htmlFor="notes"
                className="block mb-2 font-medium text-sm"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                className="w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{
                  padding: 'var(--spacing-2) var(--spacing-3)',
                  fontSize: 'var(--font-size-base)',
                  lineHeight: 'var(--line-height-normal)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-text-primary)',
                  outlineColor: 'var(--color-focus-ring)',
                }}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit">Add</Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}
      {itinerary.length > 0 && (
        <div className="space-y-3">
          {itinerary.map((item) => (
            <Card key={item.id}>
              {editingItemId === item.id ? (
                <form onSubmit={(e) => handleSaveItem(e, item.id)} className="space-y-3">
                  <Input
                    label="Date & Time (Local)"
                    type="datetime-local"
                    name="dateTime"
                    defaultValue={new Date(item.dateTime).toISOString().slice(0, 16)}
                    required
                  />
                  <Input
                    label="Title"
                    type="text"
                    name="title"
                    defaultValue={item.title}
                    required
                  />
                  <Input
                    label="Location"
                    type="text"
                    name="location"
                    defaultValue={item.location}
                    required
                  />
                  <div>
                    <label
                      htmlFor={`notes-${item.id}`}
                      className="block mb-2 font-medium text-sm"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      Notes
                    </label>
                    <textarea
                      id={`notes-${item.id}`}
                      name="notes"
                      rows={3}
                      defaultValue={item.notes}
                      className="w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                      style={{
                        padding: 'var(--spacing-2) var(--spacing-3)',
                        fontSize: 'var(--font-size-base)',
                        lineHeight: 'var(--line-height-normal)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--color-surface)',
                        color: 'var(--color-text-primary)',
                        outlineColor: 'var(--color-focus-ring)',
                      }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" size="sm">Save</Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setEditingItemId(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div
                        className="font-semibold mb-2"
                        style={{
                          fontSize: 'var(--font-size-base)',
                          lineHeight: 'var(--line-height-tight)',
                        }}
                      >
                        {item.title}
                      </div>
                      <div
                        className="text-sm mb-2"
                        style={{
                          color: 'var(--color-text-secondary)',
                          lineHeight: 'var(--line-height-normal)',
                        }}
                      >
                        {formatDateTime(item.dateTime)} • {item.location}
                      </div>
                      {item.notes && (
                        <div
                          className="text-sm mt-2 pt-2 border-t"
                          style={{
                            color: 'var(--color-text-primary)',
                            borderColor: 'var(--color-border)',
                            lineHeight: 'var(--line-height-normal)',
                          }}
                        >
                          {item.notes}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleEditItem(item)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteItem(item.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </Card>
          ))}
        </div>
      )}
    </Section>
  )
}

