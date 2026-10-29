import { withSocialMetadata } from '@/lib/seo-metadata'
import { Metadata } from 'next'
import { AdminHeader } from '@/components/admin/admin-header'
import { requireAdminPage } from '@/lib/require-admin'

export const metadata: Metadata = withSocialMetadata({
  robots: { index: false, follow: false },
})

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPage()
  return (
    <div className="min-h-screen bg-muted/10 flex flex-col">
      <AdminHeader />
      <div className="flex-1">
        {children}
      </div>
    </div>
  )
}
