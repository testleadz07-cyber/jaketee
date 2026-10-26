'use client'

import { usePathname } from 'next/navigation'
import { Header } from '@/components/header'
import { PageContentSkeleton, getPageSkeletonLayout, type PageSkeletonLayout } from '@/components/page-content-skeleton'

export function PageLoading({ label, storefront = true, layout }: { label: string; storefront?: boolean; layout?: PageSkeletonLayout }) {
  const pathname = usePathname() || '/'
  const skeletonLayout = layout || getPageSkeletonLayout(pathname)
  return <div className="min-h-screen min-w-0 bg-background text-foreground">
    {storefront && <Header />}
    <span role="status" className="sr-only">{label}</span>
    <main className={skeletonLayout === 'designer' || skeletonLayout === 'customizer' ? 'mx-auto w-full max-w-[1600px] px-4 py-8 lg:px-8' : 'section-shell py-6! md:py-8!'} aria-busy="true">
      <PageContentSkeleton layout={skeletonLayout} />
    </main>
  </div>
}
