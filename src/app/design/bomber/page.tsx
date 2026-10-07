import type { Metadata } from 'next'
import { GarmentDesigner } from '@/components/garment-designer'
import { GarmentDesignResources } from '@/components/garment-design-resources'

const url = `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.jacketee.com'}/design/bomber`
export const metadata: Metadata = { title: 'Design Your Own Bomber Jacket | Jacketee', description: 'Design a bomber jacket with custom materials, colors, ribbed trims, a utility sleeve pocket, and your own text and artwork.', alternates: { canonical: url }, openGraph: { title: 'Design Your Own Bomber Jacket | Jacketee', url, type: 'website' } }
export default function BomberDesignPage() {
  return <GarmentDesigner key="bomber" category="bomber"><GarmentDesignResources category="bomber" /></GarmentDesigner>
}
