// Embedding utility — Voyage AI with word-overlap fallback

export async function getEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.VOYAGE_API_KEY
  if (apiKey) {
    return getVoyageEmbedding(text, apiKey)
  }
  return getWordOverlapVector(text)
}

async function getVoyageEmbedding(text: string, apiKey: string): Promise<number[]> {
  const response = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'voyage-3-lite',
      input: [text.slice(0, 4000)], // Voyage limit
    }),
  })

  if (!response.ok) {
    console.error('[embeddings] Voyage API error:', response.status)
    return getWordOverlapVector(text)
  }

  const result = await response.json()
  return result.data?.[0]?.embedding ?? getWordOverlapVector(text)
}

// Fallback: word frequency vector (deterministic, no API needed)
function getWordOverlapVector(text: string): number[] {
  const VOCAB_SIZE = 256
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 2)

  const vec = new Array(VOCAB_SIZE).fill(0)
  for (const word of words) {
    let hash = 0
    for (let i = 0; i < word.length; i++) {
      hash = ((hash << 5) - hash + word.charCodeAt(i)) | 0
    }
    const idx = Math.abs(hash) % VOCAB_SIZE
    vec[idx] += 1
  }

  // Normalize
  const mag = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0))
  if (mag > 0) {
    for (let i = 0; i < vec.length; i++) {
      vec[i] /= mag
    }
  }

  return vec
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0
  let dot = 0
  let magA = 0
  let magB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    magA += a[i] * a[i]
    magB += b[i] * b[i]
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB)
  return denom > 0 ? dot / denom : 0
}

export function findSimilar(
  embedding: number[],
  candidates: { id: string; embedding: number[] }[],
  threshold = 0.8
): { id: string; score: number }[] {
  return candidates
    .map((c) => ({ id: c.id, score: cosineSimilarity(embedding, c.embedding) }))
    .filter((c) => c.score >= threshold)
    .sort((a, b) => b.score - a.score)
}
