# La Fenice · Android

Prima app **nativa Kotlin / Jetpack Compose**, non WebView. Demo locale ospiti e admin, coerente con la demo iOS. Nessun backend o Supabase, ordine reale, email, pagamento, notifica o sincronizzazione tra dispositivi. Usare solo dati fittizi.

## Aprire e compilare

Aprire questa cartella `android` in Android Studio. Il checkout deve includere anche `ios/LaFenice/Resources`: il catalogo e le immagini di proprietà sono condivisi a build time, non duplicati o scaricati dall’app.

- JDK 17; Gradle 8.9 tramite wrapper con checksum fissato.
- Android SDK Platform 35, Build Tools 34.0.0, Platform Tools.
- Android 8.0/API 26 o successivo; target API 35 per questa prova locale.
- Kotlin 2.0.21, AGP 8.7.3, Compose BOM 2024.12.01.

Installare il SDK con Android Studio dopo avere letto e accettato personalmente la [licenza Android SDK](https://developer.android.com/studio/terms). Non sono incluse accettazioni automatiche. Configurare `ANDROID_HOME` oppure il file locale non versionato `local.properties` con `sdk.dir=...`.

```sh
cd android
./gradlew testDebugUnitTest lintDebug assembleDebug
```

L’[APK di prova compilato](app/build/outputs/apk/debug/app-debug.apk) è `app/build/outputs/apk/debug/app-debug.apk`. È firmato solo con chiave debug locale. Non è una release Play Store; non sono stati creati account Play Console, chiavi release o upload.

## Provare i flussi

Accessi pubblici dimostrativi:

- Ospite: `cliente` / `cliente`.
- Admin: `admin` / `admin`.

L’ospite trova scheda soggiorno, giorno selezionabile, ordini con riepilogo, esperienze, guida offline e storico richieste. Il giorno di partenza e i giorni passati sono consultabili ma non accettano nuovi servizi. Gli orari seguono `Europe/Rome`. I prezzi non forniti restano «da confermare».

Uscire e accedere come admin **sullo stesso dispositivo** per modificare lo stato di una richiesta e la nota visibile all’ospite, creare/modificare soggiorni, disattivare accessi, generare password e gestire il catalogo. Gli stati conclusi non possono riaprirsi. Le nuove credenziali sono mostrate una volta; se perse si può generarne un’altra.

La guida ha ricerca, categorie e collegamenti esterni HTTPS. Il telefono apre il compositore, senza avviare una chiamata. I contenuti del catalogo sono EN/IT/DE/RU; l’interfaccia è in italiano. Il concierge online non è collegato.

## Interfaccia e acqua

L’interfaccia segue il percorso **giorno → scelta → riepilogo → richiesta**: avorio caldo, cobalto, titoli serif di sistema e foto/logo originali. Il soggiorno mette subito in evidenza camera, date e azione per ordinare; il menu raggruppa le categorie, conserva le quantità e mantiene visibile il riepilogo. Lo stato delle richieste è espresso con parole, non soltanto con colori. Lo staff parte dalle richieste in attesa. Nessuna nuova dipendenza grafica o font remoto.

La fascia sotto la fotografia di benvenuto usa un vero `RuntimeShader` AGSL su Android 13/API 33 o successivo. È **acqua ottica decorativa con distorsione limitata**, non una simulazione fluida: non campiona o deforma foto, logo, testo o controlli e non intercetta gesti. La sequenza si assesta in circa 5,5 secondi di attività (massimo 8 con scala sistema) e poi smette di aggiornarsi. Fuori viewport o in background viene sospesa senza recuperare il tempo trascorso.

Su API precedenti, animazioni di sistema disabilitate, hardware non disponibile o errore shader resta un gradiente statico. Il programma è riutilizzato durante pausa/resize; coroutine e listener vengono rimossi al teardown. API di riferimento: [AGSL su Android](https://developer.android.com/develop/ui/views/graphics/agsl/using-agsl), [ValueAnimator](https://developer.android.com/reference/android/animation/ValueAnimator).

## Dati e limiti

- Un file atomico `la-fenice-demo-v1.json` nella directory privata `noBackupFilesDir`; nessuna esportazione o backup automatico.
- Password PBKDF2-SHA256, sale casuale, controlli di ruolo e proprietà delle richieste. Rimane autenticazione di una **demo locale**, non protezione di dati alberghieri reali.
- Sessione solo in memoria; nuovo accesso dopo riavvio del processo.
- Primo soggiorno di prova creato una sola volta, da due giorni prima a quattro giorni dopo il primo avvio. Non viene spostato automaticamente: a scadenza l’admin può creare un nuovo soggiorno.
- Un errore di lettura/validazione non cancella né sostituisce i dati. Una scrittura fallita non mostra successo né pubblica uno stato parziale.
- Nessun permesso Internet, posizione, contatti o fotocamera nel manifest dell’app. Browser e dialer esterni sono avviati solo dal comando dell’utente.
- Azioni di salvataggio e password fuori dal thread UI; bozze dei moduli su errore, carrello tra schede e campi su rotazione. Logout chiude le bozze non salvate.

## Verifica del 24 settembre 2026

**Superati:** compilazione dell’app Kotlin/Compose, `testDebugUnitTest`, `lintDebug` e `assembleDebug`, con la toolchain Gradle 8.9 già presente e senza accesso alla rete. **17 test JUnit rieseguiti senza cache di esito, zero errori e zero fallimenti**: 16 controlli di dominio e un test dei limiti/scale disabilitate della sequenza shader. Inclusi catalogo di 37 voci (10 prodotti, 3 esperienze, 24 guida), quattro lingue, ruoli, isolamento soggiorni, idempotenza, prezzi storici, stati, date/orari/DST, reset credenziali, persistenza, file corrotti e scritture fallite. Il catalogo aggiornato è usato nelle nuove installazioni; i dati Android esistenti sono conservati senza migrazione o aggiunte automatiche. Wrapper ufficiale generato; SHA-256 JDK e Gradle verificati. Firma APK v2 verificata nuovamente da `apksigner`; pacchetto `it.lafenicepositano.app`, versione `0.1.0 (1)`, minimo API 26, target API 35.

Android Lint offline: **0 errori e 2 avvisi non bloccanti**: cartella icona con qualificatore API ridondante e icona monocromatica non fornita. Questa verifica senza rete non aggiorna il controllo delle nuove versioni delle dipendenze. Le versioni sono fissate e compatibili tra loro; l’icona adattiva usa il logo originale, senza fingere una maschera monocromatica.

La licenza Android SDK è stata accettata soltanto dopo consenso esplicito dell’utente. JDK, Gradle e SDK sono portabili in `/tmp/la-fenice-android-tools`, senza installazione di sistema. Nessuna licenza Google Play o servizio Google aggiuntivo è stata accettata.

**Avvio verificato il 23 settembre su emulatore:** Pixel 5, Android 15/API 35 AOSP ARM64. Installazione dell’APK aggiornato riuscita, `MainActivity` avviata, processo app rimasto attivo e nessun crash `AndroidRuntime` nei log. Il ramo AGSL ha inviato il primo disegno hardware senza errori (log `WelcomeWater` delle 09:58:15); questo dimostra l’esecuzione del ramo, **non la qualità visiva dello shader o un frame rate**. Il dispositivo virtuale `fenice-demo` resta disponibile localmente, seriale `emulator-5556`, con dati separati dalle demo iOS e web.

**Non ancora verificati:** interazioni e resa visiva, TalkBack e dispositivo fisico. Il binario macOS dell’emulatore non è esposto al controllo visuale CUA; non sono stati usati screenshot o input alternativi per aggirare il limite. Avvio, compilazione e firma valide non dimostrano la qualità dei flussi visivi.

Prima di distribuire la prova: compilare l’APK, verificare login ospite/admin, ordine e stato, cambio lingua russo, nuovo soggiorno/credenziali, catalogo multilingue, rotazione con bozze, schermo piccolo, tastiera e barre edge-to-edge su Android 15. Build ed esecuzione sono verifiche distinte. Per Play Store servirà una fase separata con SDK/requisiti allora vigenti, firma e scheda privacy.
