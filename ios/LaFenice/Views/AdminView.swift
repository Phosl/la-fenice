import SwiftUI

struct AdminView: View {
    @Bindable var store: PortalStore

    var body: some View {
        TabView {
            AdminRequestsView(store: store)
                .tabItem { Label("Richieste", systemImage: "tray") }
                .badge(store.visibleRequests.filter { $0.status == .pending }.count)
            AdminStaysView(store: store)
                .tabItem { Label("Soggiorni", systemImage: "bed.double") }
            AdminCatalogView(store: store)
                .tabItem { Label("Catalogo", systemImage: "list.bullet.rectangle") }
        }
        .tint(FeniceTheme.cobalt)
        .environment(\.timeZone, RomeDay.calendar.timeZone)
    }
}

private struct AdminRequestsView: View {
    @Bindable var store: PortalStore
    @State private var kind = "all"
    @State private var status = "all"
    @State private var showFilters = false

    private var requests: [ServiceRequest] {
        store.visibleRequests.filter {
            (kind == "all" || $0.kind.rawValue == kind) && (status == "all" || $0.status.rawValue == status)
        }.sorted {
            if $0.serviceDate != $1.serviceDate { return $0.serviceDate < $1.serviceDate }
            if $0.time != $1.time { return $0.time < $1.time }
            return $0.createdAt > $1.createdAt
        }
    }

    var body: some View {
        NavigationStack {
            List {
                Section {
                    let pending = store.visibleRequests.filter { $0.status == .pending }.count
                    VStack(alignment: .leading, spacing: 10) {
                        Text(pending == 0 ? "Tutto sotto controllo." : "\(pending) da gestire.")
                            .font(.system(.title, design: .serif).weight(.medium)).foregroundStyle(FeniceTheme.cobalt)
                        Text("\(store.visibleRequests.filter { $0.serviceDate == store.today && $0.status != .cancelled && $0.status != .rejected }.count) servizi oggi · \(store.state.stays.filter { $0.active && $0.checkIn <= store.today && $0.checkOut > store.today }.count) soggiorni in corso")
                            .font(.subheadline).foregroundStyle(.secondary)
                        if pending > 0 {
                            Button("Vedi richieste in attesa", systemImage: "tray") { status = RequestStatus.pending.rawValue; kind = "all" }
                                .buttonStyle(FenicePrimaryButtonStyle())
                        } else {
                            Text("Le nuove richieste compariranno qui.").font(.subheadline).foregroundStyle(.secondary)
                        }
                    }.padding(.vertical, 8)
                }
                Section {
                  DisclosureGroup("\(kind == "all" ? "Tutti i tipi" : AdminCopy.kind(ServiceKind(rawValue: kind) ?? .order)) · \(status == "all" ? "Tutti gli stati" : AdminCopy.status(RequestStatus(rawValue: status) ?? .pending))", isExpanded: $showFilters) {
                    Picker("Tipo", selection: $kind) {
                        Text("Tutti").tag("all")
                        ForEach(ServiceKind.allCases, id: \.rawValue) { item in
                            Text(AdminCopy.kind(item)).tag(item.rawValue)
                        }
                    }
                    Picker("Stato", selection: $status) {
                        Text("Tutti").tag("all")
                        ForEach(RequestStatus.allCases, id: \.rawValue) { item in
                            Text(AdminCopy.status(item)).tag(item.rawValue)
                        }
                    }
                    if status != "all" || kind != "all" {
                        Button("Mostra tutte le richieste") { status = "all"; kind = "all" }.frame(minHeight: 44)
                    }
                  }
                }
                Section("Coda richieste") {
                    if requests.isEmpty {
                        ContentUnavailableView("Nessuna richiesta", systemImage: "tray", description: Text("Le richieste degli ospiti compariranno qui. Puoi cambiare i filtri."))
                    }
                    ForEach(requests) { request in
                        NavigationLink {
                            AdminRequestDetail(store: store, request: request)
                        } label: {
                            VStack(alignment: .leading, spacing: 5) {
                                Text(request.title(store.locale)).font(.headline)
                                if let stay = store.state.stays.first(where: { $0.id == request.stayID }) {
                                    Text("\(stay.guestName) · \(stay.room)").font(.subheadline)
                                }
                                Text("\(AdminCopy.day(request.serviceDate)) · \(request.time)").font(.subheadline).foregroundStyle(.secondary)
                                RequestStatusBadge(status: request.status)
                            }
                            .padding(.vertical, 4)
                        }
                    }
                }
            }
            .navigationTitle("Richieste")
            .navigationBarTitleDisplayMode(.inline)
            .scrollContentBackground(.hidden)
            .background(FeniceTheme.paper)
            .toolbar { ToolbarItem(placement: .topBarTrailing) { AdminAccountMenu(store: store) } }
        }
    }
}

private struct AdminRequestDetail: View {
    @Bindable var store: PortalStore
    let initialRequest: ServiceRequest
    @State private var status: RequestStatus
    @State private var staffNote: String
    @State private var confirmation = false
    @State private var error: String?
    @State private var saved = false

    init(store: PortalStore, request: ServiceRequest) {
        self.store = store
        initialRequest = request
        _status = State(initialValue: request.status)
        _staffNote = State(initialValue: request.staffNote)
    }

    private var request: ServiceRequest { store.visibleRequests.first { $0.id == initialRequest.id } ?? initialRequest }

    var body: some View {
        Form {
            Section("Richiesta") {
                Text(request.title(store.locale)).font(.headline)
                RequestStatusBadge(status: request.status)
                LabeledContent("Giorno", value: AdminCopy.day(request.serviceDate))
                LabeledContent("Orario", value: request.time)
                if let location = request.location { LabeledContent("Consegna", value: AdminCopy.location(location)) }
                if let participants = request.participants { LabeledContent("Partecipanti", value: "\(participants)") }
                if !request.notes.isEmpty { LabeledContent("Note ospite", value: request.notes) }
            }
            if let stay = store.state.stays.first(where: { $0.id == request.stayID }) {
                Section("Soggiorno") {
                    LabeledContent("Ospite", value: stay.guestName)
                    LabeledContent("Camera", value: stay.room)
                    LabeledContent("Date", value: "\(AdminCopy.day(stay.checkIn)) – \(AdminCopy.day(stay.checkOut))")
                    if !stay.active { Text("Accesso ospite disattivato").foregroundStyle(.secondary) }
                }
            }
            if !request.lines.isEmpty {
                Section("Ordine") {
                    ForEach(request.lines) { line in
                        VStack(alignment: .leading, spacing: 4) {
                            Text("\(line.quantity) × \(line.title(store.locale))")
                            Text(line.priceCents.map { "\(AdminCopy.price($0)) cad." } ?? "Prezzo da confermare")
                                .font(.subheadline).foregroundStyle(.secondary)
                        }
                    }
                    LabeledContent("Totale", value: request.totalCents.map(AdminCopy.price) ?? "Da confermare")
                }
            }
            Section {
                Picker("Stato", selection: $status) {
                    ForEach([request.status] + request.status.next, id: \.rawValue) { value in
                        Text(AdminCopy.status(value)).tag(value)
                    }
                }
                .disabled(request.status.next.isEmpty)
                TextField("Nota visibile all’ospite", text: $staffNote, axis: .vertical).lineLimit(3...8)
                Button("Salva modifiche") {
                    if status != request.status { confirmation = true } else { save() }
                }
                .buttonStyle(FenicePrimaryButtonStyle())
                .disabled(status == request.status && staffNote == request.staffNote)
                if saved { Label("Aggiornamento salvato nella demo locale", systemImage: "checkmark.circle").foregroundStyle(.secondary) }
            } header: {
                Text("Gestione")
            } footer: {
                Text(request.status.next.isEmpty ? "La richiesta è conclusa. Puoi aggiornare soltanto la nota." : "La nota è visibile all’ospite. Le modifiche rimangono su questo dispositivo.")
            }
        }
        .navigationTitle("Dettaglio richiesta")
        .navigationBarTitleDisplayMode(.inline)
        .confirmationDialog("Impostare lo stato «\(AdminCopy.status(status))»?", isPresented: $confirmation, titleVisibility: .visible) {
            Button("Conferma modifica", role: status == .cancelled || status == .rejected ? .destructive : nil) { save() }
        } message: {
            Text("Le richieste annullate, rifiutate o completate non possono essere riaperte.")
        }
        .alert("Modifica non salvata", isPresented: AdminCopy.errorBinding($error)) { Button("OK") { error = nil } } message: { Text(error ?? "") }
    }

    private func save() {
        do {
            try store.updateRequest(id: request.id, status: status, staffNote: staffNote)
            staffNote = request.staffNote
            saved = true
        } catch { self.error = error.localizedDescription; saved = false }
    }
}

private struct AdminStaysView: View {
    @Bindable var store: PortalStore
    @State private var search = ""
    @State private var creating = false

    private var stays: [Stay] {
        store.state.stays.filter { search.isEmpty || "\($0.surname) \($0.guestName) \($0.room)".localizedCaseInsensitiveContains(search) }
            .sorted { $0.checkIn > $1.checkIn }
    }

    var body: some View {
        NavigationStack {
            List {
                if stays.isEmpty { ContentUnavailableView.search(text: search) }
                ForEach(stays) { stay in
                    NavigationLink { AdminStayDetail(store: store, stay: stay) } label: {
                        VStack(alignment: .leading, spacing: 5) {
                            Text(stay.guestName).font(.headline)
                            Text("\(stay.room) · \(stay.guests) ospiti")
                            Text("\(AdminCopy.day(stay.checkIn)) – \(AdminCopy.day(stay.checkOut))").font(.subheadline).foregroundStyle(.secondary)
                            if !stay.active { Label("Accesso disattivato", systemImage: "lock").font(.caption) }
                        }.padding(.vertical, 4)
                    }
                }
            }
            .searchable(text: $search, prompt: "Cognome o camera")
            .navigationTitle("Soggiorni")
            .toolbar {
                ToolbarItem(placement: .topBarLeading) { AdminAccountMenu(store: store) }
                ToolbarItem(placement: .topBarTrailing) { Button("Aggiungi", systemImage: "plus") { creating = true } }
            }
            .sheet(isPresented: $creating) { AdminStayForm(store: store, stay: nil) }
        }
    }
}

private struct AdminStayDetail: View {
    @Bindable var store: PortalStore
    let initialStay: Stay
    @State private var editing = false
    @State private var resetConfirmation = false
    @State private var disableConfirmation = false
    @State private var credential: IssuedCredential?
    @State private var error: String?

    init(store: PortalStore, stay: Stay) { self.store = store; initialStay = stay }
    private var stay: Stay { store.state.stays.first { $0.id == initialStay.id } ?? initialStay }

    var body: some View {
        Form {
            Section("Soggiorno") {
                LabeledContent("Cognome", value: stay.surname)
                LabeledContent("Ospite", value: stay.guestName)
                LabeledContent("Camera", value: stay.room)
                LabeledContent("Ospiti", value: "\(stay.guests)")
                LabeledContent("Arrivo", value: AdminCopy.day(stay.checkIn))
                LabeledContent("Partenza", value: AdminCopy.day(stay.checkOut))
                LabeledContent("Lingua", value: stay.locale.title)
                Button("Modifica soggiorno") { editing = true }
            }
            Section {
                LabeledContent("Stato accesso", value: stay.active ? "Attivo" : "Disattivato")
                if let account = store.state.accounts.first(where: { $0.stayID == stay.id }) {
                    LabeledContent("Codice", value: account.loginCode).textSelection(.enabled)
                }
                Button("Genera nuova password") { resetConfirmation = true }
                if stay.active {
                    Button("Disattiva accesso", role: .destructive) { disableConfirmation = true }
                } else {
                    Button("Riattiva accesso") { setActive(true) }
                }
            } header: { Text("Accesso ospite") } footer: {
                Text("La password è mostrata soltanto dopo la creazione o il reset. Disattivare l’accesso non elimina il soggiorno o le richieste.")
            }
            Section("Richieste del soggiorno") {
                let requests = store.visibleRequests.filter { $0.stayID == stay.id }
                if requests.isEmpty { Text("Nessuna richiesta").foregroundStyle(.secondary) }
                ForEach(requests) { request in
                    NavigationLink { AdminRequestDetail(store: store, request: request) } label: {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(request.title(store.locale))
                            Text("\(AdminCopy.day(request.serviceDate)) · \(AdminCopy.status(request.status))").font(.subheadline).foregroundStyle(.secondary)
                        }
                    }
                }
            }
        }
        .navigationTitle(stay.guestName)
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $editing) { AdminStayForm(store: store, stay: stay) }
        .sheet(item: $credential) { AdminCredentialView(credential: $0) }
        .confirmationDialog("Generare una nuova password?", isPresented: $resetConfirmation, titleVisibility: .visible) {
            Button("Genera password", role: .destructive) {
                do { credential = try store.resetPassword(stayID: stay.id) } catch { self.error = error.localizedDescription }
            }
        } message: { Text("La password precedente non funzionerà più. La nuova sarà mostrata una sola volta.") }
        .confirmationDialog("Disattivare l’accesso di questo ospite?", isPresented: $disableConfirmation, titleVisibility: .visible) {
            Button("Disattiva accesso", role: .destructive) { setActive(false) }
        } message: { Text("L’ospite non potrà accedere. Le richieste e il soggiorno rimarranno disponibili all’admin.") }
        .alert("Modifica non salvata", isPresented: AdminCopy.errorBinding($error)) { Button("OK") { error = nil } } message: { Text(error ?? "") }
    }

    private func setActive(_ active: Bool) {
        do { try store.setStayActive(id: stay.id, active: active) } catch { self.error = error.localizedDescription }
    }
}

private struct AdminCatalogView: View {
    @Bindable var store: PortalStore
    @State private var kind = CatalogKind.product
    @State private var search = ""
    @State private var editing: CatalogItem?
    @State private var toggleItem: CatalogItem?
    @State private var confirmToggle = false
    @State private var error: String?

    private var items: [CatalogItem] {
        store.state.catalog.filter { $0.kind == kind && (search.isEmpty || $0.title(store.locale).localizedCaseInsensitiveContains(search)) }
            .sorted { $0.sortOrder == $1.sortOrder ? $0.title(store.locale) < $1.title(store.locale) : $0.sortOrder < $1.sortOrder }
    }

    var body: some View {
        NavigationStack {
            List {
                Section {
                    Picker("Tipo di contenuto", selection: $kind) {
                        ForEach(CatalogKind.allCases, id: \.rawValue) { Text(AdminCopy.catalogKind($0)).tag($0) }
                    }
                }
                Section {
                    if items.isEmpty { ContentUnavailableView("Nessun contenuto", systemImage: "list.bullet.rectangle", description: Text("Cambia la ricerca o aggiungi un contenuto.")) }
                    ForEach(items) { item in
                        Button { editing = item } label: {
                            VStack(alignment: .leading, spacing: 5) {
                                Text(item.title(store.locale)).font(.headline).foregroundStyle(.primary)
                                Text(AdminCopy.category(item.category)).font(.subheadline).foregroundStyle(.secondary)
                                Text(item.active ? "Attivo" : "Disattivato").font(.caption.weight(.medium)).foregroundStyle(.secondary)
                            }.padding(.vertical, 4).frame(maxWidth: .infinity, alignment: .leading)
                        }
                        .contextMenu {
                            Button("Modifica", systemImage: "pencil") { editing = item }
                            Button(item.active ? "Disattiva" : "Riattiva", systemImage: item.active ? "pause.circle" : "play.circle", role: item.active ? .destructive : nil) {
                                toggleItem = item
                                if item.active { confirmToggle = true } else { toggle() }
                            }
                        }
                    }
                } footer: { Text("Le modifiche riguardano soltanto la demo locale, non il sito pubblico.") }
            }
            .searchable(text: $search, prompt: "Cerca nel catalogo")
            .navigationTitle("Catalogo")
            .toolbar {
                ToolbarItem(placement: .topBarLeading) { AdminAccountMenu(store: store) }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Aggiungi", systemImage: "plus") {
                        let category: String = switch kind { case .product: "food"; case .activity: "other"; case .guide: "see" }
                        editing = CatalogItem(kind: kind, category: category, labels: [:], sortOrder: min(100_000, (store.state.catalog.map(\.sortOrder).max() ?? 0) + 10))
                    }
                }
            }
            .sheet(item: $editing) { AdminCatalogForm(store: store, item: $0) }
            .confirmationDialog("Disattivare questo contenuto?", isPresented: $confirmToggle, titleVisibility: .visible) {
                Button("Disattiva", role: .destructive) { toggle() }
            } message: { Text("Non sarà più disponibile per nuove richieste. Lo storico rimarrà invariato.") }
            .alert("Modifica non salvata", isPresented: AdminCopy.errorBinding($error)) { Button("OK") { error = nil } } message: { Text(error ?? "") }
        }
    }

    private func toggle() {
        guard let item = toggleItem else { return }
        do { try store.setItemActive(id: item.id, active: !item.active); toggleItem = nil } catch { self.error = error.localizedDescription }
    }
}

private struct AdminAccountMenu: View {
    @Bindable var store: PortalStore
    @State private var error: String?
    @State private var logoutConfirmation = false

    var body: some View {
        Menu {
            Menu("Lingua dei contenuti") {
                ForEach(PortalLocale.allCases) { locale in
                    Button(locale.title, systemImage: store.locale == locale ? "checkmark" : "globe") {
                        do { try store.setLocale(locale) } catch { self.error = error.localizedDescription }
                    }
                }
            }
            Button("Esci", systemImage: "rectangle.portrait.and.arrow.right", role: .destructive) { logoutConfirmation = true }
        } label: { Label("Account admin", systemImage: "person.crop.circle") }
        .confirmationDialog("Uscire dall’account admin?", isPresented: $logoutConfirmation, titleVisibility: .visible) {
            Button("Esci", role: .destructive) { store.logout() }
        }
        .alert("Modifica non salvata", isPresented: AdminCopy.errorBinding($error)) { Button("OK") { error = nil } } message: { Text(error ?? "") }
    }
}

enum AdminCopy {
    static func status(_ value: RequestStatus) -> String {
        switch value { case .pending: "In attesa"; case .confirmed: "Confermata"; case .rejected: "Rifiutata"; case .fulfilled: "Completata"; case .cancelled: "Annullata" }
    }
    static func kind(_ value: ServiceKind) -> String {
        switch value { case .order: "Ordini"; case .activity: "Esperienze"; case .guide: "Guida" }
    }
    static func catalogKind(_ value: CatalogKind) -> String {
        switch value { case .product: "Prodotti"; case .activity: "Esperienze"; case .guide: "Guida" }
    }
    static func location(_ value: DeliveryLocation) -> String {
        switch value { case .room: "Camera"; case .pool: "Piscina"; case .beach: "Spiaggia" }
    }
    static func category(_ value: String) -> String {
        ["food": "Cibo", "classic-drink": "Drink", "wine": "Vini", "champagne": "Champagne", "raw-fish": "Crudo di pesce", "fishing": "Pesca", "boat-trip": "Gita in barca", "lemon-grove": "Limonaia", "other": "Altre esperienze", "dining": "Mangiare", "after-dark": "La sera", "sea": "Mare", "see": "Da vedere", "getting-around": "Spostarsi", "essentials": "Servizi utili"][value] ?? value
    }
    static func price(_ cents: Int) -> String { (Decimal(cents) / 100).formatted(.currency(code: "EUR").locale(Locale(identifier: "it_IT"))) }
    static func day(_ value: String) -> String {
        guard let date = RomeDay.date(value) else { return value }
        return date.formatted(Date.FormatStyle(date: .abbreviated, time: .omitted, locale: Locale(identifier: "it_IT"), calendar: RomeDay.calendar, timeZone: RomeDay.calendar.timeZone))
    }
    static func errorBinding(_ error: Binding<String?>) -> Binding<Bool> { Binding(get: { error.wrappedValue != nil }, set: { if !$0 { error.wrappedValue = nil } }) }
}
