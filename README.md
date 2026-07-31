# La Fenice Positano

Rifacimento responsive e multilingue (inglese, italiano, tedesco e russo) del sito di La Fenice Positano, realizzato con Next.js App Router, TypeScript e Tailwind CSS.

Include l'intro animata con fenice SVG, selettore lingua accessibile, gallerie con lightbox, mappa caricata su richiesta, modulo disponibilità, esperienze richiedibili via email, SEO multilingua e redirect HTTP 301 dagli URL PHP precedenti. Il modulo non è un booking engine: non conferma camere, pagamenti o disponibilità in tempo reale.

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

L'inglese usa gli URL principali; italiano, tedesco e russo sono rispettivamente sotto `/it`, `/de` e `/ru`. Il cambio lingua è manuale, conserva la pagina equivalente e non usa redirect basati sul browser.

| Contenuto | EN | IT | DE | RU |
| --- | --- | --- | --- | --- |
| Home | `/` | `/it` | `/de` | `/ru` |
| Camere | `/rooms` | `/it/camere` | `/de/zimmer` | `/ru/nomera` |
| Piscina | `/pool` | `/it/piscina` | `/de/pool` | `/ru/basseyn` |
| Spiaggia privata | `/private-beach` | `/it/spiaggia-privata` | `/de/privatstrand` | `/ru/chastnyy-plyazh` |
| Orto e sapori | `/garden-table` | `/it/orto-e-sapori` | `/de/garten-und-genuss` | `/ru/sad-i-vkusy` |
| Posizione | `/location` | `/it/posizione` | `/de/lage` | `/ru/raspolozhenie` |
| Come arrivare | `/getting-here` | `/it/come-arrivare` | `/de/anreise` | `/ru/kak-dobratsya` |
| Disponibilità | `/availability` | `/it/disponibilita` | `/de/verfuegbarkeit` | `/ru/zapros-nalichiya` |
| Privacy | `/privacy` | `/it/privacy` | `/de/datenschutz` | `/ru/konfidentsialnost` |
| Condizioni | `/terms` | `/it/condizioni` | `/de/bedingungen` | `/ru/usloviya` |

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

Lo schema per richieste, contenuti, media, ruoli e RLS è predisposto ma non viene applicato automaticamente. In questa fase Supabase resta disattivato e il sito usa i quattro dizionari statici. La migrazione esistente supporta ancora soltanto `en` e `it`: l'estensione database a `de` e `ru` verrà progettata nella seconda fase. Procedura, policy, fallback e ordine di rollout sono documentati in [SUPABASE.md](./SUPABASE.md).

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
