import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/supabase/admin'
import { requireAuth, requireAdmin, AuthError } from '@/lib/auth'

export async function GET() {
  try {
    await requireAuth()
    const db = getDb()
    const { data, error } = await db
      .from('celebrazioni')
      .select('*, programma_canti(*, spartito:spartiti(*))')
      .order('data', { ascending: true, nullsFirst: false })
    if (error) throw error

    const withUrls = data.map(c => ({
      ...c,
      programma: c.programma_canti
        ?.sort((a: { ordine: number }, b: { ordine: number }) => a.ordine - b.ordine)
        .map((p: { spartito: { file_path: string } | null }) => ({
          ...p,
          spartito: p.spartito
            ? {
                ...p.spartito,
                file_url: db.storage.from('spartiti').getPublicUrl(p.spartito.file_path).data.publicUrl,
              }
            : null,
        })),
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
    const body = await request.json()
    const db = getDb()
    const { data, error } = await db.from('celebrazioni').insert(body).select().single()
    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status })
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}
