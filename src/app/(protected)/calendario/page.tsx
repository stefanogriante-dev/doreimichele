'use client'

import { useEffect, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'
import { CalendarDays, MapPin, Plus, Pencil, Trash2, Check, X, HelpCircle, Users, Music, FileText, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'
import { CalendarEvent, RispostaPresenza, Presenza, Spartito } from '@/types'
import EventModal from '@/components/EventModal'
import { useUser } from '@/hooks/useUser'

const TIPO_COLORS: Record<string, string> = {
  prova: 'bg-sky-100 text-sky-700 border-sky-200',
  celebrazione: 'bg-purple-100 text-purple-700 border-purple-200',
  evento: 'bg-amber-100 text-amber-700 border-amber-200',
}

const TIPO_LABEL: Record<string, string> = {
  prova: 'Prova',
  celebrazione: 'Celebrazione',
  evento: 'Evento',
}

const RISPOSTA_ICONS = {
  si: { icon: Check, color: 'text-green-600 bg-green-50', label: 'Ci sono' },
  no: { icon: X, color: 'text-red-500 bg-red-50', label: 'Non ci sono' },
  forse: { icon: HelpCircle, color: 'text-amber-500 bg-amber-50', label: 'Forse' },
}

interface EventCanto {
  id: string
  event_id: string
  spartito_id: string
  ordine: number
  note: string | null
  spartito: Spartito | null
}

export default function CalendarioPage() {
  const { user } = useUser()
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<CalendarEvent | null>(null)
  const [presenze, setPresenze] = useState<Record<string, RispostaPresenza | null>>({})
  const [showPresenze, setShowPresenze] = useState<string | null>(null)
  const [presenzeDettaglio, setPresenzeDettaglio] = useState<Presenza[]>([])
  const [expandedCanti, setExpandedCanti] = useState<string | null>(null)
  const [canti, setCanti] = useState<Record<string, EventCanto[]>>({})
  const [spartiti, setSpartiti] = useState<Spartito[]>([])
  const [addCanto, setAddCanto] = useState<Record<string, string>>({})

  async function load() {
    const res = await fetch('/api/events')
    const data = await res.json()
    setEvents(data)
    setLoading(false)

    if (user) {
      const map: Record<string, RispostaPresenza | null> = {}
      for (const e of data) {
        const r = await fetch(`/api/events/${e.id}/presenze`)
        const ps: Presenza[] = await r.json()
        const mia = ps.find(p => p.user_id === user.id)
        map[e.id] = mia?.risposta ?? null
      }
      setPresenze(map)
    }
  }

  useEffect(() => { load() }, [user])

  useEffect(() => {
    if (user?.ruolo === 'admin') {
      fetch('/api/spartiti').then(r => r.json()).then(setSpartiti)
    }
  }, [user])

  async function toggleCanti(eventId: string) {
    if (expandedCanti === eventId) { setExpandedCanti(null); return }
    setExpandedCanti(eventId)
    if (!canti[eventId]) {
      const res = await fetch(`/api/events/${eventId}/canti`)
      const data = await res.json()
      setCanti(c => ({ ...c, [eventId]: data }))
    }
  }

  async function addCantoToEvent(eventId: string) {
    const spartito_id = addCanto[eventId]
    if (!spartito_id) { toast.error('Seleziona uno spartito'); return }
    const ordine = (canti[eventId]?.length ?? 0) + 1
    const res = await fetch(`/api/events/${eventId}/canti`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ spartito_id, ordine }),
    })
    if (!res.ok) { toast.error('Errore'); return }
    const nuovo = await res.json()
    setCanti(c => ({ ...c, [eventId]: [...(c[eventId] ?? []), nuovo] }))
    setAddCanto(a => ({ ...a, [eventId]: '' }))
    toast.success('Canto aggiunto')
  }

  async function removeCanto(eventId: string, spartito_id: string) {
    await fetch(`/api/events/${eventId}/canti`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ spartito_id }),
    })
    setCanti(c => ({ ...c, [eventId]: c[eventId]?.filter(x => x.spartito_id !== spartito_id) ?? [] }))
    toast.success('Rimosso')
  }

  async function rispondi(eventId: string, risposta: RispostaPresenza) {
    const prev = presenze[eventId]
    setPresenze(p => ({ ...p, [eventId]: risposta }))
    const res = await fetch(`/api/events/${eventId}/presenze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ risposta }),
    })
    if (!res.ok) {
      setPresenze(p => ({ ...p, [eventId]: prev }))
      toast.error('Errore nel salvataggio')
    }
  }

  async function deleteEvent(id: string) {
    if (!confirm('Eliminare questo evento?')) return
    await fetch(`/api/events/${id}`, { method: 'DELETE' })
    setEvents(ev => ev.filter(e => e.id !== id))
    toast.success('Evento eliminato')
  }

  async function loadPresenze(eventId: string) {
    const res = await fetch(`/api/events/${eventId}/presenze`)
    setPresenzeDettaglio(await res.json())
    setShowPresenze(eventId)
  }

  if (loading) return <div className="text-center py-12 text-gray-400">Caricamento...</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-sky-600" /> Calendario
        </h1>
        {user?.ruolo === 'admin' && (
          <button
            onClick={() => { setEditing(null); setShowModal(true) }}
            className="flex items-center gap-1.5 bg-sky-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-sky-700"
          >
            <Plus className="w-4 h-4" /> Aggiungi
          </button>
        )}
      </div>

      {events.length === 0 && (
        <p className="text-center text-gray-400 py-12">Nessun evento in calendario.</p>
      )}

      {events.map(event => {
        const mia = presenze[event.id]
        const cantiEvento = canti[event.id] ?? []
        const isExpanded = expandedCanti === event.id

        return (
          <div key={event.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium mb-1.5 ${TIPO_COLORS[event.tipo]}`}>
                    {TIPO_LABEL[event.tipo]}
                  </span>
                  <h3 className="font-semibold text-gray-800">{event.titolo}</h3>
                  <p className="text-sm text-sky-700 mt-0.5">
                    {format(parseISO(event.data_inizio), "EEEE d MMMM yyyy 'alle' HH:mm", { locale: it })}
                    {event.data_fine && ` - ${format(parseISO(event.data_fine), 'HH:mm')}`}
                  </p>
                  {event.location && (
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {event.location}
                    </p>
                  )}
                  {event.note && <p className="text-sm text-gray-500 mt-2 bg-gray-50 rounded-lg p-2">{event.note}</p>}
                </div>
                {user?.ruolo === 'admin' && (
                  <div className="flex gap-1">
                    <button onClick={() => { setEditing(event); setShowModal(true) }} className="p-1.5 text-gray-400 hover:text-sky-600">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteEvent(event.id)} className="p-1.5 text-gray-400 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Canti + Presenze */}
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                <div className="flex gap-1.5">
                  {(Object.entries(RISPOSTA_ICONS) as [RispostaPresenza, typeof RISPOSTA_ICONS[RispostaPresenza]][]).map(([r, { icon: Icon, color, label }]) => (
                    <button
                      key={r}
                      onClick={() => rispondi(event.id, r)}
                      title={label}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all border ${
                        mia === r ? `${color} border-current shadow-sm scale-105` : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{label}</span>
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleCanti(event.id)}
                    className="text-xs text-sky-600 hover:text-sky-800 flex items-center gap-1"
                  >
                    <Music className="w-3.5 h-3.5" />
                    Canti
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                  <button
                    onClick={() => loadPresenze(event.id)}
                    className="text-xs text-gray-400 hover:text-sky-600 flex items-center gap-1"
                  >
                    <Users className="w-3.5 h-3.5" /> Presenze
                  </button>
                </div>
              </div>
            </div>

            {/* Sezione canti espandibile */}
            {isExpanded && (
              <div className="border-t border-gray-100 bg-sky-50/50 p-4">
                <h4 className="text-sm font-semibold text-gray-600 mb-2 flex items-center gap-1.5">
                  <Music className="w-4 h-4 text-sky-500" /> Canti da provare
                </h4>
                <div className="space-y-2">
                  {cantiEvento.length === 0 && (
                    <p className="text-sm text-gray-400">Nessun canto aggiunto.</p>
                  )}
                  {cantiEvento.map((c, i) => (
                    <div key={c.id} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-sky-100">
                      <span className="text-xs font-bold text-sky-400 w-5">{i + 1}.</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{c.spartito?.titolo}</p>
                        {c.spartito?.compositore && <p className="text-xs text-gray-400">{c.spartito.compositore}</p>}
                      </div>
                      {c.spartito?.file_url && (
                        <a href={c.spartito.file_url} target="_blank" rel="noopener noreferrer"
                          className="p-1.5 text-sky-500 hover:text-sky-700" title="Apri spartito">
                          <FileText className="w-4 h-4" />
                        </a>
                      )}
                      {user?.ruolo === 'admin' && (
                        <button onClick={() => removeCanto(event.id, c.spartito_id)} className="p-1.5 text-gray-300 hover:text-red-400">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {user?.ruolo === 'admin' && (
                  <div className="mt-3 flex gap-2">
                    <select
                      value={addCanto[event.id] ?? ''}
                      onChange={e => setAddCanto(a => ({ ...a, [event.id]: e.target.value }))}
                      className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-sm bg-white"
                    >
                      <option value="">+ Aggiungi canto...</option>
                      {spartiti
                        .filter(s => !cantiEvento.some(c => c.spartito_id === s.id))
                        .map(s => <option key={s.id} value={s.id}>{s.titolo}</option>)}
                    </select>
                    {addCanto[event.id] && (
                      <button
                        onClick={() => addCantoToEvent(event.id)}
                        className="bg-sky-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-sky-700"
                      >
                        Aggiungi
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* Modal presenze */}
      {showPresenze && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setShowPresenze(null)}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-5" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><Users className="w-4 h-4" /> Risposte</h3>
            {presenzeDettaglio.length === 0 && <p className="text-sm text-gray-400">Nessuna risposta ancora.</p>}
            <div className="space-y-2">
              {(['si', 'no', 'forse'] as RispostaPresenza[]).map(r => {
                const lista = presenzeDettaglio.filter(p => p.risposta === r)
                if (lista.length === 0) return null
                const { icon: Icon, color, label } = RISPOSTA_ICONS[r]
                return (
                  <div key={r}>
                    <p className={`text-xs font-medium flex items-center gap-1 mb-1 ${color.split(' ')[0]}`}>
                      <Icon className="w-3 h-3" /> {label} ({lista.length})
                    </p>
                    {lista.map(p => (
                      <p key={p.id} className="text-sm text-gray-600 pl-4">{(p.user as { full_name: string } | undefined)?.full_name || p.user_id}</p>
                    ))}
                  </div>
                )
              })}
            </div>
            <button onClick={() => setShowPresenze(null)} className="mt-4 w-full py-2 text-sm text-gray-500 border rounded-lg hover:bg-gray-50">Chiudi</button>
          </div>
        </div>
      )}

      {showModal && (
        <EventModal
          event={editing}
          onClose={() => setShowModal(false)}
          onSaved={load}
        />
      )}
    </div>
  )
}
