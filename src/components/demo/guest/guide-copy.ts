import type {
  DemoGuideCategory,
  DemoLocale,
  DemoRequestStatus,
} from "@/lib/demo-portal";

export type GuideCopy = {
  intro: {
    eyebrow: string;
    title: string;
    lead: string;
  };
  search: {
    label: string;
    placeholder: string;
    clear: string;
  };
  filters: {
    label: string;
    all: string;
    categories: Record<DemoGuideCategory, string>;
  };
  results: {
    single: string;
    many: string;
    emptyTitle: string;
    emptyText: string;
  };
  card: {
    address: string;
    booking: string;
    officialSite: string;
    maps: string;
    phone: string;
    request: string;
  };
  seasonal: {
    title: string;
    text: string;
  };
  beforeYouGo: {
    eyebrow: string;
    title: string;
    lead: string;
    verticalityTitle: string;
    verticalityText: string;
    weatherTitle: string;
    weatherText: string;
    transportTitle: string;
    transportText: string;
    assistanceTitle: string;
    assistanceText: string;
    comuneLink: string;
  };
  modal: {
    eyebrow: string;
    title: string;
    lead: string;
    close: string;
    date: string;
    dateHint: string;
    time: string;
    participants: string;
    notes: string;
    notesPlaceholder: string;
    nonBinding: string;
    cancel: string;
    done: string;
    submit: string;
    submitting: string;
    success: string;
    error: string;
    unavailable: string;
  };
  requests: {
    eyebrow: string;
    title: string;
    lead: string;
    empty: string;
    date: string;
    at: string;
    participants: string;
    notes: string;
    staffNote: string;
    cancel: string;
    cancelling: string;
    cancelError: string;
  };
  statuses: Record<DemoRequestStatus, string>;
  loading: string;
};

export const guideCopy = {
  en: {
    intro: {
      eyebrow: "From La Fenice",
      title: "Our Positano",
      lead:
        "A small selection of places we know and practical details for enjoying the coast at your own pace.",
    },
    search: {
      label: "Search the guide",
      placeholder: "A place, an address or an idea",
      clear: "Clear search",
    },
    filters: {
      label: "Filter places by category",
      all: "All",
      categories: {
        dining: "At the table",
        "after-dark": "After dark",
        sea: "By the sea",
        see: "To see",
        "getting-around": "Getting around",
        essentials: "Useful places",
      },
    },
    results: {
      single: "place",
      many: "places",
      emptyTitle: "Nothing here yet",
      emptyText: "Try another word or choose a different category.",
    },
    card: {
      address: "Address",
      booking: "A note from us",
      officialSite: "Website",
      maps: "Open in Maps",
      phone: "Call",
      request: "Ask La Fenice",
    },
    seasonal: {
      title: "A seasonal coast",
      text:
        "Opening days, timetables and sea services may change during the season. Please check directly before setting out; we are happy to help.",
    },
    beforeYouGo: {
      eyebrow: "A gentle reminder",
      title: "Before you go",
      lead: "A few simple things make a day in Positano easier.",
      verticalityTitle: "A vertical town",
      verticalityText:
        "Positano is made of slopes and steps. Comfortable shoes and an unhurried pace are always a good idea.",
      weatherTitle: "Weather and sea",
      weatherText:
        "Conditions can change quickly and may affect boats, beaches and outdoor activities. Confirm on the day.",
      transportTitle: "Moving around",
      transportText:
        "Roads and public transport are busiest in high season. Check current times and leave a little room in your plans.",
      assistanceTitle: "Health and assistance",
      assistanceText:
        "Keep the municipality’s current health-service contacts to hand. Call 112 for emergencies or 118 for urgent medical assistance.",
      comuneLink: "Health services — Municipality of Positano",
    },
    modal: {
      eyebrow: "A little help from us",
      title: "Request information",
      lead: "Tell us what you have in mind and we will check the details for you.",
      close: "Close dialog",
      date: "Preferred date",
      dateHint: "Choose a date during your stay.",
      time: "Preferred time",
      participants: "Guests",
      notes: "Notes",
      notesPlaceholder: "Anything we should know?",
      nonBinding:
        "This is a request, not a confirmed reservation. Our team will reply with availability and details.",
      cancel: "Not now",
      done: "Done",
      submit: "Send request",
      submitting: "Sending…",
      success: "Your request has been sent. We will get back to you shortly.",
      error: "We could not save the request. Please try again.",
      unavailable: "There are no requestable dates left in this stay.",
    },
    requests: {
      eyebrow: "Your plans",
      title: "Requests from the guide",
      lead: "Here you can follow the requests sent to our team.",
      empty: "You have not sent any requests from the guide yet.",
      date: "Date",
      at: "at",
      participants: "guests",
      notes: "Your note",
      staffNote: "From La Fenice",
      cancel: "Cancel request",
      cancelling: "Cancelling…",
      cancelError: "The request could not be cancelled. Please try again.",
    },
    statuses: {
      pending: "Pending",
      confirmed: "Confirmed",
      rejected: "Unavailable",
      fulfilled: "Completed",
      cancelled: "Cancelled",
    },
    loading: "Opening your Positano guide…",
  },
  it: {
    intro: {
      eyebrow: "Da La Fenice",
      title: "La nostra Positano",
      lead:
        "Una piccola scelta di luoghi che conosciamo, con indicazioni utili per vivere la costa con i propri tempi.",
    },
    search: {
      label: "Cerca nella guida",
      placeholder: "Un luogo, un indirizzo o un'idea",
      clear: "Cancella la ricerca",
    },
    filters: {
      label: "Filtra i luoghi per categoria",
      all: "Tutti",
      categories: {
        dining: "A tavola",
        "after-dark": "Dopo il tramonto",
        sea: "Sul mare",
        see: "Da vedere",
        "getting-around": "Come muoversi",
        essentials: "Indirizzi utili",
      },
    },
    results: {
      single: "luogo",
      many: "luoghi",
      emptyTitle: "Nessun luogo trovato",
      emptyText: "Prova un'altra parola o scegli una categoria diversa.",
    },
    card: {
      address: "Indirizzo",
      booking: "Una nota da noi",
      officialSite: "Sito",
      maps: "Apri in Maps",
      phone: "Chiama",
      request: "Chiedi a La Fenice",
    },
    seasonal: {
      title: "Una costa stagionale",
      text:
        "Giorni di apertura, orari e servizi sul mare possono cambiare durante la stagione. Consigliamo di verificare prima di partire; noi siamo qui per aiutarvi.",
    },
    beforeYouGo: {
      eyebrow: "Un piccolo promemoria",
      title: "Prima di uscire",
      lead: "Poche cose semplici rendono più lieve una giornata a Positano.",
      verticalityTitle: "Un paese verticale",
      verticalityText:
        "Positano è fatta di salite e gradini. Scarpe comode e un passo senza fretta sono sempre una buona idea.",
      weatherTitle: "Meteo e mare",
      weatherText:
        "Le condizioni possono cambiare rapidamente e influire su barche, spiagge e attività all'aperto. Meglio confermare in giornata.",
      transportTitle: "Come muoversi",
      transportText:
        "In alta stagione strade e mezzi pubblici sono molto frequentati. Controllate gli orari aggiornati e lasciate un po' di margine.",
      assistanceTitle: "Salute e assistenza",
      assistanceText:
        "Tenete a portata di mano i contatti sanitari aggiornati del Comune. Chiamate il 112 per le emergenze o il 118 per l’assistenza sanitaria urgente.",
      comuneLink: "Servizi sanitari — Comune di Positano",
    },
    modal: {
      eyebrow: "Ci pensiamo insieme",
      title: "Richiedi informazioni",
      lead: "Raccontaci cosa hai in mente e verificheremo i dettagli per te.",
      close: "Chiudi finestra",
      date: "Data preferita",
      dateHint: "Scegli una data durante il soggiorno.",
      time: "Orario preferito",
      participants: "Partecipanti",
      notes: "Note",
      notesPlaceholder: "C'è qualcosa che dovremmo sapere?",
      nonBinding:
        "È una richiesta, non una prenotazione confermata. Il nostro staff risponderà con disponibilità e dettagli.",
      cancel: "Non ora",
      done: "Fatto",
      submit: "Invia richiesta",
      submitting: "Invio…",
      success: "La richiesta è stata inviata. Ti risponderemo al più presto.",
      error: "Non siamo riusciti a salvare la richiesta. Riprova.",
      unavailable: "Non ci sono più date disponibili per richieste in questo soggiorno.",
    },
    requests: {
      eyebrow: "I vostri programmi",
      title: "Richieste dalla guida",
      lead: "Qui puoi seguire le richieste inviate al nostro staff.",
      empty: "Non hai ancora inviato richieste dalla guida.",
      date: "Data",
      at: "alle",
      participants: "partecipanti",
      notes: "La tua nota",
      staffNote: "Da La Fenice",
      cancel: "Annulla richiesta",
      cancelling: "Annullamento…",
      cancelError: "Non è stato possibile annullare la richiesta. Riprova.",
    },
    statuses: {
      pending: "In attesa",
      confirmed: "Confermata",
      rejected: "Non disponibile",
      fulfilled: "Completata",
      cancelled: "Annullata",
    },
    loading: "Stiamo aprendo la guida a Positano…",
  },
  de: {
    intro: {
      eyebrow: "Von La Fenice",
      title: "Unser Positano",
      lead:
        "Eine kleine Auswahl vertrauter Orte und nützliche Hinweise, um die Küste im eigenen Rhythmus zu erleben.",
    },
    search: {
      label: "In der Empfehlungsliste suchen",
      placeholder: "Ein Ort, eine Adresse oder eine Idee",
      clear: "Suche löschen",
    },
    filters: {
      label: "Orte nach Kategorie filtern",
      all: "Alle",
      categories: {
        dining: "Bei Tisch",
        "after-dark": "Am Abend",
        sea: "Am Meer",
        see: "Sehenswertes",
        "getting-around": "Unterwegs",
        essentials: "Nützliche Adressen",
      },
    },
    results: {
      single: "Ort",
      many: "Orte",
      emptyTitle: "Kein Ort gefunden",
      emptyText: "Versuchen Sie einen anderen Begriff oder eine andere Kategorie.",
    },
    card: {
      address: "Adresse",
      booking: "Ein Hinweis von uns",
      officialSite: "Website",
      maps: "In Maps öffnen",
      phone: "Anrufen",
      request: "La Fenice fragen",
    },
    seasonal: {
      title: "Eine Küste im Rhythmus der Jahreszeiten",
      text:
        "Öffnungstage, Fahrpläne und Angebote am Meer können sich während der Saison ändern. Bitte prüfen Sie die Angaben vorab; wir helfen Ihnen gern.",
    },
    beforeYouGo: {
      eyebrow: "Eine kleine Erinnerung",
      title: "Bevor Sie losgehen",
      lead: "Ein paar einfache Hinweise machen einen Tag in Positano leichter.",
      verticalityTitle: "Ein vertikaler Ort",
      verticalityText:
        "Positano besteht aus Hängen und Treppen. Bequeme Schuhe und ein ruhiges Tempo sind immer eine gute Idee.",
      weatherTitle: "Wetter und Meer",
      weatherText:
        "Die Bedingungen können sich rasch ändern und Boote, Strände sowie Aktivitäten im Freien beeinflussen. Am besten am selben Tag bestätigen lassen.",
      transportTitle: "Unterwegs",
      transportText:
        "In der Hochsaison sind Straßen und öffentliche Verkehrsmittel stark ausgelastet. Prüfen Sie aktuelle Zeiten und planen Sie etwas Spielraum ein.",
      assistanceTitle: "Gesundheit und Hilfe",
      assistanceText:
        "Halten Sie die aktuellen Kontakte der Gesundheitsdienste der Gemeinde bereit. Wählen Sie 112 im Notfall oder 118 für dringende medizinische Hilfe.",
      comuneLink: "Gesundheitsdienste — Gemeinde Positano",
    },
    modal: {
      eyebrow: "Wir helfen gern",
      title: "Informationen anfragen",
      lead: "Sagen Sie uns, was Sie planen, und wir prüfen die Einzelheiten für Sie.",
      close: "Dialog schließen",
      date: "Gewünschtes Datum",
      dateHint: "Wählen Sie ein Datum während Ihres Aufenthalts.",
      time: "Gewünschte Uhrzeit",
      participants: "Teilnehmende",
      notes: "Hinweise",
      notesPlaceholder: "Gibt es etwas, das wir wissen sollten?",
      nonBinding:
        "Dies ist eine Anfrage, keine bestätigte Reservierung. Unser Team antwortet mit Verfügbarkeit und Einzelheiten.",
      cancel: "Nicht jetzt",
      done: "Fertig",
      submit: "Anfrage senden",
      submitting: "Wird gesendet…",
      success: "Ihre Anfrage wurde gesendet. Wir melden uns in Kürze.",
      error: "Die Anfrage konnte nicht gespeichert werden. Bitte versuchen Sie es erneut.",
      unavailable: "Für diesen Aufenthalt sind keine anfragbaren Termine mehr verfügbar.",
    },
    requests: {
      eyebrow: "Ihre Pläne",
      title: "Anfragen aus der Empfehlungsliste",
      lead: "Hier sehen Sie die Anfragen, die Sie an unser Team gesendet haben.",
      empty: "Sie haben noch keine Anfrage aus der Empfehlungsliste gesendet.",
      date: "Datum",
      at: "um",
      participants: "Personen",
      notes: "Ihre Nachricht",
      staffNote: "Von La Fenice",
      cancel: "Anfrage stornieren",
      cancelling: "Wird storniert…",
      cancelError: "Die Anfrage konnte nicht storniert werden. Bitte versuchen Sie es erneut.",
    },
    statuses: {
      pending: "Ausstehend",
      confirmed: "Bestätigt",
      rejected: "Nicht verfügbar",
      fulfilled: "Abgeschlossen",
      cancelled: "Storniert",
    },
    loading: "Ihr Positano-Guide wird geöffnet…",
  },
  ru: {
    intro: {
      eyebrow: "От La Fenice",
      title: "Наш Позитано",
      lead:
        "Небольшая подборка знакомых нам мест и полезные советы, чтобы знакомиться с побережьем в своем ритме.",
    },
    search: {
      label: "Поиск по путеводителю",
      placeholder: "Место, адрес или идея",
      clear: "Очистить поиск",
    },
    filters: {
      label: "Фильтр мест по категории",
      all: "Все",
      categories: {
        dining: "За столом",
        "after-dark": "После заката",
        sea: "У моря",
        see: "Что посмотреть",
        "getting-around": "Как добраться",
        essentials: "Полезные адреса",
      },
    },
    results: {
      single: "место",
      many: "мест",
      emptyTitle: "Ничего не найдено",
      emptyText: "Попробуйте другое слово или выберите другую категорию.",
    },
    card: {
      address: "Адрес",
      booking: "Наша заметка",
      officialSite: "Сайт",
      maps: "Открыть в Maps",
      phone: "Позвонить",
      request: "Спросить La Fenice",
    },
    seasonal: {
      title: "Сезонное побережье",
      text:
        "Дни работы, расписания и услуги у моря могут меняться в течение сезона. Советуем уточнить информацию перед выходом; мы всегда рады помочь.",
    },
    beforeYouGo: {
      eyebrow: "Небольшое напоминание",
      title: "Перед выходом",
      lead: "Несколько простых советов сделают день в Позитано приятнее.",
      verticalityTitle: "Вертикальный город",
      verticalityText:
        "Позитано расположен на склонах, здесь много лестниц. Удобная обувь и неспешный темп всегда кстати.",
      weatherTitle: "Погода и море",
      weatherText:
        "Условия могут быстро меняться и влиять на лодки, пляжи и занятия на открытом воздухе. Лучше уточнить все в тот же день.",
      transportTitle: "Передвижение",
      transportText:
        "В высокий сезон дороги и общественный транспорт особенно загружены. Проверяйте актуальное расписание и оставляйте запас времени.",
      assistanceTitle: "Здоровье и помощь",
      assistanceText:
        "Сохраните актуальные контакты медицинских служб муниципалитета. В экстренной ситуации звоните 112, при срочной медицинской помощи — 118.",
      comuneLink: "Медицинские службы — муниципалитет Позитано",
    },
    modal: {
      eyebrow: "Мы рядом",
      title: "Запросить информацию",
      lead: "Расскажите, что вы задумали, а мы уточним для вас детали.",
      close: "Закрыть окно",
      date: "Желаемая дата",
      dateHint: "Выберите дату во время вашего проживания.",
      time: "Желаемое время",
      participants: "Участники",
      notes: "Примечания",
      notesPlaceholder: "Есть ли что-то, что нам следует знать?",
      nonBinding:
        "Это запрос, а не подтвержденное бронирование. Наша команда ответит и сообщит о наличии и деталях.",
      cancel: "Не сейчас",
      done: "Готово",
      submit: "Отправить запрос",
      submitting: "Отправка…",
      success: "Запрос отправлен. Мы свяжемся с вами в ближайшее время.",
      error: "Не удалось сохранить запрос. Попробуйте еще раз.",
      unavailable: "Во время этого проживания больше нет доступных дат для запроса.",
    },
    requests: {
      eyebrow: "Ваши планы",
      title: "Запросы из путеводителя",
      lead: "Здесь можно следить за запросами, отправленными нашей команде.",
      empty: "Вы пока не отправляли запросов из путеводителя.",
      date: "Дата",
      at: "в",
      participants: "участников",
      notes: "Ваше сообщение",
      staffNote: "От La Fenice",
      cancel: "Отменить запрос",
      cancelling: "Отмена…",
      cancelError: "Не удалось отменить запрос. Попробуйте еще раз.",
    },
    statuses: {
      pending: "Ожидает",
      confirmed: "Подтвержден",
      rejected: "Недоступно",
      fulfilled: "Выполнен",
      cancelled: "Отменен",
    },
    loading: "Открываем ваш путеводитель по Позитано…",
  },
} satisfies Record<DemoLocale, GuideCopy>;
