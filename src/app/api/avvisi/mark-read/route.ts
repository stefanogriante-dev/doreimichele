import { NextResponse } from 'next/server'
import { getDb } from '@/lib/supabase/admin'
import { requireAuth, AuthError } from '@/lib/auth'

export async function POST() {
  try {
    const user = await requireAuth()
    const db = getDb()
    await db.from('avvisi_reads').upsert(
      { user_id: user.id, last_read_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
    return NextResponse.json({ ok: true })
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status })
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}
