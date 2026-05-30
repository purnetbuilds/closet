import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { BottomNav } from '@/components/BottomNav'
import { Toaster } from '@/components/Toaster'

const geist = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Closet',
  description: 'Your AI-powered daily outfit planner',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Closet',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} h-full`}>
      <body className="h-full bg-background font-sans antialiased">
        <main className="mx-auto min-h-full max-w-md pt-safe pb-[calc(5rem+env(safe-area-inset-bottom))]">{children}</main>
        <BottomNav />
        <Toaster />
      </body>
    </html>
  )
}
