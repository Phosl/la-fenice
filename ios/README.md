# La Fenice · app iOS locale

App nativa SwiftUI per provare i servizi ospite e la gestione admin sullo **stesso dispositivo**. È una demo con dati fittizi, non un servizio operativo della struttura. Non inserire dati personali reali, informazioni sanitarie o credenziali usate altrove.

## Aprire il progetto

Apri `/Users/filippodegennaro/siti/la fenice/ios/LaFenice.xcodeproj`, seleziona lo schema `LaFenice` e un simulatore, per esempio **iPhone 14 Pro**, poi premi Run. Il target supporta iPhone e iPad da iOS 17.

L’installazione locale disponibile è Xcode 16.2 in `/Applications/Xcode.app`. Se la selezione di Xcode della macchina punta ai soli Command Line Tools, usa `DEVELOPER_DIR` nei comandi, senza cambiare la configurazione globale:

```sh
env DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer \
  /usr/bin/xcrun simctl list devices available

env DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer \
  /usr/bin/xcodebuild \
  -project "/Users/filippodegennaro/siti/la fenice/ios/LaFenice.xcodeproj" \
  -scheme LaFenice \
  -configuration Debug \
  -destination 'platform=iOS Simulator,name=iPhone 14 Pro' \
  -derivedDataPath /tmp/la-fenice-ios-build \
  CODE_SIGNING_ALLOWED=NO build
```

Il nome del simulatore deve comparire nell’elenco del primo comando; altrimenti scegli un dispositivo disponibile in Xcode. I comandi permettono di ripetere i controlli; i risultati effettivamente osservati sono riportati nella sezione di verifica sotto. La prova in simulatore non dimostra un’installazione su iPhone fisico.

Il team Apple `ABGN4H8GGB` è configurato per la firma automatica e il bundle identifier `it.lafenicepositano.app` è registrato. Certificati e credenziali non sono inclusi nel repository. Xcode 16.2 è qui un ambiente per la prova locale: la distribuzione TestFlight deve essere compilata con un Xcode/SDK conforme ai requisiti Apple, tramite Xcode Cloud o una macchina aggiornata. La configurazione del team non attesta un caricamento o una distribuzione completati.

## Accesso e dati

| Ruolo da selezionare | Codice | Password |
| --- | --- | --- |
| Ospite | `cliente` | `cliente` |
| Admin | `admin` | `admin` |

Sono credenziali dimostrative pubbliche. I controlli locali dei ruoli non sostituiscono l’autenticazione e l’autorizzazione di un server.

Al primo avvio viene creato un soggiorno fittizio per la famiglia Rossi, con arrivo due giorni prima e partenza quattro giorni dopo il primo avvio. Se la demo viene riaperta dopo quelle date, l’admin può aggiornare il soggiorno o crearne uno nuovo: i dati non vengono azzerati automaticamente.

Lo stato è salvato atomicamente nel contenitore dell’app, in `Library/Application Support/LaFenice/demo-v1.json`. Su iOS il file utilizza la protezione completa dei dati ed è escluso dal backup insieme alla cartella della demo. Un errore di lettura non cancella il file: viene mostrato un errore con il comando Riprova.

Ordini, richieste, soggiorni e modifiche al catalogo persistono fra gli avvii. La sessione resta solo in memoria: alla chiusura completa e riapertura dell’app bisogna effettuare nuovamente il login. Disinstallare l’app elimina il suo contenitore locale; non usarlo come procedura di recupero di dati importanti.

L’interfaccia è in italiano. Menu, esperienze e guida hanno contenuti inglesi, italiani, tedeschi e russi; la lingua dei contenuti si sceglie nella scheda soggiorno.

## Scenari di prova

1. Entra come ospite, verifica camera e date in **Soggiorno**, quindi scegli un giorno valido: da oggi al giorno prima del check-out. Per oggi serve un orario futuro; il giorno di partenza resta consultabile ma non accetta nuovi servizi.
2. In **Ordina**, aggiungi un prodotto, scegli consegna in camera, piscina o spiaggia e verifica il riepilogo prima di confermare. La richiesta deve comparire in **Richieste** come salvata nella demo locale. I prezzi mancanti restano da confermare; non c’è pagamento.
3. In **Esperienze**, richiedi pesca, giro in barca o limonaia. In **Guida**, cerca un luogo e prova una richiesta di assistenza solo dove disponibile. Una richiesta non conferma una prenotazione.
4. Esci dall’account ospite ed entra come admin sullo stesso simulatore. In **Richieste**, filtra la coda, apri la richiesta, aggiungi una nota visibile all’ospite e aggiorna lo stato. Torna all’ospite e verifica nota e stato; una richiesta ancora in attesa può essere annullata dall’ospite.
5. Come admin, prova **Soggiorni**: crea un soggiorno fittizio, conserva le credenziali mostrate, modifica la scheda, reimposta la password o disattiva l’accesso. La disattivazione conserva lo storico. In **Catalogo**, modifica un elemento e verifica la vista ospite dopo il cambio account.
6. Chiudi completamente e riapri l’app: deve richiedere il login e mantenere i dati salvati. Prova anche password errata, date fuori soggiorno e ricerca senza risultati. Per verificare i due ruoli, resta sullo stesso dispositivo: due simulatori hanno archivi distinti.

### Mance sul conto · modifica locale successiva alla build 3

Nel riepilogo dell'ordine l'ospite può scegliere **Nessuna** (predefinita), 2, 5 o 10 EUR oppure un importo libero da 0 a 1.000 EUR, con al massimo due decimali. La mancia è una voce separata, salvata in centesimi insieme all'ordine; i prezzi dei prodotti non ancora noti non diventano zero e il totale resta da confermare.

La scheda soggiorno e il dettaglio admin mostrano il **Conto del soggiorno · demo**: solo ordini confermati o completati, mance comprese. Le mance delle richieste in attesa sono separate; ordini annullati o rifiutati sono esclusi dal conto ma rimangono nello storico. Il riepilogo non include il pernottamento o le esperienze e non crea addebiti reali. Gli ordini precedenti senza questo campo vengono letti come privi di mancia, senza azzerare i dati.

Prova un importo come `2,50`, torna indietro dal riepilogo e riaprilo, salva l'ordine, controlla la mancia nelle Richieste e nel conto in attesa. Come admin conferma l'ordine e verifica l'importo nel conto; annullandolo deve uscire dal conto. Dopo un salvataggio riuscito, il nuovo ordine riparte da **Nessuna**. Queste modifiche non sono incluse nella build TestFlight 3 finché non viene pubblicata una nuova beta.

Verifica locale del 23 settembre 2026: **25 test del core superati** (inclusi importi, persistenza legacy, idempotenza e regole del conto); build Debug simulatore e Release iOS senza firma riuscite. Nel simulatore iPhone 14 Pro / iOS 17 verificati scelta iniziale senza mancia, importo libero `2,50`, errore e conferma disabilitata con `2,555`, riattivazione dopo correzione nello stesso riepilogo, salvataggio e mancia in attesa nel conto ospite. Dopo conferma admin dell'ordine fittizio, il conto del soggiorno mostra **Di cui mance: 2,50 EUR**, senza includerla più tra le mance in attesa. Nessun addebito, invio esterno o aggiornamento TestFlight eseguito.

## Test e catalogo condiviso con il sito

Il core Foundation/Observation è verificabile con SwiftPM, senza avviare l’interfaccia:

```sh
env DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer \
  /usr/bin/xcrun swift test \
  --package-path "/Users/filippodegennaro/siti/la fenice/ios" \
  --scratch-path /tmp/la-fenice-swift-tests
```

Il catalogo incluso contiene 37 elementi del sito: 10 prodotti, 3 attività e 24 voci guida. Non include account o segreti. L’esportazione usa i seed TypeScript esistenti senza modificarli; le date dell’export sono deterministiche e non rappresentano una nuova verifica delle informazioni dei fornitori.

```sh
/Users/filippodegennaro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node \
  "/Users/filippodegennaro/siti/la fenice/scripts/export-ios-catalog.mjs" --check
```

Per rigenerare `LaFenice/Resources/catalog.json` dopo una modifica approvata ai contenuti web, esegui lo stesso comando senza `--check`, poi ricompila. L’export non sovrascrive le modifiche dell’admin: all’avvio l’app aggiunge soltanto le due nuove voci pranzo/pizza se ID e slug non sono già presenti, come descritto sotto.

## Verifica eseguita · 23 settembre 2026

- **20 test del core superati**, inclusi autorizzazioni e isolamento ospiti, date e ora di Roma, prezzi mancanti e storico ordini, idempotenza, transizioni di stato, credenziali, dati corrotti, scritture fallite senza perdita dello stato precedente e durata limitata dell’effetto decorativo.
- **Build Debug per simulatore e Release per dispositivo iOS riuscite**, entrambe senza firma. La build Release non è una distribuzione né una prova su telefono fisico.
- Catalogo sincronizzato con i 35 elementi web tramite `--check`; controllo ESLint dello script di esportazione e validazione del progetto Xcode superati.
- **iPhone 14 Pro, iOS 17:** login ospite, ordine con riepilogo e prezzo da confermare, salvataggio locale, cambio account admin, conferma e nota staff. Dopo ricompilazione e riavvio, nuovo login ospite e verifica della richiesta confermata con nota persistente.
- **iPhone SE di terza generazione, iOS 18.3:** login, scheda soggiorno e calendario su schermo piccolo, blocco delle richieste al check-out, selezione dei contenuti russi, richiesta esperienza con riepilogo e salvataggio, consultazione della guida. Questa prova precede gli ultimi ritocchi alle righe descrittive vuote e ai messaggi delle note; la build finale è stata riprovata sul 14 Pro.
- **Restyling calm, iPhone 14 Pro:** verificati nel simulatore il login, il riflesso sul mare con logo stabile, l’apertura/chiusura del calendario, il menu, l’aggiunta di una caprese, il riepilogo con prezzo da confermare e il salvataggio locale con svuotamento del carrello. La richiesta già presente è stata conservata durante l’aggiornamento. Debug simulatore e Release dispositivo compilano anche il nuovo shader Metal. I colori testuali dei badge confermato/completato e rifiutato superano 4,5:1 sui rispettivi fondi chiari e scuri.
- **Restyling finale, iPhone SE (iOS 18.3):** verificati login, scheda soggiorno, comando principale e menu con contenuti russi; i nomi lunghi vanno a capo e il riepilogo fisso resta sopra la barra delle schede. La preferenza russa e la richiesta precedente sono rimaste presenti. Il tentativo di attivare Movimento ridotto tramite il controllo visuale del simulatore non ha modificato l’opzione: il fallback è implementato, ma la sua resa non è attestata da questa prova. Restano non misurate le prestazioni su iPhone fisico.

La logica di creazione soggiorni, credenziali e modifiche catalogo è coperta dai test; non sono stati completati manualmente tutti i relativi percorsi dell’interfaccia. Restano da verificare VoiceOver, dimensioni testo estreme, iPad e un iPhone fisico. Nessun ordine o messaggio della demo è stato inviato all’esterno.

## TestFlight verificato · 23 settembre 2026

- **0.1.0 (3)**, commit `2ef9b04c2ed367588b58c5bd9b17e3ebeac22e95`, branch `codex/la-fenice-ios-testflight`.
- Xcode Cloud: build 3 riuscita con Xcode 27 (27A266a), archivio iOS ed esportazione firmata per App Store Connect completati. La prima build aveva il compilatore Metal assente; la seconda tentava di reinstallare un componente già importato. `ci_scripts/ci_post_clone.sh` ora verifica l'eseguibile prima e dopo l'eventuale installazione; quattro casi di regressione passano con `sh ios/ci_scripts/test_metal_preflight.sh`.
- App Store Connect: caricamento **Complete**, informazioni sulla crittografia di sistema Apple completate, build **Testing** nel gruppo **La Fenice · Interni** con un tester interno. Note di prova e limiti della demo inseriti nella build.
- [Build TestFlight](https://appstoreconnect.apple.com/teams/69a6de88-aa87-47e3-e053-5b8c7c11a4d1/apps/6815123720/testflight/ios/9b9b7649-2eea-4593-8112-4873fa7295b9).
- La distribuzione interna non dimostra un'installazione su iPhone fisico. Nessuna revisione beta esterna inviata e nessun link pubblico creato: mancano i dati autorizzati del referente per Apple. Nessuna pubblicazione App Store, web o Android.

### Aggiornamento mance · build 4

- **0.1.0 (4)**, commit `62b3c954d12b7ba1d35a5d98936e5cdb625ec9e0`: workflow Xcode Cloud riuscito, caricamento App Store Connect **Complete** e informazioni crittografiche completate.
- Note di prova sulle mance e limiti della demo salvate. Build **Testing** nel gruppo **La Fenice · Interni**, con un tester interno. [Build aggiornata](https://appstoreconnect.apple.com/teams/69a6de88-aa87-47e3-e053-5b8c7c11a4d1/apps/6815123720/testflight/ios/3e07ca9f-fd78-45ab-b939-9feeffb90f20).
- Nessuna prova della build 4 su iPhone fisico. La revisione beta esterna non è stata inviata: il modulo del referente e degli accessi demo è preparato ma non salvato, in attesa dell'autorizzazione specifica alla trasmissione ad Apple. Nessun dato personale del referente è conservato nel repository.

## Ottimizzazione iPad · verifica locale del 24 settembre 2026

- Ospite: contenuti e pulsante riepilogo centrati con larghezza massima di 760 pt nelle finestre regular. Su iPadOS 18+ le schede possono diventare una sidebar nativa; su iOS 17 resta la navigazione a schede. La rotazione cambia il layout senza sostituire le viste del carrello.
- Staff: richieste e soggiorni usano lista/dettaglio nativi, affiancati quando lo spazio lo consente e impilati su iPhone. Le schede staff restano separate dalla sidebar delle liste: annidare due sidebar restringeva la coda su iPadOS 18. I titoli dei dettagli restano nella barra solo in compact; in regular il contesto è già nelle sezioni e nella selezione, evitando sovrapposizioni con le schede superiori.
- **Simulatore iPad Pro 13-inch (M4), iPadOS 18.3:** controllati ritratto/orizzontale, apertura sidebar ospite, menu, carrello conservato cambiando scheda e ruotando, riepilogo con mancia personalizzata `2,50`, salvataggio esclusivamente locale e svuotamento carrello. Verificati conto in attesa, lista/dettaglio staff, nota fittizia conservata alla rotazione e dopo riavvio, conferma admin e mancia di **2,50 EUR** nel conto soggiorno. Il totale dei prodotti senza prezzo resta da confermare.
- **Simulatore iPhone 14 Pro, iOS 17:** verificati login staff, tabbar inferiore, apertura richiesta e ritorno alla coda, soggiorno → richiesta → soggiorno. I dati demo già presenti sono conservati.
- **25 test del core superati**; build Debug simulatore e Release iOS senza firma riuscite, senza warning. `git diff --check` pulito. Nessuna nuova dipendenza, modifica al backend o invio esterno.

Per ripetere la prova: aprire una richiesta in orizzontale, scorrere fino alla gestione, digitare una nota fittizia, ruotare e verificarne il testo; su iPhone usare Indietro sia dalla coda sia dal dettaglio soggiorno. La modifica non è ancora inclusa nella build TestFlight 4: nessun commit, push o nuova distribuzione eseguiti in questa fase. Restano da verificare iPad fisico, iPad da 11 pollici, Split View/Stage Manager, VoiceOver e dimensioni testo estreme.

## Pranzo e Pizza Fenice · aggiunta locale

- Nel menu ospite compaiono **Pranzo → Menu del giorno** e **La sera → Pizza Fenice**, con titoli e descrizioni in EN/IT/DE/RU. Piatti, proposte, prezzi, disponibilità e orari restano da confermare con lo staff; nessun ingrediente, listino o fascia oraria è inventato.
- Si riusano quantità, data/orario preferito, riepilogo, mancia facoltativa, richieste e conto esistenti. I prezzi non impostati restano «Da confermare», mai zero. Non esiste un calendario automatico dei piatti giornalieri: lo staff può aggiornare nomi, descrizioni, prezzi e visibilità dall’editor catalogo.
- Le installazioni precedenti mantengono `demo-v1.json`: dopo averlo validato, l’app aggiunge solo gli ID mancanti `product-daily-lunch` e `product-pizza-fenice`, senza rimpiazzare elementi esistenti o collisioni di slug. Soggiorni, credenziali, storico, modifiche e disattivazioni staff sono conservati. Il salvataggio è atomico e avviene soltanto se ci sono aggiunte; dati corrotti o non validi non vengono cancellati o riseminati.
- **28 test del core superati**: inclusi upgrade idempotente, contenuti staff conservati, collisioni, errore di validazione senza perdita dati, ordini pranzo/pizza e mance separate. Build Debug simulatore riuscita; export `--check` sincronizzato con 37 elementi.
- **Simulatore iPad Pro 13-inch (M4), iPadOS 18.3:** l’aggiornamento senza reset conserva la richiesta precedente e la mancia di 2,50 EUR; sono visibili le nuove sezioni pranzo/sera ed è stata selezionata una Pizza Fenice. Verificati anche riepilogo di un Menu del giorno senza prezzo, conferma esclusivamente locale, schermata «Richiesta salvata» e carrello svuotato. La conferma è raggiungibile con l’azione accessibile Scroll Down del form. Questo controllo è separato dalla verifica su dispositivo fisico, ancora da eseguire.
- Nessun backend, invio ordine, pagamento, commit, push o aggiornamento TestFlight eseguito. Una build precedente non conosce le due nuove categorie: non usare il downgrade come recupero dei dati locali.

## Preparazione aggiornamento completo · 24 settembre 2026

Verifica ripetuta sui sorgenti iPad e pranzo/pizza: **28/28 test core**, build Debug
simulatore e Release iOS senza firma riuscite, senza warning. Catalogo condiviso
allineato a 37 elementi in quattro lingue; **4/4 regressioni Metal** superate.
La distribuzione TestFlight va verificata sul nuovo commit dopo il push: questi
controlli locali non attestano ancora caricamento, assegnazione al gruppo o prova
su iPhone/iPad fisico. Non sono stati collegati Supabase o servizi operativi.

## Confini della demo

### Interfaccia calma e riflessi sul mare

Il login riusa la fotografia e il logo originali. L’ospite vede prima camera, date e il comando per scegliere dal menu; il calendario completo e le preferenze si espandono su richiesta. Il riepilogo dell’ordine rimane raggiungibile sopra la barra delle schede. Gli stessi badge testuali e simbolici distinguono gli stati per ospite e admin, senza affidarsi soltanto al colore.

Il solo header di benvenuto applica `colorEffect` SwiftUI con un piccolo shader Metal, compilato nello stesso target iOS 17+: un tocco produce un riflesso ottico circolare sulla zona di mare della fotografia e torna a riposo entro 2,4 secondi. Non è una simulazione fluidodinamica e non deforma logo, testi o controlli. Il rendering animato si ferma fuori vista, in background e a fine impulso; Movimento ridotto o Metal non disponibile mantengono la fotografia statica. Il controllo temporale ha un test di regressione; questo non sostituisce la verifica visiva su dispositivo.

### Servizi non collegati

Non sono collegati Supabase, un backend, la sincronizzazione fra dispositivi o con il sito, l’invio email, il concierge AI, le notifiche push, pagamenti o disponibilità reali. Le richieste non raggiungono la struttura né i fornitori. I collegamenti espliciti a siti, mappe e telefonate aprono invece servizi esterni: non costituiscono un’integrazione di prenotazione.

Il progetto riusa pochi file di modelli, persistenza e viste; non introduce un backend o un sistema di sincronizzazione anticipato. Per un’app operativa serviranno prima autenticazione server, autorizzazioni e isolamento dei soggiorni sul server, un archivio condiviso, gestione sicura delle credenziali e approvazione di privacy, conservazione dei dati e flussi reali della struttura. Questi passaggi non sono implementati nella demo.
