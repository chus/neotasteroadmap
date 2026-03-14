import type { Metadata } from "next"
import LayoutShell from "@/components/LayoutShell"
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
      <body className="antialiased flex flex-col min-h-screen">
        <LayoutShell>{children}</LayoutShell>
      </body>
    </html>
  )
}
