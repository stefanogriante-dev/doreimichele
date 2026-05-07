import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { getDb } from '@/lib/supabase/admin'
import AppLayout from '@/components/AppLayout'

async function getBrandColor(): Promise<string> {
  try {
    const db = getDb()
    const { data } = await db.from('app_settings').select('primary_color').eq('id', 1).single()
    return data?.primary_color ?? '#0284c7'
  } catch {
    return '#0284c7'
  }
}

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser()
  if (!user) redirect('/login')

  const brandColor = await getBrandColor()

  return <AppLayout user={user} brandColor={brandColor}>{children}</AppLayout>
}
