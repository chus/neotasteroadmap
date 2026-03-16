export async function sendSlackMessage(webhookUrl: string, payload: object) {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    console.error('[slack] Webhook failed:', response.status)
  }
}

export function formatFeedbackDigest(data: {
  newSubmissions: number
  unreviewedCount: number
  topClusters: { label: string; count: number }[]
  sentiments: { positive: number; neutral: number; negative: number }
}): object {
  const clusterList = data.topClusters.length > 0
    ? data.topClusters.map((c) => `  - ${c.label} (${c.count} submissions)`).join('\n')
    : '  No active clusters'

  const totalSentiment = data.sentiments.positive + data.sentiments.neutral + data.sentiments.negative
  const sentimentLine = totalSentiment > 0
    ? `Sentiment: ${data.sentiments.positive} positive, ${data.sentiments.neutral} neutral, ${data.sentiments.negative} negative`
    : 'No sentiment data this week'

  return {
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: 'Voice — Weekly Digest', emoji: true },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*This week:* ${data.newSubmissions} new submission${data.newSubmissions !== 1 ? 's' : ''}\n*Unreviewed:* ${data.unreviewedCount}\n${sentimentLine}`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Top clusters:*\n${clusterList}`,
        },
      },
      {
        type: 'context',
        elements: [
          { type: 'mrkdwn', text: '<https://neotasteroadmap.vercel.app/feedback|Open Voice inbox>' },
        ],
      },
    ],
  }
}
