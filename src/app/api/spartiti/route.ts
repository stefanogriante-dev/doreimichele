import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/supabase/admin'
import { requireAuth, requireAdmin, AuthError } from '@/lib/auth'

export async function GET() {
  try {
    await requireAuth()
    const db = getDb()
    const { data, error } = await db
      .from('spartiti')
      .select('*')
      .order('titolo', { ascending: true })
    if (error) throw error

    const withUrls = data.map(s => ({
      ...s,
      file_url: db.storage.from('spartiti').getPublicUrl(s.file_path).data.publicUrl,
    }))
    return NextResponse.json(withUrls)
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status })
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}

// Salva solo i metadati — il file è già stato caricato direttamente su Supabase Storage
export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    const { titolo, compositore, categoria, file_path } = await request.json()

    if (!titolo || !file_path) {
      return NextResponse.json({ error: 'Titolo e file_path obbligatori' }, { status: 400 })
    }

    const db = getDb()
    const { data, error } = await db
      .from('spartiti')
      .insert({ titolo, compositore: compositore || null, categoria: categoria || 'altro', file_path })
      .select()
      .single()
    if (error) throw error

    return NextResponse.json({
      ...data,
      file_url: db.storage.from('spartiti').getPublicUrl(file_path).data.publicUrl,
    }, { status: 201 })
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status })
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}
