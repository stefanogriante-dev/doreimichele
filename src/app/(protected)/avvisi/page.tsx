'use client'

import { useEffect, useState } from 'react'
import { Bell, Plus, Trash2, MessageSquare, Send, X, ChevronDown, ChevronUp } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'
import { toast } from 'sonner'
import { Avviso, Commento } from '@/types'
import { useUser } from '@/hooks/useUser'

export default function AvvisiPage() {
  const { user } = useUser()
  const [avvisi, setAvvisi] = useState<Avviso[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ titolo: '', contenuto: '' })
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [commenti, setCommenti] = useState<Record<string, Commento[]>>({})
  const [newComment, setNewComment] = useState<Record<string, string>>({})
  const [sendingComment, setSendingComment] = useState<string | null>(null)

  async function load() {
    const res = await fetch('/api/avvisi')
    setAvvisi(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function toggleExpand(avvisoId: string) {
    if (expanded === avvisoId) { setExpanded(null); return }
    setExpanded(avvisoId)
    if (!commenti[avvisoId]) {
      const res = await fetch(`/api/avvisi/${avvisoId}/commenti`)
      const data = await res.json()
      setCommenti(c => ({ ...c, [avvisoId]: data }))
    }
  }

  async function postComment(avvisoId: string) {
    const testo = newComment[avvisoId]?.trim()
    if (!testo) return
    setSendingComment(avvisoId)
    try {
      const res = await fetch(`/api/avvisi/${avvisoId}/commenti`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testo }),
      })
      if (!res.ok) throw new Error()
      const c = await res.json()
      setCommenti(prev => ({ ...prev, [avvisoId]: [...(prev[avvisoId] ?? []), c] }))
      setNewComment(prev => ({ ...prev, [avvisoId]: '' }))
      setAvvisi(prev => prev.map(a => a.id === avvisoId ? { ...a, commenti_count: (a.commenti_count ?? 0) + 1 } : a))
    } catch { toast.error('Errore') } finally { setSendingComment(null) }
  }

  async function saveAvviso() {
    if (!form.titolo || !form.contenuto) { toast.error('Titolo e testo obbligatori'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/avvisi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      toast.success('Avviso pubblicato')
      load(); setShowModal(false); setForm({ titolo: '', contenuto: '' })
    } catch { toast.error('Errore') } finally { setSaving(false) }
  }

  async function deleteAvviso(id: string) {
    if (!confirm('Eliminare questo avviso?')) return
    await fetch(`/api/avvisi/${id}`, { method: 'DELETE' })
    setAvvisi(a => a.filter(x => x.id !== id))
    toast.success('Eliminato')
  }

  if (loading) return <div className="text-center py-12 text-gray-400">Caricamento...</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Bell className="w-5 h-5 text-sky-600" /> Avvisi
        </h1>
        {user?.ruolo === 'admin' && (
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 bg-sky-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-sky-700">
            <Plus className="w-4 h-4" /> Nuovo
          </button>
        )}
      </div>

      {avvisi.length === 0 && <p className="text-center text-gray-400 py-12">Nessun avviso.</p>}

      {avvisi.map(avviso => (
        <div key={avviso.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800">{avviso.titolo}</h3>
                <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">{avviso.contenuto}</p>
                <p className="text-xs text-gray-400 mt-2">
                  {format(parseISO(avviso.created_at), "d MMM yyyy 'alle' HH:mm", { locale: it })}
                  {avviso.autore && ` · ${(avviso.autore as { full_name: string }).full_name}`}
                </p>
              </div>
              {user?.ruolo === 'admin' && (
                <button onClick={() => deleteAvviso(avviso.id)} className="p-1.5 text-gray-300 hover:text-red-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              onClick={() => toggleExpand(avviso.id)}
              className="mt-3 flex items-center gap-1.5 text-sm text-sky-600 hover:text-sky-800"
            >
              <MessageSquare className="w-4 h-4" />
              {avviso.commenti_count ?? 0} commenti
              {expanded === avviso.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {expanded === avviso.id && (
            <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-3">
              {(commenti[avviso.id] ?? []).map(c => (
                <div key={c.id} className="bg-white rounded-lg p-3 border border-gray-100">
                  <p className="text-sm font-medium text-gray-700">{(c.autore as { full_name: string } | undefined)?.full_name}</p>
                  <p className="text-sm text-gray-600 mt-0.5">{c.testo}</p>
                  <p className="text-xs text-gray-400 mt-1">{format(parseISO(c.created_at), "d MMM HH:mm", { locale: it })}</p>
                </div>
              ))}
              {(commenti[avviso.id] ?? []).length === 0 && (
                <p className="text-sm text-gray-400">Nessun commento ancora. Sii il primo!</p>
              )}
              <div className="flex gap-2 pt-1">
                <input
                  value={newComment[avviso.id] ?? ''}
                  onChange={e => setNewComment(prev => ({ ...prev, [avviso.id]: e.target.value }))}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); postComment(avviso.id) } }}
                  placeholder="Scrivi un commento..."
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <button
                  onClick={() => postComment(avviso.id)}
                  disabled={sendingComment === avviso.id}
                  className="p-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:bg-sky-300"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-5 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Nuovo avviso</h3>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Titolo *</label>
                <input value={form.titolo} onChange={e => setForm(f => ({ ...f, titolo: e.target.value }))}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Testo *</label>
                <textarea value={form.contenuto} onChange={e => setForm(f => ({ ...f, contenuto: e.target.value }))} rows={4}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none" />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-600">Annulla</button>
              <button onClick={saveAvviso} disabled={saving}
                className="flex-1 py-2 bg-sky-600 text-white rounded-lg text-sm font-medium hover:bg-sky-700 disabled:bg-sky-300">
                {saving ? 'Pubblicando...' : 'Pubblica'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
