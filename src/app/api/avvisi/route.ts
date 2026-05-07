import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/supabase/admin'
import { requireAuth, requireAdmin, AuthError } from '@/lib/auth'

export async function GET() {
  try {
    await requireAuth()
    const db = getDb()
    const { data, error } = await db
      .from('avvisi')
      .select('*, autore:users(id, full_name), commenti(id)')
      .order('created_at', { ascending: false })
    if (error) throw error
    return NextResponse.json(data.map(a => ({ ...a, commenti_count: a.commenti?.length ?? 0 })))
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status })
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin()
    const body = await request.json()
    const db = getDb()
    const { data, error } = await db
      .from('avvisi')
      .insert({ ...body, autore_id: user.id })
      .select('*, autore:users(id, full_name)')
      .single()
    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status })
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}
