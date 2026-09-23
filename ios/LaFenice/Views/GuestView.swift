import SwiftUI

/// An ospite plans the stay and leaves with a clear record of requests.
struct GuestView: View {
    @Bindable var store: PortalStore
    @State private var tab = GuestTab.stay
    @State private var selectedDate = Date()

    var body: some View {
        TabView(selection: $tab) {
            NavigationStack {
                GuestStayView(store: store, date: $selectedDate, openOrder: { tab = .order })
            }
            .tabItem { Label("Soggiorno", systemImage: "house") }.tag(GuestTab.stay)
            NavigationStack { GuestOrderView(store: store, date: $selectedDate) }
                .tabItem { Label("Ordina", systemImage: "fork.knife") }.tag(GuestTab.order)
            NavigationStack { GuestExperiencesView(store: store, date: selectedDate) }
                .tabItem { Label("Esperienze", systemImage: "sailboat") }.tag(GuestTab.experiences)
            NavigationStack { GuestGuideView(store: store, date: selectedDate) }
                .tabItem { Label("Guida", systemImage: "map") }.tag(GuestTab.guide)
            NavigationStack { GuestRequestsView(store: store) }
                .tabItem { Label("Richieste", systemImage: "list.bullet.rectangle") }.tag(GuestTab.requests)
        }
        .tint(FeniceTheme.cobalt)
        .environment(\.timeZone, RomeDay.calendar.timeZone)
        .onAppear {
            if let stay = store.stay {
                selectedDate = RomeDay.date(min(max(store.today, stay.checkIn), stay.checkOut)) ?? store.now
            }
        }
    }
}

private enum GuestTab { case stay, order, experiences, guide, requests }

private struct GuestStayView: View {
    @Bindable var store: PortalStore
    @Binding var date: Date
    var openOrder: () -> Void
    @State private var error: String?
    @State private var confirmLogout = false
    @State private var showCalendar = false
    @State private var showPreferences = false

    var body: some View {
        Form {
            if let stay = store.stay {
                Section {
                    VStack(alignment: .leading, spacing: 14) {
                        Text(stay.guestName).font(.system(.title, design: .serif).weight(.medium))
                            .foregroundStyle(FeniceTheme.cobalt)
                        ViewThatFits(in: .horizontal) {
                            HStack(spacing: 18) {
                                Label(stay.room, systemImage: "key.horizontal")
                                Label("\(stay.guests) ospiti", systemImage: "person.2")
                            }
                            VStack(alignment: .leading, spacing: 8) {
                                Label(stay.room, systemImage: "key.horizontal")
                                Label("\(stay.guests) ospiti", systemImage: "person.2")
                            }
                        }.font(.subheadline)
                        Text("\(guestDate(stay.checkIn)) — \(guestDate(stay.checkOut))")
                            .font(.subheadline).foregroundStyle(.secondary)
                    }.padding(.vertical, 9)
                } header: { Text("Benvenuti a La Fenice") }
                Section {
                    DisclosureGroup(isExpanded: $showCalendar) {
                        if let start = RomeDay.date(stay.checkIn), let end = RomeDay.date(stay.checkOut) {
                            DatePicker("Giorno del soggiorno", selection: $date, in: start...end, displayedComponents: .date)
                                .datePickerStyle(.graphical)
                                .accessibilityIdentifier("guest.stay.calendar")
                        }
                    } label: {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("La tua giornata").font(.caption).foregroundStyle(.secondary)
                            Label(guestDate(RomeDay.key(date)), systemImage: "calendar")
                                .font(.headline).foregroundStyle(FeniceTheme.cobalt)
                        }.padding(.vertical, 5)
                    }
                    .accessibilityIdentifier("guest.stay.chooseDay")
                    let key = RomeDay.key(date)
                    if RomeDay.orderable(key, stay: stay, now: store.now) {
                        Button(action: openOrder) {
                            Label("Scegli dal menu", systemImage: "fork.knife")
                        }
                        .buttonStyle(FenicePrimaryButtonStyle())
                        .listRowSeparator(.hidden)
                        .accessibilityIdentifier("guest.stay.order")
                    } else {
                        Text(key == stay.checkOut ? "Il giorno del check-out è consultabile; non è possibile richiedere servizi." : "Questo giorno è consultabile; non è possibile richiedere nuovi servizi.")
                            .font(.footnote).foregroundStyle(.secondary)
                    }
                    let requests = store.visibleRequests.filter { $0.serviceDate == key }
                    if requests.isEmpty {
                        Label("Nessuna richiesta per questo giorno.", systemImage: "tray")
                            .font(.subheadline).foregroundStyle(.secondary)
                    }
                    ForEach(requests) { request in
                        NavigationLink {
                            GuestRequestDetail(store: store, requestID: request.id)
                        } label: { GuestRequestRow(request: request, locale: store.locale) }
                    }
                }
                StayOrderBillSection(store: store, stayID: stay.id)
                Section("Una nota sulle scale") {
                    Label {
                        Text("La Fenice si sviluppa su più livelli collegati da numerose scale. Contatta la struttura per valutare esigenze di mobilità e percorsi.")
                    } icon: { Image(systemName: "figure.stairs").foregroundStyle(FeniceTheme.cobalt) }
                    .font(.callout)
                }
                Section {
                  DisclosureGroup("Lingua e account", isExpanded: $showPreferences) {
                    Picker("Lingua dei contenuti", selection: Binding(get: { store.locale }, set: { locale in
                        do { try store.setLocale(locale) } catch { self.error = error.localizedDescription }
                    })) {
                        ForEach(PortalLocale.allCases) { locale in Text(locale.title).tag(locale) }
                    }
                    Text("L’interfaccia dell’app è in italiano; menu, esperienze e guida seguono la lingua scelta.")
                        .font(.footnote).foregroundStyle(.secondary)
                    Button("Esci dall’account", role: .destructive) { confirmLogout = true }
                        .frame(minHeight: 44)
                  }
                }
            } else {
                ContentUnavailableView("Soggiorno non disponibile", systemImage: "person.crop.circle.badge.exclamationmark", description: Text("Contatta l’amministratore per verificare l’accesso."))
            }
        }
        .navigationTitle("Soggiorno")
        .navigationBarTitleDisplayMode(.inline)
        .scrollContentBackground(.hidden)
        .background(FeniceTheme.paper)
        .confirmationDialog("Uscire dall’account?", isPresented: $confirmLogout, titleVisibility: .visible) {
            Button("Esci", role: .destructive) { store.logout() }
        } message: { Text("Le richieste già salvate rimangono nella demo su questo dispositivo.") }
        .alert("Impossibile aggiornare", isPresented: guestErrorBinding($error)) {
            Button("OK", role: .cancel) { error = nil }
        } message: { Text(error ?? "") }
    }
}

private struct GuestExperiencesView: View {
    @Bindable var store: PortalStore
    let date: Date

    var body: some View {
        List {
            Section {
                Text("Scegli un’esperienza e indica il giorno preferito. Una richiesta non è una prenotazione confermata.")
                    .foregroundStyle(.secondary)
            }
            ForEach(store.activeCatalog(.activity)) { item in
                NavigationLink {
                    GuestExperienceForm(store: store, item: item, initialDate: date)
                } label: {
                    VStack(alignment: .leading, spacing: 8) {
                        Label(item.title(store.locale), systemImage: guestActivitySymbol(item.category))
                            .font(.headline).foregroundStyle(FeniceTheme.cobalt)
                        if !item.detail(store.locale).isEmpty { Text(item.detail(store.locale)).font(.subheadline).foregroundStyle(.secondary) }
                        Text(guestPrice(item.priceCents)).font(.caption)
                    }.padding(.vertical, 8)
                }
            }
            if store.activeCatalog(.activity).isEmpty {
                ContentUnavailableView("Nessuna esperienza disponibile", systemImage: "sailboat", description: Text("Riprova più tardi o rivolgiti alla struttura."))
            }
        }
        .navigationTitle("Esperienze")
    }
}

private struct GuestGuideView: View {
    @Bindable var store: PortalStore
    let date: Date
    @State private var search = ""
    @State private var category = "all"

    private var items: [CatalogItem] {
        store.activeCatalog(.guide).filter { item in
            (category == "all" || item.category == category) &&
            (search.isEmpty || "\(item.title(store.locale)) \(item.detail(store.locale)) \(item.address ?? "")"
                .localizedCaseInsensitiveContains(search))
        }
    }

    var body: some View {
        List {
            Section {
                Picker("Categoria", selection: $category) {
                    Text("Tutte").tag("all")
                    ForEach(CatalogItem.guideCategories, id: \.self) { Text(guestCategory($0)).tag($0) }
                }
                Text("La guida salvata è consultabile offline. Siti, mappe e telefonate richiedono servizi esterni; verifica sempre orari e disponibilità.")
                    .font(.footnote).foregroundStyle(.secondary)
            }
            ForEach(items) { item in
                NavigationLink {
                    GuestGuideDetail(store: store, item: item, date: date)
                } label: {
                    VStack(alignment: .leading, spacing: 6) {
                        Text(item.title(store.locale)).font(.headline)
                        Text(guestCategory(item.category)).font(.caption).foregroundStyle(FeniceTheme.cobalt)
                        Text(item.detail(store.locale)).font(.subheadline).foregroundStyle(.secondary).lineLimit(3)
                    }.padding(.vertical, 6)
                }
            }
            if items.isEmpty {
                ContentUnavailableView.search(text: search)
            }
            Section("Concierge") {
                Label("Il concierge online non è collegato in questa app locale.", systemImage: "bubble.left.and.bubble.right")
                    .font(.footnote).foregroundStyle(.secondary)
            }
        }
        .searchable(text: $search, prompt: "Cerca nella guida")
        .navigationTitle("Positano e dintorni")
    }
}

private struct GuestGuideDetail: View {
    @Bindable var store: PortalStore
    let item: CatalogItem
    let date: Date

    var body: some View {
        List {
            Section {
                Text(item.title(store.locale)).font(.title2.weight(.semibold))
                if !item.detail(store.locale).isEmpty { Text(item.detail(store.locale)) }
                if let address = item.address, !address.isEmpty { Label(address, systemImage: "mappin.and.ellipse") }
            } header: { Text(guestCategory(item.category)) }
            Section("Contatti e informazioni") {
                if let url = PortalStore.safeWebURL(item.websiteUrl) { Link(destination: url) { Label("Sito ufficiale", systemImage: "safari").frame(minHeight: 44) } }
                if let url = PortalStore.safeWebURL(item.mapsUrl) { Link(destination: url) { Label("Apri la mappa", systemImage: "map").frame(minHeight: 44) } }
                if let phone = item.phone, let url = guestTelephone(phone) { Link(destination: url) { Label(phone, systemImage: "phone").frame(minHeight: 44) } }
                if let verified = item.verifiedAt {
                    Text("Riferimenti verificati: \(guestDate(verified))").font(.footnote).foregroundStyle(.secondary)
                }
                Text("Verifica direttamente prezzi, orari e condizioni con il fornitore.")
                    .font(.footnote).foregroundStyle(.secondary)
            }
            let note = item.bookingNote?[store.locale.rawValue] ?? item.bookingNote?["en"] ?? ""
            if !note.isEmpty { Section("Prima di richiedere") { Text(note) } }
            if item.requestable == true {
                Section {
                    NavigationLink {
                        GuestExperienceForm(store: store, item: item, initialDate: date)
                    } label: { Label("Richiedi assistenza", systemImage: "calendar.badge.plus").frame(minHeight: 44) }
                    Text("La richiesta non conferma una prenotazione. Nella demo resta solo su questo dispositivo.")
                        .font(.footnote).foregroundStyle(.secondary)
                }
            }
        }
        .navigationTitle("Guida")
        .navigationBarTitleDisplayMode(.inline)
    }
}

private struct GuestRequestsView: View {
    @Bindable var store: PortalStore
    @State private var onlyOpen = false

    private var requests: [ServiceRequest] {
        store.visibleRequests.filter { !onlyOpen || $0.status == .pending || $0.status == .confirmed }
            .sorted { $0.createdAt > $1.createdAt }
    }

    var body: some View {
        List {
            Section { Toggle("Solo richieste aperte", isOn: $onlyOpen) }
            ForEach(requests) { request in
                NavigationLink {
                    GuestRequestDetail(store: store, requestID: request.id)
                } label: { GuestRequestRow(request: request, locale: store.locale) }
            }
            if requests.isEmpty {
                ContentUnavailableView("Nessuna richiesta", systemImage: "tray", description: Text("Gli ordini e le esperienze salvati compariranno qui con il loro stato."))
            }
        }
        .navigationTitle("Le tue richieste")
    }
}

private struct GuestRequestRow: View {
    let request: ServiceRequest
    let locale: PortalLocale

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(request.title(locale)).font(.headline)
            Text("\(guestDate(request.serviceDate)) · \(request.time)").font(.subheadline).foregroundStyle(.secondary)
            RequestStatusBadge(status: request.status)
            if request.gratuityCents > 0 {
                Text("Mancia · \(guestPrice(request.gratuityCents))").font(.footnote).foregroundStyle(.secondary)
            }
            if !request.staffNote.isEmpty { Text(request.staffNote).font(.footnote).lineLimit(2) }
        }.padding(.vertical, 6)
    }
}

private struct GuestRequestDetail: View {
    @Bindable var store: PortalStore
    let requestID: String
    @State private var confirmCancellation = false
    @State private var error: String?
    private var request: ServiceRequest? { store.visibleRequests.first { $0.id == requestID } }

    var body: some View {
        List {
            if let request {
                Section {
                    Text(request.title(store.locale)).font(.title2.weight(.semibold))
                    RequestStatusBadge(status: request.status)
                    LabeledContent("Giorno", value: guestDate(request.serviceDate))
                    LabeledContent("Orario preferito", value: request.time)
                    if let location = request.location { LabeledContent("Consegna", value: guestLocation(location)) }
                    if let participants = request.participants { LabeledContent("Partecipanti", value: "\(participants)") }
                    Text("Richiesta salvata nella demo locale, non inviata alla struttura.").font(.footnote).foregroundStyle(.secondary)
                }
                if !request.lines.isEmpty {
                    Section("Ordine") {
                        ForEach(request.lines) { line in
                            LabeledContent("\(line.quantity) × \(line.title(store.locale))", value: guestPrice(line.priceCents.map { $0 * line.quantity }))
                        }
                        LabeledContent("Prodotti", value: guestPrice(request.subtotalCents))
                        LabeledContent("Mancia", value: request.gratuityCents == 0 ? "Nessuna" : guestPrice(request.gratuityCents))
                        LabeledContent("Totale ordine", value: guestPrice(request.totalCents))
                        Text("Il conto include soltanto ordini confermati o completati, con le relative mance. Nessun addebito reale nella demo.")
                            .font(.footnote).foregroundStyle(.secondary)
                    }
                }
                if !request.notes.isEmpty { Section("La tua nota") { Text(request.notes) } }
                if !request.staffNote.isEmpty { Section("Nota dello staff") { Text(request.staffNote) } }
                Section {
                    LabeledContent("Ultimo aggiornamento") { Text(request.updatedAt, format: .dateTime.day().month().hour().minute()) }
                    if request.status == .pending {
                        Button("Annulla richiesta", role: .destructive) { confirmCancellation = true }.frame(minHeight: 44)
                    } else if request.status == .confirmed {
                        Text("Per modificare una richiesta confermata rivolgiti allo staff.").font(.footnote).foregroundStyle(.secondary)
                    }
                }
            } else {
                ContentUnavailableView("Richiesta non disponibile", systemImage: "tray")
            }
        }
        .navigationTitle("Dettaglio richiesta")
        .navigationBarTitleDisplayMode(.inline)
        .confirmationDialog("Annullare questa richiesta?", isPresented: $confirmCancellation, titleVisibility: .visible) {
            Button("Annulla richiesta", role: .destructive) {
                do { try store.cancelRequest(id: requestID) } catch { self.error = error.localizedDescription }
            }
        } message: { Text("La modifica viene salvata solo nella demo locale e non può essere revocata.") }
        .alert("Impossibile annullare", isPresented: guestErrorBinding($error)) {
            Button("OK", role: .cancel) { error = nil }
        } message: { Text(error ?? "") }
    }
}

struct StayOrderBillSection: View {
    let store: PortalStore
    let stayID: String

    var body: some View {
        let bill = store.orderBill(for: stayID)
        if bill.orderCount > 0 || bill.pendingTipCents > 0 {
            Section {
                LabeledContent("Totale ordini", value: guestPrice(bill.totalCents))
                LabeledContent("Di cui mance", value: guestPrice(bill.tipCents))
                if bill.pendingTipCents > 0 {
                    LabeledContent("Mance in attesa", value: guestPrice(bill.pendingTipCents))
                }
            } header: { Text("Conto del soggiorno · demo") }
                footer: { Text("Il totale include solo ordini confermati o completati, mance comprese. Esclude soggiorno, esperienze e ordini annullati o rifiutati. Le mance in attesa non sono ancora nel totale. Nessun addebito reale.") }
        }
    }
}

// Shared display helpers keep the order, calendar and request receipt consistent.
func guestDate(_ key: String) -> String {
    guard let date = RomeDay.date(key) else { return key }
    return date.formatted(Date.FormatStyle(date: .abbreviated, time: .omitted, locale: Locale(identifier: "it_IT"), calendar: RomeDay.calendar, timeZone: RomeDay.calendar.timeZone))
}

func guestPrice(_ cents: Int?) -> String {
    guard let cents else { return String(localized: "Prezzo da confermare") }
    return (Double(cents) / 100).formatted(.currency(code: "EUR").locale(Locale(identifier: "it_IT")))
}

func guestLocation(_ location: DeliveryLocation) -> String {
    switch location { case .room: String(localized: "Camera"); case .pool: String(localized: "Piscina"); case .beach: String(localized: "Spiaggia") }
}

func guestCategory(_ category: String) -> String {
    switch category {
    case "food": String(localized: "Da mangiare")
    case "classic-drink": String(localized: "Da bere")
    case "wine": String(localized: "Vini")
    case "champagne": String(localized: "Champagne")
    case "raw-fish": String(localized: "Crudi di mare")
    case "dining": String(localized: "A tavola")
    case "after-dark": String(localized: "La sera")
    case "sea": String(localized: "Al mare")
    case "see": String(localized: "Da vedere")
    case "getting-around": String(localized: "Come muoversi")
    case "essentials": String(localized: "Informazioni utili")
    default: category
    }
}

private func guestActivitySymbol(_ category: String) -> String {
    switch category { case "fishing": "fish"; case "boat-trip": "sailboat"; case "lemon-grove": "leaf"; default: "sun.max" }
}

private func guestTelephone(_ value: String) -> URL? {
    let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
    guard trimmed.range(of: #"^\+?[0-9 ()-]{5,30}$"#, options: .regularExpression) != nil else { return nil }
    return URL(string: "tel:" + trimmed.filter { $0.isNumber || $0 == "+" })
}

func guestErrorBinding(_ error: Binding<String?>) -> Binding<Bool> {
    Binding(get: { error.wrappedValue != nil }, set: { if !$0 { error.wrappedValue = nil } })
}
