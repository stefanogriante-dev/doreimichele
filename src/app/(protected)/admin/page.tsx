'use client'

import { useEffect, useState } from 'react'
import { Settings, Plus, Pencil, Trash2, X, Users, Palette } from 'lucide-react'
import { toast } from 'sonner'
import { User, Sezione, UserRole } from '@/types'
import { useUser } from '@/hooks/useUser'

const SEZIONI: { value: Sezione | ''; label: string }[] = [
  { value: '', label: '— nessuna —' },
  { value: 'soprano', label: 'Soprano' },
  { value: 'contralto', label: 'Contralto' },
  { value: 'tenore', label: 'Tenore' },
  { value: 'basso', label: 'Basso' },
]

const SEZIONE_COLORS: Record<string, string> = {
  soprano: 'bg-pink-100 text-pink-700',
  contralto: 'bg-purple-100 text-purple-700',
  tenore: 'bg-blue-100 text-blue-700',
  basso: 'bg-gray-100 text-gray-700',
}

const emptyForm = { username: '', full_name: '', sezione: '' as Sezione | '', ruolo: 'corista' as UserRole }

export default function AdminPage() {
  const { user: me } = useUser()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [brandColor, setBrandColor] = useState('#0284c7')
  const [savingColor, setSavingColor] = useState(false)

  async function load() {
    const res = await fetch('/api/admin/users')
    if (res.status === 403) return
    setUsers(await res.json())
    setLoading(false)
  }

  async function loadColor() {
    const res = await fetch('/api/settings')
    const data = await res.json()
    if (data.primary_color) setBrandColor(data.primary_color)
  }

  async function saveColor() {
    setSavingColor(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ primary_color: brandColor }),
      })
      if (!res.ok) throw new Error()
      // Apply immediately without full reload via router refresh
      window.location.reload()
    } catch {
      toast.error('Errore nel salvataggio')
      setSavingColor(false)
    }
  }

  useEffect(() => { load(); loadColor() }, [])

  if (me && me.ruolo !== 'admin') {
    return <div className="text-center py-12 text-red-500">Accesso negato.</div>
  }

  function openNew() {
    setEditing(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  function openEdit(u: User) {
    setEditing(u)
    setForm({ username: u.username, full_name: u.full_name, sezione: u.sezione ?? '', ruolo: u.ruolo })
    setShowModal(true)
  }

  async function save() {
    if (!form.username || !form.full_name) { toast.error('Username e nome obbligatori'); return }
    setSaving(true)
    try {
      const body = { ...form, sezione: form.sezione || null }
      const url = editing ? `/api/admin/users/${editing.id}` : '/api/admin/users'
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(editing ? 'Utente aggiornato' : 'Utente creato')
      load(); setShowModal(false)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Errore')
    } finally { setSaving(false) }
  }

  async function toggleActive(u: User) {
    await fetch(`/api/admin/users/${u.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !u.is_active }),
    })
    setUsers(prev => prev.map(x => x.id === u.id ? { ...x, is_active: !x.is_active } : x))
  }

  async function deleteUser(id: string) {
    if (!confirm('Eliminare questo utente?')) return
    await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
    setUsers(u => u.filter(x => x.id !== id))
    toast.success('Eliminato')
  }

  const bySezione = SEZIONI.filter(s => s.value).map(s => ({
    label: s.label,
    value: s.value,
    items: users.filter(u => u.sezione === s.value),
  }))
  const noSezione = users.filter(u => !u.sezione)

  if (loading) return <div className="text-center py-12 text-gray-400">Caricamento...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Settings className="w-5 h-5 text-sky-600" /> Gestione
        </h1>
        <button onClick={openNew}
          className="flex items-center gap-1.5 bg-sky-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-sky-700">
          <Plus className="w-4 h-4" /> Nuovo utente
        </button>
      </div>

      {/* Colore brand */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <h2 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Palette className="w-4 h-4" /> Colore layout app
        </h2>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={brandColor}
            onChange={e => setBrandColor(e.target.value)}
            className="w-12 h-10 rounded-lg border border-gray-300 cursor-pointer p-0.5"
          />
          <span className="text-sm font-mono text-gray-600">{brandColor}</span>
          <button
            onClick={saveColor}
            disabled={savingColor}
            className="ml-auto px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-60"
            style={{ backgroundColor: brandColor }}
          >
            {savingColor ? 'Salvo...' : 'Salva colore'}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">Il nuovo colore sarà visibile a tutti al prossimo caricamento della pagina.</p>
      </div>

      {/* Statistiche */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {SEZIONI.filter(s => s.value).map(s => {
          const count = users.filter(u => u.sezione === s.value && u.is_active).length
          return (
            <div key={s.value} className={`rounded-xl p-3 text-center ${SEZIONE_COLORS[s.value]}`}>
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-sm font-medium">{s.label}</p>
            </div>
          )
        })}
      </div>

      {/* Lista utenti per sezione */}
      {bySezione.map(({ label, value, items }) => items.length > 0 && (
        <section key={value}>
          <h2 className="font-semibold text-gray-600 mb-2 flex items-center gap-2">
            <Users className="w-4 h-4" /> {label} ({items.length})
          </h2>
          <div className="space-y-2">
            {items.map(u => <UserRow key={u.id} u={u} onEdit={openEdit} onDelete={deleteUser} onToggle={toggleActive} />)}
          </div>
        </section>
      ))}

      {noSezione.length > 0 && (
        <section>
          <h2 className="font-semibold text-gray-600 mb-2">Admin / Senza sezione</h2>
          <div className="space-y-2">
            {noSezione.map(u => <UserRow key={u.id} u={u} onEdit={openEdit} onDelete={deleteUser} onToggle={toggleActive} />)}
          </div>
        </section>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-5 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">{editing ? 'Modifica utente' : 'Nuovo utente'}</h3>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Username *</label>
                <input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value.toLowerCase() }))}
                  placeholder="es. rossim"
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
                <p className="text-xs text-gray-400 mt-0.5">Cognome + iniziale nome</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Nome completo *</label>
                <input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                  placeholder="es. Rossi Mario"
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Sezione</label>
                  <select value={form.sezione} onChange={e => setForm(f => ({ ...f, sezione: e.target.value as Sezione | '' }))}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500">
                    {SEZIONI.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Ruolo</label>
                  <select value={form.ruolo} onChange={e => setForm(f => ({ ...f, ruolo: e.target.value as UserRole }))}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500">
                    <option value="corista">Corista</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-600">Annulla</button>
              <button onClick={save} disabled={saving}
                className="flex-1 py-2 bg-sky-600 text-white rounded-lg text-sm font-medium hover:bg-sky-700 disabled:bg-sky-300">
                {saving ? 'Salvo...' : 'Salva'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function UserRow({ u, onEdit, onDelete, onToggle }: {
  u: User
  onEdit: (u: User) => void
  onDelete: (id: string) => void
  onToggle: (u: User) => void
}) {
  return (
    <div className={`bg-white rounded-xl border p-3 flex items-center gap-3 ${!u.is_active ? 'opacity-50' : 'border-gray-100'}`}>
      <div className="w-9 h-9 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 font-bold text-sm">
        {u.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-800 text-sm">{u.full_name}</p>
        <p className="text-xs text-gray-400">@{u.username} · {u.ruolo}</p>
      </div>
      <div className="flex gap-1.5">
        <button onClick={() => onToggle(u)}
          className={`text-xs px-2 py-1 rounded-full font-medium ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
          {u.is_active ? 'Attivo' : 'Disattivo'}
        </button>
        <button onClick={() => onEdit(u)} className="p-1.5 text-gray-400 hover:text-sky-600"><Pencil className="w-3.5 h-3.5" /></button>
        <button onClick={() => onDelete(u.id)} className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
    </div>
  )
}
