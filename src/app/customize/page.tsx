import { permanentRedirect } from 'next/navigation'

export default function CustomizeIndexPage() {
  permanentRedirect('/shop')
}
