import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Toaster } from 'sonner'
import { getDb } from '@/lib/supabase/admin'
import { generateBrandCss } from '@/lib/brand'

async function getBrandColor(): Promise<string> {
  try {
    const db = getDb()
    const { data } = await db.from('app_settings').select('primary_color').eq('id', 1).single()
    return data?.primary_color ?? '#0284c7'
  } catch {
    return '#0284c7'
  }
}

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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const brandColor = await getBrandColor()
  const brandCss = generateBrandCss(brandColor)

  return (
    <html lang="it" className="h-full">
      <head>
        <style dangerouslySetInnerHTML={{ __html: brandCss }} />
      </head>
      <body className="min-h-full antialiased">
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  )
}
