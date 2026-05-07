import { getSessionUser } from '@/lib/auth'
import { getDb } from '@/lib/supabase/admin'
import { format, parseISO, isAfter } from 'date-fns'
import { it } from 'date-fns/locale'
import { CalendarDays, MapPin, Bell } from 'lucide-react'
import Link from 'next/link'

const TIPO_LABEL: Record<string, string> = {
  prova: 'Prova',
  celebrazione: 'Celebrazione',
  evento: 'Evento',
}

const TIPO_COLORS: Record<string, string> = {
  prova: 'bg-sky-100 text-sky-700',
  celebrazione: 'bg-purple-100 text-purple-700',
  evento: 'bg-amber-100 text-amber-700',
}

export default async function DashboardPage() {
  const user = await getSessionUser()
  const db = getDb()
  const now = new Date().toISOString()

  const [{ data: events }, { data: avvisi }] = await Promise.all([
    db
      .from('events')
      .select('*')
      .gte('data_inizio', now)
      .order('data_inizio', { ascending: true })
      .limit(3),
    db
      .from('avvisi')
      .select('*, autore:users(full_name)')
      .order('created_at', { ascending: false })
      .limit(3),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Ciao, {user?.full_name.split(' ')[0]}! 👋</h1>
        <p className="text-gray-500 text-sm mt-0.5">Corale di San Michele · Cantù</p>
      </div>

      {/* Prossimi eventi */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-700 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-sky-600" />
            Prossimi appuntamenti
          </h2>
          <Link href="/calendario" className="text-sm text-sky-600 hover:underline">Vedi tutti</Link>
        </div>
        <div className="space-y-3">
          {events?.length === 0 && (
            <p className="text-sm text-gray-400 bg-white rounded-xl p-4 border border-gray-100">Nessun appuntamento in programma.</p>
          )}
          {events?.map(event => (
            <div key={event.id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium mb-1 ${TIPO_COLORS[event.tipo]}`}>
                    {TIPO_LABEL[event.tipo]}
                  </span>
                  <p className="font-semibold text-gray-800">{event.titolo}</p>
                  <p className="text-sm text-sky-600 mt-0.5">
                    {format(parseISO(event.data_inizio), "EEEE d MMMM 'alle' HH:mm", { locale: it })}
                  </p>
                  {event.location && (
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {event.location}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Ultimi avvisi */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-700 flex items-center gap-2">
            <Bell className="w-4 h-4 text-sky-600" />
            Ultimi avvisi
          </h2>
          <Link href="/avvisi" className="text-sm text-sky-600 hover:underline">Vedi tutti</Link>
        </div>
        <div className="space-y-3">
          {avvisi?.length === 0 && (
            <p className="text-sm text-gray-400 bg-white rounded-xl p-4 border border-gray-100">Nessun avviso.</p>
          )}
          {avvisi?.map(avviso => (
            <Link key={avviso.id} href="/avvisi">
              <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:border-sky-200 transition-colors">
                <p className="font-semibold text-gray-800">{avviso.titolo}</p>
                <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{avviso.contenuto}</p>
                <p className="text-xs text-gray-400 mt-2">
                  {format(parseISO(avviso.created_at), "d MMM yyyy", { locale: it })} · {(avviso.autore as { full_name: string } | null)?.full_name}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
