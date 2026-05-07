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
    const { spartito_id, ordine, note } = await request.json()
    const db = getDb()
    const { data, error } = await db
      .from('event_canti')
      .insert({ event_id, spartito_id, ordine: ordine ?? 0, note: note ?? null })
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
    const { id: event_id } = await params
    const { spartito_id } = await request.json()
    const db = getDb()
    const { error } = await db
      .from('event_canti')
      .delete()
      .eq('event_id', event_id)
      .eq('spartito_id', spartito_id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status })
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}
