import SwiftUI

struct AdminStayForm: View {
    @Bindable var store: PortalStore
    let original: Stay?
    @Environment(\.dismiss) private var dismiss
    @State private var surname: String
    @State private var guestName: String
    @State private var room: String
    @State private var guests: Int
    @State private var checkIn: Date
    @State private var checkOut: Date
    @State private var locale: PortalLocale
    @State private var credential: IssuedCredential?
    @State private var created = false
    @State private var error: String?

    init(store: PortalStore, stay: Stay?) {
        self.store = store
        original = stay
        _surname = State(initialValue: stay?.surname ?? "")
        _guestName = State(initialValue: stay?.guestName ?? "")
        _room = State(initialValue: stay?.room ?? "")
        _guests = State(initialValue: stay?.guests ?? 2)
        _checkIn = State(initialValue: stay.flatMap { RomeDay.date($0.checkIn) } ?? store.now)
        _checkOut = State(initialValue: stay.flatMap { RomeDay.date($0.checkOut) } ?? RomeDay.adding(3, to: store.now))
        _locale = State(initialValue: stay?.locale ?? .it)
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("Ospite") {
                    TextField("Cognome", text: $surname).textContentType(.familyName)
                    TextField("Nome da mostrare", text: $guestName).textContentType(.name)
                    TextField("Camera", text: $room)
                    Stepper("Ospiti: \(guests)", value: $guests, in: 1...20)
                    Picker("Lingua", selection: $locale) {
                        ForEach(PortalLocale.allCases) { Text($0.title).tag($0) }
                    }
                }
                Section {
                    DatePicker("Arrivo", selection: $checkIn, displayedComponents: .date)
                    DatePicker("Partenza", selection: $checkOut, displayedComponents: .date)
                } header: { Text("Date del soggiorno") } footer: {
                    Text("Da 1 a 60 notti. I servizi sono richiedibili fino al giorno prima della partenza. Le date devono includere tutte le richieste esistenti.")
                }
                Section {
                    Text(original == nil ? "Dopo il salvataggio saranno mostrati codice e password. Usa soltanto dati fittizi: questa è una demo locale." : "La modifica non cambia il codice o la password dell’ospite.")
                        .foregroundStyle(.secondary)
                }
            }
            .environment(\.timeZone, RomeDay.calendar.timeZone)
            .navigationTitle(original == nil ? "Nuovo soggiorno" : "Modifica soggiorno")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Annulla") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Salva") { save() }.disabled([surname, guestName, room].contains { $0.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty } || created)
                }
            }
            .sheet(item: $credential, onDismiss: { if created { dismiss() } }) { AdminCredentialView(credential: $0) }
            .alert("Soggiorno non salvato", isPresented: AdminCopy.errorBinding($error)) { Button("OK") { error = nil } } message: { Text(error ?? "") }
        }
    }

    private func save() {
        do {
            if var stay = original {
                stay.surname = surname
                stay.guestName = guestName
                stay.room = room
                stay.guests = guests
                stay.checkIn = RomeDay.key(checkIn)
                stay.checkOut = RomeDay.key(checkOut)
                stay.locale = locale
                try store.updateStay(stay)
                dismiss()
            } else {
                credential = try store.createStay(surname: surname, guestName: guestName, room: room, guests: guests, checkIn: RomeDay.key(checkIn), checkOut: RomeDay.key(checkOut), locale: locale)
                created = true
            }
        } catch { self.error = error.localizedDescription }
    }
}

struct AdminCredentialView: View {
    let credential: IssuedCredential
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    Label("Credenziali create", systemImage: "key.fill").font(.headline).foregroundStyle(FeniceTheme.cobalt)
                    Text("La password non potrà essere visualizzata di nuovo. Annotala prima di chiudere; puoi generarne una nuova dal soggiorno.")
                }
                Section("Accesso alla demo locale") {
                    LabeledContent("Codice", value: credential.loginCode)
                    LabeledContent("Password", value: credential.password)
                }
                .font(.body.monospaced())
                .textSelection(.enabled)
                Section { Text("Queste credenziali funzionano soltanto in questa installazione dell’app. Nessun messaggio è stato inviato.").foregroundStyle(.secondary) }
            }
            .navigationTitle("Credenziali ospite")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .confirmationAction) { Button("Ho annotato, chiudi") { dismiss() } } }
            .interactiveDismissDisabled()
        }
    }
}

struct AdminCatalogForm: View {
    @Bindable var store: PortalStore
    let original: CatalogItem
    @Environment(\.dismiss) private var dismiss
    @State private var item: CatalogItem
    @State private var price: String
    @State private var verifiedAt: Date
    @State private var error: String?
    @State private var confirmDeactivation = false

    init(store: PortalStore, item: CatalogItem) {
        self.store = store
        original = item
        _item = State(initialValue: item)
        _price = State(initialValue: item.priceCents.map { String(format: "%d,%02d", $0 / 100, $0 % 100) } ?? "")
        _verifiedAt = State(initialValue: item.verifiedAt.flatMap { RomeDay.date(String($0.prefix(10))) } ?? store.now)
    }

    private var existing: Bool { store.state.catalog.contains { $0.id == original.id } }

    var body: some View {
        NavigationStack {
            Form {
                Section("Contenuto") {
                    LabeledContent("Tipo", value: AdminCopy.catalogKind(item.kind))
                    Picker("Categoria", selection: $item.category) {
                        ForEach(item.categories, id: \.self) { Text(AdminCopy.category($0)).tag($0) }
                    }
                    TextField("Ordine di visualizzazione", value: $item.sortOrder, format: .number).keyboardType(.numberPad)
                    Toggle("Visibile agli ospiti", isOn: $item.active)
                }
                Section {
                    ForEach(PortalLocale.allCases) { locale in
                        NavigationLink {
                            Form {
                                Section("Nome obbligatorio") { TextField("Nome", text: labelBinding(locale)) }
                                Section("Descrizione facoltativa") {
                                    TextField("Descrizione", text: descriptionBinding(locale), axis: .vertical).lineLimit(4...12)
                                }
                                if item.kind == .guide {
                                    Section("Nota per la prenotazione") {
                                        TextField("Nota", text: bookingBinding(locale), axis: .vertical).lineLimit(3...8)
                                    }
                                }
                            }
                            .navigationTitle(locale.title)
                            .navigationBarTitleDisplayMode(.inline)
                        } label: {
                            VStack(alignment: .leading, spacing: 4) {
                                Text(locale.title)
                                Text(item.labels[locale.rawValue]?.isEmpty == false ? item.labels[locale.rawValue]! : "Nome da compilare")
                                    .font(.subheadline).foregroundStyle(.secondary)
                            }
                        }
                    }
                } header: { Text("Traduzioni") } footer: {
                    Text("Il nome è obbligatorio in tutte e quattro le lingue. Se aggiungi descrizioni o note, compilale in tutte le lingue.")
                }
                if item.kind != .guide {
                    Section {
                        TextField("Prezzo in EUR, facoltativo", text: $price).keyboardType(.decimalPad)
                    } header: { Text("Prezzo") } footer: {
                        Text("Lascia vuoto per indicare un prezzo da confermare. Zero indica un servizio gratuito.")
                    }
                } else {
                    Section("Informazioni della guida") {
                        TextField("Indirizzo", text: optionalText(\.address))
                        TextField("Telefono", text: optionalText(\.phone)).keyboardType(.phonePad)
                        TextField("Sito ufficiale · https://", text: optionalText(\.websiteUrl)).keyboardType(.URL).textInputAutocapitalization(.never).autocorrectionDisabled()
                        TextField("Link mappa · https://", text: optionalText(\.mapsUrl)).keyboardType(.URL).textInputAutocapitalization(.never).autocorrectionDisabled()
                        Toggle("Consenti richiesta all’admin", isOn: Binding(get: { item.requestable ?? false }, set: { item.requestable = $0 }))
                        DatePicker("Ultima verifica delle informazioni", selection: $verifiedAt, in: ...store.now, displayedComponents: .date)
                    }
                }
            }
            .environment(\.timeZone, RomeDay.calendar.timeZone)
            .navigationTitle(existing ? "Modifica contenuto" : "Nuovo contenuto")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Annulla") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Salva") {
                        if existing && original.active && !item.active { confirmDeactivation = true } else { save() }
                    }
                }
            }
            .confirmationDialog("Salvare e disattivare questo contenuto?", isPresented: $confirmDeactivation, titleVisibility: .visible) {
                Button("Salva e disattiva", role: .destructive) { save() }
            } message: { Text("Non sarà disponibile per nuove richieste. Lo storico rimarrà invariato.") }
            .alert("Contenuto non salvato", isPresented: AdminCopy.errorBinding($error)) { Button("OK") { error = nil } } message: { Text(error ?? "") }
        }
    }

    private func labelBinding(_ locale: PortalLocale) -> Binding<String> {
        Binding(get: { item.labels[locale.rawValue] ?? "" }, set: { item.labels[locale.rawValue] = $0 })
    }
    private func descriptionBinding(_ locale: PortalLocale) -> Binding<String> {
        Binding(get: { item.description?[locale.rawValue] ?? "" }, set: { value in
            if item.description == nil { item.description = [:] }
            item.description?[locale.rawValue] = value
        })
    }
    private func bookingBinding(_ locale: PortalLocale) -> Binding<String> {
        Binding(get: { item.bookingNote?[locale.rawValue] ?? "" }, set: { value in
            if item.bookingNote == nil { item.bookingNote = [:] }
            item.bookingNote?[locale.rawValue] = value
        })
    }
    private func optionalText(_ key: WritableKeyPath<CatalogItem, String?>) -> Binding<String> {
        Binding(get: { item[keyPath: key] ?? "" }, set: { item[keyPath: key] = $0 })
    }

    private func save() {
        do {
            var draft = item
            if draft.kind == .guide {
                draft.priceCents = nil
                draft.requestable = draft.requestable ?? false
                draft.verifiedAt = RomeDay.key(verifiedAt)
            } else {
                let raw = price.trimmingCharacters(in: .whitespacesAndNewlines).replacingOccurrences(of: ",", with: ".")
                if raw.isEmpty { draft.priceCents = nil } else {
                    guard raw.range(of: #"^\d{1,5}(?:\.\d{1,2})?$"#, options: .regularExpression) != nil,
                          let amount = Decimal(string: raw, locale: Locale(identifier: "en_US_POSIX")), amount <= 10_000 else {
                        error = "Inserisci un prezzo da 0 a 10.000 EUR, con al massimo due decimali."
                        return
                    }
                    draft.priceCents = NSDecimalNumber(decimal: amount * 100).intValue
                }
            }
            if draft.description?.values.allSatisfy({ $0.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }) == true { draft.description = nil }
            if draft.bookingNote?.values.allSatisfy({ $0.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }) == true { draft.bookingNote = nil }
            try store.saveItem(draft)
            dismiss()
        } catch { self.error = error.localizedDescription }
    }
}
