import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/supabase/admin'
import { requireAdmin, AuthError } from '@/lib/auth'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin()
    const { id } = await params
    const body = await request.json()
    const db = getDb()
    const { data, error } = await db
      .from('spartiti')
      .update({ titolo: body.titolo, compositore: body.compositore, categoria: body.categoria })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return NextResponse.json(data)
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status })
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin()
    const { id } = await params
    const db = getDb()

    // 1. Recupera il path del file
    const { data: spartito } = await db.from('spartiti').select('file_path').eq('id', id).single()

    // 2. Scollega dagli eventi del calendario (event_canti)
    await db.from('event_canti').delete().eq('spartito_id', id)

    // 3. Scollega dalle celebrazioni (programma_canti)
    await db.from('programma_canti').delete().eq('spartito_id', id)

    // 4. Elimina il record dal DB
    const { error } = await db.from('spartiti').delete().eq('id', id)
    if (error) throw error

    // 5. Elimina il file da Storage
    if (spartito) await db.storage.from('spartiti').remove([spartito.file_path])

    return NextResponse.json({ ok: true })
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status })
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}
