import { media } from "./media";
import type { GalleryImage, ImageAsset, SiteContent } from "./types";

const withCopy = (
  asset: ImageAsset,
  alt: string,
  caption?: string,
): GalleryImage => ({ ...asset, alt, ...(caption ? { caption } : {}) });

const homeImages = {
  room: withCopy(media.home.room, "A bright room at La Fenice in Positano"),
  garden: withCopy(
    media.home.garden,
    "The terraced garden at La Fenice above the sea",
  ),
  panorama: withCopy(
    media.home.panorama,
    "A panoramic view of Positano and the Tyrrhenian Sea",
  ),
  view: withCopy(media.home.view, "Sea view from La Fenice in Positano"),
};

const roomsGallery = [
  withCopy(media.rooms[0], "A La Fenice room opening onto a private balcony"),
  withCopy(media.rooms[1], "White walls and a vaulted ceiling in a guest room"),
  withCopy(media.rooms[2], "A sea-view terrace surrounded by greenery"),
  withCopy(media.rooms[3], "Hand-painted Vietri tiles in a La Fenice room"),
] as const;

const poolGallery = [
  withCopy(media.pool[0], "Two views of the curved seawater pool"),
  withCopy(
    media.pool[1],
    "La Fenice pool with its waterfall and hydromassage area",
  ),
] as const;

const beachGallery = [
  withCopy(media.privateBeach[0], "Clear water at La Fenice's private beach"),
  withCopy(media.privateBeach[1], "The private beach below La Fenice"),
] as const;

const gardenGallery = [
  withCopy(media.gardenTable[0], "Lemons, caprese and figs at La Fenice"),
  withCopy(media.gardenTable[1], "Bougainvillea and flowers in the La Fenice garden"),
  withCopy(media.gardenTable[2], "Potato harvest on the terraces"),
  withCopy(media.gardenTable[3], "Prickly pears and seasonal preserves"),
] as const;

const locationImage = withCopy(
  media.location,
  "Coastal sea view from La Fenice with a planter on the balcony",
);

const availabilityImage = withCopy(
  media.availability,
  "A sea-view room prepared for guests at La Fenice",
);

export const englishContent = {
  locale: "en",
  common: {
    skipIntro: "Skip intro",
    skipToContent: "Skip to content",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    changeLanguage: "Change language",
    languageName: "English",
    primaryNavigation: "Primary navigation",
    viewGallery: "View gallery",
    previousImage: "Previous image",
    nextImage: "Next image",
    closeGallery: "Close gallery",
    openMap: "Open interactive map",
    mapLoadingNotice: "The interactive map loads only when you choose to open it.",
    getDirections: "Get directions",
    officialWebsite: "Official website",
    email: "Email",
    phone: "Phone",
    address: "Address",
    vatNumber: "VAT number",
    followUs: "Follow us",
    goodToKnow: "Good to know",
  },
  navigation: {
    primary: {
      home: "Home",
      rooms: "Rooms",
      pool: "Pool",
      privateBeach: "Private beach",
      gardenTable: "Garden & table",
      location: "Location",
      gettingHere: "Getting here",
    },
    utility: {
      privacy: "Privacy",
      terms: "Terms & conditions",
    },
    availability: "Request availability",
  },
  footer: {
    description: "Between the garden and the sea.",
    contactTitle: "Contact",
    exploreTitle: "Pages",
    legalTitle: "Legal",
    photographyCredit: "Photography by Tim Evancook",
  },
  availabilityCta: {
    eyebrow: "Your stay",
    title: "Staying with us",
    text: "Send us your dates. We will reply personally.",
    label: "Request availability",
  },
  notFound: {
    title: "This path does not reach the sea.",
    text: "The page may have moved. Return to La Fenice and continue from there.",
    button: "Back home",
  },
  pages: {
    home: {
      route: "home",
      metadata: {
        title: "La Fenice Positano | Bed & Breakfast on the Amalfi Coast",
        description:
          "La Fenice is a bed and breakfast in Positano with sea-view rooms, a seawater pool, a private beach and a seasonal garden.",
        openGraphImage: homeImages.panorama,
      },
      hero: {
        eyebrow: "Positano · Amalfi Coast",
        title: "From the garden to the sea",
        lead: "Our home on the Positano hillside, between the garden and the sea.",
        image: homeImages.panorama,
        primaryCta: {
          label: "Request availability",
          route: "availability",
        },
      },
      introduction: {
        id: "welcome",
        eyebrow: "Our home",
        title: "A simple place by the sea",
        paragraphs: [
          "La Fenice is our home: rooms and gardens follow the terraces among lemons, vines and bougainvillea.",
        ],
        image: homeImages.view,
      },
      storyHeading: {
        eyebrow: "The house",
        title: "Four places",
      },
      locationTeaser: {
        eyebrow: "Location",
        title: "Via Guglielmo Marconi 4, Positano",
        text: "Near the Sponda bus stop, between the coastal road and the sea.",
        linkLabel: "Location and map",
        scrollLabel: "Continue",
      },
      stories: [
        {
          id: "garden",
          eyebrow: "The garden",
          title: "With the seasons",
          text: "Fruit, vegetables and lemons grow on our terraces.",
          image: homeImages.garden,
          cta: { label: "Garden & table", route: "gardenTable" },
        },
        {
          id: "rooms",
          eyebrow: "The rooms",
          title: "Light and Vietri",
          text: "White rooms with balconies, terraces and Vietri tiles.",
          image: homeImages.room,
          cta: { label: "Rooms", route: "rooms" },
        },
        {
          id: "pool",
          eyebrow: "The pool",
          title: "Seawater",
          text: "A curved pool surrounded by greenery.",
          image: poolGallery[0],
          cta: { label: "Pool", route: "pool" },
        },
        {
          id: "beach",
          eyebrow: "The sea",
          title: "Down to the sea",
          text: "Garden steps lead to our private access to the sea.",
          image: beachGallery[0],
          cta: { label: "Beach", route: "privateBeach" },
        },
      ],
      experiences: {
        eyebrow: "Experiences",
        title: "Along the coast",
        lead: "Fishing, boat trips and the lemon grove, subject to season and availability.",
        requestLabel: "Ask for details",
        items: [
          {
            id: "fishing",
            title: "Fishing",
            text: "A morning at sea, when conditions allow.",
            image: beachGallery[1],
            emailSubject: "Fishing experience request",
            emailBody:
              "Hello La Fenice,\n\nI would like information about the fishing experience.\n\nPreferred date:\nNumber of guests:\nName:\n\nThank you.",
          },
          {
            id: "boatTrip",
            title: "By boat",
            text: "A route along the coast, arranged together.",
            image: beachGallery[0],
            emailSubject: "Boat trip request",
            emailBody:
              "Hello La Fenice,\n\nI would like information about a boat trip.\n\nPreferred date:\nNumber of guests:\nName:\n\nThank you.",
          },
          {
            id: "lemonGrove",
            title: "Among the lemons",
            text: "A visit to the cultivated terraces around the house.",
            image: homeImages.garden,
            emailSubject: "Lemon grove experience request",
            emailBody:
              "Hello La Fenice,\n\nI would like information about the lemon grove experience.\n\nPreferred date:\nNumber of guests:\nName:\n\nThank you.",
          },
        ],
      },
      stepsNotice: {
        title: "Accessibility",
        text: "Many steps connect the road, rooms, gardens and sea. Please write before your stay about any mobility needs.",
      },
    },
    rooms: {
      route: "rooms",
      metadata: {
        title: "Sea-view rooms in Positano | La Fenice",
        description:
          "Explore the character of La Fenice's rooms in Positano, with white walls, vaulted ceilings, large windows and hand-painted Vietri tiles.",
        openGraphImage: roomsGallery[0],
      },
      intro: {
        eyebrow: "Stay",
        title: "Rooms in the light of Positano",
        lead: "Simple rooms, often open to the sea.",
      },
      heroImage: roomsGallery[0],
      sections: [
        {
          id: "character",
          title: "The rooms",
          paragraphs: [
            "White walls, vaulted ceilings and Vietri tiles; many rooms have a sea-view balcony or terrace.",
          ],
          image: roomsGallery[1],
        },
      ],
      gallery: roomsGallery,
      note: "Write to ask which room is available for your dates.",
    },
    pool: {
      route: "pool",
      metadata: {
        title: "Seawater pool in Positano | La Fenice",
        description:
          "Discover La Fenice's curved seawater pool, waterfall, hydromassage area and sunny terrace on the Positano hillside.",
        openGraphImage: poolGallery[0],
      },
      intro: {
        eyebrow: "Pool",
        title: "Seawater among the terraces",
        lead: "The curved pool faces the greenery.",
      },
      heroImage: poolGallery[0],
      sections: [
        {
          id: "water-and-shade",
          title: "Sun and shade",
          paragraphs: [
            "Seawater, a waterfall and hydromassage, among bougainvillea and jacaranda.",
          ],
          image: poolGallery[1],
        },
      ],
      gallery: poolGallery,
      note: "Usually open from June to mid-October, depending on weather and sea conditions. Please confirm your dates.",
    },
    privateBeach: {
      route: "privateBeach",
      metadata: {
        title: "Private beach in Positano | La Fenice",
        description:
          "Follow the garden steps from La Fenice to the bed and breakfast's private beach and the clear water below the Positano hillside.",
        openGraphImage: beachGallery[0],
      },
      intro: {
        eyebrow: "Private beach",
        title: "The sea at the end of the garden",
        lead: "Steps through the greenery lead to our private access to the sea.",
      },
      heroImage: beachGallery[0],
      sections: [
        {
          id: "descent",
          title: "To the water",
          paragraphs: [
            "The path crosses the terraced garden.",
          ],
          image: beachGallery[1],
        },
      ],
      gallery: beachGallery,
      note: "Access involves many steps and is subject to sea conditions.",
    },
    gardenTable: {
      route: "gardenTable",
      metadata: {
        title: "Garden and seasonal flavours | La Fenice Positano",
        description:
          "Discover the fruit, vegetables, grapes, olives and lemons traditionally grown in La Fenice's terraced garden in Positano.",
        openGraphImage: gardenGallery[0],
      },
      intro: {
        eyebrow: "Garden & table",
        title: "The garden follows the seasons",
        lead: "We grow what later reaches our table.",
      },
      heroImage: gardenGallery[0],
      sections: [
        {
          id: "summer-winter",
          title: "The harvest",
          paragraphs: [
            "Fruit and vegetables change with the months; grapes, olives, nuts and lemons mark the year.",
          ],
          image: gardenGallery[1],
        },
      ],
      gallery: gardenGallery,
      note: "Each season brings a different harvest.",
    },
    location: {
      route: "location",
      metadata: {
        title: "Location in Positano | La Fenice",
        description:
          "Find La Fenice at Via Guglielmo Marconi 4 in Positano and open directions to the bed and breakfast on the Amalfi Coast.",
        openGraphImage: locationImage,
      },
      intro: {
        eyebrow: "Location",
        title: "Between the road and the sea",
        lead: "A short walk from the Sponda bus stop.",
      },
      heroImage: locationImage,
      sections: [
        {
          id: "address",
          title: "Via Guglielmo Marconi 4",
          paragraphs: [
            "From the Sponda bus stop, walk about 200 metres toward Amalfi.",
          ],
          cta: { label: "Getting here", route: "gettingHere" },
        },
      ],
      gallery: [locationImage],
      note: "In high season, check traffic and schedules before travelling.",
    },
    gettingHere: {
      route: "gettingHere",
      metadata: {
        title: "How to reach Positano | La Fenice",
        description:
          "Plan your journey to La Fenice in Positano by car, train, plane or sea, with links to official transport operators.",
        openGraphImage: locationImage,
      },
      intro: {
        eyebrow: "Getting here",
        title: "Reaching Positano",
        lead: "Choose how to travel and check official schedules.",
      },
      heroImage: locationImage,
      travelNotice: "Services change with the season.",
      modes: [
        {
          id: "car",
          title: "By car",
          routes: [
            {
              id: "car-north",
              title: "From the north",
              steps: [
                "Exit at Castellammare di Stabia, then take SS145 and SS163 to Positano.",
              ],
            },
            {
              id: "car-south",
              title: "From the south",
              steps: [
                "Exit at Vietri sul Mare, then take SS163 to Positano.",
              ],
            },
          ],
        },
        {
          id: "train",
          title: "By train",
          routes: [
            {
              id: "train-naples",
              title: "Via Naples",
              steps: [
                "Napoli Centrale → EAV to Sorrento → SITA Sud to Positano Sponda.",
              ],
            },
            {
              id: "train-salerno",
              title: "Via Salerno",
              steps: [
                "Salerno → SITA Sud to Amalfi → connection to Positano Sponda.",
              ],
            },
          ],
        },
        {
          id: "plane",
          title: "By plane",
          routes: [
            {
              id: "plane-naples",
              title: "From Naples Capodichino",
              steps: [
                "Napoli Centrale → EAV to Sorrento, or Curreri direct to Sorrento; then SITA Sud to Positano Sponda.",
              ],
            },
            {
              id: "plane-rome",
              title: "From Rome Fiumicino",
              steps: [
                "Roma Termini → Naples or Salerno; then follow the train route.",
              ],
            },
          ],
        },
        {
          id: "sea",
          title: "By sea",
          routes: [
            {
              id: "sea-positano",
              title: "Ferries and hydrofoils",
              steps: [
                "In season, sea services connect Positano with Naples, Sorrento, Salerno and Amalfi.",
              ],
            },
          ],
        },
      ],
      officialResourcesTitle: "Official travel information",
      officialResources: [
        {
          id: "sita",
          label: "SITA Sud Campania",
          description: "Amalfi Coast buses",
          href: "https://sitasudtrasporti.it/campania/orari/",
        },
        {
          id: "eav",
          label: "EAV",
          description: "Naples–Sorrento trains",
          href: "https://www.eavsrl.it/orari-linee-ferroviarie/",
        },
        {
          id: "curreri",
          label: "Curreri Viaggi",
          description: "Naples Airport–Sorrento shuttle",
          href: "https://www.curreriviaggi.it/it/navetta-aeroporto-di-napoli",
        },
        {
          id: "trenitalia",
          label: "Trenitalia",
          description: "National rail services",
          href: "https://www.trenitalia.com/en.html",
        },
        {
          id: "naples-airport",
          label: "Naples International Airport",
          description: "Connections from Capodichino",
          href: "https://www.aeroportodinapoli.it/it/in-bus",
        },
        {
          id: "alilauro",
          label: "Alilauro",
          description: "Ferries and hydrofoils",
          href: "https://www.alilauro.it/en/",
        },
      ],
      transferTitle: "Private transfer",
      transferNote: "For a private transfer, write for current options and prices.",
    },
    availability: {
      route: "availability",
      metadata: {
        title: "Request availability | La Fenice Positano",
        description:
          "Send La Fenice an availability request for your stay in Positano.",
        openGraphImage: availabilityImage,
      },
      intro: {
        eyebrow: "Your stay",
        title: "Request availability",
        lead: "Tell us your dates and number of guests. We will reply directly.",
      },
      heroImage: availabilityImage,
      form: {
        title: "Your request",
        requiredHint: "Fields marked with * are required.",
        honeypotLabel: "Website",
        fields: {
          name: { label: "Name *", placeholder: "Your full name" },
          email: { label: "Email *", placeholder: "you@example.com" },
          phone: {
            label: "Phone",
            placeholder: "+00 000 0000000",
            hint: "Optional, including country code",
          },
          guests: { label: "Guests *", hint: "Adults and children travelling" },
          checkIn: { label: "Check-in *" },
          checkOut: { label: "Check-out *" },
          message: {
            label: "Message",
            placeholder: "Tell us anything useful about your stay",
          },
        },
        consent: {
          prefix: "I have read the",
          linkLabel: "privacy notice",
          suffix: "and agree to send these details for my availability request. *",
        },
        submitLabel: "Send request",
        submittingLabel: "Sending…",
        successTitle: "Request sent",
        successMessage: "Thank you. We will reply by email; this is not yet a confirmed booking.",
        errorTitle: "We could not send your request",
        errorMessage:
          "Please try again or contact us using the email address or phone number below.",
        emailFallback: {
          subject: "Availability request",
          body: "Name:\nPhone:\nGuests:\nCheck-in:\nCheck-out:\nRequest:",
        },
        validation: {
          required: "Please complete this required field.",
          invalidEmail: "Enter a valid email address.",
          invalidDateRange: "Check-out must be after check-in.",
          invalidGuests: "Enter at least one guest.",
          consentRequired: "Consent is required to send the request.",
        },
      },
      responseTimeNote: "This request is not a confirmed booking.",
      fallback: {
        title: "Prefer to contact us directly?",
        text: "Email or call us directly.",
        emailLabel: "Email La Fenice",
        phoneLabel: "Call La Fenice",
      },
    },
    privacy: {
      route: "privacy",
      status: "review-required",
      metadata: {
        title: "Privacy notice | La Fenice Positano",
        description:
          "Privacy information for the La Fenice Positano website. Final notice pending owner and legal review.",
        robots: "noindex",
      },
      title: "Privacy notice",
      reviewNotice: {
        title: "Content required before launch",
        text: "The previous website contains no privacy notice text. The owner and a qualified privacy adviser must provide or approve the complete notice before the availability form and production website are published. This placeholder is not a privacy notice.",
      },
    },
    terms: {
      route: "terms",
      status: "review-required",
      metadata: {
        title: "Terms & conditions | La Fenice Positano",
        description:
          "Terms and conditions for La Fenice Positano. Final content pending owner and legal review.",
        robots: "noindex",
      },
      title: "Terms & conditions",
      reviewNotice: {
        title: "Content required before launch",
        text: "The previous website contains no terms and conditions. The owner and a qualified adviser must supply and approve the applicable stay, cancellation and website terms before publication. This placeholder does not create contractual terms.",
      },
    },
  },
} as const satisfies SiteContent;
