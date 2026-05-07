'use client'

import { useEffect, useState } from 'react'
import { User } from '@/types'

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => { setUser(d.user ?? null) })
      .finally(() => setLoading(false))
  }, [])

  return { user, loading }
}
