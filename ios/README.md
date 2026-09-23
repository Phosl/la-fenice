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

## Test e catalogo condiviso con il sito

Il core Foundation/Observation è verificabile con SwiftPM, senza avviare l’interfaccia:

```sh
env DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer \
  /usr/bin/xcrun swift test \
  --package-path "/Users/filippodegennaro/siti/la fenice/ios" \
  --scratch-path /tmp/la-fenice-swift-tests
```

Il catalogo incluso contiene 35 elementi del sito: 8 prodotti, 3 attività e 24 voci guida. Non include account o segreti. L’esportazione usa i seed TypeScript esistenti senza modificarli; le date dell’export sono deterministiche e non rappresentano una nuova verifica delle informazioni dei fornitori.

```sh
/Users/filippodegennaro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node \
  "/Users/filippodegennaro/siti/la fenice/scripts/export-ios-catalog.mjs" --check
```

Per rigenerare `LaFenice/Resources/catalog.json` dopo una modifica approvata ai contenuti web, esegui lo stesso comando senza `--check`, poi ricompila. L’export non aggiorna il catalogo già salvato in un contenitore della demo: non sovrascrive le modifiche dell’admin.

## Verifica eseguita · 23 settembre 2026

- **19 test del core superati**, inclusi autorizzazioni e isolamento ospiti, date e ora di Roma, prezzi mancanti e storico ordini, idempotenza, transizioni di stato, credenziali, dati corrotti e scritture fallite senza perdita dello stato precedente.
- **Build Debug per simulatore e Release per dispositivo iOS riuscite**, entrambe senza firma. La build Release non è una distribuzione né una prova su telefono fisico.
- Catalogo sincronizzato con i 35 elementi web tramite `--check`; controllo ESLint dello script di esportazione e validazione del progetto Xcode superati.
- **iPhone 14 Pro, iOS 17:** login ospite, ordine con riepilogo e prezzo da confermare, salvataggio locale, cambio account admin, conferma e nota staff. Dopo ricompilazione e riavvio, nuovo login ospite e verifica della richiesta confermata con nota persistente.
- **iPhone SE di terza generazione, iOS 18.3:** login, scheda soggiorno e calendario su schermo piccolo, blocco delle richieste al check-out, selezione dei contenuti russi, richiesta esperienza con riepilogo e salvataggio, consultazione della guida. Questa prova precede gli ultimi ritocchi alle righe descrittive vuote e ai messaggi delle note; la build finale è stata riprovata sul 14 Pro.

La logica di creazione soggiorni, credenziali e modifiche catalogo è coperta dai test; non sono stati completati manualmente tutti i relativi percorsi dell’interfaccia. Restano da verificare VoiceOver, dimensioni testo estreme, iPad e un iPhone fisico. Non sono stati eseguiti firma, invio ad App Store Connect o distribuzione TestFlight. Nessun ordine o messaggio è stato inviato all’esterno.

## Confini della demo

Non sono collegati Supabase, un backend, la sincronizzazione fra dispositivi o con il sito, l’invio email, il concierge AI, le notifiche push, pagamenti o disponibilità reali. Le richieste non raggiungono la struttura né i fornitori. I collegamenti espliciti a siti, mappe e telefonate aprono invece servizi esterni: non costituiscono un’integrazione di prenotazione.

Il progetto riusa pochi file di modelli, persistenza e viste; non introduce un backend o un sistema di sincronizzazione anticipato. Per un’app operativa serviranno prima autenticazione server, autorizzazioni e isolamento dei soggiorni sul server, un archivio condiviso, gestione sicura delle credenziali e approvazione di privacy, conservazione dei dati e flussi reali della struttura. Questi passaggi non sono implementati nella demo.
