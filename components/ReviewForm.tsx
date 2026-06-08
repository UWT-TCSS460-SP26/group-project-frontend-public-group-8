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

  function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault()
    setTouched(true)
    if (!content.trim()) return
    onSubmit(header.trim(), content.trim())
  }

  const inputStyle: React.CSSProperties = {
    width:        '100%',
    padding:      '0.5rem 0.75rem',
    borderWidth:  '1px',
    borderStyle:  'solid',
    borderColor:  'var(--input-border)',
    borderRadius: '6px',
    background:   'var(--bg)',
    color:        'var(--text)',
    fontSize:     '0.9rem',
    fontFamily:   'inherit',
    transition:   'border-color 0.15s, box-shadow 0.15s',
    outline:      'none',
    boxSizing:    'border-box',
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div style={{ marginBottom: '0.75rem' }}>
        <label htmlFor="review-header"
          style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.3rem', letterSpacing: '0.03em' }}>
          Title{' '}
          <span style={{ color: 'var(--text-faint)', fontWeight: 400 }}>(optional)</span>
        </label>
        <input
          id="review-header"
          type="text"
          value={header}
          onChange={e => setHeader(e.target.value)}
          placeholder="e.g. A must-watch"
          disabled={submitting}
          style={inputStyle}
          onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 0 0 2px var(--accent-ring)' }}
          onBlur={e => { e.currentTarget.style.borderColor = 'var(--input-border)'; e.currentTarget.style.boxShadow = 'none' }}
        />
      </div>

      <div style={{ marginBottom: '0.75rem' }}>
        <label htmlFor="review-content"
          style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.3rem', letterSpacing: '0.03em' }}>
          Review{' '}
          <span style={{ color: 'var(--error)', fontSize: '0.78rem' }}>*</span>
        </label>
        <textarea
          id="review-content"
          value={content}
          onChange={e => { setContent(e.target.value); setTouched(true) }}
          placeholder="Share your thoughts…"
          rows={4}
          disabled={submitting}
          aria-describedby={contentError ? 'review-content-error' : undefined}
          aria-invalid={!!contentError}
          style={{
            ...inputStyle,
            borderColor: contentError ? 'var(--error)' : 'var(--input-border)',
            resize:      'vertical',
          }}
          onFocus={e => { e.currentTarget.style.borderColor = contentError ? 'var(--error)' : 'var(--accent)'; e.currentTarget.style.boxShadow = '0 0 0 2px var(--accent-ring)' }}
          onBlur={e => { e.currentTarget.style.borderColor = contentError ? 'var(--error)' : 'var(--input-border)'; e.currentTarget.style.boxShadow = 'none' }}
        />
        {contentError && (
          <p id="review-content-error" role="alert"
            style={{ color: 'var(--error)', fontSize: '0.78rem', margin: '0.25rem 0 0' }}>
            {contentError}
          </p>
        )}
      </div>

      {error && (
        <p role="alert" style={{ color: 'var(--error)', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
          {error}
        </p>
      )}

      <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center' }}>
        <button type="submit" disabled={submitting} className="btn-primary"
          style={{ opacity: submitting ? 0.65 : 1, cursor: submitting ? 'wait' : 'pointer' }}>
          {submitting ? 'Saving…' : submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} disabled={submitting} className="btn-ghost">
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
