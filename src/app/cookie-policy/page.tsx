import { LegalPolicyPage } from '@/components/legal-policy-page'
import { cookiePolicy } from '@/data/site-policies'

export default function CookiePolicyPage() {
  return <LegalPolicyPage policy={cookiePolicy} />
}
