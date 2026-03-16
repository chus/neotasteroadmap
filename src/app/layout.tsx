import type { Metadata } from "next"
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
  let unreviewedCount = 0
  try {
    unreviewedCount = await getUnreviewedFeedbackCount()
  } catch {
    // Table may not exist yet during initial setup
  }

  return (
    <html lang="en">
      <body className="antialiased flex flex-col min-h-screen">
        <LayoutShell unreviewedCount={unreviewedCount}>{children}</LayoutShell>
      </body>
    </html>
  )
}
