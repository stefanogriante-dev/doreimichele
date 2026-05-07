import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/supabase/admin'
import { requireAdmin, AuthError } from '@/lib/auth'

export async function GET() {
  const db = getDb()
  const { data, error } = await db.from('app_settings').select('primary_color').eq('id', 1).single()
  if (error) return NextResponse.json({ primary_color: '#0284c7' })
  return NextResponse.json(data)
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin()
    const { primary_color } = await request.json()
    if (!primary_color || !/^#[0-9a-fA-F]{6}$/.test(primary_color)) {
      return NextResponse.json({ error: 'Colore non valido' }, { status: 400 })
    }
    const db = getDb()
    const { error } = await db
      .from('app_settings')
      .upsert({ id: 1, primary_color })
    if (error) throw error
    return NextResponse.json({ primary_color })
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status })
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}
