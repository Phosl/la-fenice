import type { Locale } from "@/lib/content/types";
import type { DemoProductCategory } from "@/lib/demo-portal";

export const guestDemoLocales = ["en", "it", "de", "ru"] as const satisfies readonly Locale[];

export type GuestRequestStatus =
  | "pending"
  | "confirmed"
  | "rejected"
  | "fulfilled"
  | "cancelled";

export type GuestServiceLocation = "room" | "pool" | "beach";
export type GuestShopCategory = "all" | DemoProductCategory;

export type GuestCopy = {
  languageName: string;
  demoLabel: string;
  localDataNotice: string;
  loading: string;
  backToLogin: string;
  login: {
    eyebrow: string;
    title: string;
    lead: string;
    languageLabel: string;
    codeLabel: string;
    codePlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    submit: string;
    submitting: string;
    error: string;
    credentialsTitle: string;
    credentialsHint: string;
    codeValue: string;
    passwordValue: string;
    copy: string;
    copied: string;
    securityNote: string;
  };
  stay: {
    eyebrow: string;
    welcome: string;
    lead: string;
    room: string;
    guests: string;
    checkIn: string;
    checkOut: string;
    night: string;
    nights: string;
  };
  calendar: {
    title: string;
    lead: string;
    previous: string;
    next: string;
    today: string;
    checkIn: string;
    checkOut: string;
    past: string;
    selected: string;
    unavailablePast: string;
    unavailableCheckout: string;
  };
  day: {
    title: string;
    orderTab: string;
    activityTab: string;
    readOnlyTitle: string;
    readOnlyPast: string;
    readOnlyCheckout: string;
  };
  order: {
    shopEyebrow: string;
    title: string;
    lead: string;
    categoryLabel: string;
    categories: Record<GuestShopCategory, string>;
    emptyCatalog: string;
    emptyCategory: string;
    quantityDecrease: string;
    quantityIncrease: string;
    quantityFor: string;
    priceOnRequest: string;
    each: string;
    locationLabel: string;
    timeLabel: string;
    notesLabel: string;
    notesPlaceholder: string;
    summaryTitle: string;
    summaryEmpty: string;
    total: string;
    totalPartlyOnRequest: string;
    submit: string;
    submitting: string;
    success: string;
    error: string;
  };
  activity: {
    title: string;
    lead: string;
    emptyCatalog: string;
    selected: string;
    participantsLabel: string;
    timeLabel: string;
    notesLabel: string;
    notesPlaceholder: string;
    submit: string;
    submitting: string;
    success: string;
    error: string;
  };
  locations: Record<GuestServiceLocation, string>;
  requests: {
    title: string;
    lead: string;
    empty: string;
    order: string;
    activity: string;
    on: string;
    at: string;
    participants: string;
    staffNote: string;
    cancel: string;
    cancelling: string;
    cancelError: string;
    quantity: string;
  };
  statuses: Record<GuestRequestStatus, string>;
};

export const guestDemoCopy: Record<Locale, GuestCopy> = {
  en: {
    languageName: "English",
    demoLabel: "Guest area demo",
    localDataNotice: "Demo data — visible only in this browser",
    loading: "Opening your stay…",
    backToLogin: "Return to login",
    login: {
      eyebrow: "A stay made for you",
      title: "Welcome to La Fenice",
      lead: "Use the demo user and password to open the sample stay.",
      languageLabel: "Language",
      codeLabel: "User",
      codePlaceholder: "cliente",
      passwordLabel: "Password",
      passwordPlaceholder: "Enter your password",
      submit: "Enter your stay",
      submitting: "Checking…",
      error: "The code or password is not valid. Please try again.",
      credentialsTitle: "Try the guest demo",
      credentialsHint: "Use these sample credentials. They do not grant access to real guest data.",
      codeValue: "User",
      passwordValue: "Password",
      copy: "Copy",
      copied: "Copied",
      securityNote: "This is a browser-only prototype, not a secure authentication system.",
    },
    stay: {
      eyebrow: "Your stay",
      welcome: "Welcome",
      lead: "Choose a day to order something by the pool, in your room or on the beach — or ask us to arrange an experience.",
      room: "Room",
      guests: "Guests",
      checkIn: "Check-in",
      checkOut: "Check-out",
      night: "night",
      nights: "nights",
    },
    calendar: {
      title: "Your days at La Fenice",
      lead: "Select today or a future day during your stay.",
      previous: "Show previous stay day",
      next: "Show next stay day",
      today: "Today",
      checkIn: "Check-in",
      checkOut: "Check-out",
      past: "Past",
      selected: "Selected",
      unavailablePast: "Past days can be viewed but no longer accept requests.",
      unavailableCheckout: "Check-out day is visible but does not accept requests.",
    },
    day: {
      title: "Plan this day",
      orderTab: "Shop",
      activityTab: "Activities",
      readOnlyTitle: "This day is read-only",
      readOnlyPast: "Requests for past days are closed. You can still review the requests already sent below.",
      readOnlyCheckout: "Requests are not available on check-out day. Please contact the team if you need assistance.",
    },
    order: {
      shopEyebrow: "La Fenice Shop",
      title: "Your stay shop",
      lead: "Browse by category, choose quantities and send your selection for the day shown above.",
      categoryLabel: "Filter shop products by category",
      categories: {
        all: "All",
        food: "Food",
        "classic-drink": "Classic drinks",
        wine: "Wines",
        champagne: "Champagne",
        "raw-fish": "Raw fish",
      },
      emptyCatalog: "There are no items available right now.",
      emptyCategory: "There are no products in this category right now.",
      quantityDecrease: "Decrease quantity",
      quantityIncrease: "Increase quantity",
      quantityFor: "Quantity for",
      priceOnRequest: "On request",
      each: "each",
      locationLabel: "Where would you like it?",
      timeLabel: "Preferred time",
      notesLabel: "Notes for the team",
      notesPlaceholder: "Allergies, preferences or anything we should know",
      summaryTitle: "Your selection",
      summaryEmpty: "Choose at least one item to send a request.",
      total: "Estimated total",
      totalPartlyOnRequest: "plus items priced on request",
      submit: "Send order request",
      submitting: "Sending…",
      success: "Your order request has been sent. The team will confirm it shortly.",
      error: "We could not save this request. Please try again.",
    },
    activity: {
      title: "Choose an experience",
      lead: "Send a request and our team will confirm availability and details.",
      emptyCatalog: "There are no activities available right now.",
      selected: "Selected activity",
      participantsLabel: "Participants",
      timeLabel: "Preferred time",
      notesLabel: "Notes for the team",
      notesPlaceholder: "Tell us what would make this experience special",
      submit: "Request this activity",
      submitting: "Sending…",
      success: "Your activity request has been sent. The team will confirm it shortly.",
      error: "We could not save this request. Please try again.",
    },
    locations: { room: "Room", pool: "Pool", beach: "Private beach" },
    requests: {
      title: "Your requests",
      lead: "Follow confirmations and messages from the La Fenice team.",
      empty: "No requests for this day yet.",
      order: "Order",
      activity: "Activity",
      on: "for",
      at: "at",
      participants: "participants",
      staffNote: "Message from the team",
      cancel: "Cancel request",
      cancelling: "Cancelling…",
      cancelError: "The request could not be cancelled. Please try again.",
      quantity: "Qty",
    },
    statuses: {
      pending: "Pending",
      confirmed: "Confirmed",
      rejected: "Declined",
      fulfilled: "Completed",
      cancelled: "Cancelled",
    },
  },
  it: {
    languageName: "Italiano",
    demoLabel: "Demo area ospiti",
    localDataNotice: "Dati dimostrativi — visibili solo in questo browser",
    loading: "Stiamo aprendo il tuo soggiorno…",
    backToLogin: "Torna al login",
    login: {
      eyebrow: "Un soggiorno pensato per te",
      title: "Benvenuto a La Fenice",
      lead: "Usa utente e password della demo per aprire il soggiorno di esempio.",
      languageLabel: "Lingua",
      codeLabel: "Utente",
      codePlaceholder: "cliente",
      passwordLabel: "Password",
      passwordPlaceholder: "Inserisci la password",
      submit: "Entra nel soggiorno",
      submitting: "Verifica…",
      error: "Il codice o la password non sono validi. Riprova.",
      credentialsTitle: "Prova la demo ospite",
      credentialsHint: "Usa queste credenziali di esempio. Non permettono di accedere a dati reali.",
      codeValue: "Utente",
      passwordValue: "Password",
      copy: "Copia",
      copied: "Copiato",
      securityNote: "Questo è un prototipo salvato nel browser, non un sistema di autenticazione sicuro.",
    },
    stay: {
      eyebrow: "Il tuo soggiorno",
      welcome: "Benvenuto",
      lead: "Scegli un giorno per ordinare qualcosa in piscina, in camera o in spiaggia, oppure chiedici di organizzare un’esperienza.",
      room: "Camera",
      guests: "Ospiti",
      checkIn: "Check-in",
      checkOut: "Check-out",
      night: "notte",
      nights: "notti",
    },
    calendar: {
      title: "I tuoi giorni a La Fenice",
      lead: "Seleziona oggi o un giorno futuro durante il soggiorno.",
      previous: "Mostra il giorno precedente del soggiorno",
      next: "Mostra il giorno successivo del soggiorno",
      today: "Oggi",
      checkIn: "Check-in",
      checkOut: "Check-out",
      past: "Passato",
      selected: "Selezionato",
      unavailablePast: "I giorni passati sono consultabili, ma non accettano più richieste.",
      unavailableCheckout: "Il giorno del check-out è visibile, ma non accetta richieste.",
    },
    day: {
      title: "Organizza questa giornata",
      orderTab: "Shop",
      activityTab: "Attività",
      readOnlyTitle: "Questa giornata è in sola lettura",
      readOnlyPast: "Le richieste per i giorni passati sono chiuse. Puoi comunque consultare sotto quelle già inviate.",
      readOnlyCheckout: "Il giorno del check-out non accetta richieste. Se ti serve aiuto, contatta lo staff.",
    },
    order: {
      shopEyebrow: "La Fenice Shop",
      title: "Lo shop del soggiorno",
      lead: "Esplora le categorie, scegli le quantità e invia la selezione per il giorno indicato sopra.",
      categoryLabel: "Filtra i prodotti dello shop per categoria",
      categories: {
        all: "Tutto",
        food: "Cucina",
        "classic-drink": "Bevande",
        wine: "Vini",
        champagne: "Champagne",
        "raw-fish": "Crudo di pesce",
      },
      emptyCatalog: "Al momento non ci sono prodotti disponibili.",
      emptyCategory: "Al momento non ci sono prodotti in questa categoria.",
      quantityDecrease: "Diminuisci quantità",
      quantityIncrease: "Aumenta quantità",
      quantityFor: "Quantità per",
      priceOnRequest: "Su richiesta",
      each: "cad.",
      locationLabel: "Dove vuoi riceverlo?",
      timeLabel: "Orario preferito",
      notesLabel: "Note per lo staff",
      notesPlaceholder: "Allergie, preferenze o altre informazioni utili",
      summaryTitle: "La tua selezione",
      summaryEmpty: "Scegli almeno un prodotto per inviare la richiesta.",
      total: "Totale indicativo",
      totalPartlyOnRequest: "più prodotti con prezzo su richiesta",
      submit: "Invia richiesta d’ordine",
      submitting: "Invio…",
      success: "La richiesta è stata inviata. Lo staff la confermerà a breve.",
      error: "Non è stato possibile salvare la richiesta. Riprova.",
    },
    activity: {
      title: "Scegli un’esperienza",
      lead: "Invia una richiesta: il nostro staff confermerà disponibilità e dettagli.",
      emptyCatalog: "Al momento non ci sono attività disponibili.",
      selected: "Attività selezionata",
      participantsLabel: "Partecipanti",
      timeLabel: "Orario preferito",
      notesLabel: "Note per lo staff",
      notesPlaceholder: "Raccontaci cosa renderebbe speciale questa esperienza",
      submit: "Richiedi questa attività",
      submitting: "Invio…",
      success: "La richiesta attività è stata inviata. Lo staff la confermerà a breve.",
      error: "Non è stato possibile salvare la richiesta. Riprova.",
    },
    locations: { room: "Camera", pool: "Piscina", beach: "Spiaggia privata" },
    requests: {
      title: "Le tue richieste",
      lead: "Segui conferme e messaggi dello staff La Fenice.",
      empty: "Non ci sono ancora richieste per questo giorno.",
      order: "Ordine",
      activity: "Attività",
      on: "per",
      at: "alle",
      participants: "partecipanti",
      staffNote: "Messaggio dello staff",
      cancel: "Annulla richiesta",
      cancelling: "Annullamento…",
      cancelError: "Non è stato possibile annullare la richiesta. Riprova.",
      quantity: "Qtà",
    },
    statuses: {
      pending: "In attesa",
      confirmed: "Confermato",
      rejected: "Rifiutato",
      fulfilled: "Completato",
      cancelled: "Annullato",
    },
  },
  de: {
    languageName: "Deutsch",
    demoLabel: "Demo-Gästebereich",
    localDataNotice: "Demodaten — nur in diesem Browser sichtbar",
    loading: "Ihr Aufenthalt wird geöffnet…",
    backToLogin: "Zurück zur Anmeldung",
    login: {
      eyebrow: "Ein Aufenthalt nur für Sie",
      title: "Willkommen in der La Fenice",
      lead: "Verwenden Sie Demo-Benutzer und Passwort, um den Beispielaufenthalt zu öffnen.",
      languageLabel: "Sprache",
      codeLabel: "Benutzer",
      codePlaceholder: "cliente",
      passwordLabel: "Passwort",
      passwordPlaceholder: "Passwort eingeben",
      submit: "Aufenthalt öffnen",
      submitting: "Wird geprüft…",
      error: "Der Code oder das Passwort ist ungültig. Bitte versuchen Sie es erneut.",
      credentialsTitle: "Gästedemo ausprobieren",
      credentialsHint: "Verwenden Sie diese Beispieldaten. Sie gewähren keinen Zugriff auf echte Gästedaten.",
      codeValue: "Benutzer",
      passwordValue: "Passwort",
      copy: "Kopieren",
      copied: "Kopiert",
      securityNote: "Dies ist ein im Browser gespeicherter Prototyp und kein sicheres Authentifizierungssystem.",
    },
    stay: {
      eyebrow: "Ihr Aufenthalt",
      welcome: "Willkommen",
      lead: "Wählen Sie einen Tag, um etwas am Pool, im Zimmer oder am Strand zu bestellen — oder lassen Sie uns ein Erlebnis organisieren.",
      room: "Zimmer",
      guests: "Gäste",
      checkIn: "Check-in",
      checkOut: "Check-out",
      night: "Nacht",
      nights: "Nächte",
    },
    calendar: {
      title: "Ihre Tage in der La Fenice",
      lead: "Wählen Sie heute oder einen zukünftigen Tag Ihres Aufenthalts.",
      previous: "Vorherigen Aufenthaltstag anzeigen",
      next: "Nächsten Aufenthaltstag anzeigen",
      today: "Heute",
      checkIn: "Check-in",
      checkOut: "Check-out",
      past: "Vergangen",
      selected: "Ausgewählt",
      unavailablePast: "Vergangene Tage können angesehen werden, nehmen aber keine Anfragen mehr an.",
      unavailableCheckout: "Der Check-out-Tag ist sichtbar, nimmt aber keine Anfragen an.",
    },
    day: {
      title: "Diesen Tag planen",
      orderTab: "Shop",
      activityTab: "Aktivitäten",
      readOnlyTitle: "Dieser Tag ist schreibgeschützt",
      readOnlyPast: "Anfragen für vergangene Tage sind geschlossen. Bereits gesendete Anfragen können Sie unten weiterhin ansehen.",
      readOnlyCheckout: "Am Check-out-Tag sind keine Anfragen möglich. Wenden Sie sich bitte an das Team, wenn Sie Hilfe benötigen.",
    },
    order: {
      shopEyebrow: "La Fenice Shop",
      title: "Ihr Shop für den Aufenthalt",
      lead: "Durchsuchen Sie die Kategorien, wählen Sie Mengen und senden Sie Ihre Auswahl für den oben angezeigten Tag.",
      categoryLabel: "Shop-Produkte nach Kategorie filtern",
      categories: {
        all: "Alle",
        food: "Speisen",
        "classic-drink": "Getränke",
        wine: "Weine",
        champagne: "Champagner",
        "raw-fish": "Roher Fisch",
      },
      emptyCatalog: "Derzeit sind keine Artikel verfügbar.",
      emptyCategory: "Derzeit sind in dieser Kategorie keine Produkte verfügbar.",
      quantityDecrease: "Menge verringern",
      quantityIncrease: "Menge erhöhen",
      quantityFor: "Menge für",
      priceOnRequest: "Auf Anfrage",
      each: "je",
      locationLabel: "Wohin dürfen wir es bringen?",
      timeLabel: "Gewünschte Uhrzeit",
      notesLabel: "Hinweise für das Team",
      notesPlaceholder: "Allergien, Vorlieben oder andere wichtige Informationen",
      summaryTitle: "Ihre Auswahl",
      summaryEmpty: "Wählen Sie mindestens einen Artikel aus, um eine Anfrage zu senden.",
      total: "Voraussichtlicher Gesamtpreis",
      totalPartlyOnRequest: "zuzüglich Artikel mit Preis auf Anfrage",
      submit: "Bestellanfrage senden",
      submitting: "Wird gesendet…",
      success: "Ihre Bestellanfrage wurde gesendet. Das Team bestätigt sie in Kürze.",
      error: "Die Anfrage konnte nicht gespeichert werden. Bitte versuchen Sie es erneut.",
    },
    activity: {
      title: "Erlebnis auswählen",
      lead: "Senden Sie eine Anfrage; unser Team bestätigt Verfügbarkeit und Details.",
      emptyCatalog: "Derzeit sind keine Aktivitäten verfügbar.",
      selected: "Ausgewählte Aktivität",
      participantsLabel: "Teilnehmende",
      timeLabel: "Gewünschte Uhrzeit",
      notesLabel: "Hinweise für das Team",
      notesPlaceholder: "Sagen Sie uns, was dieses Erlebnis besonders machen würde",
      submit: "Aktivität anfragen",
      submitting: "Wird gesendet…",
      success: "Ihre Aktivitätsanfrage wurde gesendet. Das Team bestätigt sie in Kürze.",
      error: "Die Anfrage konnte nicht gespeichert werden. Bitte versuchen Sie es erneut.",
    },
    locations: { room: "Zimmer", pool: "Pool", beach: "Privatstrand" },
    requests: {
      title: "Ihre Anfragen",
      lead: "Hier sehen Sie Bestätigungen und Nachrichten des La-Fenice-Teams.",
      empty: "Für diesen Tag gibt es noch keine Anfragen.",
      order: "Bestellung",
      activity: "Aktivität",
      on: "für",
      at: "um",
      participants: "Teilnehmende",
      staffNote: "Nachricht des Teams",
      cancel: "Anfrage stornieren",
      cancelling: "Wird storniert…",
      cancelError: "Die Anfrage konnte nicht storniert werden. Bitte versuchen Sie es erneut.",
      quantity: "Anz.",
    },
    statuses: {
      pending: "Ausstehend",
      confirmed: "Bestätigt",
      rejected: "Abgelehnt",
      fulfilled: "Abgeschlossen",
      cancelled: "Storniert",
    },
  },
  ru: {
    languageName: "Русский",
    demoLabel: "Демо личного кабинета",
    localDataNotice: "Демонстрационные данные — видны только в этом браузере",
    loading: "Открываем информацию о проживании…",
    backToLogin: "Вернуться ко входу",
    login: {
      eyebrow: "Отдых, созданный для вас",
      title: "Добро пожаловать в La Fenice",
      lead: "Используйте демонстрационные логин и пароль, чтобы открыть пример проживания.",
      languageLabel: "Язык",
      codeLabel: "Пользователь",
      codePlaceholder: "cliente",
      passwordLabel: "Пароль",
      passwordPlaceholder: "Введите пароль",
      submit: "Открыть проживание",
      submitting: "Проверяем…",
      error: "Неверный код или пароль. Попробуйте еще раз.",
      credentialsTitle: "Попробуйте демоверсию",
      credentialsHint: "Используйте эти тестовые данные. Они не дают доступа к данным реальных гостей.",
      codeValue: "Пользователь",
      passwordValue: "Пароль",
      copy: "Копировать",
      copied: "Скопировано",
      securityNote: "Это прототип с хранением данных в браузере, а не безопасная система аутентификации.",
    },
    stay: {
      eyebrow: "Ваше проживание",
      welcome: "Добро пожаловать",
      lead: "Выберите день, чтобы заказать что-нибудь к бассейну, в номер или на пляж либо попросить нас организовать впечатление.",
      room: "Номер",
      guests: "Гости",
      checkIn: "Заезд",
      checkOut: "Выезд",
      night: "ночь",
      nights: "ночей",
    },
    calendar: {
      title: "Ваши дни в La Fenice",
      lead: "Выберите сегодняшний или будущий день проживания.",
      previous: "Показать предыдущий день проживания",
      next: "Показать следующий день проживания",
      today: "Сегодня",
      checkIn: "Заезд",
      checkOut: "Выезд",
      past: "Прошел",
      selected: "Выбран",
      unavailablePast: "Прошедшие дни можно посмотреть, но запросы на них уже закрыты.",
      unavailableCheckout: "День выезда виден, но запросы на него недоступны.",
    },
    day: {
      title: "Спланируйте этот день",
      orderTab: "Магазин",
      activityTab: "Активности",
      readOnlyTitle: "Этот день доступен только для просмотра",
      readOnlyPast: "Запросы на прошедшие дни закрыты. Ниже по-прежнему можно посмотреть уже отправленные запросы.",
      readOnlyCheckout: "В день выезда запросы недоступны. Если вам нужна помощь, обратитесь к команде.",
    },
    order: {
      shopEyebrow: "La Fenice Shop",
      title: "Магазин для вашего отдыха",
      lead: "Выберите категорию и количество, затем отправьте заказ на указанный выше день.",
      categoryLabel: "Фильтр товаров магазина по категории",
      categories: {
        all: "Все",
        food: "Еда",
        "classic-drink": "Напитки",
        wine: "Вина",
        champagne: "Шампанское",
        "raw-fish": "Сырая рыба",
      },
      emptyCatalog: "Сейчас нет доступных позиций.",
      emptyCategory: "Сейчас в этой категории нет товаров.",
      quantityDecrease: "Уменьшить количество",
      quantityIncrease: "Увеличить количество",
      quantityFor: "Количество для",
      priceOnRequest: "По запросу",
      each: "за ед.",
      locationLabel: "Куда принести заказ?",
      timeLabel: "Предпочтительное время",
      notesLabel: "Комментарий для команды",
      notesPlaceholder: "Аллергии, предпочтения или другая важная информация",
      summaryTitle: "Ваш выбор",
      summaryEmpty: "Выберите хотя бы одну позицию, чтобы отправить запрос.",
      total: "Ориентировочная сумма",
      totalPartlyOnRequest: "плюс позиции с ценой по запросу",
      submit: "Отправить запрос заказа",
      submitting: "Отправляем…",
      success: "Запрос заказа отправлен. Команда скоро его подтвердит.",
      error: "Не удалось сохранить запрос. Попробуйте еще раз.",
    },
    activity: {
      title: "Выберите впечатление",
      lead: "Отправьте запрос, и наша команда подтвердит доступность и детали.",
      emptyCatalog: "Сейчас нет доступных активностей.",
      selected: "Выбранная активность",
      participantsLabel: "Участники",
      timeLabel: "Предпочтительное время",
      notesLabel: "Комментарий для команды",
      notesPlaceholder: "Расскажите, что сделало бы это впечатление особенным",
      submit: "Запросить активность",
      submitting: "Отправляем…",
      success: "Запрос активности отправлен. Команда скоро его подтвердит.",
      error: "Не удалось сохранить запрос. Попробуйте еще раз.",
    },
    locations: { room: "Номер", pool: "Бассейн", beach: "Частный пляж" },
    requests: {
      title: "Ваши запросы",
      lead: "Следите за подтверждениями и сообщениями команды La Fenice.",
      empty: "На этот день запросов пока нет.",
      order: "Заказ",
      activity: "Активность",
      on: "на",
      at: "в",
      participants: "участников",
      staffNote: "Сообщение команды",
      cancel: "Отменить запрос",
      cancelling: "Отменяем…",
      cancelError: "Не удалось отменить запрос. Попробуйте еще раз.",
      quantity: "Кол-во",
    },
    statuses: {
      pending: "Ожидает",
      confirmed: "Подтвержден",
      rejected: "Отклонен",
      fulfilled: "Завершен",
      cancelled: "Отменен",
    },
  },
};

export function isGuestDemoLocale(value: string | null): value is Locale {
  return guestDemoLocales.some((locale) => locale === value);
}
