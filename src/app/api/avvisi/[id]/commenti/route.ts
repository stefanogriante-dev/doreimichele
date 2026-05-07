import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/supabase/admin'
import { requireAuth, AuthError } from '@/lib/auth'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth()
    const { id } = await params
    const db = getDb()
    const { data, error } = await db
      .from('commenti')
      .select('*, autore:users(id, full_name)')
      .eq('avviso_id', id)
      .order('created_at', { ascending: true })
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
    const { id: avviso_id } = await params
    const { testo } = await request.json()
    if (!testo?.trim()) return NextResponse.json({ error: 'Testo obbligatorio' }, { status: 400 })
    const db = getDb()
    const { data, error } = await db
      .from('commenti')
      .insert({ avviso_id, autore_id: user.id, testo: testo.trim() })
      .select('*, autore:users(id, full_name)')
      .single()
    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status })
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}
