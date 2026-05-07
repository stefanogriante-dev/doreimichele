import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/supabase/admin'
import { requireAdmin, AuthError } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    const { filename } = await request.json()
    if (!filename) return NextResponse.json({ error: 'filename obbligatorio' }, { status: 400 })

    const safeName = `${Date.now()}_${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    const db = getDb()
    const { data, error } = await db.storage
      .from('spartiti')
      .createSignedUploadUrl(safeName)

    if (error) throw error
    return NextResponse.json({ signedUrl: data.signedUrl, path: safeName })
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status })
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}
