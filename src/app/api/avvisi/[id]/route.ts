import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/supabase/admin'
import { requireAdmin, AuthError } from '@/lib/auth'

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin()
    const { id } = await params
    const db = getDb()
    const { error } = await db.from('avvisi').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status })
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}
