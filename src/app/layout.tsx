import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: 'DoReMiChele',
  description: 'App della Corale di San Michele in Cantù',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'DoReMiChele',
  },
}

export const viewport: Viewport = {
  themeColor: '#0284c7',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className="h-full">
      <body className="min-h-full antialiased">
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  )
}
