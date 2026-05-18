import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/supabase/admin'
import { requireAuth, requireAdmin, AuthError } from '@/lib/auth'
import { sendPush } from '@/lib/webpush'
import type webpush from 'web-push'


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

    // Invia push notifications a tutti gli iscritti
    const { data: subs } = await db
      .from('push_subscriptions')
      .select('id, endpoint, subscription, user_id')

    if (subs && subs.length > 0) {
      // Calcola quanti avvisi non letti avrà ogni utente dopo questo nuovo avviso
      const { data: reads } = await db
        .from('avvisi_reads')
        .select('user_id, last_read_at')
        .in('user_id', subs.map(s => s.user_id))

      const readMap = Object.fromEntries((reads ?? []).map(r => [r.user_id, r.last_read_at]))
      const { count: totalAvvisi } = await db
        .from('avvisi')
        .select('*', { count: 'exact', head: true })

      const deadEndpoints: string[] = []
      await Promise.allSettled(
        subs.map(async (row) => {
          try {
            const lastRead = readMap[row.user_id]
            let badge = 1
            if (lastRead) {
              const { count } = await db
                .from('avvisi')
                .select('*', { count: 'exact', head: true })
                .gt('created_at', lastRead)
              badge = (count ?? 0) + 1 // +1 per il nuovo avviso appena creato
            } else {
              badge = (totalAvvisi ?? 0) + 1
            }
            await sendPush(row.subscription as webpush.PushSubscription, {
              title: '📢 Nuovo avviso',
              body: body.titolo,
              url: '/avvisi',
              badge,
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
