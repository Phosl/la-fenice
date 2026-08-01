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
  withCopy(media.pool[0], "Der geschwungene Meerwasserpool und die Sonnenterrasse"),
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
  withCopy(media.gardenTable[0], "Saisonale Erzeugnisse aus dem Garten des La Fenice"),
  withCopy(media.gardenTable[1], "Eine Ernte aus dem Garten des La Fenice"),
  withCopy(media.gardenTable[2], "Oliven und Gemüse von den Terrassenfeldern"),
  withCopy(media.gardenTable[3], "Feigen, die in der Sonne Positanos reifen"),
] as const;

const locationImage = withCopy(
  media.location,
  "Das La Fenice am grünen Hang über dem Tyrrhenischen Meer",
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
    description:
      "Ein traditionsreiches Bed & Breakfast am Hang von Positano – vom Garten bis zum Meer.",
    contactTitle: "Kontakt",
    exploreTitle: "Entdecken",
    legalTitle: "Rechtliches",
    photographyCredit: "Fotografie von Tim Evancook",
  },
  availabilityCta: {
    eyebrow: "Ihr Aufenthalt",
    title: "Beginnen Sie mit einer unverbindlichen Anfrage.",
    text: "Teilen Sie uns Ihre Reisedaten und die Anzahl der Gäste mit. La Fenice antwortet Ihnen direkt mit Verfügbarkeit und Einzelheiten.",
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
          "Entdecken Sie La Fenice, ein Bed & Breakfast am Hang von Positano mit Zimmern mit Meerblick, Meerwasserpool, Privatstrand und saisonalem Garten.",
        openGraphImage: homeImages.panorama,
      },
      hero: {
        eyebrow: "Positano · Amalfiküste",
        title: "Vom Garten bis zum Meer",
        lead:
          "Ein traditionsreicher Rückzugsort am Hang von Positano, zwischen Zitronenbäumen, Bougainvilleen und dem Blick auf das Tyrrhenische Meer.",
        image: homeImages.panorama,
        primaryCta: {
          label: "Verfügbarkeit anfragen",
          route: "availability",
        },
        secondaryCta: {
          label: "La Fenice entdecken",
          route: "rooms",
        },
      },
      introduction: {
        id: "welcome",
        eyebrow: "La Fenice",
        title: "Ein Zuhause am Hang von Positano",
        paragraphs: [
          "La Fenice ist ein Bed & Breakfast auf einem rund drei Hektar großen Anwesen an der Amalfiküste. Villen und kleine Häuser ziehen sich durch terrassierte Gärten mit Bougainvilleen, Zitronenbäumen und Weinreben hinunter zum Meer.",
          "Hier prägt der Charakter der Küste jeden Aufenthalt: Meerblick, Gartenwege, ein in den Fels eingebetteter Pool und der Privatstrand unterhalb des Anwesens.",
        ],
        image: homeImages.view,
      },
      storyHeading: {
        eyebrow: "Vom Hang bis zum Meer",
        title: "Vier Kapitel, eine Landschaft.",
      },
      accessibilityNoteLabel: "Ein wichtiger Hinweis zur Zugänglichkeit",
      locationTeaser: {
        eyebrow: "Lage",
        title: "Zwischen Küstenstraße und Meer",
        linkLabel: "Lage entdecken",
        badge: "Via Marconi 4",
        scrollLabel: "Scrollen",
      },
      stories: [
        {
          id: "garden",
          eyebrow: "Der Garten",
          title: "Was die Jahreszeit schenkt",
          text: "Obst, Gemüse, Trauben, Oliven und Zitronen wachsen auf dem terrassierten Land und gehören seit jeher zur Küche der Familie.",
          image: homeImages.garden,
          cta: { label: "Vom Garten auf den Tisch", route: "gardenTable" },
        },
        {
          id: "rooms",
          eyebrow: "Die Zimmer",
          title: "Licht, Meer und die Farben von Vietri",
          text: "Die meisten Zimmer blicken auf das Meer und öffnen sich zu einem privaten Balkon oder einer Terrasse. Gewölbedecken und handbemalte Vietri-Fliesen prägen ihren Charakter.",
          image: homeImages.room,
          cta: { label: "Zimmer entdecken", route: "rooms" },
        },
        {
          id: "pool",
          eyebrow: "Der Pool",
          title: "In den Hang eingebettet",
          text: "Ein geschwungener Meerwasserpool mit Wasserfall und Whirlpoolbereich liegt zwischen Sonnenterrassen und schattenspendenden Blütenpflanzen.",
          image: poolGallery[0],
          cta: { label: "Pool entdecken", route: "pool" },
        },
        {
          id: "beach",
          eyebrow: "Das Meer",
          title: "Hinunter zum Privatstrand",
          text: "Gartenstufen führen vom Anwesen zu einem eigenen, ruhigen Zugang zum klaren Wasser unterhalb.",
          image: beachGallery[0],
          cta: { label: "Strand entdecken", route: "privateBeach" },
        },
      ],
      experiences: {
        eyebrow: "Erlebnisse",
        title: "Drei Wege, die Küste kennenzulernen",
        lead:
          "Entdecken Sie die Landschaft rund um La Fenice vom Meer aus, durch lokale Traditionen und den Duft der Zitronen. Jedes Erlebnis wird auf Anfrage organisiert und bedarf einer Bestätigung.",
        requestLabel: "Per E-Mail anfragen",
        items: [
          {
            id: "fishing",
            title: "Fischen vor der Küste",
            text: "Fragen Sie nach einem Fischerlebnis in den Gewässern rund um Positano. Die Einzelheiten werden je nach Saison und Meeresbedingungen bestätigt.",
            image: beachGallery[1],
            emailSubject: "Anfrage zum Fischerlebnis",
            emailBody:
              "Guten Tag La Fenice,\n\nich hätte gern Informationen zum Fischerlebnis.\n\nWunschdatum:\nAnzahl der Gäste:\nName:\n\nVielen Dank.",
          },
          {
            id: "boatTrip",
            title: "Ein Tag mit dem Boot",
            text: "Fragen Sie nach den aktuellen Möglichkeiten, die Küste vom Wasser aus zu entdecken. Route und Einzelheiten zur Einschiffung werden direkt vereinbart.",
            image: beachGallery[0],
            emailSubject: "Anfrage zu einem Bootsausflug",
            emailBody:
              "Guten Tag La Fenice,\n\nich hätte gern Informationen zu einem Bootsausflug.\n\nWunschdatum:\nAnzahl der Gäste:\nName:\n\nVielen Dank.",
          },
          {
            id: "lemonGrove",
            title: "Unter Zitronenbäumen",
            text: "Entdecken Sie den Terrassengarten und die Rolle, die Zitronen und der saisonale Anbau im Leben des La Fenice spielen.",
            image: homeImages.garden,
            emailSubject: "Anfrage zum Erlebnis im Zitronengarten",
            emailBody:
              "Guten Tag La Fenice,\n\nich hätte gern Informationen zum Erlebnis im Zitronengarten.\n\nWunschdatum:\nAnzahl der Gäste:\nName:\n\nVielen Dank.",
          },
        ],
      },
      stepsNotice: {
        title: "Ein Ort, der von Stufen geprägt ist",
        text: "La Fenice folgt dem natürlichen Hang der Amalfiküste. Zwischen Straße, Zimmern, Gärten, Pool und Strand liegen viele Stufen, weshalb das Anwesen nicht für jede Mobilitätsanforderung geeignet ist. Kontaktieren Sie uns vor Ihrer Anfrage, wenn Sie Fragen zur Zugänglichkeit haben.",
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
        lead:
          "Schlichte mediterrane Innenräume, traditionelle Details und eine offene Verbindung zum Meer.",
      },
      heroImage: roomsGallery[0],
      sections: [
        {
          id: "character",
          title: "Für die Küste geschaffen",
          paragraphs: [
            "Die meisten Zimmer blicken auf das Meer und verfügen über einen privaten Balkon oder eine Terrasse.",
            "Weiße Wände, Gewölbedecken und große Fenster treffen auf Böden aus handbemalten Vietri-Fliesen.",
          ],
          image: roomsGallery[1],
        },
      ],
      gallery: roomsGallery,
      note:
        "Die derzeitigen Informationen beschreiben die Zimmer als Gesamtheit und nicht als einzelne Zimmerkategorien. Fragen Sie die Verfügbarkeit an, um Einzelheiten zu dem für Ihre Reisedaten angebotenen Zimmer zu erhalten.",
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
        title: "Vom Fels umschlossenes Wasser",
        lead:
          "Ein geschwungener Pool und eine blühende Terrasse, eingebettet in die natürliche Form des Hangs.",
      },
      heroImage: poolGallery[0],
      sections: [
        {
          id: "water-and-shade",
          title: "Sonne, Schatten und Meerwasser",
          paragraphs: [
            "Der Meerwasserpool verfügt über einen Wasserfall und einen Whirlpoolbereich.",
            "Auf der sonnigen Terrasse finden sich unter Bougainvilleen und Jacaranda auch schattige Plätze.",
          ],
          image: poolGallery[1],
        },
        {
          id: "season",
          eyebrow: "Saisonale Öffnung",
          title: "Anfang Juni bis Mitte Oktober",
          paragraphs: [
            "Der veröffentlichte Öffnungszeitraum reicht von Anfang Juni bis Mitte Oktober, sofern Wetter- und Meeresbedingungen es zulassen. Bitte bestätigen Sie die aktuellen Öffnungszeiten bei Ihrer Verfügbarkeitsanfrage.",
          ],
        },
      ],
      gallery: poolGallery,
      note: "Die Öffnungszeiten des Pools sind saisonabhängig und müssen für jeden Aufenthalt bestätigt werden.",
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
        title: "Ein Weg durch den Garten zum Meer",
        lead:
          "Unterhalb der Villen und Terrassen führen schattige Stufen hinunter zum Privatstrand des La Fenice.",
      },
      heroImage: beachGallery[0],
      sections: [
        {
          id: "descent",
          title: "Die Küste in ihrer natürlichsten Form",
          paragraphs: [
            "Gäste erreichen das Wasser über die von Bäumen gesäumten Stufen, die vom Anwesen hinabführen.",
            "Der lange Abstieg ist Teil der Landschaft und sollte von Gästen mit eingeschränkter Mobilität berücksichtigt werden.",
          ],
          image: beachGallery[1],
        },
        {
          id: "boat-outings",
          title: "Unterwegs auf dem Wasser",
          paragraphs: [
            "Fragen Sie uns nach aktuellen Möglichkeiten für Bootsausflüge entlang der Küste, darunter Fahrten in Richtung Capri, Blaue Grotte, Amalfi und Li Galli. Verfügbarkeit und Bedingungen für die Einschiffung müssen direkt bestätigt werden.",
          ],
          image: beachGallery[0],
        },
      ],
      gallery: beachGallery,
      note:
        "Der Zugang zum Strand führt über viele Stufen im Freien. Der Zugang zum Meer und Bootsausflüge hängen von den Wetter- und Meeresbedingungen ab.",
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
        title: "Ein Garten im Rhythmus der Jahreszeiten",
        lead:
          "Das terrassierte Land liefert Obst, Gemüse und Kräuter, die seit Langem die Küche der Familie inspirieren.",
      },
      heroImage: gardenGallery[0],
      sections: [
        {
          id: "summer-winter",
          title: "Von Sommerfarben bis Wintergemüse",
          paragraphs: [
            "Im Sommer wachsen im Garten Tomaten, Auberginen, Paprika, Aprikosen, Feigen, Pflaumen und Pfirsiche.",
            "Der Winter bringt Kartoffeln, Zwiebeln, verschiedene Brokkolisorten, Fenchel, Spinat und Mangold.",
          ],
          image: gardenGallery[1],
        },
        {
          id: "harvest",
          title: "Trauben, Oliven und Zitronen",
          paragraphs: [
            "Die Weinlese findet traditionell im September statt, gefolgt von der Oliven- und Nussernte im Oktober. Die Zitronenbäume tragen das ganze Jahr über Früchte.",
            "Was reif und saisonal ist, wird für die Küche geerntet.",
          ],
          image: gardenGallery[3],
        },
      ],
      gallery: gardenGallery,
    },
    location: {
      route: "location",
      metadata: {
        title: "Lage in Positano | La Fenice",
        description:
          "Sie finden La Fenice in der Via Marconi 4 in Positano. Öffnen Sie die Wegbeschreibung zum Bed & Breakfast an der Amalfiküste.",
        openGraphImage: locationImage,
      },
      intro: {
        eyebrow: "Lage",
        title: "Am Hang von Positano",
        lead:
          "La Fenice liegt zwischen der Küstenstraße und dem Meer. Seine terrassierten Gärten ziehen sich den Hang hinunter.",
      },
      heroImage: locationImage,
      sections: [
        {
          id: "address",
          title: "Via Marconi 4",
          paragraphs: [
            "Das Bed & Breakfast befindet sich in der Via Marconi 4, 84017 Positano (SA), Italien.",
            "Nach den bestehenden Hinweisen sind es von der Bushaltestelle Sponda etwa 200 Meter zu Fuß in Richtung Amalfi. Nutzen Sie die Karte für den letzten Abschnitt und kontaktieren Sie uns, wenn Sie Hinweise zum Zugang benötigen.",
          ],
          cta: { label: "Anreise planen", route: "gettingHere" },
        },
      ],
      gallery: [locationImage],
      note:
        "Straßenverhältnisse und Fahrpläne des öffentlichen Verkehrs können sich ändern, besonders in der Hochsaison. Prüfen Sie vor der Anreise die aktuellen Informationen.",
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
        title: "Ihr Weg nach Positano",
        lead:
          "Der letzte Teil der Reise führt entlang der Küste. Wählen Sie Ihre Route und prüfen Sie vor der Abfahrt stets die aktuellen Fahrpläne.",
      },
      heroImage: locationImage,
      travelNotice:
        "Fahrzeiten, Routen und saisonale Verbindungen ändern sich. Die folgenden Hinweise verzichten bewusst auf feste Abfahrtszeiten; aktuelle Informationen finden Sie bei den verlinkten offiziellen Anbietern.",
      modes: [
        {
          id: "car",
          title: "Mit dem Auto",
          routes: [
            {
              id: "car-north",
              title: "Aus dem Norden",
              steps: [
                "Folgen Sie der Autobahn in Richtung Castellammare di Stabia.",
                "Fahren Sie auf der SS145 in Richtung Sorrentinische Halbinsel weiter und nehmen Sie anschließend die SS163 nach Positano.",
                "Italienische Autobahnen sind mautpflichtig. Prüfen Sie vor der Abfahrt die aktuelle Navigation und die geltenden Verkehrsregeln an der Küste.",
              ],
            },
            {
              id: "car-south",
              title: "Aus dem Süden",
              steps: [
                "Verlassen Sie die Autobahn bei Vietri sul Mare.",
                "Folgen Sie der SS163 entlang der Amalfiküste in Richtung Positano.",
                "Planen Sie für die schmale Küstenstraße und den saisonalen Verkehr zusätzliche Zeit ein.",
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
                "Fahren Sie ab Napoli Centrale mit der EAV Circumvesuviana nach Sorrent.",
                "Steigen Sie in Sorrent in einen Bus von SITA Sud nach Positano um und bitten Sie um die Haltestelle Sponda.",
                "Nach den bestehenden Hinweisen sind es von Sponda etwa 200 Meter zu Fuß in Richtung Amalfi.",
              ],
            },
            {
              id: "train-salerno",
              title: "Über Salerno",
              steps: [
                "Nehmen Sie am Bahnhof Salerno einen Bus von SITA Sud nach Amalfi.",
                "Steigen Sie in Amalfi in die Verbindung nach Positano um und an der Haltestelle Sponda aus.",
                "Saisonale Schiffsverbindungen können Salerno ebenfalls mit Positano verbinden. Informieren Sie sich vor der Reise beim jeweiligen Anbieter.",
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
                "Nutzen Sie eine offizielle Flughafenverbindung nach Napoli Centrale und folgen Sie der Route über Sorrent, oder nehmen Sie den Curreri-Flughafenshuttle nach Sorrent.",
                "Fahren Sie von Sorrent mit einem Bus von SITA Sud bis Positano Sponda weiter.",
              ],
            },
            {
              id: "plane-rome",
              title: "Ab Flughafen Rom-Fiumicino",
              steps: [
                "Nehmen Sie den Flughafenzug nach Roma Termini.",
                "Fahren Sie mit einem Fernzug nach Neapel oder Salerno weiter und folgen Sie anschließend der jeweiligen Route oben.",
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
                "Saisonale Verbindungen führen von Häfen wie Neapel, Sorrent, Salerno und Amalfi nach Positano.",
                "Die Routen hängen von der Jahreszeit und den Meeresbedingungen ab. Prüfen Sie vor der Reise den aktuellen Fahrplan und Abfahrtshafen beim Anbieter.",
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
          description: "Buslinien an der Amalfiküste und aktuelle Fahrpläne",
          href: "https://sitasudtrasporti.it/campania/orari/",
        },
        {
          id: "eav",
          label: "EAV",
          description: "Bahninformationen und Betriebsmeldungen für Neapel–Sorrent",
          href: "https://www.eavsrl.it/orari-linee-ferroviarie/",
        },
        {
          id: "curreri",
          label: "Curreri Viaggi",
          description: "Informationen zum Shuttle zwischen Flughafen Neapel und Sorrent",
          href: "https://www.curreriviaggi.it/it/navetta-aeroporto-di-napoli",
        },
        {
          id: "trenitalia",
          label: "Trenitalia",
          description: "Fernverkehrsplanung für Neapel, Salerno und Rom",
          href: "https://www.trenitalia.com/en.html",
        },
        {
          id: "naples-airport",
          label: "Internationaler Flughafen Neapel",
          description: "Offizielle Informationen zum Bodentransport",
          href: "https://www.aeroportodinapoli.it/it/in-bus",
        },
        {
          id: "alilauro",
          label: "Alilauro",
          description: "Offizielle Informationen zu saisonalen Fähren und Tragflügelbooten",
          href: "https://www.alilauro.it/en/",
        },
      ],
      transferTitle: "Privater Transfer",
      transferNote:
        "Wenn Sie Unterstützung bei der Organisation eines privaten Transfers wünschen, kontaktieren Sie La Fenice bitte vor der Anreise, damit aktuelle Möglichkeiten und Preise bestätigt werden können.",
    },
    availability: {
      route: "availability",
      metadata: {
        title: "Verfügbarkeit anfragen | La Fenice Positano",
        description:
          "Senden Sie La Fenice eine Anfrage zur Zimmerverfügbarkeit in Positano. Ihre Anfrage wird persönlich beantwortet und ist keine Sofortbuchung.",
        openGraphImage: availabilityImage,
      },
      intro: {
        eyebrow: "Ihr Aufenthalt",
        title: "Verfügbarkeit anfragen",
        lead:
          "Teilen Sie uns Ihre Reisedaten und die Anzahl der Reisenden mit. Wir antworten Ihnen persönlich mit Informationen zu dem verfügbaren Zimmer.",
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
        successMessage:
          "Vielen Dank. Wir antworten Ihnen direkt per E-Mail. Ihre Anfrage ist noch keine bestätigte Reservierung.",
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
      responseTimeNote:
        "Dieses Formular sendet eine Verfügbarkeitsanfrage und keine Sofortbuchung. La Fenice bestätigt Verfügbarkeit und Einzelheiten persönlich.",
      fallback: {
        title: "Möchten Sie uns lieber direkt kontaktieren?",
        text: "Schreiben Sie La Fenice eine E-Mail oder rufen Sie uns an und nennen Sie Ihre gewünschten Reisedaten sowie die Anzahl der Gäste.",
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
