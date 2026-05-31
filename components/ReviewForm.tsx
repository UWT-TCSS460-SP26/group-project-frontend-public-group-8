'use client'

import { useState } from 'react'

interface ReviewFormProps {
  initialHeader?: string
  initialContent?: string
  submitting?: boolean
  error?: string | null
  onSubmit: (header: string, content: string) => void
  onCancel?: () => void
  submitLabel?: string
}

export default function ReviewForm({
  initialHeader = '',
  initialContent = '',
  submitting = false,
  error = null,
  onSubmit,
  onCancel,
  submitLabel = 'Post Review',
}: ReviewFormProps) {
  const [header, setHeader] = useState(initialHeader)
  const [content, setContent] = useState(initialContent)
  const [touched, setTouched] = useState(false)

  const contentError = touched && content.trim().length === 0 ? 'Review text is required.' : null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setTouched(true)
    if (!content.trim()) return
    onSubmit(header.trim(), content.trim())
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div style={{ marginBottom: '0.75rem' }}>
        <label
          htmlFor="review-header"
          style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.3rem' }}
        >
          Title <span style={{ color: 'var(--text-faint)', fontWeight: 400 }}>(optional)</span>
        </label>
        <input
          id="review-header"
          type="text"
          value={header}
          onChange={(e) => setHeader(e.target.value)}
          placeholder="e.g. A must-watch"
          disabled={submitting}
          style={{
            width: '100%',
            padding: '0.5rem 0.75rem',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            background: 'var(--bg)',
            color: 'var(--text)',
            fontSize: '0.9rem',
          }}
        />
      </div>

      <div style={{ marginBottom: '0.75rem' }}>
        <label
          htmlFor="review-content"
          style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.3rem' }}
        >
          Review <span style={{ color: 'var(--error)', fontSize: '0.8rem' }}>*</span>
        </label>
        <textarea
          id="review-content"
          value={content}
          onChange={(e) => { setContent(e.target.value); setTouched(true) }}
          placeholder="Share your thoughts…"
          rows={4}
          disabled={submitting}
          aria-describedby={contentError ? 'review-content-error' : undefined}
          aria-invalid={!!contentError}
          style={{
            width: '100%',
            padding: '0.5rem 0.75rem',
            border: `1px solid ${contentError ? 'var(--error)' : 'var(--border)'}`,
            borderRadius: '6px',
            background: 'var(--bg)',
            color: 'var(--text)',
            fontSize: '0.9rem',
            resize: 'vertical',
          }}
        />
        {contentError && (
          <p id="review-content-error" role="alert" style={{ color: 'var(--error)', fontSize: '0.8rem', margin: '0.25rem 0 0' }}>
            {contentError}
          </p>
        )}
      </div>

      {error && (
        <p role="alert" style={{ color: 'var(--error)', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
          {error}
        </p>
      )}

      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: '0.5rem 1.25rem',
            background: 'var(--accent)',
            color: 'var(--accent-text)',
            border: 'none',
            borderRadius: '6px',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: submitting ? 'wait' : 'pointer',
            opacity: submitting ? 0.7 : 1,
          }}
        >
          {submitting ? 'Saving…' : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            style={{
              padding: '0.5rem 1rem',
              background: 'transparent',
              color: 'var(--text-muted)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
