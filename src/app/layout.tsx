import type { Metadata } from "next"
import { headers } from "next/headers"
import LayoutShell from "@/components/LayoutShell"
import { getUnreviewedFeedbackCount } from "@/app/feedback-actions"
import "./globals.css"

export const metadata: Metadata = {
  title: "NeoTaste Roadmap",
  description: "2026 product roadmap sequencing tool",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const headersList = await headers()
  const hostname = headersList.get('host') ?? ''
  const isVoiceSubdomain = hostname === 'voice.neotasteroadmap.vercel.app' || hostname.startsWith('voice.')

  let unreviewedCount = 0
  if (!isVoiceSubdomain) {
    try {
      unreviewedCount = await getUnreviewedFeedbackCount()
    } catch {
      // Table may not exist yet during initial setup
    }
  }

  return (
    <html lang="en">
      <body className="antialiased flex flex-col min-h-screen">
        <LayoutShell unreviewedCount={unreviewedCount} isVoiceSubdomain={isVoiceSubdomain}>{children}</LayoutShell>
      </body>
    </html>
  )
}
