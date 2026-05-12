import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/supabase/admin'
import { requireAuth, requireAdmin, AuthError } from '@/lib/auth'
import { sendPush } from '@/lib/webpush'
import type webpush from 'web-push'

// TODO: rimuovere questo filtro per inviare a tutti i coristi
const PUSH_TEST_USER = 'De Pascalis Federica'

export async function GET() {
  try {
    await requireAuth()
    const db = getDb()
    const { data, error } = await db
      .from('avvisi')
      .select('*, autore:users(id, full_name), commenti(id)')
      .order('created_at', { ascending: false })
    if (error) throw error
    return NextResponse.json(data.map(a => ({ ...a, commenti_count: a.commenti?.length ?? 0 })))
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status })
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin()
    const body = await request.json()
    const db = getDb()

    // Crea l'avviso
    const { data, error } = await db
      .from('avvisi')
      .insert({ ...body, autore_id: user.id })
      .select('*, autore:users(id, full_name)')
      .single()
    if (error) throw error

    // Invia push notifications (solo PUSH_TEST_USER per ora)
    const { data: subs } = await db
      .from('push_subscriptions')
      .select('id, endpoint, subscription, users!inner(full_name)')
      .eq('users.full_name', PUSH_TEST_USER)

    if (subs && subs.length > 0) {
      const deadEndpoints: string[] = []
      await Promise.allSettled(
        subs.map(async (row) => {
          try {
            await sendPush(row.subscription as webpush.PushSubscription, {
              title: '📢 Nuovo avviso',
              body: body.titolo,
              url: '/avvisi',
            })
          } catch {
            deadEndpoints.push(row.endpoint)
          }
        })
      )
      // Rimuovi subscription scadute
      if (deadEndpoints.length > 0) {
        await db.from('push_subscriptions')
          .delete()
          .in('endpoint', deadEndpoints)
      }
    }

    return NextResponse.json(data, { status: 201 })
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status })
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}
