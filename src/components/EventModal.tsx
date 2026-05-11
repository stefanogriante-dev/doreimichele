'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { CalendarEvent } from '@/types'
import { X } from 'lucide-react'

const TIPI = ['prova', 'celebrazione', 'evento']

function splitDateTime(iso: string | null | undefined): { date: string; time: string } {
  if (!iso) return { date: '', time: '' }
  const d = new Date(iso)
  const date = iso.slice(0, 10)
  const h = d.getHours(), m = d.getMinutes()
  const time = (h === 0 && m === 0) ? '' : `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  return { date, time }
}

export default function EventModal({
  event,
  onClose,
  onSaved,
}: {
  event: CalendarEvent | null
  onClose: () => void
  onSaved: () => void
}) {
  const inizioSplit = splitDateTime(event?.data_inizio)
  const fineSplit = splitDateTime(event?.data_fine)

  const [form, setForm] = useState({
    tipo: event?.tipo ?? 'prova',
    titolo: event?.titolo ?? '',
    data: inizioSplit.date,
    ora: inizioSplit.time,
    data_fine: fineSplit.date,
    ora_fine: fineSplit.time,
    location: event?.location ?? '',
    note: event?.note ?? '',
  })
  const [saving, setSaving] = useState(false)

  function set(k: string, v: string) {
    setForm(f => ({ ...f, [k]: v }))
  }

  async function save() {
    if (!form.titolo || !form.data) {
      toast.error('Titolo e data obbligatori')
      return
    }
    setSaving(true)
    try {
      const data_inizio = new Date(`${form.data}T${form.ora || '00:00'}:00`).toISOString()
      const data_fine = form.data_fine
        ? new Date(`${form.data_fine}T${form.ora_fine || '00:00'}:00`).toISOString()
        : null

      const body = {
        tipo: form.tipo,
        titolo: form.titolo,
        data_inizio,
        data_fine,
        location: form.location || null,
        note: form.note || null,
      }
      const url = event ? `/api/events/${event.id}` : '/api/events'
      const method = event ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error()
      toast.success(event ? 'Evento aggiornato' : 'Evento creato')
      onSaved()
      onClose()
    } catch {
      toast.error('Errore nel salvataggio')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md p-5 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">{event ? 'Modifica evento' : 'Nuovo evento'}</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700">Tipo</label>
            <select value={form.tipo} onChange={e => set('tipo', e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500">
              {TIPI.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Titolo *</label>
            <input value={form.titolo} onChange={e => set('titolo', e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Data *</label>
              <input type="date" value={form.data} onChange={e => set('data', e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Ora <span className="text-gray-400 font-normal">(opz.)</span></label>
              <input type="time" value={form.ora} onChange={e => set('ora', e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Data fine <span className="text-gray-400 font-normal">(opz.)</span></label>
              <input type="date" value={form.data_fine} onChange={e => set('data_fine', e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Ora fine <span className="text-gray-400 font-normal">(opz.)</span></label>
              <input type="time" value={form.ora_fine} onChange={e => set('ora_fine', e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Location</label>
            <input value={form.location} onChange={e => set('location', e.target.value)}
              placeholder="es. Chiesa di San Michele"
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Note</label>
            <textarea value={form.note} onChange={e => set('note', e.target.value)} rows={2}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none" />
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
            Annulla
          </button>
          <button onClick={save} disabled={saving}
            className="flex-1 py-2 bg-sky-600 text-white rounded-lg text-sm font-medium hover:bg-sky-700 disabled:bg-sky-300">
            {saving ? 'Salvo...' : 'Salva'}
          </button>
        </div>
      </div>
    </div>
  )
}
