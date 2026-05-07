'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Music2 } from 'lucide-react'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!username.trim()) return

    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim().toLowerCase() }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Utente non trovato')
        return
      }
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-100 to-sky-200 px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-full bg-sky-600 flex items-center justify-center mb-4">
            <Music2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-sky-700">DoReMiChele</h1>
          <p className="text-sm text-gray-500 mt-1">Corale di San Michele · Cantù</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Il tuo username
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="es. griantes"
              autoCapitalize="none"
              autoCorrect="off"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-400 mt-1">Cognome + iniziale nome (es. Griante Stefano → griantes)</p>
          </div>

          <button
            type="submit"
            disabled={loading || !username.trim()}
            className="w-full bg-sky-600 hover:bg-sky-700 disabled:bg-sky-300 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            {loading ? 'Accesso...' : 'Entra'}
          </button>
        </form>
      </div>
    </div>
  )
}
