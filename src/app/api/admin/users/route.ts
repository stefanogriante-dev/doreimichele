import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/supabase/admin'
import { requireAdmin, AuthError } from '@/lib/auth'

export async function GET() {
  try {
    await requireAdmin()
    const db = getDb()
    const { data, error } = await db
      .from('users')
      .select('*')
      .order('full_name', { ascending: true })
    if (error) throw error
    return NextResponse.json(data)
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status })
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    const body = await request.json()
    if (!body.username || !body.full_name) {
      return NextResponse.json({ error: 'Username e nome obbligatori' }, { status: 400 })
    }
    const db = getDb()
    const { data, error } = await db
      .from('users')
      .insert({ ...body, username: body.username.toLowerCase().trim() })
      .select()
      .single()
    if (error) {
      if (error.code === '23505') return NextResponse.json({ error: 'Username già in uso' }, { status: 409 })
      throw error
    }
    return NextResponse.json(data, { status: 201 })
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status })
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}
