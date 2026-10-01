import type { Metadata } from 'next'
import { CustomJacketLandingPage } from '@/components/custom-jacket-landing-page'
import { getCustomLandingConfig } from '@/data/custom-jacket-landings'
const config = getCustomLandingConfig('custom-hoodies')
const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.jacketee.com'
export const metadata: Metadata = { title: config.title, description: config.description, alternates: { canonical: `${siteUrl}${config.path}` }, openGraph: { title: config.title, description: config.description, url: `${siteUrl}${config.path}`, type: 'website' } }
export default function Page() { return <CustomJacketLandingPage pageKey="custom-hoodies" /> }
