import type { Metadata } from 'next'
import { GarmentDesigner } from '@/components/garment-designer'
import { GarmentDesignResources } from '@/components/garment-design-resources'

const url = `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.jacketee.com'}/design/puffer`
export const metadata: Metadata = { title: 'Design Your Own Puffer Jacket | Jacketee', description: 'Design a custom puffer jacket with horizontal or chevron quilting, padding weight, a hood, colors, materials, text, and artwork.', alternates: { canonical: url }, openGraph: { title: 'Design Your Own Puffer Jacket | Jacketee', url, type: 'website' } }
export default function PufferDesignPage() {
  return <GarmentDesigner key="puffer" category="puffer"><GarmentDesignResources category="puffer" /></GarmentDesigner>
}
