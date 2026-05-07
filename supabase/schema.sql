-- DoReMiChele — Schema DB

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  sezione TEXT CHECK (sezione IN ('soprano', 'contralto', 'tenore', 'basso')),
  ruolo TEXT NOT NULL DEFAULT 'corista' CHECK (ruolo IN ('admin', 'corista')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL CHECK (tipo IN ('prova', 'celebrazione', 'evento')),
  titolo TEXT NOT NULL,
  descrizione TEXT,
  data_inizio TIMESTAMPTZ NOT NULL,
  data_fine TIMESTAMPTZ,
  location TEXT,
  note TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS presenze (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  risposta TEXT NOT NULL CHECK (risposta IN ('si', 'no', 'forse')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

CREATE TABLE IF NOT EXISTS spartiti (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titolo TEXT NOT NULL,
  compositore TEXT,
  categoria TEXT NOT NULL DEFAULT 'altro',
  file_path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS celebrazioni (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titolo TEXT NOT NULL,
  data DATE,
  tipo TEXT NOT NULL DEFAULT 'liturgica',
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS programma_canti (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  celebrazione_id UUID NOT NULL REFERENCES celebrazioni(id) ON DELETE CASCADE,
  spartito_id UUID NOT NULL REFERENCES spartiti(id) ON DELETE CASCADE,
  ordine INT NOT NULL DEFAULT 0,
  note TEXT,
  UNIQUE(celebrazione_id, spartito_id)
);

CREATE TABLE IF NOT EXISTS avvisi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titolo TEXT NOT NULL,
  contenuto TEXT NOT NULL,
  autore_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS commenti (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  avviso_id UUID NOT NULL REFERENCES avvisi(id) ON DELETE CASCADE,
  autore_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  testo TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Storage bucket per spartiti PDF
-- Eseguire nel Supabase Dashboard → Storage → New Bucket → "spartiti" (public)

-- Utente admin iniziale (eseguire dopo aver creato lo schema)
-- INSERT INTO users (username, full_name, ruolo, sezione)
-- VALUES ('griantes', 'Griante Stefano', 'admin', null);
