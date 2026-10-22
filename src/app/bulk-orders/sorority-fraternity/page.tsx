import { customLandingMetadata } from '@/components/custom-jacket-landing-page'
import type { Metadata } from 'next'
import { BulkProgramPage } from '@/components/bulk-program-page'
import { getCustomLandingConfig } from '@/data/custom-jacket-landings'

const config = getCustomLandingConfig('sorority-fraternity-jackets')

export async function generateMetadata(): Promise<Metadata> {
  return customLandingMetadata(config)
}

export default function Page() {
  return <BulkProgramPage kind="sorority-fraternity" />
}
