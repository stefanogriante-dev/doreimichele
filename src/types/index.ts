export type UserRole = 'admin' | 'corista'
export type Sezione = 'soprano' | 'contralto' | 'tenore' | 'basso'
export type EventType = 'prova' | 'celebrazione' | 'evento'
export type RispostaPresenza = 'si' | 'no' | 'forse'

export interface User {
  id: string
  username: string
  full_name: string
  sezione: Sezione | null
  ruolo: UserRole
  is_active: boolean
  created_at: string
  citta_nascita: string | null
  numero_ci: string | null
  scadenza_ci: string | null   // ISO date string YYYY-MM-DD
}

export interface CalendarEvent {
  id: string
  tipo: EventType
  titolo: string
  descrizione: string | null
  data_inizio: string
  data_fine: string | null
  location: string | null
  note: string | null
  created_by: string | null
  created_at: string
  presenze?: Presenza[]
  mia_presenza?: RispostaPresenza | null
}

export interface Presenza {
  id: string
  event_id: string
  user_id: string
  risposta: RispostaPresenza
  updated_at: string
  user?: User
}

export interface Spartito {
  id: string
  titolo: string
  compositore: string | null
  categoria: string
  file_path: string
  file_url?: string
  created_at: string
}

export interface Celebrazione {
  id: string
  titolo: string
  data: string | null
  tipo: string
  note: string | null
  created_at: string
  programma?: ProgrammaCanto[]
}

export interface ProgrammaCanto {
  id: string
  celebrazione_id: string
  spartito_id: string
  ordine: number
  note: string | null
  spartito?: Spartito
}

export interface Avviso {
  id: string
  titolo: string
  contenuto: string
  autore_id: string | null
  created_at: string
  autore?: User
  commenti?: Commento[]
  commenti_count?: number
}

export interface Commento {
  id: string
  avviso_id: string
  autore_id: string
  testo: string
  created_at: string
  autore?: User
}
