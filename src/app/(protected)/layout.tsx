import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import AppLayout from '@/components/AppLayout'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser()
  if (!user) redirect('/login')

  return <AppLayout user={user}>{children}</AppLayout>
}
