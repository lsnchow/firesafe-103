import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Firesafe',
  description: 'Firesafe',
  generator: 'Firesafe',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="bg-background text-foreground" suppressHydrationWarning>{children}</body>
    </html>
  )
}
