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
  withCopy(media.pool[0], "The curved seawater pool and sunny terrace"),
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
  withCopy(media.gardenTable[0], "Seasonal produce grown in La Fenice's garden"),
  withCopy(media.gardenTable[1], "A garden harvest at La Fenice"),
  withCopy(media.gardenTable[2], "Olives and vegetables from the terraced grounds"),
  withCopy(media.gardenTable[3], "Figs ripening in the Positano sun"),
] as const;

const locationImage = withCopy(
  media.location,
  "La Fenice on the green hillside above the Tyrrhenian Sea",
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
    description:
      "A traditional bed and breakfast on the hillside of Positano, from the garden to the sea.",
    contactTitle: "Contact",
    exploreTitle: "Explore",
    legalTitle: "Legal",
    photographyCredit: "Photography by Tim Evancook",
  },
  availabilityCta: {
    eyebrow: "Your stay",
    title: "Begin with a simple request.",
    text: "Share your dates and number of guests. La Fenice will reply directly with availability and details.",
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
          "Discover La Fenice, a hillside bed and breakfast in Positano with sea-view rooms, a seawater pool, a private beach and a seasonal garden.",
        openGraphImage: homeImages.panorama,
      },
      hero: {
        eyebrow: "Positano · Amalfi Coast",
        title: "From the garden to the sea",
        lead:
          "A traditional retreat unfolding across the Positano hillside, among lemon trees, bougainvillea and views of the Tyrrhenian Sea.",
        image: homeImages.panorama,
        primaryCta: {
          label: "Request availability",
          route: "availability",
        },
        secondaryCta: {
          label: "Discover La Fenice",
          route: "rooms",
        },
      },
      introduction: {
        id: "welcome",
        eyebrow: "La Fenice",
        title: "A hillside home in Positano",
        paragraphs: [
          "La Fenice is a bed and breakfast set across about three hectares on the Amalfi Coast. Villas and cottages descend toward the sea through terraced grounds planted with bougainvillea, lemons and vines.",
          "Here, the character of the coast is part of every stay: sea views, garden paths, a pool shaped into the rock and a private beach below the property.",
        ],
        image: homeImages.view,
      },
      proof: {
        ariaLabel: "At a glance",
        items: [
          { value: "3", label: "hectares of terraced land" },
          { value: "01", label: "seawater swimming pool" },
          { value: "01", label: "private access to the sea" },
        ],
      },
      storyHeading: {
        eyebrow: "From the hillside to the sea",
        title: "Four chapters, one landscape.",
      },
      accessibilityNoteLabel: "An important note about access",
      locationTeaser: {
        eyebrow: "Location",
        title: "Between the coastal road and the sea",
        linkLabel: "Explore the location",
        badge: "Via Marconi 4",
        scrollLabel: "Scroll",
      },
      stories: [
        {
          id: "garden",
          eyebrow: "The garden",
          title: "What the season gives",
          text: "Fruit, vegetables, grapes, olives and lemons grow on the terraced land and have long been part of the family's table.",
          image: homeImages.garden,
          cta: { label: "From garden to table", route: "gardenTable" },
        },
        {
          id: "rooms",
          eyebrow: "The rooms",
          title: "Light, sea and Vietri colour",
          text: "Most rooms overlook the sea and open onto a private balcony or terrace, with vaulted ceilings and hand-painted Vietri tiles.",
          image: homeImages.room,
          cta: { label: "Explore the rooms", route: "rooms" },
        },
        {
          id: "pool",
          eyebrow: "The pool",
          title: "Carved into the hillside",
          text: "A curved seawater pool with a waterfall and hydromassage area sits between sunny terraces and shaded flowering plants.",
          image: poolGallery[0],
          cta: { label: "Discover the pool", route: "pool" },
        },
        {
          id: "beach",
          eyebrow: "The sea",
          title: "Down to the private beach",
          text: "Garden steps lead from the property to its own quiet access to the clear water below.",
          image: beachGallery[0],
          cta: { label: "Discover the beach", route: "privateBeach" },
        },
      ],
      experiences: {
        eyebrow: "Experiences",
        title: "Three ways to meet the coast",
        lead:
          "Discover the landscape around La Fenice through the sea, local traditions and the scent of lemons. Each experience is arranged on request and subject to confirmation.",
        requestLabel: "Request by email",
        items: [
          {
            id: "fishing",
            title: "Fishing on the coast",
            text: "Ask about a fishing experience in the waters around Positano, with details confirmed according to season and sea conditions.",
            image: beachGallery[1],
            emailSubject: "Fishing experience request",
            emailBody:
              "Hello La Fenice,\n\nI would like information about the fishing experience.\n\nPreferred date:\nNumber of guests:\nName:\n\nThank you.",
          },
          {
            id: "boatTrip",
            title: "A day by boat",
            text: "Request current options for discovering the coast from the water, with route and embarkation details agreed directly.",
            image: beachGallery[0],
            emailSubject: "Boat trip request",
            emailBody:
              "Hello La Fenice,\n\nI would like information about a boat trip.\n\nPreferred date:\nNumber of guests:\nName:\n\nThank you.",
          },
          {
            id: "lemonGrove",
            title: "Among the lemon trees",
            text: "Discover the terraced garden and the role that lemons and seasonal cultivation play in the life of La Fenice.",
            image: homeImages.garden,
            emailSubject: "Lemon grove experience request",
            emailBody:
              "Hello La Fenice,\n\nI would like information about the lemon grove experience.\n\nPreferred date:\nNumber of guests:\nName:\n\nThank you.",
          },
        ],
      },
      stepsNotice: {
        title: "A place shaped by steps",
        text: "La Fenice follows the natural slope of the Amalfi Coast. Moving between the road, rooms, gardens, pool and beach involves many steps, so the property may not suit every mobility need. Please contact us before requesting a stay if you would like to discuss access.",
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
        title: "Rooms filled with the light of Positano",
        lead:
          "Simple Mediterranean interiors, traditional details and an open relationship with the sea.",
      },
      heroImage: roomsGallery[0],
      sections: [
        {
          id: "character",
          title: "Made for the coast",
          paragraphs: [
            "Most rooms overlook the sea and have a private balcony or terrace.",
            "White walls, vaulted ceilings and large windows are paired with floors laid in hand-painted Vietri tiles.",
          ],
          image: roomsGallery[1],
        },
      ],
      gallery: roomsGallery,
      note:
        "The current information describes the rooms as a collection rather than individual room types. Please request availability for details about the room offered for your dates.",
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
        title: "Water held by the rock",
        lead:
          "A curved pool and flowering terrace set into the natural shape of the hillside.",
      },
      heroImage: poolGallery[0],
      sections: [
        {
          id: "water-and-shade",
          title: "Sun, shade and seawater",
          paragraphs: [
            "The seawater swimming pool has a waterfall and hydromassage area.",
            "Its sunny terrace also offers shaded areas beneath bougainvillea and jacaranda.",
          ],
          image: poolGallery[1],
        },
        {
          id: "season",
          eyebrow: "Seasonal opening",
          title: "Early June to mid-October",
          paragraphs: [
            "The published opening period is from the beginning of June to the middle of October, weather and sea conditions permitting. Please confirm current opening dates when requesting availability.",
          ],
        },
      ],
      gallery: poolGallery,
      note: "Pool opening dates are seasonal and must be confirmed for each stay.",
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
        title: "A path through the garden to the sea",
        lead:
          "Below the villas and terraces, shaded steps descend toward La Fenice's private beach.",
      },
      heroImage: beachGallery[0],
      sections: [
        {
          id: "descent",
          title: "The coast at its most natural",
          paragraphs: [
            "Guests reach the water by following the tree-lined steps down from the property.",
            "The long descent is part of the landscape and should be considered by guests with limited mobility.",
          ],
          image: beachGallery[1],
        },
        {
          id: "boat-outings",
          title: "Out on the water",
          paragraphs: [
            "Ask us about current options for coastal boat outings, including routes toward Capri, the Blue Grotto, Amalfi and Li Galli. Availability and embarkation arrangements must be confirmed directly.",
          ],
          image: beachGallery[0],
        },
      ],
      gallery: beachGallery,
      note:
        "Beach access requires many outdoor steps. Sea access and boat outings depend on weather and sea conditions.",
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
        title: "A garden that follows the seasons",
        lead:
          "The terraced land supplies fruit, vegetables and herbs that have long inspired the family kitchen.",
      },
      heroImage: gardenGallery[0],
      sections: [
        {
          id: "summer-winter",
          title: "From summer colour to winter greens",
          paragraphs: [
            "In summer the garden produces tomatoes, aubergines, peppers, apricots, figs, plums and peaches.",
            "Winter brings potatoes, onions, several kinds of broccoli, fennel, spinach and beet.",
          ],
          image: gardenGallery[1],
        },
        {
          id: "harvest",
          title: "Grapes, olives and lemons",
          paragraphs: [
            "The grape harvest traditionally takes place in September, followed by olives and nuts in October. Lemon trees bear fruit throughout the year.",
            "What is ripe and in season is gathered for the table.",
          ],
          image: gardenGallery[3],
        },
      ],
      gallery: gardenGallery,
    },
    location: {
      route: "location",
      metadata: {
        title: "Location in Positano | La Fenice",
        description:
          "Find La Fenice at Via Marconi 4 in Positano and open directions to the bed and breakfast on the Amalfi Coast.",
        openGraphImage: locationImage,
      },
      intro: {
        eyebrow: "Location",
        title: "On the hillside of Positano",
        lead:
          "La Fenice sits between the coastal road and the sea, with terraced grounds descending through the landscape.",
      },
      heroImage: locationImage,
      sections: [
        {
          id: "address",
          title: "Via Marconi 4",
          paragraphs: [
            "The bed and breakfast is located at Via Marconi 4, 84017 Positano (SA), Italy.",
            "From the Sponda bus stop, the existing directions indicate a walk of about 200 metres toward Amalfi. Use the map for the final approach and contact us if you need access guidance.",
          ],
          cta: { label: "Plan your journey", route: "gettingHere" },
        },
      ],
      gallery: [locationImage],
      note:
        "Road conditions and public transport schedules can change, especially in high season. Check live directions before travelling.",
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
        title: "Your way to Positano",
        lead:
          "The last part of the journey follows the coast. Choose your route and always check live schedules before departure.",
      },
      heroImage: locationImage,
      travelNotice:
        "Travel times, routes and seasonal services change. The guidance below intentionally avoids fixed timetables; use the linked official operators for current information.",
      modes: [
        {
          id: "car",
          title: "By car",
          routes: [
            {
              id: "car-north",
              title: "From the north",
              steps: [
                "Follow the motorway toward Castellammare di Stabia.",
                "Continue on SS145 toward the Sorrento Peninsula, then take SS163 toward Positano.",
                "Italian motorways charge tolls. Check live navigation and current coastal traffic rules before setting out.",
              ],
            },
            {
              id: "car-south",
              title: "From the south",
              steps: [
                "Leave the motorway at Vietri sul Mare.",
                "Follow SS163 along the Amalfi Coast toward Positano.",
                "Allow extra time for the narrow coastal road and seasonal traffic.",
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
                "From Napoli Centrale, use the EAV Circumvesuviana service to Sorrento.",
                "At Sorrento, continue by SITA Sud bus toward Positano and ask for the Sponda stop.",
                "From Sponda, the existing directions indicate about 200 metres on foot toward Amalfi.",
              ],
            },
            {
              id: "train-salerno",
              title: "Via Salerno",
              steps: [
                "From Salerno station, take a SITA Sud bus to Amalfi.",
                "Change in Amalfi for the service toward Positano and get off at Sponda.",
                "Seasonal sea services may also connect Salerno with Positano; check operators before travel.",
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
                "Use an official airport connection to Napoli Centrale and follow the route via Sorrento, or take the Curreri airport shuttle to Sorrento.",
                "From Sorrento, continue by SITA Sud bus to Positano Sponda.",
              ],
            },
            {
              id: "plane-rome",
              title: "From Rome Fiumicino",
              steps: [
                "Take the airport train to Roma Termini.",
                "Continue by mainline train to Naples or Salerno, then follow the relevant route above.",
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
                "Seasonal services connect Positano with ports including Naples, Sorrento, Salerno and Amalfi.",
                "Routes depend on the time of year and sea conditions. Check the operator's live timetable and departure port before travelling.",
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
          description: "Amalfi Coast bus routes and current timetables",
          href: "https://sitasudtrasporti.it/campania/orari/",
        },
        {
          id: "eav",
          label: "EAV",
          description: "Naples–Sorrento rail information and service updates",
          href: "https://www.eavsrl.it/orari-linee-ferroviarie/",
        },
        {
          id: "curreri",
          label: "Curreri Viaggi",
          description: "Naples Airport–Sorrento shuttle information",
          href: "https://www.curreriviaggi.it/it/navetta-aeroporto-di-napoli",
        },
        {
          id: "trenitalia",
          label: "Trenitalia",
          description: "Mainline train planning for Naples, Salerno and Rome",
          href: "https://www.trenitalia.com/en.html",
        },
        {
          id: "naples-airport",
          label: "Naples International Airport",
          description: "Official ground transport information",
          href: "https://www.aeroportodinapoli.it/it/in-bus",
        },
        {
          id: "alilauro",
          label: "Alilauro",
          description: "Official seasonal ferry and hydrofoil information",
          href: "https://www.alilauro.it/en/",
        },
      ],
      transferTitle: "Private transfer",
      transferNote:
        "If you would like help arranging a private transfer, contact La Fenice before travelling so current options and prices can be confirmed.",
    },
    availability: {
      route: "availability",
      metadata: {
        title: "Request availability | La Fenice Positano",
        description:
          "Send La Fenice a request for room availability in Positano. Your request is answered directly and does not create an instant booking.",
        openGraphImage: availabilityImage,
      },
      intro: {
        eyebrow: "Your stay",
        title: "Request availability",
        lead:
          "Tell us your dates and who will be travelling. We will reply directly with the room information available for your stay.",
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
        successMessage:
          "Thank you. We will reply directly by email. Your request is not a confirmed reservation.",
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
      responseTimeNote:
        "This form sends an availability request, not an instant booking. La Fenice will confirm availability and details directly.",
      fallback: {
        title: "Prefer to contact us directly?",
        text: "Email or call La Fenice and include your preferred dates and number of guests.",
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
