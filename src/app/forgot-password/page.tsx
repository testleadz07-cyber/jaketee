'use client'

import { apiFetch as fetch } from '@/lib/api-fetch'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { AlertCircle, CheckCircle, Mail } from 'lucide-react'
import { BrandLogo } from '@/components/brand-logo'
import Link from 'next/link'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { useTurnstile } from '@/components/turnstile-challenge'
import { useGuestFormActivity } from '@/hooks/use-guest-form-activity'

export default function ForgotPasswordPage() {
  const verification = useTurnstile('forgot_password')
  const [email, setEmail] = useState('')
  const formActivity = useGuestFormActivity('forgot_password', { email })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

    try {
      const turnstileToken = await verification.getToken()
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, turnstileToken }),
      })

      const data = await res.json().catch(() => ({}))

      if (res.ok) {
        await formActivity.submitted({ email })
        setSuccess(data.message || "If an account with that email exists, we've sent a password reset link.")
      } else {
        setError(data.error || 'Something went wrong. Please try again.')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-4">
        <Breadcrumbs items={[{ label: 'Sign In', href: '/login' }, { label: 'Forgot Password' }]} className="flex justify-center" />
        <Card className="w-full max-w-md border-2">
          <CardHeader className="space-y-4 text-center">
            <div className="flex justify-center">
              <BrandLogo />
            </div>
            <CardTitle className="text-2xl">Forgot Password</CardTitle>
            <CardDescription>
              Enter your email and we'll send you a link to reset your password
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="space-y-4">
                <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-500/10 text-emerald-600 text-sm border border-emerald-500/20">
                  <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{success}</span>
                </div>
                <p className="text-center text-sm text-muted-foreground">
                  Didn't get it? Check your spam folder, or{' '}
                  <button
                    type="button"
                    className="text-primary hover:underline"
                    onClick={() => {
                      setSuccess('')
                    }}
                  >
                    try another email
                  </button>
                  .
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} {...formActivity.bindings} className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>

                {verification.widget}
                {formActivity.notice}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    'Sending...'
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Send Reset Link
                    </>
                  )}
                </Button>
              </form>
            )}

            <div className="text-center text-sm text-muted-foreground mt-4">
              Remembered your password?{' '}
              <Link href="/login" className="text-primary hover:underline">
                Sign In
              </Link>
            </div>

            <div className="text-center text-sm text-muted-foreground pt-2">
              <Link href="/" className="hover:text-primary">
                ← Back to Store
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
