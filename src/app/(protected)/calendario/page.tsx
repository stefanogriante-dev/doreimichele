'use client'

import { useEffect, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'
import { CalendarDays, MapPin, Plus, Pencil, Trash2, Check, X, HelpCircle, Users, Music, FileText, ChevronDown, ChevronUp, Church } from 'lucide-react'
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
  spartito_id: string | null
  titolo_libero: string | null
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
  const [addCanto, setAddCanto] = useState<Record<string, { modo: 'libreria' | 'titolo'; spartito_id: string; titolo_libero: string }>>({})
  const [tipoFilter, setTipoFilter] = useState<string>('')

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

  function getAddCanto(eventId: string) {
    return addCanto[eventId] ?? { modo: 'libreria' as const, spartito_id: '', titolo_libero: '' }
  }

  function setAddCantoField(eventId: string, field: string, value: string) {
    setAddCanto(a => ({ ...a, [eventId]: { ...getAddCanto(eventId), [field]: value } }))
  }

  async function addCantoToEvent(eventId: string) {
    const stato = getAddCanto(eventId)
    const ordine = (canti[eventId]?.length ?? 0) + 1
    const body = stato.modo === 'libreria'
      ? { spartito_id: stato.spartito_id, ordine }
      : { titolo_libero: stato.titolo_libero, ordine }

    const res = await fetch(`/api/events/${eventId}/canti`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) { const d = await res.json(); toast.error(d.error || 'Errore'); return }
    const nuovo = await res.json()
    setCanti(c => ({ ...c, [eventId]: [...(c[eventId] ?? []), nuovo] }))
    setAddCanto(a => ({ ...a, [eventId]: { modo: stato.modo, spartito_id: '', titolo_libero: '' } }))
    toast.success('Canto aggiunto')
  }

  async function removeCanto(eventId: string, cantoId: string) {
    await fetch(`/api/events/${eventId}/canti`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ canto_id: cantoId }),
    })
    setCanti(c => ({ ...c, [eventId]: c[eventId]?.filter(x => x.id !== cantoId) ?? [] }))
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

  const TIPI_FILTER = [
    { value: '', label: 'Tutti' },
    { value: 'prova', label: 'Prova' },
    { value: 'celebrazione', label: 'Celebrazione' },
    { value: 'evento', label: 'Evento' },
  ]

  const filtered = tipoFilter ? events.filter(e => e.tipo === tipoFilter) : events

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

      {/* Filtro tipo */}
      <div className="flex gap-2 flex-wrap">
        {TIPI_FILTER.map(t => (
          <button
            key={t.value}
            onClick={() => setTipoFilter(t.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
              tipoFilter === t.value
                ? 'bg-sky-600 text-white border-sky-600'
                : 'bg-white text-gray-500 border-gray-200 hover:border-sky-300 hover:text-sky-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-gray-400 py-12">Nessun evento trovato.</p>
      )}

      {filtered.map(event => {
        const mia = presenze[event.id]
        const cantiEvento = canti[event.id] ?? []
        const isExpanded = expandedCanti === event.id

        const isCelebrazione = event.tipo === 'celebrazione'

        return (
          <div key={event.id} className={`rounded-xl shadow-sm overflow-hidden border ${
            isCelebrazione
              ? 'bg-purple-50 border-l-4 border-l-purple-400 border-t-purple-100 border-r-purple-100 border-b-purple-100'
              : 'bg-white border-gray-100'
          }`}>
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium mb-1.5 ${TIPO_COLORS[event.tipo]}`}>
                    {TIPO_LABEL[event.tipo]}
                  </span>
                  <h3 className="font-semibold text-gray-800 flex items-center gap-1.5">
                    {isCelebrazione && <Church className="w-4 h-4 text-purple-500 flex-shrink-0" />}
                    {event.titolo}
                  </h3>
                  <p className="text-sm text-sky-700 mt-0.5">
                    {(() => {
                      const d = parseISO(event.data_inizio)
                      const hasTime = d.getHours() !== 0 || d.getMinutes() !== 0
                      return hasTime
                        ? format(d, "EEEE d MMMM yyyy 'alle' HH:mm", { locale: it })
                        : format(d, 'EEEE d MMMM yyyy', { locale: it })
                    })()}
                    {event.data_fine && (() => {
                      const df = parseISO(event.data_fine)
                      const hasTime = df.getHours() !== 0 || df.getMinutes() !== 0
                      return hasTime ? ` — ${format(df, 'HH:mm')}` : ''
                    })()}
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
                        <p className="text-sm font-medium text-gray-800">
                          {c.spartito?.titolo ?? c.titolo_libero}
                        </p>
                        {c.spartito?.compositore && <p className="text-xs text-gray-400">{c.spartito.compositore}</p>}
                        {!c.spartito && <p className="text-xs text-gray-400 italic">solo titolo</p>}
                      </div>
                      {c.spartito?.file_url && (
                        <a href={c.spartito.file_url} target="_blank" rel="noopener noreferrer"
                          className="p-1.5 text-sky-500 hover:text-sky-700" title="Apri spartito">
                          <FileText className="w-4 h-4" />
                        </a>
                      )}
                      {user?.ruolo === 'admin' && (
                        <button onClick={() => removeCanto(event.id, c.id)} className="p-1.5 text-gray-300 hover:text-red-400">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {user?.ruolo === 'admin' && (() => {
                  const stato = getAddCanto(event.id)
                  return (
                    <div className="mt-3 space-y-2">
                      {/* Toggle modalità */}
                      <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5 w-fit">
                        {(['libreria', 'titolo'] as const).map(m => (
                          <button key={m} onClick={() => setAddCantoField(event.id, 'modo', m)}
                            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${stato.modo === m ? 'bg-white text-sky-700 shadow-sm' : 'text-gray-500'}`}>
                            {m === 'libreria' ? '📄 Da libreria' : '✏️ Solo titolo'}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        {stato.modo === 'libreria' ? (
                          <select
                            value={stato.spartito_id}
                            onChange={e => setAddCantoField(event.id, 'spartito_id', e.target.value)}
                            className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-sm bg-white"
                          >
                            <option value="">Seleziona spartito...</option>
                            {spartiti
                              .filter(s => !cantiEvento.some(c => c.spartito_id === s.id))
                              .map(s => <option key={s.id} value={s.id}>{s.titolo}{s.compositore ? ` — ${s.compositore}` : ''}</option>)}
                          </select>
                        ) : (
                          <input
                            value={stato.titolo_libero}
                            onChange={e => setAddCantoField(event.id, 'titolo_libero', e.target.value)}
                            placeholder="Titolo del canto..."
                            className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                          />
                        )}
                        <button
                          onClick={() => addCantoToEvent(event.id)}
                          disabled={stato.modo === 'libreria' ? !stato.spartito_id : !stato.titolo_libero.trim()}
                          className="bg-sky-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-sky-700 disabled:bg-sky-300"
                        >
                          Aggiungi
                        </button>
                      </div>
                    </div>
                  )
                })()}
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
