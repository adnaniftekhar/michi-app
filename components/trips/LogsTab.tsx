'use client'

import { useState } from 'react'
import type { ActivityLog, Artifact } from '@/types'
import { Section } from '../ui/Section'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Badge } from '../ui/Badge'
import { EmptyState } from '../ui/EmptyState'
import { showToast } from '../ui/Toast'

interface LogsTabProps {
  activityLogs: ActivityLog[]
  onUpdate: (logs: ActivityLog[]) => void
  timezone: string
}

export function LogsTab({ activityLogs, onUpdate, timezone }: LogsTabProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingLogId, setEditingLogId] = useState<string | null>(null)

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

  const handleAddLog = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    const dateTime = formData.get('dateTime') as string
    const title = formData.get('title') as string
    const notes = formData.get('notes') as string
    const tags = (formData.get('tags') as string)
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
    const artifactType = formData.get('artifactType') as Artifact['type'] | ''
    const artifactUrl = formData.get('artifactUrl') as string
    const artifactText = formData.get('artifactText') as string

    const artifacts: Artifact[] = []
    if (artifactType === 'LINK' && artifactUrl) {
      artifacts.push({
        id: `artifact-${Date.now()}`,
        type: 'LINK',
        url: artifactUrl,
        createdAt: new Date().toISOString(),
      })
    } else if (artifactType === 'NOTE' && artifactText) {
      artifacts.push({
        id: `artifact-${Date.now()}`,
        type: 'NOTE',
        text: artifactText,
        createdAt: new Date().toISOString(),
      })
    }

    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      dateTime: new Date(dateTime).toISOString(),
      title,
      notes,
      tags,
      artifacts,
      createdAt: new Date().toISOString(),
    }

    const updated = [...activityLogs, newLog].sort(
      (a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()
    )
    onUpdate(updated)
    setShowForm(false)
    form.reset()
    showToast('Activity log added', 'success')
  }

  const handleEditLog = (log: ActivityLog) => {
    setEditingLogId(log.id)
  }

  const handleSaveLog = (e: React.FormEvent<HTMLFormElement>, logId: string) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    const dateTime = formData.get('dateTime') as string
    const title = formData.get('title') as string
    const notes = formData.get('notes') as string
    const tags = (formData.get('tags') as string)
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
    const artifactType = formData.get('artifactType') as Artifact['type'] | ''
    const artifactUrl = formData.get('artifactUrl') as string
    const artifactText = formData.get('artifactText') as string

    const artifacts: Artifact[] = []
    if (artifactType === 'LINK' && artifactUrl) {
      artifacts.push({
        id: `artifact-${Date.now()}`,
        type: 'LINK',
        url: artifactUrl,
        createdAt: new Date().toISOString(),
      })
    } else if (artifactType === 'NOTE' && artifactText) {
      artifacts.push({
        id: `artifact-${Date.now()}`,
        type: 'NOTE',
        text: artifactText,
        createdAt: new Date().toISOString(),
      })
    }

    const updated = activityLogs.map(log =>
      log.id === logId
        ? { ...log, dateTime: new Date(dateTime).toISOString(), title, notes, tags, artifacts }
        : log
    ).sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())
    
    onUpdate(updated)
    setEditingLogId(null)
    showToast('Activity log updated', 'success')
  }

  const handleDeleteLog = (logId: string) => {
    if (confirm('Are you sure you want to delete this activity log?')) {
      const updated = activityLogs.filter(log => log.id !== logId)
      onUpdate(updated)
      showToast('Activity log deleted', 'success')
    }
  }

  return (
    <Section
      title="Activity Logs"
      description={`Document your learning activities (${timezone})`}
      action={
        !showForm && (
          <Button onClick={() => setShowForm(true)}>Add Log</Button>
        )
      }
      emptyState={{
        message: 'No activity logs yet. Add your first log to track your learning.',
        action: !showForm && (
          <Button onClick={() => setShowForm(true)}>Add Log</Button>
        ),
      }}
      isEmpty={!showForm && activityLogs.length === 0}
    >
      {showForm && (
        <Card className="mb-6">
          <form onSubmit={handleAddLog} className="space-y-4">
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
            <Input
              label="Tags (comma-separated)"
              type="text"
              name="tags"
              helperText="Separate multiple tags with commas"
            />
            <Select
              label="Artifact Type"
              name="artifactType"
              options={[
                { value: '', label: 'None' },
                { value: 'LINK', label: 'LINK' },
                { value: 'NOTE', label: 'NOTE' },
              ]}
            />
            <Input
              label="Artifact URL (if LINK)"
              type="url"
              name="artifactUrl"
            />
            <div>
              <label
                htmlFor="artifactText"
                className="block mb-2 font-medium text-sm"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Artifact Text (if NOTE)
              </label>
              <textarea
                id="artifactText"
                name="artifactText"
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
      {activityLogs.length > 0 && (
        <div className="space-y-4">
          {activityLogs.map((log) => (
            <Card key={log.id}>
              {editingLogId === log.id ? (
                <form onSubmit={(e) => handleSaveLog(e, log.id)} className="space-y-4">
                  <Input
                    label="Date & Time (Local)"
                    type="datetime-local"
                    name="dateTime"
                    defaultValue={new Date(log.dateTime).toISOString().slice(0, 16)}
                    required
                  />
                  <Input
                    label="Title"
                    type="text"
                    name="title"
                    defaultValue={log.title}
                    required
                  />
                  <div>
                    <label
                      htmlFor={`notes-${log.id}`}
                      className="block mb-2 font-medium text-sm"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      Notes
                    </label>
                    <textarea
                      id={`notes-${log.id}`}
                      name="notes"
                      rows={3}
                      defaultValue={log.notes}
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
                  <Input
                    label="Tags (comma-separated)"
                    type="text"
                    name="tags"
                    defaultValue={log.tags.join(', ')}
                    helperText="Separate multiple tags with commas"
                  />
                  <Select
                    label="Artifact Type"
                    name="artifactType"
                    options={[
                      { value: '', label: 'None' },
                      { value: 'LINK', label: 'LINK' },
                      { value: 'NOTE', label: 'NOTE' },
                    ]}
                    defaultValue={log.artifacts[0]?.type || ''}
                  />
                  <Input
                    label="Artifact URL (if LINK)"
                    type="url"
                    name="artifactUrl"
                    defaultValue={log.artifacts.find(a => a.type === 'LINK')?.url || ''}
                  />
                  <div>
                    <label
                      htmlFor={`artifactText-${log.id}`}
                      className="block mb-2 font-medium text-sm"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      Artifact Text (if NOTE)
                    </label>
                    <textarea
                      id={`artifactText-${log.id}`}
                      name="artifactText"
                      rows={3}
                      defaultValue={log.artifacts.find(a => a.type === 'NOTE')?.text || ''}
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
                      onClick={() => setEditingLogId(null)}
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
                        {log.title}
                      </div>
                      <div
                        className="text-sm mb-3"
                        style={{
                          color: 'var(--color-text-secondary)',
                          lineHeight: 'var(--line-height-normal)',
                        }}
                      >
                        {formatDateTime(log.dateTime)}
                      </div>
                      {log.notes && (
                        <div
                          className="mb-3 text-sm"
                          style={{
                            color: 'var(--color-text-primary)',
                            lineHeight: 'var(--line-height-normal)',
                          }}
                        >
                          {log.notes}
                        </div>
                      )}
                      {log.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {log.tags.map((tag) => (
                            <Badge key={tag} variant="default">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {log.artifacts.length > 0 && (
                        <div className="mt-3 pt-3 border-t space-y-2" style={{ borderColor: 'var(--color-border)' }}>
                          {log.artifacts.map((artifact) => (
                            <Card key={artifact.id} className="p-3">
                              {artifact.type === 'LINK' && artifact.url && (
                                <a
                                  href={artifact.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm break-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                                  style={{
                                    color: 'var(--color-primary)',
                                    outlineColor: 'var(--color-focus-ring)',
                                  }}
                                >
                                  {artifact.url}
                                </a>
                              )}
                              {artifact.type === 'NOTE' && artifact.text && (
                                <div
                                  className="text-sm"
                                  style={{
                                    color: 'var(--color-text-primary)',
                                    lineHeight: 'var(--line-height-normal)',
                                  }}
                                >
                                  {artifact.text}
                                </div>
                              )}
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleEditLog(log)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteLog(log.id)}
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

