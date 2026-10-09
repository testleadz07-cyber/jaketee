import ReturnsClient from './returns-client'
import { PolicyResources } from '@/components/policy-resources'

export const dynamic = 'force-dynamic'

export default function ReturnsPage() {
  const policy = {
    '@context': 'https://schema.org', '@type': 'Organization',
    '@id': 'https://www.jacketee.com/#organization', name: 'Jacketee', url: 'https://www.jacketee.com',
    hasMerchantReturnPolicy: {
      '@type': 'MerchantReturnPolicy', applicableCountry: ['US', 'GB', 'CA'],
      returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow', merchantReturnDays: 10,
      returnMethod: 'https://schema.org/ReturnByMail', returnFees: 'https://schema.org/ReturnFeesCustomerResponsibility',
      merchantReturnLink: 'https://www.jacketee.com/returns',
      description: 'Eligible non-customized stock jackets only. Change-of-mind returns have a 15% restocking fee with a $35 minimum. Customized items are not returnable for a change of mind.',
    },
  }
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(policy).replace(/</g, '\\u003c') }} />
    <ReturnsClient resources={<PolicyResources topic="returns" />} />
  </>
}
