import ReturnsClient from './returns-client'
import { PolicyResources } from '@/components/policy-resources'

export const dynamic = 'force-dynamic'

export default function ReturnsPage() {
  return <ReturnsClient resources={<PolicyResources topic="returns" />} />
}
