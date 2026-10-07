import type { Metadata } from 'next'
import { GarmentDesigner } from '@/components/garment-designer'
import { GarmentDesignResources } from '@/components/garment-design-resources'

const url = `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.jacketee.com'}/design/coach`
export const metadata: Metadata = { title: 'Design Your Own Coach Jacket | Jacketee', description: 'Create a custom coach jacket with a point collar, snaps or zipper, cuff and drawcord options, colors, materials, and your artwork.', alternates: { canonical: url }, openGraph: { title: 'Design Your Own Coach Jacket | Jacketee', url, type: 'website' } }
export default function CoachDesignPage() {
  return <GarmentDesigner key="coach" category="coach"><GarmentDesignResources category="coach" /></GarmentDesigner>
}
