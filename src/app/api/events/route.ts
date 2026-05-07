import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/supabase/admin'
import { requireAuth, requireAdmin, AuthError } from '@/lib/auth'

export async function GET() {
  try {
    await requireAuth()
    const db = getDb()
    const { data, error } = await db
      .from('events')
      .select('*')
      .order('data_inizio', { ascending: true })
    if (error) throw error
    return NextResponse.json(data)
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status })
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    const body = await request.json()
    const db = getDb()
    const { data, error } = await db.from('events').insert(body).select().single()
    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status })
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}
