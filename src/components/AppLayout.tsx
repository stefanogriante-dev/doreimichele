'use client'

import { usePathname, useRouter } from 'next/navigation'
import { CalendarDays, Music, Bell, Settings, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { User } from '@/types'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Home', icon: Bell },
  { href: '/calendario', label: 'Calendario', icon: CalendarDays },
  { href: '/avvisi', label: 'Avvisi', icon: Bell },
]

const ADMIN_NAV_ITEMS = [
  { href: '/spartiti', label: 'Spartiti', icon: Music },
  { href: '/admin', label: 'Gestione', icon: Settings },
]

const SEZIONE_COLORS: Record<string, string> = {
  soprano: 'bg-pink-100 text-pink-700',
  contralto: 'bg-purple-100 text-purple-700',
  tenore: 'bg-blue-100 text-blue-700',
  basso: 'bg-gray-100 text-gray-700',
}

export default function AppLayout({ children, user }: { children: React.ReactNode; user: User }) {
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  const allItems = user.ruolo === 'admin'
    ? [...NAV_ITEMS, ...ADMIN_NAV_ITEMS]
    : NAV_ITEMS

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const initials = user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-sky-600 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="md:hidden p-1 rounded-lg hover:bg-sky-700"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <span className="font-bold text-lg tracking-tight">DoReMiChele</span>
        </div>
        <div className="flex items-center gap-2">
          {user.sezione && (
            <span className="hidden sm:inline-flex text-xs px-2 py-0.5 rounded-full font-medium bg-white/20 text-white">
              {user.sezione}
            </span>
          )}
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
            {initials}
          </div>
          <span className="hidden sm:block text-sm">{user.full_name}</span>
          <button onClick={handleLogout} className="p-1.5 rounded-lg hover:bg-sky-700" title="Esci">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar desktop */}
        <nav className="hidden md:flex flex-col w-56 bg-white border-r border-gray-200 py-4 gap-1">
          {allItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <a
                key={href}
                href={href}
                className={`flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active ? 'bg-sky-600 text-white' : 'text-gray-600 hover:bg-sky-50 hover:text-sky-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </a>
            )
          })}
        </nav>

        {/* Mobile menu overlay */}
        {menuOpen && (
          <div className="md:hidden fixed inset-0 z-20 bg-black/40" onClick={() => setMenuOpen(false)}>
            <nav className="absolute left-0 top-14 bottom-0 w-56 bg-white py-4 flex flex-col gap-1" onClick={e => e.stopPropagation()}>
              {allItems.map(({ href, label, icon: Icon }) => {
                const active = pathname === href
                return (
                  <a
                    key={href}
                    href={href}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      active ? 'bg-sky-600 text-white' : 'text-gray-600 hover:bg-sky-50 hover:text-sky-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </a>
                )
              })}
            </nav>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-5xl mx-auto px-4 py-6 pb-24 md:pb-6">
            {children}
          </div>
        </main>
      </div>

      {/* Bottom nav mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe z-30">
        <div className="flex">
          {allItems.slice(0, 5).map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <a
                key={href}
                href={href}
                className={`flex-1 flex flex-col items-center py-2 gap-0.5 text-xs transition-colors ${
                  active ? 'text-sky-600' : 'text-gray-400'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="leading-none">{label}</span>
              </a>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
