import { getDigestHistory, getDigestRecipients } from '@/app/actions'
import CommsBoard from '@/components/CommsBoard'

export const dynamic = 'force-dynamic'

export default async function Comms() {
  const [digests, recipients] = await Promise.all([
    getDigestHistory(),
    getDigestRecipients(),
  ])
  return <CommsBoard initialDigests={digests} initialRecipients={recipients} />
}
