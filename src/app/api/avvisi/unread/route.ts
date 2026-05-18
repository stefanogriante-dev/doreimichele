import { NextResponse } from 'next/server'
import { getDb } from '@/lib/supabase/admin'
import { requireAuth, AuthError } from '@/lib/auth'

export async function GET() {
  try {
    const user = await requireAuth()
    const db = getDb()

    const { data: readData } = await db
      .from('avvisi_reads')
      .select('last_read_at')
      .eq('user_id', user.id)
      .single()

    let query = db.from('avvisi').select('*', { count: 'exact', head: true })
    if (readData?.last_read_at) {
      query = query.gt('created_at', readData.last_read_at)
    }
    const { count } = await query
    return NextResponse.json({ count: count ?? 0 })
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status })
    return NextResponse.json({ count: 0 })
  }
}
