import { Metadata } from 'next'
import { NotificationBell } from '@/components/admin/notification-bell'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NotificationBell />
      {children}
    </>
  )
}
