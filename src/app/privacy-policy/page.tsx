import { LegalPolicyPage } from '@/components/legal-policy-page'
import { privacyPolicy } from '@/data/site-policies'

export default function PrivacyPolicyPage() {
  return <LegalPolicyPage policy={privacyPolicy} />
}
