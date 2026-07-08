'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html>
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          background: '#0a0a0a',
          color: '#fafafa',
        }}
      >
        <div style={{ maxWidth: 420, textAlign: 'center', padding: '2rem' }}>
          <div
            style={{
              margin: '0 auto 1.5rem',
              width: 72,
              height: 72,
              borderRadius: '9999px',
              border: '2px dashed rgba(239, 68, 68, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(38, 38, 38, 0.6)',
            }}
          >
            <span style={{ fontSize: 32 }}>⚠️</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.75rem' }}>
            Something Went Wrong
          </h1>
          <p style={{ color: '#a3a3a3', marginBottom: '2rem', lineHeight: 1.5 }}>
            A critical error occurred and this page couldn&apos;t be displayed. Please try again.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button
              onClick={() => reset()}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                border: 'none',
                background: '#fafafa',
                color: '#0a0a0a',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Try Again
            </button>
            <a
              href="/"
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                border: '1px solid #404040',
                color: '#fafafa',
                fontWeight: 600,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              Go Back Home
            </a>
          </div>
        </div>
      </body>
    </html>
  )
}
