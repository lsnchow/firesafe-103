import { Inter } from "next/font/google"
import { Providers } from "./providers"
import type React from "react" // Import React

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          {children}
        </Providers>
      </body>
    </html>
  )
}

