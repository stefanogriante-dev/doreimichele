# CLAUDE.md — DoReMiChele

App PWA per la gestione della **Corale di San Michele** di Cantù.

## Stack
- **Next.js** (App Router) + TypeScript + Tailwind CSS
- **Supabase** (database + Storage) — progetto: `CoraleSanMichele`, ID: `gjoumhmimopuizvopbkj`
- **Vercel** — deploy automatico da `master`
- **web-push** — notifiche push (VAPID)

## Repository e deploy
- **GitHub:** `https://github.com/stefanogriante-dev/doreimichele`
- **Produzione:** `https://doremichele.com` (anche `doremichele.vercel.app`)
- **Branch di lavoro:** `master`

## Percorso locale
`E:\Stefano\progetti_personali\AppCoraleSanMichele`

## Comandi
```bash
npm run dev     # sviluppo locale → http://localhost:3000
npm run build   # verifica TypeScript + build
```

## Autenticazione
- Login con **username** (cognome + iniziale nome, es. `bianchim`)
- Cookie httpOnly `dmichele_uid`
- Ruoli: `corista` | `admin`

## Struttura pagine
| Percorso | Visibile a | Descrizione |
|----------|-----------|-------------|
| `/dashboard` | tutti | Home con guida uso app |
| `/calendario` | tutti | Eventi con presenze, canti, filtro tipo |
| `/avvisi` | tutti | Comunicazioni con badge non letti |
| `/spartiti` | solo admin | Libreria PDF con upload diretto Supabase |
| `/admin` | solo admin | Gestione utenti |

## Tabelle Supabase
| Tabella | Descrizione |
|---------|-------------|
| `users` | Utenti — `username`, `full_name`, `sezione`, `ruolo`, `is_active` |
| `events` | Appuntamenti — tipo: `prova`, `celebrazione`, `evento` |
| `presenze` | Conferme presenza per evento (`si`, `no`, `forse`) |
| `spartiti` | Metadati PDF — file su Storage bucket `spartiti` |
| `event_canti` | Canti collegati a un evento (con o senza spartito) |
| `celebrazioni` | Celebrazioni liturgiche con programma canti |
| `programma_canti` | Canti nel programma di una celebrazione |
| `avvisi` | Comunicazioni con titolo, contenuto, autore |
| `commenti` | Commenti sugli avvisi |
| `app_settings` | Impostazioni globali (id=1 sempre) |
| `push_subscriptions` | Subscription Web Push per notifiche |
| `avvisi_reads` | Timestamp ultima lettura avvisi per utente |

## Migration history
- `schema.sql` — schema iniziale
- `migration_v2.sql` — tabella `event_canti`
- `migration_v3.sql` — `spartito_id` nullable + `titolo_libero` in event_canti e programma_canti
- `migration_v4.sql` — tabella `app_settings` (primary_color)
- `migration_v5.sql` — tabella `push_subscriptions`
- `migration_v6.sql` — tabella `avvisi_reads`

## Note tecniche
- **Upload PDF:** client-side diretto su Supabase Storage via signed URL (bypassa limite 4.5MB Vercel)
- **Next.js 16:** usa `proxy.ts` con `export function proxy()` (non `middleware.ts`)
- **Notifiche push:** VAPID keys in env vars (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`)
- **Badge icona app:** Badging API — aggiornato in `AppLayout.tsx` e `public/sw.js`
- **Celebrazioni nel calendario:** card con `bg-purple-50` + bordo sinistro viola + icona Church
- **Avvisi non letti:** conteggio via `avvisi_reads.last_read_at`; azzerato quando si apre `/avvisi`

## Variabili d'ambiente (Vercel + .env.local)
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY
VAPID_SUBJECT
```
