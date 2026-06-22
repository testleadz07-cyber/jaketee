'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/header'
import { ShoppingBag, ArrowLeft, Search, HelpCircle } from 'lucide-react'
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background via-background to-muted/20">
      <Header showBack backHref="/" />

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full text-center space-y-8"
        >
          {/* Logo / Graphic */}
          <div className="relative flex justify-center">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="p-6 bg-muted rounded-full border-2 border-dashed border-muted-foreground/30 relative"
            >
              <ShoppingBag className="h-16 w-16 text-primary" />
              <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                404
              </span>
            </motion.div>
          </div>

          {/* Heading */}
          <div className="space-y-3">
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              Page Not Found
            </h1>
            <p className="text-muted-foreground text-lg">
              We couldn't find the page you're looking for. It might have been moved or deleted.
            </p>
          </div>

          {/* Action Links */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pt-4">
            <Link href="/" className="w-full">
              <Button className="w-full h-12 gap-2" variant="default">
                <ArrowLeft className="h-4 w-4" />
                Go Back Home
              </Button>
            </Link>
            <Link href="/contact" className="w-full">
              <Button className="w-full h-12 gap-2" variant="outline">
                <HelpCircle className="h-4 w-4" />
                Contact Support
              </Button>
            </Link>
          </div>

          <div className="pt-6 border-t border-muted">
            <p className="text-sm text-muted-foreground">
              Or continue shopping for premium fashion in our{' '}
              <Link href="/" className="underline text-primary hover:text-primary/80 transition-colors font-medium">
                catalog
              </Link>
              .
            </p>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-background mt-auto">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          © 2024 Luxe Store. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
