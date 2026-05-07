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

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    const formData = await request.formData()
    const file = formData.get('file') as File
    const titolo = formData.get('titolo') as string
    const compositore = formData.get('compositore') as string
    const categoria = formData.get('categoria') as string

    if (!file || !titolo) {
      return NextResponse.json({ error: 'File e titolo obbligatori' }, { status: 400 })
    }

    const db = getDb()
    const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`

    const { error: uploadError } = await db.storage
      .from('spartiti')
      .upload(fileName, file, { contentType: 'application/pdf' })
    if (uploadError) throw uploadError

    const { data, error } = await db
      .from('spartiti')
      .insert({ titolo, compositore: compositore || null, categoria: categoria || 'altro', file_path: fileName })
      .select()
      .single()
    if (error) throw error

    return NextResponse.json({
      ...data,
      file_url: db.storage.from('spartiti').getPublicUrl(fileName).data.publicUrl,
    }, { status: 201 })
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status })
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}
