import ReturnsClient from './returns-client'
import { deliverySettings, returnPolicyText } from '@/config/fulfillment'
import { shippingCountries } from '@/config/fulfillment'
import { PolicyResources } from '@/components/policy-resources'

export const dynamic = 'force-dynamic'

export default function ReturnsPage() {
  const policy = {
    '@context': 'https://schema.org', '@type': 'Organization',
    '@id': 'https://www.jacketee.com/#organization', name: 'Jacketee', url: 'https://www.jacketee.com',
    hasMerchantReturnPolicy: {
      '@type': 'MerchantReturnPolicy', applicableCountry: shippingCountries,
      returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow', merchantReturnDays: deliverySettings.returnDays,
      returnMethod: 'https://schema.org/ReturnByMail', returnFees: 'https://schema.org/ReturnFeesCustomerResponsibility',
      merchantReturnLink: 'https://www.jacketee.com/returns',
      description: `${returnPolicyText.eligibility} ${returnPolicyText.fee} Non-returnable Items: ${returnPolicyText.personalized}. ${returnPolicyText.customExchange}.`,
    },
  }
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(policy).replace(/</g, '\\u003c') }} />
    <ReturnsClient resources={<PolicyResources topic="returns" />} />
  </>
}
