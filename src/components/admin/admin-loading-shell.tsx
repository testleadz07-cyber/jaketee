'use client'

import { Loader2 } from 'lucide-react'

export function AdminLoadingShell({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="min-h-screen bg-muted/10">
      <main className="container mx-auto flex min-h-[calc(100vh-130px)] items-center justify-center px-4 py-8">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">{label}</p>
        </div>
      </main>
    </div>
  )
}
