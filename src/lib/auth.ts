import { cookies } from 'next/headers'
import { getDb } from './supabase/admin'
import { User } from '@/types'

const COOKIE_NAME = 'dmichele_uid'

export async function getSessionUser(): Promise<User | null> {
  const cookieStore = await cookies()
  const userId = cookieStore.get(COOKIE_NAME)?.value
  if (!userId) return null

  const db = getDb()
  const { data } = await db
    .from('users')
    .select('*')
    .eq('id', userId)
    .eq('is_active', true)
    .single()

  return data ?? null
}

export async function requireAuth(): Promise<User> {
  const user = await getSessionUser()
  if (!user) throw new AuthError('Non autenticato', 401)
  return user
}

export async function requireAdmin(): Promise<User> {
  const user = await requireAuth()
  if (user.ruolo !== 'admin') throw new AuthError('Accesso negato', 403)
  return user
}

export class AuthError extends Error {
  constructor(message: string, public status: number) {
    super(message)
  }
}
