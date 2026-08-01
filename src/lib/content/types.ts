export type Locale = "en" | "it" | "de" | "ru";

export type RouteKey =
  | "home"
  | "rooms"
  | "pool"
  | "privateBeach"
  | "gardenTable"
  | "location"
  | "gettingHere"
  | "availability"
  | "privacy"
  | "terms";

export interface ImageAsset {
  id: string;
  src: string;
  width: number;
  height: number;
  focus?: {
    desktop: ImageFocusPoint;
    mobile?: ImageFocusPoint;
  };
}

export interface ImageFocusPoint {
  x: number;
  y: number;
}

export interface GalleryImage extends ImageAsset {
  alt: string;
  caption?: string;
}

export interface PageMetadata {
  title: string;
  description: string;
  openGraphImage?: GalleryImage;
  robots?: "index" | "noindex";
}

export interface PageIntro {
  eyebrow?: string;
  title: string;
  lead: string;
}

export interface RouteCallToAction {
  label: string;
  route: RouteKey;
}

export interface ContentSection {
  id: string;
  eyebrow?: string;
  title: string;
  paragraphs: readonly string[];
  image?: GalleryImage;
  cta?: RouteCallToAction;
}

export interface FeaturePageContent {
  route: Exclude<
    RouteKey,
    "home" | "gettingHere" | "availability" | "privacy" | "terms"
  >;
  metadata: PageMetadata;
  intro: PageIntro;
  heroImage: GalleryImage;
  sections: readonly ContentSection[];
  gallery: readonly GalleryImage[];
  note?: string;
}

export interface HomeStory {
  id: string;
  eyebrow: string;
  title: string;
  text: string;
  image: GalleryImage;
  cta: RouteCallToAction;
}

export type ExperienceId = "fishing" | "boatTrip" | "lemonGrove";

export interface HomeExperience {
  id: ExperienceId;
  title: string;
  text: string;
  image: GalleryImage;
  emailSubject: string;
  emailBody: string;
}

export interface HomePageContent {
  route: "home";
  metadata: PageMetadata;
  hero: {
    eyebrow: string;
    title: string;
    lead: string;
    image: GalleryImage;
    primaryCta: RouteCallToAction;
  };
  introduction: ContentSection;
  storyHeading: {
    eyebrow: string;
    title: string;
  };
  locationTeaser: {
    eyebrow: string;
    title: string;
    text: string;
    linkLabel: string;
    scrollLabel: string;
  };
  stories: readonly HomeStory[];
  experiences: {
    eyebrow: string;
    title: string;
    lead: string;
    requestLabel: string;
    items: readonly HomeExperience[];
  };
  stepsNotice: {
    title: string;
    text: string;
  };
}

export type TravelModeId = "car" | "train" | "plane" | "sea";

export interface TravelRoute {
  id: string;
  title: string;
  steps: readonly string[];
}

export interface TravelMode {
  id: TravelModeId;
  title: string;
  routes: readonly TravelRoute[];
}

export interface ExternalResource {
  id: string;
  label: string;
  description: string;
  href: string;
}

export interface GettingHerePageContent {
  route: "gettingHere";
  metadata: PageMetadata;
  intro: PageIntro;
  heroImage: GalleryImage;
  travelNotice: string;
  modes: readonly TravelMode[];
  officialResourcesTitle: string;
  officialResources: readonly ExternalResource[];
  transferTitle: string;
  transferNote: string;
}

export type AvailabilityField =
  | "name"
  | "email"
  | "phone"
  | "guests"
  | "checkIn"
  | "checkOut"
  | "message";

export interface FormFieldCopy {
  label: string;
  placeholder?: string;
  hint?: string;
}

export interface AvailabilityFormCopy {
  title: string;
  requiredHint: string;
  honeypotLabel: string;
  fields: Record<AvailabilityField, FormFieldCopy>;
  consent: {
    prefix: string;
    linkLabel: string;
    suffix: string;
  };
  submitLabel: string;
  submittingLabel: string;
  successTitle: string;
  successMessage: string;
  errorTitle: string;
  errorMessage: string;
  emailFallback: {
    subject: string;
    body: string;
  };
  validation: {
    required: string;
    invalidEmail: string;
    invalidDateRange: string;
    invalidGuests: string;
    consentRequired: string;
  };
}

export interface AvailabilityPageContent {
  route: "availability";
  metadata: PageMetadata;
  intro: PageIntro;
  heroImage: GalleryImage;
  form: AvailabilityFormCopy;
  responseTimeNote: string;
  fallback: {
    title: string;
    text: string;
    emailLabel: string;
    phoneLabel: string;
  };
}

export interface LegalPageContent {
  route: "privacy" | "terms";
  status: "review-required";
  metadata: PageMetadata;
  title: string;
  reviewNotice: {
    title: string;
    text: string;
  };
}

export interface NavigationLabels {
  primary: Record<
    | "home"
    | "rooms"
    | "pool"
    | "privateBeach"
    | "gardenTable"
    | "location"
    | "gettingHere",
    string
  >;
  utility: Record<"privacy" | "terms", string>;
  availability: string;
}

export interface CommonCopy {
  skipIntro: string;
  skipToContent: string;
  openMenu: string;
  closeMenu: string;
  changeLanguage: string;
  languageName: string;
  primaryNavigation: string;
  viewGallery: string;
  previousImage: string;
  nextImage: string;
  closeGallery: string;
  openMap: string;
  mapLoadingNotice: string;
  getDirections: string;
  officialWebsite: string;
  email: string;
  phone: string;
  address: string;
  vatNumber: string;
  followUs: string;
  goodToKnow: string;
}

export interface AvailabilityCallToActionCopy {
  eyebrow: string;
  title: string;
  text: string;
  label: string;
}

export interface NotFoundCopy {
  title: string;
  text: string;
  button: string;
}

export interface FooterCopy {
  description: string;
  contactTitle: string;
  exploreTitle: string;
  legalTitle: string;
  photographyCredit: string;
}

export interface SiteContent {
  locale: Locale;
  common: CommonCopy;
  navigation: NavigationLabels;
  footer: FooterCopy;
  availabilityCta: AvailabilityCallToActionCopy;
  notFound: NotFoundCopy;
  pages: {
    home: HomePageContent;
    rooms: FeaturePageContent;
    pool: FeaturePageContent;
    privateBeach: FeaturePageContent;
    gardenTable: FeaturePageContent;
    location: FeaturePageContent;
    gettingHere: GettingHerePageContent;
    availability: AvailabilityPageContent;
    privacy: LegalPageContent;
    terms: LegalPageContent;
  };
}

export interface SiteIdentity {
  name: string;
  legalName: string;
  lodgingType: "BedAndBreakfast";
  siteUrl: string;
  email: string;
  phone: {
    display: string;
    href: string;
  };
  vatNumber: string;
  address: {
    street: string;
    postalCode: string;
    locality: string;
    province: string;
    region: string;
    countryCode: "IT";
    formatted: string;
  };
  coordinates: {
    latitude: number;
    longitude: number;
  };
  social: readonly {
    platform: "facebook" | "instagram";
    label: string;
    href: string;
  }[];
  maps: {
    place: string;
    directions: string;
    embed: string;
  };
  photographyCredit: string;
}
