import type { Metadata } from 'next'
import { VarsityDesigner } from '@/components/varsity-designer'
import { VarsityDesignResources } from '@/components/varsity-design-resources'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.jacketee.com'

export const metadata: Metadata = {
  title: 'Design Your Own Varsity Jacket | Jacketee',
  description: 'Design a custom varsity jacket with your colors, materials, collar, hood, buttons or zipper. Add text and artwork and preview all four views.',
  alternates: { canonical: `${SITE_URL}/design/varsity` },
  openGraph: { title: 'Design Your Own Varsity Jacket | Jacketee', description: 'Create your varsity jacket with custom colors, materials, text, and artwork.', url: `${SITE_URL}/design/varsity`, type: 'website' },
}

export default function VarsityDesignPage() {
  return <VarsityDesigner><VarsityDesignResources /></VarsityDesigner>
}
