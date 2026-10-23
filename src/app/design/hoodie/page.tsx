import { withSocialMetadata } from '@/lib/seo-metadata'
import type { Metadata } from 'next'
import { GarmentDesigner } from '@/components/garment-designer'
import { GarmentDesignResources } from '@/components/garment-design-resources'

const title = 'Design Your Own Fleece Hoodie | Jacketee'
const description = 'Customize a pullover or full-zip fleece hoodie with hood lining, drawstrings, pockets, fit, sleeve styles, colors, text, and artwork.'
const url = `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.jacketee.com'}/design/hoodie`
export const metadata: Metadata = withSocialMetadata({ title, description, alternates: { canonical: url }, openGraph: { title, description, url, type: 'website' } })
export default function HoodieDesignPage() {
  return <GarmentDesigner key="hoodie" category="hoodie"><GarmentDesignResources category="hoodie" /></GarmentDesigner>
}
