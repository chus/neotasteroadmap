import { getShippedInitiatives } from '@/app/actions'
import ShippedPage from '@/components/ShippedPage'

export const dynamic = 'force-dynamic'

export default async function Shipped() {
  const groups = await getShippedInitiatives()
  return <ShippedPage groups={groups} />
}
