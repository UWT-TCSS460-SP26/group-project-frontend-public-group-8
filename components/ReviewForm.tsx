'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { submitReview } from '@/lib/actions'

const HEADER_MAX = 200
const CONTENT_MAX = 5000

interface Props {
  titleId: number
  mediaType: 'movie' | 'tv'
}

export default function ReviewForm({ titleId, mediaType }: Props) {
  const router = useRouter()
  const [header, setHeader] = useState('')
  const [content, setContent] = useState('')
  const [fieldErr, setFieldErr] = useState<{ header?: string; content?: string }>({})
  const [globalErr, setGlobalErr] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [pending, startTransition] = useTransition()
  const successRef = useRef<HTMLParagraphElement | null>(null)
  const contentRef = useRef<HTMLTextAreaElement | null>(null)
  const headerRef = useRef<HTMLInputElement | null>(null)

  function validate() {
    const next: { header?: string; content?: string } = {}
    if (!content.trim()) next.content = 'Review content is required.'
    else if (content.length > CONTENT_MAX) next.content = `Must be ${CONTENT_MAX} characters or fewer.`
    if (header.length > HEADER_MAX) next.header = `Title must be ${HEADER_MAX} characters or fewer.`
    return next
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setGlobalErr(null)
    setSuccess(false)
    const v = validate()
    setFieldErr(v)
    if (v.content) {
      contentRef.current?.focus()
      return
    }
    if (v.header) {
      headerRef.current?.focus()
      return
    }

    startTransition(async () => {
      const res = await submitReview({
        titleId,
        mediaType,
        content,
        header: header || undefined,
      })
      if (res.ok) {
        setHeader('')
        setContent('')
        setSuccess(true)
        setTimeout(() => successRef.current?.focus(), 0)
        router.refresh()
      } else {
        setGlobalErr(res.error)
      }
    })
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      aria-label="Write a review"
      style={{
        marginTop: '1.5rem',
        padding: '1.25rem',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
      }}
    >
      <h3 style={{ margin: '0 0 0.875rem', fontSize: '1.05rem' }}>Write a review</h3>

      {success && (
        <p
          ref={successRef}
          tabIndex={-1}
          role="status"
          style={{
            margin: '0 0 0.875rem',
            padding: '0.625rem 0.875rem',
            background: 'rgba(56, 189, 248, 0.1)',
            border: '1px solid var(--accent)',
            borderRadius: '6px',
            color: 'var(--text)',
            fontSize: '0.875rem',
          }}
        >
          <strong>Thanks!</strong> Your review was posted.
        </p>
      )}

      {globalErr && (
        <p
          role="alert"
          style={{
            margin: '0 0 0.875rem',
            padding: '0.625rem 0.875rem',
            background: 'rgba(248, 113, 113, 0.1)',
            border: '1px solid var(--error)',
            borderRadius: '6px',
            color: 'var(--error)',
            fontSize: '0.875rem',
          }}
        >
          {globalErr}
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '0.875rem' }}>
        <label htmlFor="rev-header" style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.375rem' }}>
          Title <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
        </label>
        <input
          ref={headerRef}
          id="rev-header"
          name="header"
          type="text"
          value={header}
          onChange={(e) => {
            setHeader(e.target.value)
            if (fieldErr.header) setFieldErr((p) => ({ ...p, header: undefined }))
          }}
          maxLength={HEADER_MAX}
          placeholder="Short headline"
          aria-invalid={fieldErr.header ? 'true' : undefined}
          aria-describedby={fieldErr.header ? 'rev-header-err' : 'rev-header-count'}
          style={inputStyle(!!fieldErr.header)}
        />
        <span id="rev-header-count" style={counterStyle(header.length, HEADER_MAX)}>
          {header.length} / {HEADER_MAX}
        </span>
        {fieldErr.header && (
          <span id="rev-header-err" style={errStyle}>
            {fieldErr.header}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '0.875rem' }}>
        <label htmlFor="rev-content" style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.375rem' }}>
          Review <span style={{ color: 'var(--error)' }} aria-hidden="true">*</span>
        </label>
        <textarea
          ref={contentRef}
          id="rev-content"
          name="content"
          required
          rows={5}
          value={content}
          onChange={(e) => {
            setContent(e.target.value)
            if (fieldErr.content) setFieldErr((p) => ({ ...p, content: undefined }))
          }}
          maxLength={CONTENT_MAX}
          placeholder="What did you think?"
          aria-invalid={fieldErr.content ? 'true' : undefined}
          aria-describedby={fieldErr.content ? 'rev-content-err' : 'rev-content-count'}
          style={{ ...inputStyle(!!fieldErr.content), resize: 'vertical', minHeight: '90px', fontFamily: 'inherit' }}
        />
        <span id="rev-content-count" style={counterStyle(content.length, CONTENT_MAX)}>
          {content.length} / {CONTENT_MAX}
        </span>
        {fieldErr.content && (
          <span id="rev-content-err" style={errStyle}>
            {fieldErr.content}
          </span>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        style={{
          background: 'var(--accent)',
          color: 'var(--accent-text)',
          border: 'none',
          borderRadius: '8px',
          padding: '0.625rem 1.25rem',
          fontSize: '0.95rem',
          fontWeight: 700,
          cursor: pending ? 'wait' : 'pointer',
          opacity: pending ? 0.7 : 1,
        }}
      >
        {pending ? 'Posting…' : 'Post review'}
      </button>
    </form>
  )
}

function inputStyle(invalid: boolean): React.CSSProperties {
  return {
    background: 'var(--input-bg)',
    border: `1px solid ${invalid ? 'var(--error)' : 'var(--input-border)'}`,
    borderRadius: '8px',
    padding: '0.625rem 0.75rem',
    color: 'var(--input-text)',
    font: 'inherit',
    fontSize: '0.95rem',
  }
}
function counterStyle(len: number, max: number): React.CSSProperties {
  return {
    fontSize: '0.75rem',
    textAlign: 'right',
    color: len >= max * 0.9 ? 'var(--error)' : 'var(--text-muted)',
    marginTop: '0.25rem',
  }
}
const errStyle: React.CSSProperties = {
  color: 'var(--error)',
  fontSize: '0.8rem',
  marginTop: '0.375rem',
}