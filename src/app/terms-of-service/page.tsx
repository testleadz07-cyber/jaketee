import { LegalPolicyPage } from '@/components/legal-policy-page'
import { termsPolicy } from '@/data/site-policies'

export default function TermsOfServicePage() {
  return <LegalPolicyPage policy={termsPolicy} />
}
