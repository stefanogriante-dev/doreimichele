import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import AppLayout from '@/components/AppLayout'
import PushSubscriber from '@/components/PushSubscriber'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser()
  if (!user) redirect('/login')

  return (
    <AppLayout user={user}>
      <PushSubscriber />
      {children}
    </AppLayout>
  )
}
