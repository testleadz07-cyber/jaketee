'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Loader2, MailCheck } from 'lucide-react'
import { Header } from '@/components/header'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

function ClaimOrdersContent() {
  const { status } = useSession()
  const router = useRouter()
  const params = useSearchParams()
  const token = params.get('token') || ''
  const linkError = /^[a-f0-9]{64}$/.test(token) ? '' : 'This verification link is invalid. Request a new link from your account.'
  const { toast } = useToast()
  const attempted = useRef(false)
  const [error, setError] = useState('')
  const [working, setWorking] = useState(false)

  useEffect(() => {
    if (status !== 'authenticated' || attempted.current) return
    attempted.current = true
    if (linkError) return
    const claim = async () => {
      setWorking(true)
      try {
        const response = await fetch('/api/orders/claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'confirm', token }),
        })
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Could not link orders')
        toast({ title: 'Orders linked', description: `${result.claimed} guest order${result.claimed === 1 ? '' : 's'} added to your account.` })
        router.replace('/profile?tab=orders')
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Could not link orders')
      } finally {
        setWorking(false)
      }
    }
    void claim()
  }, [status, token, linkError, router, toast])

  const loginUrl = `/login?callbackUrl=${encodeURIComponent(`/profile/claim-orders?token=${token}`)}`
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-4 px-4 py-12 text-center">
        <MailCheck className="h-9 w-9" aria-hidden="true" />
        <h1 className="text-2xl font-semibold">Link guest orders</h1>
        {status === 'loading' || working ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Verifying your orders...</div>
        ) : status === 'unauthenticated' ? (
          <>
            <p className="text-sm text-muted-foreground">Sign in to the account where you want these orders to appear.</p>
            <Button asChild><Link href={loginUrl}>Sign In</Link></Button>
          </>
        ) : error || linkError ? (
          <>
            <p role="alert" className="text-sm text-destructive">{error || linkError}</p>
            <Button asChild variant="outline"><Link href="/profile?tab=orders">Back to orders</Link></Button>
          </>
        ) : null}
      </main>
    </div>
  )
}

export default function ClaimOrdersPage() {
  return <Suspense fallback={null}><ClaimOrdersContent /></Suspense>
}
