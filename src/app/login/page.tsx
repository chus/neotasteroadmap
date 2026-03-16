'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginForm() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const from = searchParams.get('from') || '/'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      if (res.ok) {
        router.push(from)
        router.refresh()
      } else {
        setError('Incorrect password')
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-neutral-200 p-6">
      <div className="mb-4">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoFocus
          className="w-full text-[14px] border border-neutral-300 rounded-lg px-3 py-2.5 outline-none focus:border-neutral-500"
        />
      </div>
      {error && (
        <p className="text-[12px] text-red-500 mb-3">{error}</p>
      )}
      <button
        type="submit"
        disabled={loading || !password}
        className="w-full text-[13px] font-medium py-2.5 rounded-lg bg-neutral-900 text-white hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  )
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <svg width="32" height="32" viewBox="0 0 28 28" fill="none" className="rounded-md">
              <rect width="28" height="28" rx="6" fill="#50E88A" />
              <text x="14" y="19.5" textAnchor="middle" fill="#0D2818" fontSize="16" fontWeight="700" fontFamily="system-ui">N</text>
            </svg>
            <span className="text-[17px] font-semibold text-neutral-800">NeoTaste</span>
          </div>
          <h1 className="text-[20px] font-semibold text-neutral-800 mb-1">Product Roadmap</h1>
          <p className="text-[13px] text-neutral-500">Enter the team password to continue.</p>
        </div>

        <Suspense fallback={
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <div className="h-10 bg-neutral-100 rounded-lg animate-pulse" />
          </div>
        }>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  )
}
