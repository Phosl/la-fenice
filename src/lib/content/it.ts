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
  withCopy(media.pool[0], "Due vedute della piscina curva con acqua di mare"),
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
  withCopy(media.gardenTable[0], "Limoni, caprese e fichi de La Fenice"),
  withCopy(media.gardenTable[1], "Bouganville e fiori nel giardino de La Fenice"),
  withCopy(media.gardenTable[2], "La raccolta delle patate sui terrazzamenti"),
  withCopy(media.gardenTable[3], "Fichi d'India e conserve di stagione"),
] as const;

const locationImage = withCopy(
  media.location,
  "Vista della costa e del mare da La Fenice, con un vaso sul balcone",
);

const availabilityImage = withCopy(
  media.availability,
  "Una camera vista mare preparata per gli ospiti de La Fenice",
);

export const italianContent = {
  locale: "it",
  common: {
    introControls: {
      enter: "Entra",
      reload: "Ripeti",
      reloadedAnnouncement: "L'animazione introduttiva è ripartita.",
    },
    skipToContent: "Vai al contenuto",
    openMenu: "Apri menu",
    closeMenu: "Chiudi menu",
    changeLanguage: "Cambia lingua",
    languageName: "Italiano",
    primaryNavigation: "Navigazione principale",
    viewGallery: "Apri galleria",
    previousImage: "Immagine precedente",
    nextImage: "Immagine successiva",
    closeGallery: "Chiudi galleria",
    openMap: "Apri la mappa interattiva",
    mapLoadingNotice: "La mappa interattiva viene caricata solo quando scegli di aprirla.",
    getDirections: "Ottieni indicazioni",
    officialWebsite: "Sito ufficiale",
    email: "Email",
    phone: "Telefono",
    address: "Indirizzo",
    vatNumber: "Partita IVA",
    followUs: "Seguici",
    goodToKnow: "Da sapere",
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
    description: "Tra orto e mare.",
    contactTitle: "Contatti",
    exploreTitle: "Pagine",
    legalTitle: "Informazioni legali",
    photographyCredit: "Fotografie di Tim Evancook",
  },
  availabilityCta: {
    eyebrow: "Soggiornare",
    title: "Per soggiornare con noi",
    text: "Scrivici le date. Ti risponderemo personalmente.",
    label: "Richiedi disponibilità",
  },
  notFound: {
    title: "Questo sentiero non arriva al mare.",
    text: "La pagina potrebbe essere stata spostata. Torna a La Fenice e riparti da lì.",
    button: "Torna alla home",
  },
  pages: {
    home: {
      route: "home",
      metadata: {
        title: "La Fenice Positano | Bed & Breakfast in Costiera Amalfitana",
        description:
          "La Fenice è un bed and breakfast a Positano con camere vista mare, piscina con acqua di mare, spiaggia privata e orto stagionale.",
        openGraphImage: homeImages.panorama,
      },
      hero: {
        eyebrow: "Positano · Costiera Amalfitana",
        title: "Dal giardino al mare",
        lead: "La nostra casa sul pendio di Positano, tra orto e mare.",
        image: homeImages.panorama,
        primaryCta: {
          label: "Richiedi disponibilità",
          route: "availability",
        },
      },
      introduction: {
        id: "welcome",
        eyebrow: "Casa nostra",
        title: "Un luogo semplice, sul mare",
        paragraphs: [
          "La Fenice è la nostra casa e il nostro bed and breakfast: camere e giardini seguono i terrazzamenti tra limoni, viti e bouganville.",
        ],
        image: homeImages.view,
      },
      storyHeading: {
        eyebrow: "La casa",
        title: "Quattro luoghi",
      },
      locationTeaser: {
        eyebrow: "Posizione",
        title: "Via Guglielmo Marconi 4, Positano",
        text: "Vicino alla fermata Sponda, tra la strada costiera e il mare.",
        linkLabel: "Posizione e mappa",
        scrollLabel: "Continua",
      },
      stories: [
        {
          id: "garden",
          eyebrow: "L'orto",
          title: "Seguendo le stagioni",
          text: "Frutta, ortaggi e limoni crescono sui nostri terrazzamenti.",
          image: homeImages.garden,
          cta: { label: "Orto e sapori", route: "gardenTable" },
        },
        {
          id: "rooms",
          eyebrow: "Le camere",
          title: "Luce e Vietri",
          text: "Camere bianche con balconi, terrazze e piastrelle di Vietri.",
          image: homeImages.room,
          cta: { label: "Camere", route: "rooms" },
        },
        {
          id: "pool",
          eyebrow: "La piscina",
          title: "Acqua di mare",
          text: "Una piscina curva, circondata dal verde.",
          image: poolGallery[0],
          cta: { label: "Piscina", route: "pool" },
        },
        {
          id: "beach",
          eyebrow: "Il mare",
          title: "Verso il mare",
          text: "Dal giardino, una scalinata porta all'accesso privato al mare.",
          image: beachGallery[0],
          cta: { label: "Spiaggia privata", route: "privateBeach" },
        },
      ],
      experiences: {
        eyebrow: "Esperienze",
        title: "Lungo la costa",
        lead: "Pesca, barca e limonaia, secondo stagione e disponibilità.",
        requestLabel: "Chiedi informazioni",
        items: [
          {
            id: "fishing",
            title: "Pesca",
            text: "Una mattina in mare, condizioni permettendo.",
            image: beachGallery[1],
            emailSubject: "Richiesta esperienza di pesca",
            emailBody:
              "Buongiorno La Fenice,\n\nvorrei ricevere informazioni sull'esperienza di pesca.\n\nData preferita:\nNumero di ospiti:\nNome:\n\nGrazie.",
          },
          {
            id: "boatTrip",
            title: "In barca",
            text: "Un itinerario lungo la costa, concordato insieme.",
            image: beachGallery[0],
            emailSubject: "Richiesta gita in barca",
            emailBody:
              "Buongiorno La Fenice,\n\nvorrei ricevere informazioni su una gita in barca.\n\nData preferita:\nNumero di ospiti:\nNome:\n\nGrazie.",
          },
          {
            id: "lemonGrove",
            title: "Tra i limoni",
            text: "Una visita ai terrazzamenti coltivati della casa.",
            image: homeImages.garden,
            emailSubject: "Richiesta esperienza nella limonaia",
            emailBody:
              "Buongiorno La Fenice,\n\nvorrei ricevere informazioni sull'esperienza nella limonaia.\n\nData preferita:\nNumero di ospiti:\nNome:\n\nGrazie.",
          },
        ],
      },
      stepsNotice: {
        title: "Accessibilità",
        text: "Molti gradini collegano strada, camere, giardini e mare. Scrivici prima del soggiorno per esigenze di mobilità.",
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
        lead: "Spazi semplici, spesso aperti sul mare.",
      },
      heroImage: roomsGallery[0],
      sections: [
        {
          id: "character",
          title: "Le camere",
          paragraphs: [
            "Pareti bianche, soffitti a volta e piastrelle di Vietri; molte camere hanno balcone o terrazza vista mare.",
          ],
          image: roomsGallery[1],
        },
      ],
      gallery: roomsGallery,
      note: "Scrivici per conoscere la camera disponibile nelle tue date.",
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
        title: "Acqua di mare tra le terrazze",
        lead: "La piscina curva guarda il verde.",
      },
      heroImage: poolGallery[0],
      sections: [
        {
          id: "water-and-shade",
          title: "Sole e ombra",
          paragraphs: [
            "Acqua di mare, cascata e idromassaggio, tra bouganville e jacaranda.",
          ],
          image: poolGallery[1],
        },
      ],
      gallery: poolGallery,
      note: "Apertura indicativa da giugno a metà ottobre, secondo meteo e condizioni del mare. Conferma le date con noi.",
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
        title: "Il mare in fondo al giardino",
        lead: "Una scalinata nel verde conduce all'accesso privato.",
      },
      heroImage: beachGallery[0],
      sections: [
        {
          id: "descent",
          title: "Verso l'acqua",
          paragraphs: [
            "Il percorso attraversa il giardino terrazzato.",
          ],
          image: beachGallery[1],
        },
      ],
      gallery: beachGallery,
      note: "L'accesso richiede molti gradini ed è soggetto alle condizioni del mare.",
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
        title: "L'orto segue le stagioni",
        lead: "Coltiviamo ciò che arriva sulla nostra tavola.",
      },
      heroImage: gardenGallery[0],
      sections: [
        {
          id: "summer-winter",
          title: "Il raccolto",
          paragraphs: [
            "Frutta e ortaggi cambiano con i mesi; uva, olive, noci e limoni segnano l'anno.",
          ],
          image: gardenGallery[1],
        },
      ],
      gallery: gardenGallery,
      note: "Ogni stagione porta un raccolto diverso.",
    },
    location: {
      route: "location",
      metadata: {
        title: "Posizione a Positano | La Fenice",
        description:
          "Trova La Fenice in Via Guglielmo Marconi 4 a Positano e apri le indicazioni per raggiungere il bed and breakfast in Costiera Amalfitana.",
        openGraphImage: locationImage,
      },
      intro: {
        eyebrow: "Posizione",
        title: "Tra la strada e il mare",
        lead: "A pochi passi dalla fermata Sponda.",
      },
      heroImage: locationImage,
      sections: [
        {
          id: "address",
          title: "Via Guglielmo Marconi 4",
          paragraphs: [
            "Dalla fermata Sponda sono circa 200 metri a piedi in direzione Amalfi.",
          ],
          cta: { label: "Come arrivare", route: "gettingHere" },
        },
      ],
      gallery: [locationImage],
      note: "In alta stagione controlla traffico e orari prima di partire.",
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
        title: "Arrivare a Positano",
        lead: "Scegli il mezzo e controlla gli orari ufficiali.",
      },
      heroImage: locationImage,
      travelNotice: "I servizi cambiano con la stagione.",
      modes: [
        {
          id: "car",
          title: "In auto",
          routes: [
            {
              id: "car-north",
              title: "Da nord",
              steps: [
                "Uscita Castellammare di Stabia, poi SS145 e SS163 per Positano.",
              ],
            },
            {
              id: "car-south",
              title: "Da sud",
              steps: [
                "Uscita Vietri sul Mare, poi SS163 per Positano.",
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
                "Napoli Centrale → EAV per Sorrento → SITA Sud per Positano Sponda.",
              ],
            },
            {
              id: "train-salerno",
              title: "Via Salerno",
              steps: [
                "Salerno → SITA Sud per Amalfi → coincidenza per Positano Sponda.",
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
                "Napoli Centrale → EAV per Sorrento, oppure Curreri diretto a Sorrento; poi SITA Sud per Positano Sponda.",
              ],
            },
            {
              id: "plane-rome",
              title: "Da Roma Fiumicino",
              steps: [
                "Roma Termini → Napoli o Salerno; poi segui l'itinerario in treno.",
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
                "In stagione, Positano è collegata via mare con Napoli, Sorrento, Salerno e Amalfi.",
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
          description: "Autobus della Costiera",
          href: "https://sitasudtrasporti.it/campania/orari/",
        },
        {
          id: "eav",
          label: "EAV",
          description: "Treni Napoli–Sorrento",
          href: "https://www.eavsrl.it/orari-linee-ferroviarie/",
        },
        {
          id: "curreri",
          label: "Curreri Viaggi",
          description: "Navetta Napoli Aeroporto–Sorrento",
          href: "https://www.curreriviaggi.it/it/navetta-aeroporto-di-napoli",
        },
        {
          id: "trenitalia",
          label: "Trenitalia",
          description: "Treni nazionali",
          href: "https://www.trenitalia.com/it.html",
        },
        {
          id: "naples-airport",
          label: "Aeroporto Internazionale di Napoli",
          description: "Collegamenti da Capodichino",
          href: "https://www.aeroportodinapoli.it/it/in-bus",
        },
        {
          id: "alilauro",
          label: "Alilauro",
          description: "Traghetti e aliscafi",
          href: "https://www.alilauro.it/it/",
        },
      ],
      transferTitle: "Transfer privato",
      transferNote: "Per un transfer privato, scrivici per opzioni e prezzi.",
    },
    availability: {
      route: "availability",
      metadata: {
        title: "Disponibilità camere a Positano | La Fenice",
        description:
          "Richiedi la disponibilità delle camere a La Fenice, Positano. Indica date e numero di ospiti: ti risponderemo personalmente.",
        openGraphImage: availabilityImage,
      },
      intro: {
        eyebrow: "Il tuo soggiorno",
        title: "Richiedi disponibilità",
        lead: "Indicaci date e ospiti. Ti risponderemo direttamente.",
      },
      heroImage: availabilityImage,
      form: {
        title: "La tua richiesta",
        requiredHint: "I campi contrassegnati con * sono obbligatori.",
        honeypotLabel: "Sito web",
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
        successMessage: "Grazie. Ti risponderemo via email; la richiesta non è ancora confermata.",
        errorTitle: "Non è stato possibile inviare la richiesta",
        errorMessage:
          "Riprova oppure contattaci tramite l'indirizzo email o il numero di telefono qui sotto.",
        emailFallback: {
          subject: "Richiesta disponibilità",
          body: "Nome:\nTelefono:\nOspiti:\nArrivo:\nPartenza:\nRichiesta:",
        },
        validation: {
          required: "Compila questo campo obbligatorio.",
          invalidEmail: "Inserisci un indirizzo email valido.",
          invalidDateRange: "Il check-out deve essere successivo al check-in.",
          invalidGuests: "Indica almeno un ospite.",
          consentRequired: "Il consenso è necessario per inviare la richiesta.",
        },
      },
      responseTimeNote: "La richiesta non è una prenotazione confermata.",
      fallback: {
        title: "Preferisci contattarci direttamente?",
        text: "Scrivici o chiamaci direttamente.",
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
