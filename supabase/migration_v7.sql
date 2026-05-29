-- migration_v7: dati documento (C.I.) utenti

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS citta_nascita TEXT,
  ADD COLUMN IF NOT EXISTS numero_ci TEXT,
  ADD COLUMN IF NOT EXISTS scadenza_ci DATE;

-- Aggiornamento da elenco Siena 2026
-- Corrispondenze trovate tra Excel e DB

UPDATE users SET citta_nascita = 'Cantù',          numero_ci = 'CA72444TD', scadenza_ci = '2034-07-28' WHERE full_name ILIKE 'Arrighi Anna';
UPDATE users SET citta_nascita = 'Cantù',          numero_ci = 'CA13570SM', scadenza_ci = '2033-06-06' WHERE full_name ILIKE 'Baron Barbara';
UPDATE users SET citta_nascita = 'Cantù',          numero_ci = 'CA80071NS', scadenza_ci = '2031-12-29' WHERE full_name ILIKE 'Bianchi Barbara';
UPDATE users SET citta_nascita = 'Cantù',          numero_ci = 'CA21871JF', scadenza_ci = '2031-10-12' WHERE full_name ILIKE 'Bianchi Ercole';
UPDATE users SET citta_nascita = 'Cantù',          numero_ci = 'CA41287MQ', scadenza_ci = '2033-05-04' WHERE full_name ILIKE 'Buono Rosangela';
UPDATE users SET citta_nascita = 'Como',           numero_ci = 'AX2239147', scadenza_ci = '2027-09-12' WHERE full_name ILIKE 'Cairoli Elena';
UPDATE users SET citta_nascita = 'Cantù',          numero_ci = 'CA72439JC', scadenza_ci = '2032-03-06' WHERE full_name ILIKE 'Conzatti Luigi';
UPDATE users SET citta_nascita = 'Cantù',          numero_ci = 'CA00685SY', scadenza_ci = '2033-12-31' WHERE full_name ILIKE 'De Pascalis Federica';
UPDATE users SET citta_nascita = 'Busto Arsizio',  numero_ci = 'CA58622JJ', scadenza_ci = '2031-11-23' WHERE full_name ILIKE 'Ferrian Paola';
UPDATE users SET citta_nascita = 'Erba',           numero_ci = 'CA35745HJ', scadenza_ci = '2031-06-03' WHERE full_name ILIKE 'Giostra Paolo';
UPDATE users SET citta_nascita = 'Cantù',          numero_ci = 'CA33431NU', scadenza_ci = '2032-02-04' WHERE full_name ILIKE 'Griante Stefano';
UPDATE users SET citta_nascita = 'Cantù',          numero_ci = 'CA99625MT', scadenza_ci = '2032-09-04' WHERE full_name ILIKE 'Griante Rosalia';
UPDATE users SET citta_nascita = 'Como',           numero_ci = 'CA45904JZ', scadenza_ci = '2032-01-08' WHERE full_name ILIKE 'Isella Luca';
UPDATE users SET citta_nascita = 'Como',           numero_ci = 'CA60720LY', scadenza_ci = '2032-12-11' WHERE full_name ILIKE 'Marelli Irene';
UPDATE users SET citta_nascita = 'Como',           numero_ci = 'CA30398IQ', scadenza_ci = '2032-03-23' WHERE full_name ILIKE 'Molten% Antonio';  -- Molteni o Moltenia
UPDATE users SET citta_nascita = 'Cantù',          numero_ci = 'CA42227EA', scadenza_ci = '2029-11-24' WHERE full_name ILIKE 'Pasquaretta Armando';
UPDATE users SET citta_nascita = 'Cantù',          numero_ci = 'CA27924XR', scadenza_ci = '2035-08-31' WHERE full_name ILIKE 'Roman_ Mauro';       -- Romano o Romano'
UPDATE users SET citta_nascita = 'Amendolara',     numero_ci = 'CA69368PE', scadenza_ci = '2033-05-30' WHERE full_name ILIKE 'Stamato%';            -- Stamato Giusy o Giuseppina
UPDATE users SET citta_nascita = 'Cantù',          numero_ci = 'CA88057SL', scadenza_ci = '2033-06-21' WHERE full_name ILIKE 'Tagliabue Nicoletta';
UPDATE users SET citta_nascita = 'Cantù',          numero_ci = 'CA32702IQ', scadenza_ci = '2031-07-30' WHERE full_name ILIKE 'Terraneo Monica';
