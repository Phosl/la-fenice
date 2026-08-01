import { media } from "./media";
import type { GalleryImage, ImageAsset, SiteContent } from "./types";

const withCopy = (
  asset: ImageAsset,
  alt: string,
  caption?: string,
): GalleryImage => ({ ...asset, alt, ...(caption ? { caption } : {}) });

const homeImages = {
  room: withCopy(media.home.room, "Ein helles Zimmer im La Fenice in Positano"),
  garden: withCopy(
    media.home.garden,
    "Der Terrassengarten des La Fenice oberhalb des Meeres",
  ),
  panorama: withCopy(
    media.home.panorama,
    "Panoramablick auf Positano und das Tyrrhenische Meer",
  ),
  view: withCopy(media.home.view, "Meerblick vom La Fenice in Positano"),
};

const roomsGallery = [
  withCopy(media.rooms[0], "Ein Zimmer im La Fenice mit Zugang zum privaten Balkon"),
  withCopy(media.rooms[1], "Weiße Wände und Gewölbedecke in einem Gästezimmer"),
  withCopy(media.rooms[2], "Eine begrünte Terrasse mit Meerblick"),
  withCopy(media.rooms[3], "Handbemalte Vietri-Fliesen in einem Zimmer des La Fenice"),
] as const;

const poolGallery = [
  withCopy(media.pool[0], "Zwei Ansichten des geschwungenen Meerwasserpools"),
  withCopy(
    media.pool[1],
    "Der Pool des La Fenice mit Wasserfall und Whirlpoolbereich",
  ),
] as const;

const beachGallery = [
  withCopy(media.privateBeach[0], "Klares Wasser am Privatstrand des La Fenice"),
  withCopy(media.privateBeach[1], "Der Privatstrand unterhalb des La Fenice"),
] as const;

const gardenGallery = [
  withCopy(media.gardenTable[0], "Zitronen, Caprese und Feigen im La Fenice"),
  withCopy(media.gardenTable[1], "Bougainvilleen und Blüten im Garten des La Fenice"),
  withCopy(media.gardenTable[2], "Kartoffelernte auf den Terrassen"),
  withCopy(media.gardenTable[3], "Kaktusfeigen und saisonale Konserven"),
] as const;

const locationImage = withCopy(
  media.location,
  "Blick vom La Fenice auf Küste und Meer, mit einem Pflanzgefäß am Balkon",
);

const availabilityImage = withCopy(
  media.availability,
  "Ein für Gäste vorbereitetes Zimmer mit Meerblick im La Fenice",
);

export const germanContent = {
  locale: "de",
  common: {
    skipIntro: "Intro überspringen",
    skipToContent: "Zum Inhalt springen",
    openMenu: "Menü öffnen",
    closeMenu: "Menü schließen",
    changeLanguage: "Sprache wechseln",
    languageName: "Deutsch",
    primaryNavigation: "Hauptnavigation",
    viewGallery: "Galerie ansehen",
    previousImage: "Vorheriges Bild",
    nextImage: "Nächstes Bild",
    closeGallery: "Galerie schließen",
    openMap: "Interaktive Karte öffnen",
    mapLoadingNotice: "Die interaktive Karte wird erst geladen, wenn Sie sie öffnen.",
    getDirections: "Route planen",
    officialWebsite: "Offizielle Website",
    email: "E-Mail",
    phone: "Telefon",
    address: "Adresse",
    vatNumber: "USt-IdNr.",
    followUs: "Folgen Sie uns",
    goodToKnow: "Gut zu wissen",
  },
  navigation: {
    primary: {
      home: "Startseite",
      rooms: "Zimmer",
      pool: "Pool",
      privateBeach: "Privatstrand",
      gardenTable: "Garten & Genuss",
      location: "Lage",
      gettingHere: "Anreise",
    },
    utility: {
      privacy: "Datenschutz",
      terms: "Allgemeine Geschäftsbedingungen",
    },
    availability: "Verfügbarkeit anfragen",
  },
  footer: {
    description: "Zwischen Garten und Meer.",
    contactTitle: "Kontakt",
    exploreTitle: "Seiten",
    legalTitle: "Rechtliches",
    photographyCredit: "Fotografie von Tim Evancook",
  },
  availabilityCta: {
    eyebrow: "Aufenthalt",
    title: "Bei uns wohnen",
    text: "Senden Sie uns Ihre Reisedaten. Wir antworten Ihnen persönlich.",
    label: "Verfügbarkeit anfragen",
  },
  notFound: {
    title: "Dieser Weg führt nicht zum Meer.",
    text: "Die Seite wurde möglicherweise verschoben. Kehren Sie zu La Fenice zurück und setzen Sie Ihren Weg von dort fort.",
    button: "Zur Startseite",
  },
  pages: {
    home: {
      route: "home",
      metadata: {
        title: "La Fenice Positano | Bed & Breakfast an der Amalfiküste",
        description:
          "La Fenice ist ein Bed & Breakfast in Positano mit Zimmern mit Meerblick, Meerwasserpool, Privatstrand und saisonalem Garten.",
        openGraphImage: homeImages.panorama,
      },
      hero: {
        eyebrow: "Positano · Amalfiküste",
        title: "Vom Garten bis zum Meer",
        lead: "Unser Zuhause am Hang von Positano, zwischen Garten und Meer.",
        image: homeImages.panorama,
        primaryCta: {
          label: "Verfügbarkeit anfragen",
          route: "availability",
        },
      },
      introduction: {
        id: "welcome",
        eyebrow: "Unser Zuhause",
        title: "Ein schlichter Ort am Meer",
        paragraphs: [
          "La Fenice ist unser Zuhause und Bed & Breakfast: Zimmer und Gärten folgen den Terrassen zwischen Zitronen, Reben und Bougainvilleen.",
        ],
        image: homeImages.view,
      },
      storyHeading: {
        eyebrow: "Das Haus",
        title: "Vier Orte",
      },
      locationTeaser: {
        eyebrow: "Lage",
        title: "Via Guglielmo Marconi 4, Positano",
        text: "Nahe der Haltestelle Sponda, zwischen Küstenstraße und Meer.",
        linkLabel: "Lage und Karte",
        scrollLabel: "Weiter",
      },
      stories: [
        {
          id: "garden",
          eyebrow: "Der Garten",
          title: "Im Rhythmus der Jahreszeiten",
          text: "Obst, Gemüse und Zitronen wachsen auf unseren Terrassen.",
          image: homeImages.garden,
          cta: { label: "Garten & Genuss", route: "gardenTable" },
        },
        {
          id: "rooms",
          eyebrow: "Die Zimmer",
          title: "Licht und Vietri",
          text: "Weiße Zimmer mit Balkon, Terrasse und Vietri-Fliesen.",
          image: homeImages.room,
          cta: { label: "Zimmer", route: "rooms" },
        },
        {
          id: "pool",
          eyebrow: "Der Pool",
          title: "Meerwasser",
          text: "Ein geschwungener Pool, umgeben von Grün.",
          image: poolGallery[0],
          cta: { label: "Pool", route: "pool" },
        },
        {
          id: "beach",
          eyebrow: "Das Meer",
          title: "Hinunter zum Meer",
          text: "Vom Garten führt eine Treppe zu unserem privaten Meerzugang.",
          image: beachGallery[0],
          cta: { label: "Privatstrand", route: "privateBeach" },
        },
      ],
      experiences: {
        eyebrow: "Erlebnisse",
        title: "An der Küste",
        lead: "Fischen, Bootsfahrt und Zitronengarten – je nach Saison und Verfügbarkeit.",
        requestLabel: "Informationen anfragen",
        items: [
          {
            id: "fishing",
            title: "Fischen",
            text: "Ein Vormittag auf dem Meer, wenn die Bedingungen es erlauben.",
            image: beachGallery[1],
            emailSubject: "Anfrage zum Fischerlebnis",
            emailBody:
              "Guten Tag La Fenice,\n\nich hätte gern Informationen zum Fischerlebnis.\n\nWunschdatum:\nAnzahl der Gäste:\nName:\n\nVielen Dank.",
          },
          {
            id: "boatTrip",
            title: "Mit dem Boot",
            text: "Eine gemeinsam abgestimmte Route entlang der Küste.",
            image: beachGallery[0],
            emailSubject: "Anfrage zu einem Bootsausflug",
            emailBody:
              "Guten Tag La Fenice,\n\nich hätte gern Informationen zu einem Bootsausflug.\n\nWunschdatum:\nAnzahl der Gäste:\nName:\n\nVielen Dank.",
          },
          {
            id: "lemonGrove",
            title: "Unter Zitronenbäumen",
            text: "Ein Besuch auf den bewirtschafteten Terrassen des Hauses.",
            image: homeImages.garden,
            emailSubject: "Anfrage zum Erlebnis im Zitronengarten",
            emailBody:
              "Guten Tag La Fenice,\n\nich hätte gern Informationen zum Erlebnis im Zitronengarten.\n\nWunschdatum:\nAnzahl der Gäste:\nName:\n\nVielen Dank.",
          },
        ],
      },
      stepsNotice: {
        title: "Barrierefreiheit",
        text: "Viele Stufen verbinden Straße, Zimmer, Gärten und Meer. Schreiben Sie uns vor Ihrem Aufenthalt bei besonderen Mobilitätsbedürfnissen.",
      },
    },
    rooms: {
      route: "rooms",
      metadata: {
        title: "Zimmer mit Meerblick in Positano | La Fenice",
        description:
          "Entdecken Sie die Zimmer des La Fenice in Positano mit weißen Wänden, Gewölbedecken, großen Fenstern und handbemalten Vietri-Fliesen.",
        openGraphImage: roomsGallery[0],
      },
      intro: {
        eyebrow: "Aufenthalt",
        title: "Zimmer im Licht von Positano",
        lead: "Schlichte Räume, oft zum Meer hin geöffnet.",
      },
      heroImage: roomsGallery[0],
      sections: [
        {
          id: "character",
          title: "Die Zimmer",
          paragraphs: [
            "Weiße Wände, Gewölbedecken und Vietri-Fliesen; viele Zimmer haben einen Balkon oder eine Terrasse mit Meerblick.",
          ],
          image: roomsGallery[1],
        },
      ],
      gallery: roomsGallery,
      note: "Schreiben Sie uns, welches Zimmer für Ihre Reisedaten verfügbar ist.",
    },
    pool: {
      route: "pool",
      metadata: {
        title: "Meerwasserpool in Positano | La Fenice",
        description:
          "Entdecken Sie den geschwungenen Meerwasserpool des La Fenice mit Wasserfall, Whirlpoolbereich und Sonnenterrasse am Hang von Positano.",
        openGraphImage: poolGallery[0],
      },
      intro: {
        eyebrow: "Pool",
        title: "Meerwasser zwischen den Terrassen",
        lead: "Der geschwungene Pool blickt ins Grüne.",
      },
      heroImage: poolGallery[0],
      sections: [
        {
          id: "water-and-shade",
          title: "Sonne und Schatten",
          paragraphs: [
            "Meerwasser, Wasserfall und Whirlpoolbereich zwischen Bougainvilleen und Jacaranda.",
          ],
          image: poolGallery[1],
        },
      ],
      gallery: poolGallery,
      note: "In der Regel von Juni bis Mitte Oktober geöffnet, je nach Wetter und Meeresbedingungen. Bitte bestätigen Sie Ihre Reisedaten.",
    },
    privateBeach: {
      route: "privateBeach",
      metadata: {
        title: "Privatstrand in Positano | La Fenice",
        description:
          "Folgen Sie den Gartenstufen des La Fenice bis zum Privatstrand des Bed & Breakfast und zum klaren Wasser unterhalb des Hangs von Positano.",
        openGraphImage: beachGallery[0],
      },
      intro: {
        eyebrow: "Privatstrand",
        title: "Das Meer am Ende des Gartens",
        lead: "Eine Treppe im Grünen führt zu unserem privaten Meerzugang.",
      },
      heroImage: beachGallery[0],
      sections: [
        {
          id: "descent",
          title: "Zum Wasser",
          paragraphs: [
            "Der Weg führt durch den Terrassengarten.",
          ],
          image: beachGallery[1],
        },
      ],
      gallery: beachGallery,
      note: "Der Zugang umfasst viele Stufen und hängt von den Meeresbedingungen ab.",
    },
    gardenTable: {
      route: "gardenTable",
      metadata: {
        title: "Garten und saisonale Genüsse | La Fenice Positano",
        description:
          "Entdecken Sie Obst, Gemüse, Trauben, Oliven und Zitronen, die traditionell im Terrassengarten des La Fenice in Positano angebaut werden.",
        openGraphImage: gardenGallery[0],
      },
      intro: {
        eyebrow: "Garten & Genuss",
        title: "Der Garten folgt den Jahreszeiten",
        lead: "Wir bauen an, was später auf unseren Tisch kommt.",
      },
      heroImage: gardenGallery[0],
      sections: [
        {
          id: "summer-winter",
          title: "Die Ernte",
          paragraphs: [
            "Obst und Gemüse wechseln mit den Monaten; Trauben, Oliven, Nüsse und Zitronen begleiten das Jahr.",
          ],
          image: gardenGallery[1],
        },
      ],
      gallery: gardenGallery,
      note: "Jede Jahreszeit bringt eine andere Ernte.",
    },
    location: {
      route: "location",
      metadata: {
        title: "Lage in Positano | La Fenice",
        description:
          "Sie finden La Fenice in der Via Guglielmo Marconi 4 in Positano. Öffnen Sie die Wegbeschreibung zum Bed & Breakfast an der Amalfiküste.",
        openGraphImage: locationImage,
      },
      intro: {
        eyebrow: "Lage",
        title: "Zwischen Straße und Meer",
        lead: "Nur wenige Schritte von der Haltestelle Sponda entfernt.",
      },
      heroImage: locationImage,
      sections: [
        {
          id: "address",
          title: "Via Guglielmo Marconi 4",
          paragraphs: [
            "Von der Haltestelle Sponda sind es etwa 200 Meter in Richtung Amalfi.",
          ],
          cta: { label: "Anreise", route: "gettingHere" },
        },
      ],
      gallery: [locationImage],
      note: "Prüfen Sie in der Hochsaison Verkehr und Fahrpläne vor der Anreise.",
    },
    gettingHere: {
      route: "gettingHere",
      metadata: {
        title: "Anreise nach Positano | La Fenice",
        description:
          "Planen Sie Ihre Anreise zum La Fenice in Positano mit Auto, Bahn, Flugzeug oder Schiff – mit Links zu offiziellen Verkehrsunternehmen.",
        openGraphImage: locationImage,
      },
      intro: {
        eyebrow: "Anreise",
        title: "Nach Positano kommen",
        lead: "Wählen Sie das Verkehrsmittel und prüfen Sie die offiziellen Fahrpläne.",
      },
      heroImage: locationImage,
      travelNotice: "Die Verbindungen ändern sich mit der Saison.",
      modes: [
        {
          id: "car",
          title: "Mit dem Auto",
          routes: [
            {
              id: "car-north",
              title: "Aus dem Norden",
              steps: [
                "Ausfahrt Castellammare di Stabia, dann SS145 und SS163 nach Positano.",
              ],
            },
            {
              id: "car-south",
              title: "Aus dem Süden",
              steps: [
                "Ausfahrt Vietri sul Mare, dann SS163 nach Positano.",
              ],
            },
          ],
        },
        {
          id: "train",
          title: "Mit der Bahn",
          routes: [
            {
              id: "train-naples",
              title: "Über Neapel",
              steps: [
                "Napoli Centrale → EAV nach Sorrent → SITA Sud nach Positano Sponda.",
              ],
            },
            {
              id: "train-salerno",
              title: "Über Salerno",
              steps: [
                "Salerno → SITA Sud nach Amalfi → Anschluss nach Positano Sponda.",
              ],
            },
          ],
        },
        {
          id: "plane",
          title: "Mit dem Flugzeug",
          routes: [
            {
              id: "plane-naples",
              title: "Ab Flughafen Neapel-Capodichino",
              steps: [
                "Napoli Centrale → EAV nach Sorrent oder Curreri direkt nach Sorrent; dann SITA Sud nach Positano Sponda.",
              ],
            },
            {
              id: "plane-rome",
              title: "Ab Flughafen Rom-Fiumicino",
              steps: [
                "Roma Termini → Neapel oder Salerno; dann der Bahnroute folgen.",
              ],
            },
          ],
        },
        {
          id: "sea",
          title: "Auf dem Seeweg",
          routes: [
            {
              id: "sea-positano",
              title: "Fähren und Tragflügelboote",
              steps: [
                "In der Saison verbinden Schiffe Positano mit Neapel, Sorrent, Salerno und Amalfi.",
              ],
            },
          ],
        },
      ],
      officialResourcesTitle: "Offizielle Reiseinformationen",
      officialResources: [
        {
          id: "sita",
          label: "SITA Sud Campania",
          description: "Busse an der Amalfiküste",
          href: "https://sitasudtrasporti.it/campania/orari/",
        },
        {
          id: "eav",
          label: "EAV",
          description: "Züge Neapel–Sorrent",
          href: "https://www.eavsrl.it/orari-linee-ferroviarie/",
        },
        {
          id: "curreri",
          label: "Curreri Viaggi",
          description: "Shuttle Flughafen Neapel–Sorrent",
          href: "https://www.curreriviaggi.it/it/navetta-aeroporto-di-napoli",
        },
        {
          id: "trenitalia",
          label: "Trenitalia",
          description: "Nationaler Bahnverkehr",
          href: "https://www.trenitalia.com/en.html",
        },
        {
          id: "naples-airport",
          label: "Internationaler Flughafen Neapel",
          description: "Verbindungen ab Capodichino",
          href: "https://www.aeroportodinapoli.it/it/in-bus",
        },
        {
          id: "alilauro",
          label: "Alilauro",
          description: "Fähren und Tragflügelboote",
          href: "https://www.alilauro.it/en/",
        },
      ],
      transferTitle: "Privater Transfer",
      transferNote: "Schreiben Sie uns für aktuelle Transfermöglichkeiten und Preise.",
    },
    availability: {
      route: "availability",
      metadata: {
        title: "Zimmerverfügbarkeit in Positano | La Fenice",
        description:
          "Fragen Sie die Zimmerverfügbarkeit bei La Fenice in Positano an. Nennen Sie Reisedaten und Gästezahl; wir antworten persönlich.",
        openGraphImage: availabilityImage,
      },
      intro: {
        eyebrow: "Ihr Aufenthalt",
        title: "Verfügbarkeit anfragen",
        lead: "Nennen Sie uns Reisedaten und Gästezahl. Wir antworten Ihnen direkt.",
      },
      heroImage: availabilityImage,
      form: {
        title: "Ihre Anfrage",
        requiredHint: "Mit * gekennzeichnete Felder sind Pflichtfelder.",
        honeypotLabel: "Website",
        fields: {
          name: { label: "Name *", placeholder: "Ihr vollständiger Name" },
          email: { label: "E-Mail *", placeholder: "sie@beispiel.de" },
          phone: {
            label: "Telefon",
            placeholder: "+00 000 0000000",
            hint: "Optional, einschließlich Ländervorwahl",
          },
          guests: { label: "Gäste *", hint: "Mitreisende Erwachsene und Kinder" },
          checkIn: { label: "Anreise *" },
          checkOut: { label: "Abreise *" },
          message: {
            label: "Nachricht",
            placeholder: "Teilen Sie uns weitere wichtige Informationen zu Ihrem Aufenthalt mit",
          },
        },
        consent: {
          prefix: "Ich habe die",
          linkLabel: "Datenschutzerklärung",
          suffix: "gelesen und stimme der Übermittlung dieser Angaben für meine Verfügbarkeitsanfrage zu. *",
        },
        submitLabel: "Anfrage senden",
        submittingLabel: "Wird gesendet…",
        successTitle: "Anfrage gesendet",
        successMessage: "Danke. Wir antworten per E-Mail; dies ist noch keine bestätigte Buchung.",
        errorTitle: "Ihre Anfrage konnte nicht gesendet werden",
        errorMessage:
          "Bitte versuchen Sie es erneut oder kontaktieren Sie uns über die unten angegebene E-Mail-Adresse oder Telefonnummer.",
        emailFallback: {
          subject: "Verfügbarkeitsanfrage",
          body: "Name:\nTelefon:\nGäste:\nAnreise:\nAbreise:\nAnfrage:",
        },
        validation: {
          required: "Bitte füllen Sie dieses Pflichtfeld aus.",
          invalidEmail: "Geben Sie eine gültige E-Mail-Adresse ein.",
          invalidDateRange: "Die Abreise muss nach der Anreise liegen.",
          invalidGuests: "Geben Sie mindestens einen Gast an.",
          consentRequired: "Ihre Zustimmung ist erforderlich, um die Anfrage zu senden.",
        },
      },
      responseTimeNote: "Diese Anfrage ist noch keine bestätigte Buchung.",
      fallback: {
        title: "Möchten Sie uns lieber direkt kontaktieren?",
        text: "Schreiben Sie uns oder rufen Sie uns direkt an.",
        emailLabel: "E-Mail an La Fenice",
        phoneLabel: "La Fenice anrufen",
      },
    },
    privacy: {
      route: "privacy",
      status: "review-required",
      metadata: {
        title: "Datenschutzerklärung | La Fenice Positano",
        description:
          "Datenschutzinformationen für die Website von La Fenice Positano. Die endgültige Fassung muss noch vom Betreiber und rechtlich geprüft werden.",
        robots: "noindex",
      },
      title: "Datenschutzerklärung",
      reviewNotice: {
        title: "Inhalt vor Veröffentlichung erforderlich",
        text: "Die bisherige Website enthält keine Datenschutzerklärung. Der Betreiber und eine qualifizierte Datenschutzberatung müssen vor der Veröffentlichung des Verfügbarkeitsformulars und der Produktionswebsite eine vollständige Erklärung bereitstellen oder genehmigen. Dieser Platzhalter ist keine Datenschutzerklärung.",
      },
    },
    terms: {
      route: "terms",
      status: "review-required",
      metadata: {
        title: "Allgemeine Geschäftsbedingungen | La Fenice Positano",
        description:
          "Allgemeine Geschäftsbedingungen für La Fenice Positano. Die endgültigen Inhalte müssen noch vom Betreiber und rechtlich geprüft werden.",
        robots: "noindex",
      },
      title: "Allgemeine Geschäftsbedingungen",
      reviewNotice: {
        title: "Inhalt vor Veröffentlichung erforderlich",
        text: "Die bisherige Website enthält keine Allgemeinen Geschäftsbedingungen. Der Betreiber und eine qualifizierte Beratung müssen vor der Veröffentlichung die geltenden Bedingungen für Aufenthalt, Stornierung und Website-Nutzung bereitstellen und genehmigen. Dieser Platzhalter begründet keine vertraglichen Bedingungen.",
      },
    },
  },
} as const satisfies SiteContent;
