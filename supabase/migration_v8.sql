-- migration_v8: data di nascita utenti

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS data_nascita DATE;
