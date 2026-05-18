-- migration_v6: traccia avvisi letti per utente

CREATE TABLE IF NOT EXISTS avvisi_reads (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
