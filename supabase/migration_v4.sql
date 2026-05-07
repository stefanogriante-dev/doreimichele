-- migration_v4: impostazioni globali app (colore brand)

CREATE TABLE IF NOT EXISTS app_settings (
  id INT PRIMARY KEY DEFAULT 1,
  primary_color TEXT NOT NULL DEFAULT '#0284c7',
  CHECK (id = 1)  -- una sola riga
);

-- Inserisce la riga di default se non esiste
INSERT INTO app_settings (id, primary_color) VALUES (1, '#0284c7')
ON CONFLICT (id) DO NOTHING;
