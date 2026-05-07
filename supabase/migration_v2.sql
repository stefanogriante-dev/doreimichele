-- migration_v2: aggiunge elenco canti agli eventi del calendario

CREATE TABLE IF NOT EXISTS event_canti (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  spartito_id UUID NOT NULL REFERENCES spartiti(id) ON DELETE CASCADE,
  ordine INT NOT NULL DEFAULT 0,
  note TEXT,
  UNIQUE(event_id, spartito_id)
);
