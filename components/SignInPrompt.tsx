import { signIn } from '@/auth'

interface Props {
  message: string
  callbackUrl?: string
}

export default function SignInPrompt({ message, callbackUrl }: Props) {
  return (
    <div
      style={{
        marginTop: '1rem',
        padding: '0.875rem 1rem',
        background: 'var(--bg-subtle)',
        border: '1px dashed var(--border)',
        borderRadius: '8px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '0.75rem',
        justifyContent: 'space-between',
      }}
    >
      <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{message}</span>
      <form
        action={async () => {
          'use server'
          await signIn('tcss460', callbackUrl ? { redirectTo: callbackUrl } : undefined)
        }}
      >
        <button
          type="submit"
          style={{
            padding: '0.375rem 0.875rem',
            background: 'var(--accent)',
            color: 'var(--accent-text)',
            border: 'none',
            borderRadius: '6px',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Sign in
        </button>
      </form>
    </div>
  )
}