import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/supabase/admin'
import { requireAuth, AuthError } from '@/lib/auth'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth()
    const { id } = await params
    const db = getDb()
    const { data, error } = await db
      .from('presenze')
      .select('*, user:users(id, full_name, sezione)')
      .eq('event_id', id)
    if (error) throw error
    return NextResponse.json(data)
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status })
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const { id: event_id } = await params
    const { risposta } = await request.json()
    const db = getDb()

    const { data, error } = await db
      .from('presenze')
      .upsert({ event_id, user_id: user.id, risposta, updated_at: new Date().toISOString() }, { onConflict: 'event_id,user_id' })
      .select()
      .single()
    if (error) throw error
    return NextResponse.json(data)
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status })
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}
