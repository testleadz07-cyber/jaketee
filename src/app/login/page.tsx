'use client'

import { useState, useEffect, Suspense } from 'react'
import { getSession, signIn, useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ShoppingBag, AlertCircle, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { Breadcrumbs } from '@/components/breadcrumbs'

async function waitForSession() {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const session = await getSession()
    if (session?.user) return session
    await new Promise((resolve) => setTimeout(resolve, 150))
  }
  return null
}

function getSafeCallbackUrl(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return null
  return value
}

function getDestination(role: string | undefined, callbackUrl: string | null) {
  if (callbackUrl && (role === 'admin' || !callbackUrl.startsWith('/admin'))) {
    return callbackUrl
  }
  return role === 'admin' ? '/admin/dashboard' : '/profile'
}

function redirectTo(destination: string) {
  window.location.replace(destination)
}

function LoginContent() {
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const success = searchParams.get('success') === 'true'
    ? 'Account created successfully! Please sign in.'
    : ''
  const callbackUrl = getSafeCallbackUrl(searchParams.get('callbackUrl'))

  useEffect(() => {
    if (session?.user) {
      const role = (session.user as any).role
      redirectTo(getDestination(role, callbackUrl))
    }
  }, [callbackUrl, session])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        identifier,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid email or password')
        setIsLoading(false)
      } else {
        const updatedSession = await waitForSession()
        const role = (updatedSession?.user as any)?.role || 'customer'
        redirectTo(getDestination(role, callbackUrl))
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md border-2">
      <CardHeader className="space-y-4 text-center">
        <div className="flex justify-center">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Jacketee
            </span>
          </div>
        </div>
        <CardTitle className="text-2xl">Sign In</CardTitle>
        <CardDescription>
          Access your account and order history
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 text-emerald-600 text-sm border border-emerald-500/20">
              <CheckCircle className="h-4 w-4" />
              {success}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="identifier">Email or username</Label>
            <Input
              id="identifier"
              type="text"
              placeholder="your@email.com or username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <PasswordInput
              id="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>

          <div className="text-center text-sm text-muted-foreground mt-4">
            Don't have an account?{' '}
            <Link href="/register" className="text-primary hover:underline">
              Register
            </Link>
          </div>

          <div className="text-center text-sm text-muted-foreground pt-2">
            <Link href="/" className="hover:text-primary">
              ← Back to Store
            </Link>
          </div>

          <div className="border-t pt-4 mt-6">
            <p className="text-center text-[10px] text-muted-foreground opacity-60">
              Admin demo: admin@jacketee.com / admin123
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background via-background to-muted/20 p-4">
      <div className="w-full max-w-md space-y-4">
        <Breadcrumbs items={[{ label: 'Sign In' }]} className="flex justify-center" />
        <Suspense fallback={<div>Loading login form...</div>}>
          <LoginContent />
        </Suspense>
      </div>
    </div>
  )
}
