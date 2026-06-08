'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  MediaFilter,
  RecItem,
  drawRecommendation,
  genresFor,
} from '@/lib/recommend'

const TYPE_OPTIONS: { value: MediaFilter; label: string }[] = [
  { value: 'both', label: 'Both' },
  { value: 'movie', label: 'Movies' },
  { value: 'tv', label: 'TV' },
]

// Keep the ball shaking at least this long so the reveal feels earned even when
// the API responds instantly.
const MIN_SHAKE_MS = 1000

interface Props {
  /** Called after a result is picked, so a host (e.g. modal) can scroll into view. */
  onResult?: () => void
}

// Shrink the fortune so short ones fill the ball and long ones stay readable.
// Anything still too tall falls back to scrolling inside the window.
function fitFont(text: string): string {
  const n = text.length
  if (n <= 22) return '1.35rem'
  if (n <= 34) return '1.15rem'
  if (n <= 48) return '1rem'
  if (n <= 70) return '0.88rem'
  return '0.8rem'
}

export default function EightBall({ onResult }: Props) {
  const [mediaType, setMediaType] = useState<MediaFilter>('both')
  const [genre, setGenre] = useState<string | null>(null)
  const [item, setItem] = useState<RecItem | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [shaking, setShaking] = useState(false)
  const [isPending, startDraw] = useTransition()

  const genreOptions = genresFor(mediaType)
  const busy = shaking || isPending

  function changeMediaType(next: MediaFilter) {
    setMediaType(next)
    // Drop the genre if it isn't valid for the new media type.
    if (genre && !genresFor(next).some((g) => g.name === genre)) setGenre(null)
  }

  async function shake(overrides?: { mediaType?: MediaFilter; genre?: string | null }) {
    const effType = overrides?.mediaType ?? mediaType
    const effGenre = overrides && 'genre' in overrides ? overrides.genre! : genre
    if (overrides?.mediaType) setMediaType(overrides.mediaType)
    if (overrides && 'genre' in overrides) setGenre(overrides.genre ?? null)

    setShaking(true)
    setError(null)
    const started = Date.now()

    const result = await drawRecommendation({ mediaType: effType, genre: effGenre ?? null })

    const elapsed = Date.now() - started
    if (elapsed < MIN_SHAKE_MS) await new Promise((r) => setTimeout(r, MIN_SHAKE_MS - elapsed))

    startDraw(() => {
      setShaking(false)
      if (result.ok) {
        setItem(result.item)
        setError(null)
        onResult?.()
      } else {
        setItem(null)
        setError(result.error)
      }
    })
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ margin: '0 0 1.25rem', color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
        Can&apos;t decide? Set the vibe, give it a shake, and let fate pick your next watch.
      </p>

      {/* The ball */}
      <button
        type="button"
        onClick={() => shake()}
        disabled={busy}
        aria-label="Shake the magic 8-ball"
        style={ballButton}
      >
        <span className={shaking ? 'eightball-shake' : undefined} style={ballOuter}>
          <span style={ballWindow}>
            {shaking ? (
              <span style={{ fontSize: '1.8rem', letterSpacing: '0.1em', opacity: 0.9 }}>•••</span>
            ) : item ? (
              <div className="eightball-scroll">
                <span style={{ ...ballVerdict, fontSize: fitFont(item.verdict) }}>
                  {item.verdict}
                </span>
              </div>
            ) : (
              <span style={{ fontSize: '6.5rem', fontWeight: 900, lineHeight: 1 }}>8</span>
            )}
          </span>
        </span>
      </button>

      {/* Filters */}
      <div style={controls}>
        <div style={segmented} role="group" aria-label="Media type">
          {TYPE_OPTIONS.map((opt) => {
            const active = mediaType === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => changeMediaType(opt.value)}
                style={{
                  ...segButton,
                  background: active ? 'var(--accent)' : 'transparent',
                  color: active ? 'var(--accent-text)' : 'var(--text)',
                  fontWeight: active ? 700 : 600,
                }}
              >
                {opt.label}
              </button>
            )
          })}
        </div>

        <select
          value={genre ?? ''}
          onChange={(e) => setGenre(e.target.value || null)}
          aria-label="Genre"
          style={select}
        >
          <option value="">Any genre</option>
          {genreOptions.map((g) => (
            <option key={g.name} value={g.name}>
              {g.label}
            </option>
          ))}
        </select>

        <button type="button" onClick={() => shake()} disabled={busy} className="btn-primary">
          {shaking ? 'Shaking…' : item ? 'Shake again' : 'Shake'}
        </button>
      </div>

      {/* Result */}
      {error && <p style={{ color: 'var(--error)', marginTop: '1.5rem', fontWeight: 600 }}>{error}</p>}

      {item && !shaking && (
        <Link href={`/media/${item.type}/${item.id}`} style={resultCard}>
          {item.posterUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.posterUrl} alt={item.title} style={resultPoster} />
          ) : (
            <div style={{ ...resultPoster, ...posterPlaceholder }}>No poster</div>
          )}
          <div style={{ textAlign: 'left', flex: 1, minWidth: 0 }}>
            <p style={resultTitle}>{item.title}</p>
            <p style={resultMeta}>
              {[
                item.type === 'tv' ? 'TV' : 'Movie',
                item.year,
                item.voteAverage ? `★ ${item.voteAverage.toFixed(1)}` : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
            {item.overview && <p style={resultOverview}>{item.overview}</p>}
            <span style={resultLink}>View details →</span>
          </div>
        </Link>
      )}
    </div>
  )
}

/* ---- styles ---- */

const ballButton: React.CSSProperties = {
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  padding: 0,
  marginBottom: '1.5rem',
}

const ballOuter: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '260px',
  height: '260px',
  borderRadius: '50%',
  background: 'radial-gradient(circle at 35% 28%, #243240 0%, #0a0e14 55%, #000 100%)',
  border: '1.5px solid rgba(0,212,255,0.40)',
  boxShadow:
    '0 0 36px rgba(0,212,255,0.30), 0 12px 36px rgba(0,0,0,0.8), inset -10px -12px 30px rgba(0,0,0,0.7)',
}

const ballWindow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  width: '190px',
  height: '190px',
  borderRadius: '50%',
  overflow: 'hidden',
  background: 'radial-gradient(circle at 50% 38%, #00465c 0%, #021018 82%)',
  color: '#7ff0ff',
  padding: '0 1.1rem',
  textShadow: '0 0 12px rgba(0,212,255,0.95)',
  boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.8), 0 0 14px rgba(0,212,255,0.25)',
}

const ballVerdict: React.CSSProperties = {
  fontSize: '1.05rem',
  fontWeight: 700,
  lineHeight: 1.3,
  overflowWrap: 'anywhere',
}

const controls: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.6rem',
  justifyContent: 'center',
  alignItems: 'center',
}

const segmented: React.CSSProperties = {
  display: 'inline-flex',
  border: '1px solid var(--border)',
  borderRadius: '6px',
  overflow: 'hidden',
  background: 'var(--card-bg)',
}

const segButton: React.CSSProperties = {
  border: 'none',
  padding: '0.5rem 0.95rem',
  fontSize: '0.85rem',
  cursor: 'pointer',
}

const select: React.CSSProperties = {
  padding: '0.5rem 0.8rem',
  border: '1px solid var(--input-border)',
  borderRadius: '6px',
  fontSize: '0.85rem',
  background: 'var(--input-bg)',
  color: 'var(--input-text)',
  fontWeight: 600,
}

const resultCard: React.CSSProperties = {
  display: 'flex',
  gap: '1.25rem',
  marginTop: '1.75rem',
  padding: '1rem',
  border: '1px solid var(--border)',
  borderRadius: '10px',
  background: 'var(--card-bg)',
  textDecoration: 'none',
  color: 'inherit',
  textAlign: 'left',
  maxWidth: '560px',
  marginLeft: 'auto',
  marginRight: 'auto',
}

const resultPoster: React.CSSProperties = {
  width: '110px',
  aspectRatio: '2/3',
  objectFit: 'cover',
  borderRadius: '8px',
  flexShrink: 0,
}

const posterPlaceholder: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'var(--placeholder-bg)',
  color: 'var(--text-faint)',
  fontSize: '0.75rem',
}

const resultTitle: React.CSSProperties = {
  margin: '0 0 0.25rem',
  fontSize: '1.15rem',
  fontWeight: 700,
  lineHeight: 1.25,
  color: 'var(--text)',
}

const resultMeta: React.CSSProperties = {
  margin: '0 0 0.6rem',
  fontSize: '0.82rem',
  color: 'var(--text-secondary)',
  fontWeight: 600,
}

const resultOverview: React.CSSProperties = {
  margin: '0 0 0.7rem',
  fontSize: '0.85rem',
  color: 'var(--text-secondary)',
  lineHeight: 1.5,
  display: '-webkit-box',
  WebkitLineClamp: 3,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
}

const resultLink: React.CSSProperties = {
  fontSize: '0.85rem',
  fontWeight: 700,
  color: 'var(--accent)',
}