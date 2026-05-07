import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/supabase/admin'
import { requireAdmin, AuthError } from '@/lib/auth'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin()
    const { id: celebrazione_id } = await params
    const { spartito_id, ordine, note } = await request.json()
    const db = getDb()
    const { data, error } = await db
      .from('programma_canti')
      .insert({ celebrazione_id, spartito_id, ordine: ordine ?? 0, note: note ?? null })
      .select('*, spartito:spartiti(*)')
      .single()
    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status })
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin()
    const { id: celebrazione_id } = await params
    const { spartito_id } = await request.json()
    const db = getDb()
    const { error } = await db
      .from('programma_canti')
      .delete()
      .eq('celebrazione_id', celebrazione_id)
      .eq('spartito_id', spartito_id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status })
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}
