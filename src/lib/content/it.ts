import { media } from "./media";
import type { GalleryImage, ImageAsset, SiteContent } from "./types";

const withCopy = (
  asset: ImageAsset,
  alt: string,
  caption?: string,
): GalleryImage => ({ ...asset, alt, ...(caption ? { caption } : {}) });

const homeImages = {
  room: withCopy(media.home.room, "Una camera luminosa de La Fenice a Positano"),
  garden: withCopy(
    media.home.garden,
    "Il giardino terrazzato de La Fenice affacciato sul mare",
  ),
  panorama: withCopy(
    media.home.panorama,
    "Veduta panoramica di Positano e del Mar Tirreno",
  ),
  view: withCopy(media.home.view, "Vista sul mare da La Fenice a Positano"),
};

const roomsGallery = [
  withCopy(media.rooms[0], "Una camera de La Fenice aperta sul balcone privato"),
  withCopy(media.rooms[1], "Pareti bianche e soffitto a volta in una camera"),
  withCopy(media.rooms[2], "Una terrazza vista mare circondata dal verde"),
  withCopy(media.rooms[3], "Piastrelle di Vietri dipinte a mano in una camera"),
] as const;

const poolGallery = [
  withCopy(media.pool[0], "La piscina curva con acqua di mare e la terrazza al sole"),
  withCopy(
    media.pool[1],
    "La piscina de La Fenice con cascata e zona idromassaggio",
  ),
] as const;

const beachGallery = [
  withCopy(media.privateBeach[0], "L'acqua limpida della spiaggia privata de La Fenice"),
  withCopy(media.privateBeach[1], "La spiaggia privata sotto La Fenice"),
] as const;

const gardenGallery = [
  withCopy(media.gardenTable[0], "Prodotti di stagione coltivati nell'orto de La Fenice"),
  withCopy(media.gardenTable[1], "Un raccolto dell'orto de La Fenice"),
  withCopy(media.gardenTable[2], "Olive e ortaggi dei terrazzamenti"),
  withCopy(media.gardenTable[3], "Fichi che maturano al sole di Positano"),
] as const;

const locationImage = withCopy(
  media.location,
  "La Fenice sul verde pendio sopra il Mar Tirreno",
);

const availabilityImage = withCopy(
  media.availability,
  "Una camera vista mare preparata per gli ospiti de La Fenice",
);

export const italianContent = {
  locale: "it",
  common: {
    skipIntro: "Salta intro",
    skipToContent: "Vai al contenuto",
    openMenu: "Apri menu",
    closeMenu: "Chiudi menu",
    changeLanguage: "Cambia lingua",
    languageName: "Italiano",
    viewGallery: "Apri galleria",
    previousImage: "Immagine precedente",
    nextImage: "Immagine successiva",
    closeGallery: "Chiudi galleria",
    openMap: "Apri la mappa interattiva",
    getDirections: "Ottieni indicazioni",
    officialWebsite: "Sito ufficiale",
    email: "Email",
    phone: "Telefono",
    address: "Indirizzo",
    vatNumber: "Partita IVA",
    followUs: "Seguici",
  },
  navigation: {
    primary: {
      home: "Home",
      rooms: "Camere",
      pool: "Piscina",
      privateBeach: "Spiaggia privata",
      gardenTable: "Orto e sapori",
      location: "Posizione",
      gettingHere: "Come arrivare",
    },
    utility: {
      privacy: "Privacy",
      terms: "Termini e condizioni",
    },
    availability: "Richiedi disponibilità",
  },
  footer: {
    description:
      "Un bed and breakfast della tradizione sul pendio di Positano, dall'orto al mare.",
    contactTitle: "Contatti",
    exploreTitle: "Esplora",
    legalTitle: "Informazioni legali",
    photographyCredit: "Fotografie di Tim Evancook",
  },
  pages: {
    home: {
      route: "home",
      metadata: {
        title: "La Fenice Positano | Bed & Breakfast in Costiera Amalfitana",
        description:
          "Scopri La Fenice, bed and breakfast sul pendio di Positano con camere vista mare, piscina con acqua di mare, spiaggia privata e orto stagionale.",
        openGraphImage: homeImages.panorama,
      },
      hero: {
        eyebrow: "Positano · Costiera Amalfitana",
        title: "Dall'orto al mare",
        lead:
          "Un rifugio della tradizione disteso sul pendio di Positano, tra limoni, bouganville e vedute sul Mar Tirreno.",
        image: homeImages.panorama,
        primaryCta: {
          label: "Richiedi disponibilità",
          route: "availability",
        },
        secondaryCta: {
          label: "Scopri La Fenice",
          route: "rooms",
        },
      },
      introduction: {
        id: "welcome",
        eyebrow: "La Fenice",
        title: "Una casa sul pendio di Positano",
        paragraphs: [
          "La Fenice è un bed and breakfast esteso su circa tre ettari in Costiera Amalfitana. Ville e piccoli edifici scendono verso il mare attraverso terrazzamenti coltivati a bouganville, limoni e viti.",
          "Qui il carattere della costa accompagna ogni soggiorno: viste sul mare, sentieri nel giardino, una piscina modellata nella roccia e la spiaggia privata sotto la proprietà.",
        ],
        image: homeImages.view,
      },
      stories: [
        {
          id: "garden",
          eyebrow: "L'orto",
          title: "Quello che offre la stagione",
          text: "Frutta, ortaggi, uva, olive e limoni crescono sui terrazzamenti e da sempre fanno parte della tavola di famiglia.",
          image: homeImages.garden,
          cta: { label: "Dall'orto alla tavola", route: "gardenTable" },
        },
        {
          id: "rooms",
          eyebrow: "Le camere",
          title: "Luce, mare e colori di Vietri",
          text: "La maggior parte delle camere guarda il mare e si apre su un balcone o una terrazza privata, tra volte e piastrelle di Vietri dipinte a mano.",
          image: homeImages.room,
          cta: { label: "Esplora le camere", route: "rooms" },
        },
        {
          id: "pool",
          eyebrow: "La piscina",
          title: "Disegnata nel pendio",
          text: "Una piscina curva con acqua di mare, cascata e zona idromassaggio è circondata da terrazze al sole e piante fiorite che offrono ombra.",
          image: poolGallery[0],
          cta: { label: "Scopri la piscina", route: "pool" },
        },
        {
          id: "beach",
          eyebrow: "Il mare",
          title: "Giù fino alla spiaggia privata",
          text: "I gradini nel giardino conducono dalla proprietà a un accesso riservato all'acqua limpida sottostante.",
          image: beachGallery[0],
          cta: { label: "Scopri la spiaggia", route: "privateBeach" },
        },
      ],
      stepsNotice: {
        title: "Un luogo fatto di gradini",
        text: "La Fenice segue il pendio naturale della Costiera Amalfitana. Per spostarsi tra strada, camere, giardini, piscina e spiaggia occorrono molti gradini: la struttura potrebbe non rispondere a tutte le esigenze di mobilità. Contattaci prima della richiesta per parlare dell'accessibilità.",
      },
    },
    rooms: {
      route: "rooms",
      metadata: {
        title: "Camere vista mare a Positano | La Fenice",
        description:
          "Scopri il carattere delle camere de La Fenice a Positano, con pareti bianche, soffitti a volta, grandi finestre e piastrelle di Vietri dipinte a mano.",
        openGraphImage: roomsGallery[0],
      },
      intro: {
        eyebrow: "Soggiornare",
        title: "Camere nella luce di Positano",
        lead:
          "Interni mediterranei essenziali, dettagli della tradizione e un rapporto aperto con il mare.",
      },
      heroImage: roomsGallery[0],
      sections: [
        {
          id: "character",
          title: "Nate per la costa",
          paragraphs: [
            "La maggior parte delle camere si affaccia sul mare e dispone di balcone o terrazza privata.",
            "Pareti bianche, soffitti a volta e grandi finestre incontrano pavimenti in piastrelle di Vietri dipinte a mano.",
          ],
          image: roomsGallery[1],
        },
      ],
      gallery: roomsGallery,
      note:
        "Le informazioni attuali descrivono le camere nel loro insieme, non singole tipologie. Richiedi disponibilità per conoscere i dettagli della sistemazione proposta nelle tue date.",
    },
    pool: {
      route: "pool",
      metadata: {
        title: "Piscina con acqua di mare a Positano | La Fenice",
        description:
          "Scopri la piscina curva de La Fenice, con acqua di mare, cascata, zona idromassaggio e terrazza al sole sul pendio di Positano.",
        openGraphImage: poolGallery[0],
      },
      intro: {
        eyebrow: "Piscina",
        title: "L'acqua abbracciata dalla roccia",
        lead:
          "Una piscina curva e una terrazza fiorita seguono la forma naturale del pendio.",
      },
      heroImage: poolGallery[0],
      sections: [
        {
          id: "water-and-shade",
          title: "Sole, ombra e acqua di mare",
          paragraphs: [
            "La piscina con acqua di mare dispone di cascata e zona idromassaggio.",
            "La terrazza soleggiata offre anche zone d'ombra sotto bouganville e jacaranda.",
          ],
          image: poolGallery[1],
        },
        {
          id: "season",
          eyebrow: "Apertura stagionale",
          title: "Da inizio giugno a metà ottobre",
          paragraphs: [
            "Il periodo di apertura pubblicato va dall'inizio di giugno alla metà di ottobre, condizioni meteo e del mare permettendo. Verifica le date aggiornate al momento della richiesta.",
          ],
        },
      ],
      gallery: poolGallery,
      note: "Le date di apertura della piscina sono stagionali e vanno confermate per ogni soggiorno.",
    },
    privateBeach: {
      route: "privateBeach",
      metadata: {
        title: "Spiaggia privata a Positano | La Fenice",
        description:
          "Segui i gradini nel giardino de La Fenice fino alla spiaggia privata del bed and breakfast e all'acqua limpida sotto il pendio di Positano.",
        openGraphImage: beachGallery[0],
      },
      intro: {
        eyebrow: "Spiaggia privata",
        title: "Un sentiero nel giardino verso il mare",
        lead:
          "Sotto le ville e i terrazzamenti, gradini ombreggiati scendono fino alla spiaggia privata de La Fenice.",
      },
      heroImage: beachGallery[0],
      sections: [
        {
          id: "descent",
          title: "La costa nella sua forma più naturale",
          paragraphs: [
            "Gli ospiti raggiungono l'acqua seguendo la scalinata alberata che scende dalla proprietà.",
            "La lunga discesa è parte del paesaggio e va considerata da chi ha una mobilità ridotta.",
          ],
          image: beachGallery[1],
        },
        {
          id: "boat-outings",
          title: "Uscire in mare",
          paragraphs: [
            "Chiedici quali escursioni costiere in barca sono attualmente disponibili, anche verso Capri, Grotta Azzurra, Amalfi e Li Galli. Disponibilità e modalità d'imbarco vanno confermate direttamente.",
          ],
          image: beachGallery[0],
        },
      ],
      gallery: beachGallery,
      note:
        "L'accesso alla spiaggia richiede molti gradini all'aperto. L'accesso al mare e le uscite in barca dipendono dalle condizioni meteo-marine.",
    },
    gardenTable: {
      route: "gardenTable",
      metadata: {
        title: "Orto e sapori di stagione | La Fenice Positano",
        description:
          "Scopri frutta, ortaggi, uva, olive e limoni tradizionalmente coltivati nell'orto terrazzato de La Fenice a Positano.",
        openGraphImage: gardenGallery[0],
      },
      intro: {
        eyebrow: "Orto e sapori",
        title: "Un orto che segue le stagioni",
        lead:
          "I terrazzamenti offrono frutta, verdura ed erbe che da tempo ispirano la cucina di famiglia.",
      },
      heroImage: gardenGallery[0],
      sections: [
        {
          id: "summer-winter",
          title: "Dai colori estivi alle verdure d'inverno",
          paragraphs: [
            "In estate l'orto produce pomodori, melanzane, peperoni, albicocche, fichi, prugne e pesche.",
            "L'inverno porta patate, cipolle, diverse varietà di broccoli, finocchi, spinaci e bietole.",
          ],
          image: gardenGallery[1],
        },
        {
          id: "harvest",
          title: "Uva, olive e limoni",
          paragraphs: [
            "La vendemmia si svolge tradizionalmente a settembre, seguita in ottobre dalla raccolta di olive e noci. I limoni danno frutto durante tutto l'anno.",
            "Quello che è maturo e di stagione viene raccolto per la tavola.",
          ],
          image: gardenGallery[3],
        },
      ],
      gallery: gardenGallery,
    },
    location: {
      route: "location",
      metadata: {
        title: "Posizione a Positano | La Fenice",
        description:
          "Trova La Fenice in Via Marconi 4 a Positano e apri le indicazioni per raggiungere il bed and breakfast in Costiera Amalfitana.",
        openGraphImage: locationImage,
      },
      intro: {
        eyebrow: "Posizione",
        title: "Sul pendio di Positano",
        lead:
          "La Fenice si trova tra la strada costiera e il mare, con terreni terrazzati che scendono nel paesaggio.",
      },
      heroImage: locationImage,
      sections: [
        {
          id: "address",
          title: "Via Marconi 4",
          paragraphs: [
            "Il bed and breakfast si trova in Via Marconi 4, 84017 Positano (SA), Italia.",
            "Dalla fermata Sponda, le indicazioni esistenti segnalano circa 200 metri a piedi in direzione Amalfi. Usa la mappa per l'ultimo tratto e contattaci se ti servono indicazioni sull'accesso.",
          ],
          cta: { label: "Organizza il viaggio", route: "gettingHere" },
        },
      ],
      gallery: [locationImage],
      note:
        "Condizioni stradali e orari del trasporto pubblico possono cambiare, soprattutto in alta stagione. Verifica le indicazioni aggiornate prima del viaggio.",
    },
    gettingHere: {
      route: "gettingHere",
      metadata: {
        title: "Come arrivare a Positano | La Fenice",
        description:
          "Organizza il viaggio verso La Fenice a Positano in auto, treno, aereo o via mare, con collegamenti agli operatori ufficiali.",
        openGraphImage: locationImage,
      },
      intro: {
        eyebrow: "Come arrivare",
        title: "La tua strada verso Positano",
        lead:
          "L'ultima parte del viaggio segue la costa. Scegli il percorso e controlla sempre gli orari aggiornati prima di partire.",
      },
      heroImage: locationImage,
      travelNotice:
        "Tempi di viaggio, percorsi e servizi stagionali cambiano. Le indicazioni non riportano orari fissi: consulta gli operatori ufficiali collegati per le informazioni aggiornate.",
      modes: [
        {
          id: "car",
          title: "In auto",
          routes: [
            {
              id: "car-north",
              title: "Da nord",
              steps: [
                "Segui l'autostrada verso Castellammare di Stabia.",
                "Prosegui sulla SS145 verso la Penisola Sorrentina, quindi imbocca la SS163 verso Positano.",
                "Le autostrade italiane sono a pedaggio. Controlla navigazione e regole di circolazione aggiornate prima della partenza.",
              ],
            },
            {
              id: "car-south",
              title: "Da sud",
              steps: [
                "Esci dall'autostrada a Vietri sul Mare.",
                "Segui la SS163 lungo la Costiera Amalfitana verso Positano.",
                "Prevedi più tempo per la strada costiera stretta e il traffico stagionale.",
              ],
            },
          ],
        },
        {
          id: "train",
          title: "In treno",
          routes: [
            {
              id: "train-naples",
              title: "Via Napoli",
              steps: [
                "Da Napoli Centrale usa il servizio EAV Circumvesuviana per Sorrento.",
                "A Sorrento prosegui con un autobus SITA Sud verso Positano e chiedi la fermata Sponda.",
                "Da Sponda, le indicazioni esistenti segnalano circa 200 metri a piedi in direzione Amalfi.",
              ],
            },
            {
              id: "train-salerno",
              title: "Via Salerno",
              steps: [
                "Dalla stazione di Salerno prendi un autobus SITA Sud per Amalfi.",
                "Ad Amalfi cambia con il servizio verso Positano e scendi a Sponda.",
                "I collegamenti stagionali via mare possono unire Salerno e Positano: verifica gli operatori prima del viaggio.",
              ],
            },
          ],
        },
        {
          id: "plane",
          title: "In aereo",
          routes: [
            {
              id: "plane-naples",
              title: "Da Napoli Capodichino",
              steps: [
                "Usa un collegamento aeroportuale ufficiale per Napoli Centrale e segui l'itinerario via Sorrento, oppure prendi la navetta Curreri fino a Sorrento.",
                "Da Sorrento prosegui con un autobus SITA Sud fino a Positano Sponda.",
              ],
            },
            {
              id: "plane-rome",
              title: "Da Roma Fiumicino",
              steps: [
                "Prendi il treno aeroportuale per Roma Termini.",
                "Prosegui in treno per Napoli o Salerno, quindi segui uno degli itinerari indicati sopra.",
              ],
            },
          ],
        },
        {
          id: "sea",
          title: "Via mare",
          routes: [
            {
              id: "sea-positano",
              title: "Traghetti e aliscafi",
              steps: [
                "Servizi stagionali collegano Positano con porti tra cui Napoli, Sorrento, Salerno e Amalfi.",
                "Le rotte dipendono dal periodo e dalle condizioni del mare. Controlla orario aggiornato e porto di partenza sul sito dell'operatore.",
              ],
            },
          ],
        },
      ],
      officialResourcesTitle: "Informazioni di viaggio ufficiali",
      officialResources: [
        {
          id: "sita",
          label: "SITA Sud Campania",
          description: "Linee autobus della Costiera e orari aggiornati",
          href: "https://sitasudtrasporti.it/campania/orari/",
        },
        {
          id: "eav",
          label: "EAV",
          description: "Informazioni ferroviarie Napoli–Sorrento e aggiornamenti",
          href: "https://www.eavsrl.it/orari-linee-ferroviarie/",
        },
        {
          id: "curreri",
          label: "Curreri Viaggi",
          description: "Navetta Aeroporto di Napoli–Sorrento",
          href: "https://www.curreriviaggi.it/it/navetta-aeroporto-di-napoli",
        },
        {
          id: "trenitalia",
          label: "Trenitalia",
          description: "Viaggi in treno verso Napoli, Salerno e Roma",
          href: "https://www.trenitalia.com/it.html",
        },
        {
          id: "naples-airport",
          label: "Aeroporto Internazionale di Napoli",
          description: "Informazioni ufficiali sui trasporti di terra",
          href: "https://www.aeroportodinapoli.it/it/in-bus",
        },
        {
          id: "alilauro",
          label: "Alilauro",
          description: "Informazioni ufficiali su traghetti e aliscafi stagionali",
          href: "https://www.alilauro.it/it/",
        },
      ],
      transferNote:
        "Se desideri assistenza per organizzare un trasferimento privato, contatta La Fenice prima del viaggio per verificare opzioni e prezzi aggiornati.",
    },
    availability: {
      route: "availability",
      metadata: {
        title: "Richiedi disponibilità | La Fenice Positano",
        description:
          "Invia a La Fenice una richiesta di disponibilità per un soggiorno a Positano. La richiesta riceve risposta diretta e non genera una prenotazione immediata.",
        openGraphImage: availabilityImage,
      },
      intro: {
        eyebrow: "Il tuo soggiorno",
        title: "Richiedi disponibilità",
        lead:
          "Indicaci le date e chi viaggerà con te. Ti risponderemo direttamente con le informazioni sulla sistemazione disponibile.",
      },
      heroImage: availabilityImage,
      form: {
        title: "La tua richiesta",
        requiredHint: "I campi contrassegnati con * sono obbligatori.",
        fields: {
          name: { label: "Nome *", placeholder: "Nome e cognome" },
          email: { label: "Email *", placeholder: "tu@esempio.it" },
          phone: {
            label: "Telefono",
            placeholder: "+00 000 0000000",
            hint: "Facoltativo, includi il prefisso internazionale",
          },
          guests: { label: "Ospiti *", hint: "Adulti e bambini in viaggio" },
          checkIn: { label: "Check-in *" },
          checkOut: { label: "Check-out *" },
          message: {
            label: "Messaggio",
            placeholder: "Aggiungi informazioni utili sul soggiorno",
          },
        },
        consent: {
          prefix: "Ho letto l'",
          linkLabel: "informativa privacy",
          suffix: "e acconsento all'invio dei dati per questa richiesta di disponibilità. *",
        },
        submitLabel: "Invia richiesta",
        submittingLabel: "Invio in corso…",
        successTitle: "Richiesta inviata",
        successMessage:
          "Grazie. Ti risponderemo direttamente via email. La richiesta non è una prenotazione confermata.",
        errorTitle: "Non è stato possibile inviare la richiesta",
        errorMessage:
          "Riprova oppure contattaci tramite l'indirizzo email o il numero di telefono qui sotto.",
        validation: {
          required: "Compila questo campo obbligatorio.",
          invalidEmail: "Inserisci un indirizzo email valido.",
          invalidDateRange: "Il check-out deve essere successivo al check-in.",
          invalidGuests: "Indica almeno un ospite.",
          consentRequired: "Il consenso è necessario per inviare la richiesta.",
        },
      },
      responseTimeNote:
        "Il modulo invia una richiesta di disponibilità, non una prenotazione immediata. La Fenice confermerà direttamente disponibilità e dettagli.",
      fallback: {
        title: "Preferisci contattarci direttamente?",
        text: "Scrivi o telefona a La Fenice indicando le date preferite e il numero di ospiti.",
        emailLabel: "Scrivi a La Fenice",
        phoneLabel: "Chiama La Fenice",
      },
    },
    privacy: {
      route: "privacy",
      status: "review-required",
      metadata: {
        title: "Informativa privacy | La Fenice Positano",
        description:
          "Informazioni sulla privacy del sito La Fenice Positano. Testo definitivo in attesa di revisione del titolare e legale.",
        robots: "noindex",
      },
      title: "Informativa privacy",
      reviewNotice: {
        title: "Contenuto necessario prima del lancio",
        text: "Il sito precedente non contiene un testo di informativa privacy. Il titolare e un consulente qualificato devono fornire o approvare l'informativa completa prima di pubblicare il modulo di disponibilità e il sito in produzione. Questo segnaposto non è un'informativa privacy.",
      },
    },
    terms: {
      route: "terms",
      status: "review-required",
      metadata: {
        title: "Termini e condizioni | La Fenice Positano",
        description:
          "Termini e condizioni de La Fenice Positano. Testo definitivo in attesa di revisione del titolare e legale.",
        robots: "noindex",
      },
      title: "Termini e condizioni",
      reviewNotice: {
        title: "Contenuto necessario prima del lancio",
        text: "Il sito precedente non contiene termini e condizioni. Il titolare e un consulente qualificato devono fornire e approvare le condizioni applicabili al soggiorno, alla cancellazione e all'uso del sito prima della pubblicazione. Questo segnaposto non stabilisce condizioni contrattuali.",
      },
    },
  },
} as const satisfies SiteContent;
