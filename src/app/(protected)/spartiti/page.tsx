'use client'

import { useEffect, useState } from 'react'
import { Music, Plus, Download, Trash2, Search, FileText, X } from 'lucide-react'
import { toast } from 'sonner'
import { Spartito } from '@/types'
import { useUser } from '@/hooks/useUser'

const CATEGORIE = ['liturgica', 'polifonica', 'natalizia', 'mariana', 'altro']

export default function SpartitiPage() {
  const { user } = useUser()
  const [spartiti, setSpartiti] = useState<Spartito[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ titolo: '', compositore: '', categoria: 'altro' })
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  async function load() {
    const res = await fetch('/api/spartiti')
    setSpartiti(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function upload() {
    if (!form.titolo || !file) { toast.error('Titolo e file obbligatori'); return }
    setUploading(true)
    try {
      // Step 1: ottieni URL firmato da Supabase
      const urlRes = await fetch('/api/spartiti/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name }),
      })
      if (!urlRes.ok) { const d = await urlRes.json(); throw new Error(d.error) }
      const { signedUrl, path } = await urlRes.json()

      // Step 2: carica il PDF direttamente su Supabase (bypassa Vercel)
      const uploadRes = await fetch(signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/pdf' },
        body: file,
      })
      if (!uploadRes.ok) throw new Error('Errore nel caricamento del file')

      // Step 3: salva i metadati nel DB
      const metaRes = await fetch('/api/spartiti', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titolo: form.titolo, compositore: form.compositore, categoria: form.categoria, file_path: path }),
      })
      if (!metaRes.ok) { const d = await metaRes.json(); throw new Error(d.error) }

      toast.success('Spartito caricato')
      load(); setShowModal(false); setForm({ titolo: '', compositore: '', categoria: 'altro' }); setFile(null)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Errore nel caricamento')
    } finally { setUploading(false) }
  }

  async function deleteSprt(id: string) {
    if (!confirm('Eliminare questo spartito?')) return
    await fetch(`/api/spartiti/${id}`, { method: 'DELETE' })
    setSpartiti(s => s.filter(x => x.id !== id))
    toast.success('Eliminato')
  }

  const filtered = spartiti.filter(s => {
    const q = search.toLowerCase()
    const matchQ = !q || s.titolo.toLowerCase().includes(q) || s.compositore?.toLowerCase().includes(q)
    const matchC = !catFilter || s.categoria === catFilter
    return matchQ && matchC
  })

  if (loading) return <div className="text-center py-12 text-gray-400">Caricamento...</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Music className="w-5 h-5 text-sky-600" /> Spartiti
        </h1>
        {user?.ruolo === 'admin' && (
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 bg-sky-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-sky-700">
            <Plus className="w-4 h-4" /> Carica
          </button>
        )}
      </div>

      {/* Filtri */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Cerca per titolo o compositore..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500">
          <option value="">Tutte le categorie</option>
          {CATEGORIE.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
        </select>
      </div>

      {filtered.length === 0 && <p className="text-center text-gray-400 py-12">Nessuno spartito trovato.</p>}

      <div className="grid gap-3 sm:grid-cols-2">
        {filtered.map(s => (
          <div key={s.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-sky-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-800 truncate">{s.titolo}</p>
              {s.compositore && <p className="text-sm text-gray-500">{s.compositore}</p>}
              <span className="inline-block text-xs bg-sky-50 text-sky-600 px-2 py-0.5 rounded-full mt-1">{s.categoria}</span>
            </div>
            <div className="flex gap-1.5">
              {s.file_url && (
                <a href={s.file_url} target="_blank" rel="noopener noreferrer" download
                  className="p-2 text-sky-500 hover:text-sky-700 bg-sky-50 rounded-lg" title="Apri / Scarica">
                  <Download className="w-4 h-4" />
                </a>
              )}
              {user?.ruolo === 'admin' && (
                <button onClick={() => deleteSprt(s.id)} className="p-2 text-gray-300 hover:text-red-500 bg-gray-50 rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-5 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Carica spartito</h3>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Titolo *</label>
                <input value={form.titolo} onChange={e => setForm(f => ({ ...f, titolo: e.target.value }))}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Compositore</label>
                <input value={form.compositore} onChange={e => setForm(f => ({ ...f, compositore: e.target.value }))}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Categoria</label>
                <select value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500">
                  {CATEGORIE.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">File PDF *</label>
                <input type="file" accept=".pdf" onChange={e => setFile(e.target.files?.[0] ?? null)}
                  className="mt-1 w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100" />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-600">Annulla</button>
              <button onClick={upload} disabled={uploading}
                className="flex-1 py-2 bg-sky-600 text-white rounded-lg text-sm font-medium hover:bg-sky-700 disabled:bg-sky-300">
                {uploading ? 'Caricamento...' : 'Carica'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
