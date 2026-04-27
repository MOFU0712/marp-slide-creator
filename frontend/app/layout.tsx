import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Marp Slide Creator',
  description: 'AI-powered slide creation tool for engineers',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <header className="border-b border-border">
          <div className="container mx-auto px-4 h-14 flex items-center">
            <h1 className="font-semibold text-lg">Marp Slide Creator</h1>
          </div>
        </header>
        <main className="flex-1 flex flex-col">{children}</main>
      </body>
    </html>
  )
}
