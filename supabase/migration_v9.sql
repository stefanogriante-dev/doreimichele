-- migration_v9: date di nascita utenti (da elenco Siena 2026)

UPDATE users SET data_nascita = '1968-07-28' WHERE full_name ILIKE 'Arrighi Anna';
UPDATE users SET data_nascita = '1973-06-06' WHERE full_name ILIKE 'Baron Barbara';
UPDATE users SET data_nascita = '1976-12-29' WHERE full_name ILIKE 'Bianchi Barbara';
UPDATE users SET data_nascita = '1970-10-12' WHERE full_name ILIKE 'Bianchi Ercole';
UPDATE users SET data_nascita = '1963-05-04' WHERE full_name ILIKE 'Buono Rosangela';
UPDATE users SET data_nascita = '1963-09-12' WHERE full_name ILIKE 'Cairoli Elena';
UPDATE users SET data_nascita = '1967-03-06' WHERE full_name ILIKE 'Conzatti Luigi';
UPDATE users SET data_nascita = '1979-12-31' WHERE full_name ILIKE 'De Pascalis Federica';
UPDATE users SET data_nascita = '1975-11-23' WHERE full_name ILIKE 'Ferrian Paola';
UPDATE users SET data_nascita = '1969-06-03' WHERE full_name ILIKE 'Giostra Paolo';
UPDATE users SET data_nascita = '1976-02-04' WHERE full_name ILIKE 'Griante Stefano';
UPDATE users SET data_nascita = '1960-09-04' WHERE full_name ILIKE 'Griante Rosalia';
UPDATE users SET data_nascita = '1968-01-08' WHERE full_name ILIKE 'Isella Luca';
UPDATE users SET data_nascita = '1971-12-11' WHERE full_name ILIKE 'Marelli Irene';
UPDATE users SET data_nascita = '1963-03-23' WHERE full_name ILIKE 'Molten% Antonio';
UPDATE users SET data_nascita = '1964-11-24' WHERE full_name ILIKE 'Pasquaretta Armando';
UPDATE users SET data_nascita = '1970-08-31' WHERE full_name ILIKE 'Roman_ Mauro';
UPDATE users SET data_nascita = '1966-05-30' WHERE full_name ILIKE 'Stamato%';
UPDATE users SET data_nascita = '1966-06-21' WHERE full_name ILIKE 'Tagliabue Nicoletta';
UPDATE users SET data_nascita = '1969-07-30' WHERE full_name ILIKE 'Terraneo Monica';
