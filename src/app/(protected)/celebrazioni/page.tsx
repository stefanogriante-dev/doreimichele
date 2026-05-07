'use client'

import { useEffect, useState } from 'react'
import { Church, Plus, Trash2, Pencil, Music, FileText, X } from 'lucide-react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { toast } from 'sonner'
import { Celebrazione, Spartito } from '@/types'
import { useUser } from '@/hooks/useUser'

const TIPI = ['liturgica', 'concerto', 'matrimonio', 'gita', 'altro']

export default function CelebrazioniPage() {
  const { user } = useUser()
  const [celebrazioni, setCelebrazioni] = useState<Celebrazione[]>([])
  const [spartiti, setSpartiti] = useState<Spartito[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Celebrazione | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [form, setForm] = useState({ titolo: '', data: '', tipo: 'liturgica', note: '' })
  const [saving, setSaving] = useState(false)
  const [addCanto, setAddCanto] = useState<{ celebrazioneId: string; spartito_id: string; note: string } | null>(null)

  async function load() {
    const [rc, rs] = await Promise.all([fetch('/api/celebrazioni'), fetch('/api/spartiti')])
    setCelebrazioni(await rc.json())
    setSpartiti(await rs.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openNew() {
    setEditing(null)
    setForm({ titolo: '', data: '', tipo: 'liturgica', note: '' })
    setShowModal(true)
  }

  function openEdit(c: Celebrazione) {
    setEditing(c)
    setForm({ titolo: c.titolo, data: c.data ?? '', tipo: c.tipo, note: c.note ?? '' })
    setShowModal(true)
  }

  async function save() {
    if (!form.titolo) { toast.error('Titolo obbligatorio'); return }
    setSaving(true)
    try {
      const body = { titolo: form.titolo, data: form.data || null, tipo: form.tipo, note: form.note || null }
      const url = editing ? `/api/celebrazioni/${editing.id}` : '/api/celebrazioni'
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error()
      toast.success(editing ? 'Aggiornata' : 'Creata')
      load(); setShowModal(false)
    } catch { toast.error('Errore') } finally { setSaving(false) }
  }

  async function deleteCelebrazione(id: string) {
    if (!confirm('Eliminare questa celebrazione?')) return
    await fetch(`/api/celebrazioni/${id}`, { method: 'DELETE' })
    setCelebrazioni(c => c.filter(x => x.id !== id))
    toast.success('Eliminata')
  }

  async function addCantoToCelebrazione() {
    if (!addCanto?.spartito_id) { toast.error('Seleziona uno spartito'); return }
    const cel = celebrazioni.find(c => c.id === addCanto.celebrazioneId)
    const ordine = (cel?.programma?.length ?? 0) + 1
    const res = await fetch(`/api/celebrazioni/${addCanto.celebrazioneId}/programma`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ spartito_id: addCanto.spartito_id, ordine, note: addCanto.note || null }),
    })
    if (!res.ok) { toast.error('Errore'); return }
    toast.success('Canto aggiunto')
    load(); setAddCanto(null)
  }

  async function removeCanto(celebrazioneId: string, spartito_id: string) {
    await fetch(`/api/celebrazioni/${celebrazioneId}/programma`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ spartito_id }),
    })
    toast.success('Rimosso')
    load()
  }

  if (loading) return <div className="text-center py-12 text-gray-400">Caricamento...</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Church className="w-5 h-5 text-sky-600" /> Celebrazioni
        </h1>
        {user?.ruolo === 'admin' && (
          <button onClick={openNew} className="flex items-center gap-1.5 bg-sky-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-sky-700">
            <Plus className="w-4 h-4" /> Aggiungi
          </button>
        )}
      </div>

      {celebrazioni.length === 0 && <p className="text-center text-gray-400 py-12">Nessuna celebrazione.</p>}

      {celebrazioni.map(cel => (
        <div key={cel.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div
            className="p-4 cursor-pointer hover:bg-sky-50 transition-colors flex items-start justify-between gap-2"
            onClick={() => setExpanded(expanded === cel.id ? null : cel.id)}
          >
            <div>
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">{cel.tipo}</span>
              <h3 className="font-semibold text-gray-800 mt-1">{cel.titolo}</h3>
              {cel.data && (
                <p className="text-sm text-sky-600 mt-0.5">
                  {format(new Date(cel.data + 'T12:00:00'), "EEEE d MMMM yyyy", { locale: it })}
                </p>
              )}
              {cel.note && <p className="text-xs text-gray-400 mt-0.5">{cel.note}</p>}
            </div>
            {user?.ruolo === 'admin' && (
              <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                <button onClick={() => openEdit(cel)} className="p-1.5 text-gray-400 hover:text-sky-600"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => deleteCelebrazione(cel.id)} className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            )}
          </div>

          {expanded === cel.id && (
            <div className="border-t border-gray-100 p-4">
              <h4 className="text-sm font-semibold text-gray-600 mb-2 flex items-center gap-1.5">
                <Music className="w-4 h-4" /> Programma canti
              </h4>
              <div className="space-y-2">
                {(!cel.programma || cel.programma.length === 0) && (
                  <p className="text-sm text-gray-400">Nessun canto nel programma.</p>
                )}
                {cel.programma?.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-2 bg-sky-50 rounded-lg px-3 py-2">
                    <span className="text-xs font-bold text-sky-400 w-5">{i + 1}.</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{p.spartito?.titolo}</p>
                      {p.spartito?.compositore && <p className="text-xs text-gray-400">{p.spartito.compositore}</p>}
                      {p.note && <p className="text-xs text-amber-600 italic">{p.note}</p>}
                    </div>
                    {p.spartito?.file_url && (
                      <a href={p.spartito.file_url} target="_blank" rel="noopener noreferrer"
                        className="p-1.5 text-sky-500 hover:text-sky-700" title="Apri spartito">
                        <FileText className="w-4 h-4" />
                      </a>
                    )}
                    {user?.ruolo === 'admin' && (
                      <button onClick={() => removeCanto(cel.id, p.spartito_id)} className="p-1.5 text-gray-300 hover:text-red-400">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {user?.ruolo === 'admin' && (
                <div className="mt-3 flex gap-2">
                  <select
                    value={addCanto?.celebrazioneId === cel.id ? addCanto.spartito_id : ''}
                    onChange={e => setAddCanto({ celebrazioneId: cel.id, spartito_id: e.target.value, note: '' })}
                    className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
                  >
                    <option value="">+ Aggiungi canto...</option>
                    {spartiti.map(s => <option key={s.id} value={s.id}>{s.titolo}</option>)}
                  </select>
                  {addCanto?.celebrazioneId === cel.id && addCanto.spartito_id && (
                    <button onClick={addCantoToCelebrazione}
                      className="bg-sky-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-sky-700">
                      Aggiungi
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-5 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">{editing ? 'Modifica celebrazione' : 'Nuova celebrazione'}</h3>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Titolo *</label>
                <input value={form.titolo} onChange={e => setForm(f => ({ ...f, titolo: e.target.value }))}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Data</label>
                  <input type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Tipo</label>
                  <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500">
                    {TIPI.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Note</label>
                <textarea value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} rows={2}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none" />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-600">Annulla</button>
              <button onClick={save} disabled={saving} className="flex-1 py-2 bg-sky-600 text-white rounded-lg text-sm font-medium hover:bg-sky-700 disabled:bg-sky-300">
                {saving ? 'Salvo...' : 'Salva'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
