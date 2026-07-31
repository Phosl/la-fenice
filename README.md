# La Fenice Positano

Rifacimento responsive e bilingue del sito di La Fenice Positano, realizzato con Next.js App Router, TypeScript e Tailwind CSS.

Include l'intro animata con fenice SVG, navigazione accessibile, gallerie con lightbox, mappa caricata su richiesta, modulo disponibilità, SEO multilingua e redirect HTTP 301 dagli URL PHP precedenti. Il modulo non è un booking engine: non conferma camere, pagamenti o disponibilità in tempo reale.

## Requisiti e avvio

- Node.js 22 o successivo
- npm

```bash
npm install
cp .env.example .env.local
npm run dev
```

Il sito è disponibile su `http://localhost:3000`.

## Script

| Comando | Funzione |
| --- | --- |
| `npm run dev` | Avvia Next.js in sviluppo |
| `npm run build` | Genera la build di produzione |
| `npm run start` | Avvia la build di produzione |
| `npm run typecheck` | Controlla i tipi TypeScript |
| `npm run lint` | Esegue ESLint |
| `npm run test:run` | Esegue una volta i test Vitest |
| `npm run test:e2e` | Esegue i test Playwright su mobile e desktop |
| `npm run check` | Esegue typecheck, lint, test e build |

Per il primo test end-to-end installare Chromium con `npx playwright install chromium`.

## Route

L'inglese usa gli URL principali; l'italiano è sotto `/it`. Il cambio lingua è manuale, senza redirect basati sul browser.

| Contenuto | EN | IT |
| --- | --- | --- |
| Home | `/` | `/it` |
| Camere | `/rooms` | `/it/camere` |
| Piscina | `/pool` | `/it/piscina` |
| Spiaggia privata | `/private-beach` | `/it/spiaggia-privata` |
| Orto e sapori | `/garden-table` | `/it/orto-e-sapori` |
| Posizione | `/location` | `/it/posizione` |
| Come arrivare | `/getting-here` | `/it/come-arrivare` |
| Disponibilità | `/availability` | `/it/disponibilita` |
| Privacy | `/privacy` | `/it/privacy` |
| Condizioni | `/terms` | `/it/condizioni` |

## Variabili d'ambiente

Copiare `.env.example` in `.env.local`. Il sito informativo funziona anche senza servizi esterni.

```dotenv
NEXT_PUBLIC_SITE_URL=https://www.lafenicepositano.com

RESEND_API_KEY=
INQUIRY_FROM_EMAIL=La Fenice <requests@lafenicepositano.com>
INQUIRY_TO_EMAIL=info@lafenicepositano.com

SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

La Server Action valida le richieste, applica un honeypot anti-spam e invia l'email con Resend. Se Resend non è configurato o la consegna fallisce, l'interfaccia mostra email e telefono per il contatto diretto. La persistenza Supabase è opzionale e non blocca l'invio email.

`RESEND_API_KEY` e `SUPABASE_SERVICE_ROLE_KEY` devono rimanere esclusivamente server-side. La service role non deve mai avere il prefisso `NEXT_PUBLIC_`.

## Supabase — seconda fase

Lo schema per richieste, contenuti, media, ruoli e RLS è predisposto ma non viene applicato automaticamente. Procedura, policy, fallback e ordine di rollout sono documentati in [SUPABASE.md](./SUPABASE.md).

## Deploy su Vercel

Importare il repository in Vercel oppure usare la CLI:

```bash
npx vercel
npx vercel --prod
```

Configurare le variabili d'ambiente in Vercel per ogni ambiente interessato. Impostare `NEXT_PUBLIC_SITE_URL` sull'URL canonico definitivo prima della pubblicazione del dominio; Vercel rileva automaticamente Next.js e usa `npm run build`.

## Prima del lancio sul dominio

- verificare il dominio mittente in Resend e provare la consegna del modulo;
- far approvare contatti, servizi e affermazioni commerciali dal titolare;
- sostituire Privacy e Condizioni provvisorie con testi legali approvati;
- sostituire le immagini legacy a bassa risoluzione in `public/images/legacy` con fotografie originali ad alta risoluzione.

Finché i testi legali non sono approvati, le relative pagine restano escluse dall'indicizzazione. Il dominio pubblico non va collegato alla preview prima di queste verifiche.
