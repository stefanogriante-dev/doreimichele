import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/supabase/admin'
import { requireAuth, requireAdmin, AuthError } from '@/lib/auth'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth()
    const { id } = await params
    const db = getDb()
    const { data, error } = await db
      .from('event_canti')
      .select('*, spartito:spartiti(*)')
      .eq('event_id', id)
      .order('ordine', { ascending: true })
    if (error) throw error

    const withUrls = data.map(c => ({
      ...c,
      spartito: c.spartito
        ? { ...c.spartito, file_url: db.storage.from('spartiti').getPublicUrl(c.spartito.file_path).data.publicUrl }
        : null,
    }))
    return NextResponse.json(withUrls)
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status })
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin()
    const { id: event_id } = await params
    const { spartito_id, titolo_libero, ordine, note } = await request.json()

    if (!spartito_id && !titolo_libero?.trim()) {
      return NextResponse.json({ error: 'Seleziona uno spartito o inserisci un titolo' }, { status: 400 })
    }

    const db = getDb()
    const { data, error } = await db
      .from('event_canti')
      .insert({
        event_id,
        spartito_id: spartito_id || null,
        titolo_libero: titolo_libero?.trim() || null,
        ordine: ordine ?? 0,
        note: note ?? null,
      })
      .select('*, spartito:spartiti(*)')
      .single()
    if (error) throw error

    return NextResponse.json({
      ...data,
      spartito: data.spartito
        ? { ...data.spartito, file_url: db.storage.from('spartiti').getPublicUrl(data.spartito.file_path).data.publicUrl }
        : null,
    }, { status: 201 })
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status })
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin()
    const { id: event_id } = await params
    const { canto_id } = await request.json()
    const db = getDb()
    const { error } = await db
      .from('event_canti')
      .delete()
      .eq('id', canto_id)
      .eq('event_id', event_id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status })
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}
