'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/header'
import { AlertTriangle, RefreshCcw, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to the console (or an error reporting service)
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background via-background to-muted/20">
      <Header showBack backHref="/" />

      <main className="flex-1 flex items-center justify-center container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full text-center space-y-8"
        >
          <div className="relative flex justify-center">
            <div className="p-6 bg-muted rounded-full border-2 border-dashed border-destructive/30">
              <AlertTriangle className="h-16 w-16 text-destructive" />
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              Something Went Wrong
            </h1>
            <p className="text-muted-foreground text-lg">
              An unexpected error occurred while loading this page. Please try again, or head back home.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pt-4">
            <Button className="w-full h-12 gap-2" variant="default" onClick={() => reset()}>
              <RefreshCcw className="h-4 w-4" />
              Try Again
            </Button>
            <Link href="/" className="w-full">
              <Button className="w-full h-12 gap-2" variant="outline">
                <ArrowLeft className="h-4 w-4" />
                Go Back Home
              </Button>
            </Link>
          </div>

          <div className="pt-6 border-t border-muted">
            <p className="text-sm text-muted-foreground">
              If this keeps happening,{' '}
              <Link href="/contact" className="underline text-primary hover:text-primary/80 transition-colors font-medium">
                contact support
              </Link>
              .
            </p>
          </div>
        </motion.div>
      </main>

      <footer className="border-t bg-background mt-auto">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          © 2024 Luxe Store. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
