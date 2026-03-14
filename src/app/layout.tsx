import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "NeoTaste Roadmap",
  description: "2026 product roadmap sequencing tool",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
