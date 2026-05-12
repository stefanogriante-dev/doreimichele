import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/supabase/admin'
import { requireAuth, AuthError } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const subscription = await request.json()
    if (!subscription?.endpoint) {
      return NextResponse.json({ error: 'Subscription non valida' }, { status: 400 })
    }
    const db = getDb()
    await db.from('push_subscriptions').upsert({
      user_id: user.id,
      endpoint: subscription.endpoint,
      subscription,
    }, { onConflict: 'user_id,endpoint' })
    return NextResponse.json({ ok: true })
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status })
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { endpoint } = await request.json()
    const db = getDb()
    await db.from('push_subscriptions')
      .delete()
      .eq('user_id', user.id)
      .eq('endpoint', endpoint)
    return NextResponse.json({ ok: true })
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status })
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}
