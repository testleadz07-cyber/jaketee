'use client'

import { apiFetch as fetch } from '@/lib/api-fetch'

import { Suspense, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Loader2, MailCheck } from 'lucide-react'
import { Header } from '@/components/header'
import { PageLoading } from '@/components/page-loading'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

function ClaimOrdersContent() {
  const { data: session, status } = useSession()
  const userId = (session?.user as { id?: string } | undefined)?.id
  const router = useRouter()
  const params = useSearchParams()
  const token = params.get('token') || ''
  const linkError = /^[a-f0-9]{64}$/.test(token) ? '' : 'This verification link is invalid. Request a new link from your account.'
  const { toast } = useToast()
  const attempted = useRef('')
  const [attempt, setAttempt] = useState(0)
  const [retryable, setRetryable] = useState(false)
  const [error, setError] = useState('')
  const [working, setWorking] = useState(false)

  useEffect(() => {
    const key = `${userId}:${token}:${attempt}`
    if (status !== 'authenticated' || !userId) { attempted.current = ''; return }
    if (attempted.current === key) return
    attempted.current = key
    if (linkError) return
    const claim = async () => {
      setWorking(true)
      setError('')
      setRetryable(false)
      try {
        const response = await fetch('/api/orders/claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'confirm', token }),
          signal: AbortSignal.timeout(30000),
        })
        const result = await response.json().catch(() => ({}))
        if (attempted.current !== key) return
        if (!response.ok) setRetryable(response.status >= 500 || response.status === 429)
        if (!response.ok) throw new Error(result.error || 'Could not link orders. Please retry.')
        toast({ title: result.alreadyLinked ? 'Orders already linked' : 'Orders linked', description: `${result.claimed} guest order${result.claimed === 1 ? '' : 's'} added to your account.` })
        router.replace('/profile?tab=orders')
      } catch (cause) {
        if (attempted.current !== key) return
        if (cause instanceof Error && ['TimeoutError', 'TypeError'].includes(cause.name)) setRetryable(true)
        setError(cause instanceof Error && cause.name !== 'TimeoutError' ? cause.message : 'Verification timed out. Retry to check this same link safely.')
      } finally {
        if (attempted.current === key) setWorking(false)
      }
    }
    void claim()
  }, [status, userId, token, linkError, router, toast, attempt])

  const loginUrl = `/login?callbackUrl=${encodeURIComponent(`/profile/claim-orders?token=${token}`)}`
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-4 px-4 py-12 text-center">
        <MailCheck className="h-9 w-9" aria-hidden="true" />
        <h1 className="text-2xl font-semibold">Link guest orders</h1>
        {status === 'loading' || (status === 'authenticated' && working) ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Verifying your orders...</div>
        ) : status === 'unauthenticated' ? (
          <>
            <p className="text-sm text-muted-foreground">Sign in to the account that requested this verification link.</p>
            <Button asChild><Link href={loginUrl}>Sign In</Link></Button>
          </>
        ) : error || linkError ? (
          <>
            <p role="alert" className="text-sm text-destructive">{error || linkError}</p>
            {retryable && <Button onClick={() => setAttempt(value => value + 1)}>Retry verification</Button>}
            <Button asChild variant="outline"><Link href="/profile?tab=orders">Request a new link / Back to orders</Link></Button>
          </>
        ) : null}
      </main>
    </div>
  )
}

export default function ClaimOrdersPage() {
  return <Suspense fallback={<PageLoading label="Preparing order linking…" />}><ClaimOrdersContent /></Suspense>
}
