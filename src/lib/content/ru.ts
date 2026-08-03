import { media } from "./media";
import type { GalleryImage, ImageAsset, SiteContent } from "./types";

const withCopy = (
  asset: ImageAsset,
  alt: string,
  caption?: string,
): GalleryImage => ({ ...asset, alt, ...(caption ? { caption } : {}) });

const homeImages = {
  room: withCopy(media.home.room, "Светлый номер в La Fenice в Позитано"),
  garden: withCopy(
    media.home.garden,
    "Террасный сад La Fenice над морем",
  ),
  panorama: withCopy(
    media.home.panorama,
    "Панорамный вид на Позитано и Тирренское море",
  ),
  view: withCopy(media.home.view, "Вид на море из La Fenice в Позитано"),
};

const roomsGallery = [
  withCopy(media.rooms[0], "Номер La Fenice с выходом на собственный балкон"),
  withCopy(media.rooms[1], "Белые стены и сводчатый потолок в гостевом номере"),
  withCopy(media.rooms[2], "Терраса с видом на море, окружённая зеленью"),
  withCopy(media.rooms[3], "Расписанная вручную плитка из Вьетри в номере La Fenice"),
] as const;

const poolGallery = [
  withCopy(media.pool[0], "Два вида изогнутого бассейна с морской водой"),
  withCopy(
    media.pool[1],
    "Бассейн La Fenice с водопадом и зоной гидромассажа",
  ),
] as const;

const beachGallery = [
  withCopy(media.privateBeach[0], "Прозрачная вода у частного пляжа La Fenice"),
  withCopy(media.privateBeach[1], "Частный пляж у подножия La Fenice"),
] as const;

const gardenGallery = [
  withCopy(media.gardenTable[0], "Лимоны, капрезе и инжир в La Fenice"),
  withCopy(media.gardenTable[1], "Бугенвиллеи и цветы в саду La Fenice"),
  withCopy(media.gardenTable[2], "Сбор картофеля на террасах"),
  withCopy(media.gardenTable[3], "Опунция и сезонные заготовки"),
] as const;

const locationImage = withCopy(
  media.location,
  "Вид из La Fenice на побережье и море, с вазоном на балконе",
);

const availabilityImage = withCopy(
  media.availability,
  "Подготовленный для гостей номер La Fenice с видом на море",
);

export const russianContent = {
  locale: "ru",
  common: {
    introControls: {
      enter: "Войти",
      reload: "Повторить",
      reloadedAnnouncement: "Заставка запущена повторно.",
    },
    skipToContent: "Перейти к содержанию",
    openMenu: "Открыть меню",
    closeMenu: "Закрыть меню",
    changeLanguage: "Выбрать язык",
    languageName: "Русский",
    primaryNavigation: "Основная навигация",
    viewGallery: "Открыть галерею",
    previousImage: "Предыдущее изображение",
    nextImage: "Следующее изображение",
    closeGallery: "Закрыть галерею",
    openMap: "Открыть интерактивную карту",
    mapLoadingNotice: "Интерактивная карта загрузится, только когда вы решите её открыть.",
    getDirections: "Построить маршрут",
    officialWebsite: "Официальный сайт",
    email: "Электронная почта",
    phone: "Телефон",
    address: "Адрес",
    vatNumber: "Номер НДС",
    followUs: "Мы в социальных сетях",
    goodToKnow: "Полезно знать",
  },
  navigation: {
    primary: {
      home: "Главная",
      rooms: "Номера",
      pool: "Бассейн",
      privateBeach: "Частный пляж",
      gardenTable: "Сад и кухня",
      location: "Расположение",
      gettingHere: "Как добраться",
    },
    utility: {
      privacy: "Конфиденциальность",
      terms: "Условия и положения",
    },
    availability: "Запросить наличие",
  },
  footer: {
    description: "Между садом и морем.",
    contactTitle: "Контакты",
    exploreTitle: "Страницы",
    legalTitle: "Правовая информация",
    photographyCredit: "Фотографии: Tim Evancook",
  },
  availabilityCta: {
    eyebrow: "Проживание",
    title: "Остановиться у нас",
    text: "Напишите нам желаемые даты. Мы ответим лично.",
    label: "Запросить наличие",
  },
  notFound: {
    title: "Эта тропа не ведёт к морю.",
    text: "Возможно, страница перемещена. Вернитесь на главную La Fenice и продолжите оттуда.",
    button: "На главную",
  },
  pages: {
    home: {
      route: "home",
      metadata: {
        title: "La Fenice Positano | B&B на Амальфитанском побережье",
        description:
          "La Fenice — B&B в Позитано с номерами с видом на море, бассейном с морской водой, частным пляжем и сезонным садом.",
        openGraphImage: homeImages.panorama,
      },
      hero: {
        eyebrow: "Позитано · Амальфитанское побережье",
        title: "От сада к морю",
        lead: "Наш дом на склоне Позитано, между садом и морем.",
        image: homeImages.panorama,
        primaryCta: {
          label: "Запросить наличие",
          route: "availability",
        },
      },
      introduction: {
        id: "welcome",
        eyebrow: "Наш дом",
        title: "Простой дом у моря",
        paragraphs: [
          "La Fenice — наш дом и B&B: номера и сады расположены на террасах среди лимонов, винограда и бугенвиллей.",
        ],
        image: homeImages.view,
      },
      storyHeading: {
        eyebrow: "Дом",
        title: "Четыре места",
      },
      locationTeaser: {
        eyebrow: "Расположение",
        title: "Via Guglielmo Marconi 4, Позитано",
        text: "Рядом с остановкой Sponda, между прибрежной дорогой и морем.",
        linkLabel: "Расположение и карта",
        scrollLabel: "Далее",
      },
      stories: [
        {
          id: "garden",
          eyebrow: "Сад",
          title: "В ритме сезонов",
          text: "На наших террасах растут фрукты, овощи и лимоны.",
          image: homeImages.garden,
          cta: { label: "Сад и кухня", route: "gardenTable" },
        },
        {
          id: "rooms",
          eyebrow: "Номера",
          title: "Свет и Вьетри",
          text: "Белые номера с балконами, террасами и плиткой Вьетри.",
          image: homeImages.room,
          cta: { label: "Номера", route: "rooms" },
        },
        {
          id: "pool",
          eyebrow: "Бассейн",
          title: "Морская вода",
          text: "Изогнутый бассейн, окружённый зеленью.",
          image: poolGallery[0],
          cta: { label: "Бассейн", route: "pool" },
        },
        {
          id: "beach",
          eyebrow: "Море",
          title: "К морю",
          text: "Из сада к частному выходу к морю ведёт лестница.",
          image: beachGallery[0],
          cta: { label: "Частный пляж", route: "privateBeach" },
        },
      ],
      experiences: {
        eyebrow: "Впечатления",
        title: "На побережье",
        lead: "Рыбалка, прогулка на лодке и лимонный сад — по сезону и при наличии.",
        requestLabel: "Узнать подробности",
        items: [
          {
            id: "fishing",
            title: "Рыбалка",
            text: "Утро в море, когда позволяют условия.",
            image: beachGallery[1],
            emailSubject: "Запрос о рыбалке",
            emailBody:
              "Здравствуйте, La Fenice!\n\nПодскажите, пожалуйста, подробнее о рыбалке.\n\nЖелаемая дата:\nКоличество гостей:\nИмя и фамилия:\n\nСпасибо.",
          },
          {
            id: "boatTrip",
            title: "На лодке",
            text: "Маршрут вдоль побережья, который мы согласуем вместе.",
            image: beachGallery[0],
            emailSubject: "Запрос о морской прогулке",
            emailBody:
              "Здравствуйте, La Fenice!\n\nПодскажите, пожалуйста, подробнее о морской прогулке.\n\nЖелаемая дата:\nКоличество гостей:\nИмя и фамилия:\n\nСпасибо.",
          },
          {
            id: "lemonGrove",
            title: "Среди лимонов",
            text: "Знакомство с террасами, на которых мы выращиваем урожай.",
            image: homeImages.garden,
            emailSubject: "Запрос о посещении лимонного сада",
            emailBody:
              "Здравствуйте, La Fenice!\n\nПодскажите, пожалуйста, подробнее о посещении лимонного сада.\n\nЖелаемая дата:\nКоличество гостей:\nИмя и фамилия:\n\nСпасибо.",
          },
        ],
      },
      stepsNotice: {
        title: "Доступность",
        text: "Дорогу, номера, сады и море соединяет множество ступеней. Сообщите нам заранее об особых требованиях к доступности.",
      },
    },
    rooms: {
      route: "rooms",
      metadata: {
        title: "Номера с видом на море в Позитано | La Fenice",
        description:
          "Познакомьтесь с номерами La Fenice в Позитано: белые стены, сводчатые потолки, большие окна и расписанная вручную плитка из Вьетри.",
        openGraphImage: roomsGallery[0],
      },
      intro: {
        eyebrow: "Проживание",
        title: "Номера в свете Позитано",
        lead: "Простые интерьеры, часто с видом на море.",
      },
      heroImage: roomsGallery[0],
      sections: [
        {
          id: "character",
          title: "Номера",
          paragraphs: [
            "Белые стены, сводчатые потолки и плитка Вьетри; во многих номерах есть балкон или терраса с видом на море.",
          ],
          image: roomsGallery[1],
        },
      ],
      gallery: roomsGallery,
      note: "Напишите нам, чтобы узнать, какой номер доступен на ваши даты.",
    },
    pool: {
      route: "pool",
      metadata: {
        title: "Бассейн с морской водой в Позитано | La Fenice",
        description:
          "Откройте для себя изогнутый бассейн La Fenice с морской водой, водопадом, зоной гидромассажа и солнечной террасой на склоне Позитано.",
        openGraphImage: poolGallery[0],
      },
      intro: {
        eyebrow: "Бассейн",
        title: "Морская вода среди террас",
        lead: "Изогнутый бассейн выходит к зелени.",
      },
      heroImage: poolGallery[0],
      sections: [
        {
          id: "water-and-shade",
          title: "Солнце и тень",
          paragraphs: [
            "Морская вода, водопад и гидромассаж среди бугенвиллей и жакаранд.",
          ],
          image: poolGallery[1],
        },
      ],
      gallery: poolGallery,
      note: "Обычно открыт с июня до середины октября, в зависимости от погоды и состояния моря. Уточните даты заранее.",
    },
    privateBeach: {
      route: "privateBeach",
      metadata: {
        title: "Частный пляж в Позитано | La Fenice",
        description:
          "Спуститесь по садовым ступеням La Fenice к частному пляжу и прозрачной воде у подножия склона Позитано.",
        openGraphImage: beachGallery[0],
      },
      intro: {
        eyebrow: "Частный пляж",
        title: "Море в конце сада",
        lead: "Лестница среди зелени ведёт к нашему частному выходу к морю.",
      },
      heroImage: beachGallery[0],
      sections: [
        {
          id: "descent",
          title: "К воде",
          paragraphs: [
            "Тропа проходит через террасный сад.",
          ],
          image: beachGallery[1],
        },
      ],
      gallery: beachGallery,
      note: "На пути много ступеней; доступ зависит от состояния моря.",
    },
    gardenTable: {
      route: "gardenTable",
      metadata: {
        title: "Сад и сезонные вкусы | La Fenice Positano",
        description:
          "Узнайте о фруктах, овощах, винограде, оливках и лимонах, которые традиционно выращивают в террасном саду La Fenice в Позитано.",
        openGraphImage: gardenGallery[0],
      },
      intro: {
        eyebrow: "Сад и кухня",
        title: "Сад следует временам года",
        lead: "Мы выращиваем то, что потом появляется на нашем столе.",
      },
      heroImage: gardenGallery[0],
      sections: [
        {
          id: "summer-winter",
          title: "Урожай",
          paragraphs: [
            "Фрукты и овощи меняются по месяцам; виноград, оливки, орехи и лимоны отмечают ход года.",
          ],
          image: gardenGallery[1],
        },
      ],
      gallery: gardenGallery,
      note: "У каждого сезона свой урожай.",
    },
    location: {
      route: "location",
      metadata: {
        title: "Расположение в Позитано | La Fenice",
        description:
          "Найдите La Fenice по адресу Via Guglielmo Marconi 4 в Позитано и постройте маршрут к B&B на Амальфитанском побережье.",
        openGraphImage: locationImage,
      },
      intro: {
        eyebrow: "Расположение",
        title: "Между дорогой и морем",
        lead: "В нескольких минутах от остановки Sponda.",
      },
      heroImage: locationImage,
      sections: [
        {
          id: "address",
          title: "Via Guglielmo Marconi 4",
          paragraphs: [
            "От остановки Sponda около 200 метров пешком в направлении Амальфи.",
          ],
          cta: { label: "Как добраться", route: "gettingHere" },
        },
      ],
      gallery: [locationImage],
      note: "В высокий сезон проверьте движение и расписание перед поездкой.",
    },
    gettingHere: {
      route: "gettingHere",
      metadata: {
        title: "Как добраться до Позитано | La Fenice",
        description:
          "Спланируйте поездку в La Fenice в Позитано на автомобиле, поезде, самолёте или по морю, используя ссылки на официальных перевозчиков.",
        openGraphImage: locationImage,
      },
      intro: {
        eyebrow: "Как добраться",
        title: "Как приехать в Позитано",
        lead: "Выберите транспорт и проверьте официальное расписание.",
      },
      heroImage: locationImage,
      travelNotice: "Сезонные рейсы меняются.",
      modes: [
        {
          id: "car",
          title: "На автомобиле",
          routes: [
            {
              id: "car-north",
              title: "С севера",
              steps: [
                "Съезд на Кастелламмаре-ди-Стабия, затем SS145 и SS163 до Позитано.",
              ],
            },
            {
              id: "car-south",
              title: "С юга",
              steps: [
                "Съезд в Виетри-суль-Маре, затем SS163 до Позитано.",
              ],
            },
          ],
        },
        {
          id: "train",
          title: "На поезде",
          routes: [
            {
              id: "train-naples",
              title: "Через Неаполь",
              steps: [
                "Napoli Centrale → EAV до Сорренто → SITA Sud до Positano Sponda.",
              ],
            },
            {
              id: "train-salerno",
              title: "Через Салерно",
              steps: [
                "Салерно → SITA Sud до Амальфи → пересадка до Positano Sponda.",
              ],
            },
          ],
        },
        {
          id: "plane",
          title: "На самолёте",
          routes: [
            {
              id: "plane-naples",
              title: "Из аэропорта Неаполь-Каподикино",
              steps: [
                "Napoli Centrale → EAV до Сорренто или прямой автобус Curreri до Сорренто; затем SITA Sud до Positano Sponda.",
              ],
            },
            {
              id: "plane-rome",
              title: "Из аэропорта Рим-Фьюмичино",
              steps: [
                "Roma Termini → Неаполь или Салерно; затем следуйте маршруту на поезде.",
              ],
            },
          ],
        },
        {
          id: "sea",
          title: "По морю",
          routes: [
            {
              id: "sea-positano",
              title: "Паромы и суда на подводных крыльях",
              steps: [
                "В сезон морские рейсы связывают Позитано с Неаполем, Сорренто, Салерно и Амальфи.",
              ],
            },
          ],
        },
      ],
      officialResourcesTitle: "Официальная информация для путешественников",
      officialResources: [
        {
          id: "sita",
          label: "SITA Sud Campania",
          description: "Автобусы Амальфитанского побережья",
          href: "https://sitasudtrasporti.it/campania/orari/",
        },
        {
          id: "eav",
          label: "EAV",
          description: "Поезда Неаполь — Сорренто",
          href: "https://www.eavsrl.it/orari-linee-ferroviarie/",
        },
        {
          id: "curreri",
          label: "Curreri Viaggi",
          description: "Автобус аэропорт Неаполя — Сорренто",
          href: "https://www.curreriviaggi.it/it/navetta-aeroporto-di-napoli",
        },
        {
          id: "trenitalia",
          label: "Trenitalia",
          description: "Национальные железные дороги",
          href: "https://www.trenitalia.com/en.html",
        },
        {
          id: "naples-airport",
          label: "Международный аэропорт Неаполя",
          description: "Транспорт из Каподикино",
          href: "https://www.aeroportodinapoli.it/it/in-bus",
        },
        {
          id: "alilauro",
          label: "Alilauro",
          description: "Паромы и суда на подводных крыльях",
          href: "https://www.alilauro.it/en/",
        },
      ],
      transferTitle: "Индивидуальный трансфер",
      transferNote: "Напишите нам, чтобы уточнить варианты и стоимость трансфера.",
    },
    availability: {
      route: "availability",
      metadata: {
        title: "Наличие номеров в Позитано | La Fenice",
        description:
          "Узнайте о наличии номеров в La Fenice в Позитано. Укажите даты и количество гостей — мы ответим вам лично.",
        openGraphImage: availabilityImage,
      },
      intro: {
        eyebrow: "Ваш отдых",
        title: "Запросить наличие",
        lead: "Укажите даты и количество гостей. Мы ответим напрямую.",
      },
      heroImage: availabilityImage,
      form: {
        title: "Ваш запрос",
        requiredHint: "Поля, отмеченные *, обязательны для заполнения.",
        honeypotLabel: "Веб-сайт",
        fields: {
          name: { label: "Имя и фамилия *", placeholder: "Ваши имя и фамилия" },
          email: { label: "Электронная почта *", placeholder: "you@example.com" },
          phone: {
            label: "Телефон",
            placeholder: "+00 000 0000000",
            hint: "Необязательно, укажите код страны",
          },
          guests: { label: "Гости *", hint: "Взрослые и дети в поездке" },
          checkIn: { label: "Дата заезда *" },
          checkOut: { label: "Дата выезда *" },
          message: {
            label: "Сообщение",
            placeholder: "Расскажите нам всё, что важно знать о вашей поездке",
          },
        },
        consent: {
          prefix: "Я ознакомлен(а) с",
          linkLabel: "политикой конфиденциальности",
          suffix: "и соглашаюсь отправить эти данные в составе запроса о наличии. *",
        },
        submitLabel: "Отправить запрос",
        submittingLabel: "Отправка…",
        successTitle: "Запрос отправлен",
        successMessage: "Спасибо. Мы ответим по электронной почте; бронирование пока не подтверждено.",
        errorTitle: "Не удалось отправить запрос",
        errorMessage:
          "Попробуйте ещё раз или свяжитесь с нами по указанному ниже адресу электронной почты или телефону.",
        emailFallback: {
          subject: "Запрос о наличии",
          body: "Имя и фамилия:\nТелефон:\nГости:\nДата заезда:\nДата выезда:\nЗапрос:",
        },
        validation: {
          required: "Заполните это обязательное поле.",
          invalidEmail: "Введите действительный адрес электронной почты.",
          invalidDateRange: "Дата выезда должна быть позже даты заезда.",
          invalidGuests: "Укажите хотя бы одного гостя.",
          consentRequired: "Для отправки запроса необходимо согласие.",
        },
      },
      responseTimeNote: "Этот запрос не является подтверждённым бронированием.",
      fallback: {
        title: "Хотите связаться с нами напрямую?",
        text: "Напишите нам или позвоните напрямую.",
        emailLabel: "Написать в La Fenice",
        phoneLabel: "Позвонить в La Fenice",
      },
    },
    privacy: {
      route: "privacy",
      status: "review-required",
      metadata: {
        title: "Политика конфиденциальности | La Fenice Positano",
        description:
          "Информация о конфиденциальности на сайте La Fenice Positano. Окончательный текст ожидает согласования владельцем и юридической проверки.",
        robots: "noindex",
      },
      title: "Политика конфиденциальности",
      reviewNotice: {
        title: "До запуска необходимо подготовить текст",
        text: "На предыдущем сайте отсутствует текст политики конфиденциальности. До публикации формы запроса наличия и запуска сайта владелец и квалифицированный специалист по защите данных должны предоставить или утвердить полный текст политики. Этот временный текст не является политикой конфиденциальности.",
      },
    },
    terms: {
      route: "terms",
      status: "review-required",
      metadata: {
        title: "Условия и положения | La Fenice Positano",
        description:
          "Условия и положения La Fenice Positano. Окончательный текст ожидает согласования владельцем и юридической проверки.",
        robots: "noindex",
      },
      title: "Условия и положения",
      reviewNotice: {
        title: "До запуска необходимо подготовить текст",
        text: "На предыдущем сайте отсутствуют условия и положения. До публикации владелец и квалифицированный специалист должны предоставить и утвердить применимые условия проживания, отмены бронирования и использования сайта. Этот временный текст не устанавливает договорных условий.",
      },
    },
  },
} as const satisfies SiteContent;
