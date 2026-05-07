-- migration_v3: canti con titolo libero (senza spartito obbligatorio)

ALTER TABLE event_canti ADD COLUMN IF NOT EXISTS titolo_libero TEXT;
ALTER TABLE event_canti ALTER COLUMN spartito_id DROP NOT NULL;

ALTER TABLE programma_canti ADD COLUMN IF NOT EXISTS titolo_libero TEXT;
ALTER TABLE programma_canti ALTER COLUMN spartito_id DROP NOT NULL;
