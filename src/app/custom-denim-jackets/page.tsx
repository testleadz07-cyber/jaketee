import { customLandingMetadata } from '@/components/custom-jacket-landing-page'
import type { Metadata } from 'next'
import { CustomJacketLandingPage } from '@/components/custom-jacket-landing-page'
import { getCustomLandingConfig } from '@/data/custom-jacket-landings'
const config = getCustomLandingConfig('custom-denim-jackets')
export async function generateMetadata(): Promise<Metadata> {
  return customLandingMetadata(config)
}
export default function Page() { return <CustomJacketLandingPage pageKey="custom-denim-jackets" /> }
