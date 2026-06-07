'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  isOpen: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  isLoading = false,
}: Props) {
  const cancelRef = useRef<HTMLButtonElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<Element | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement
      const t = setTimeout(() => cancelRef.current?.focus(), 16)
      return () => clearTimeout(t)
    } else {
      ;(triggerRef.current as HTMLElement | null)?.focus()
      triggerRef.current = null
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onCancel(); return }
      if (e.key !== 'Tab') return
      const modal = modalRef.current
      if (!modal) return
      const focusable = Array.from(
        modal.querySelectorAll<HTMLElement>('button:not([disabled])')
      ).filter(el => el.tabIndex !== -1)
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey ? document.activeElement === first : document.activeElement === last) {
        e.preventDefault()
        ;(e.shiftKey ? last : first).focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, onCancel])

  if (!mounted || !isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      style={{ position: 'fixed', inset: 0, zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
    >
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onCancel}
        style={{ position: 'absolute', inset: 0, background: 'rgba(2,8,16,0.88)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
      />

      {/* Panel */}
      <div
        ref={modalRef}
        style={{
          position: 'relative',
          background: 'var(--bg-subtle)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '1.75rem 2rem',
          maxWidth: '400px',
          width: '100%',
          boxShadow: '0 0 0 1px rgba(255,51,85,0.2), 0 24px 64px rgba(0,0,0,0.85)',
        }}
      >
        {/* Red accent line */}
        <div aria-hidden="true" style={{ position: 'absolute', top: 0, left: '12%', right: '12%', height: '2px', background: 'linear-gradient(90deg, transparent, var(--danger), transparent)', borderRadius: '2px' }} />

        <h2 id="confirm-modal-title" style={{ margin: '0 0 0.5rem', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text)' }}>
          {title}
        </h2>
        <p style={{ margin: '0 0 1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
          {message}
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="btn-ghost"
            style={{ fontSize: '0.875rem' }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.45rem 1.125rem',
              background: 'var(--danger)',
              color: '#fff',
              border: '1.5px solid var(--danger)',
              borderRadius: '4px',
              fontSize: '0.875rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1,
              transition: 'opacity 0.15s, box-shadow 0.15s',
              boxShadow: '0 0 14px rgba(255,51,85,0.4)',
            }}
          >
            {isLoading ? 'Deleting…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
