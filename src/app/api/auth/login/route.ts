import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/supabase/admin'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  const { username } = await request.json()

  if (!username?.trim()) {
    return NextResponse.json({ error: 'Username obbligatorio' }, { status: 400 })
  }

  const db = getDb()
  const { data: user } = await db
    .from('users')
    .select('id, username, full_name, ruolo, sezione, is_active')
    .eq('username', username.trim().toLowerCase())
    .eq('is_active', true)
    .single()

  if (!user) {
    return NextResponse.json({ error: 'Utente non trovato' }, { status: 401 })
  }

  const cookieStore = await cookies()
  cookieStore.set('dmichele_uid', user.id, {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 giorni
  })

  return NextResponse.json({ user })
}
