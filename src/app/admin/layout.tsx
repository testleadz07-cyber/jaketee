import { Metadata } from 'next'
import { AdminHeader } from '@/components/admin/admin-header'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/10 flex flex-col">
      <AdminHeader />
      <div className="flex-1">
        {children}
      </div>
    </div>
  )
}
