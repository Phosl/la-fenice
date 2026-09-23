import SwiftUI

struct GuestOrderView: View {
    @Bindable var store: PortalStore
    @Binding var date: Date
    @State private var quantities: [String: Int] = [:]
    @State private var location = DeliveryLocation.room
    @State private var time = Date().addingTimeInterval(3_600)
    @State private var notes = ""
    @State private var clientRequestID = UUID().uuidString
    @State private var review: OrderDraft?

    private var products: [CatalogItem] { store.activeCatalog(.product) }
    private var count: Int { quantities.values.reduce(0, +) }
    private var orderable: Bool { store.stay.map { RomeDay.orderable(RomeDay.key(date), stay: $0, now: store.now) } ?? false }
    private var futureTime: Bool { guestFutureTime(date: date, time: time, now: store.now) }

    var body: some View {
        Form {
            Section("Giorno e consegna") {
                GuestServiceDatePicker(stay: store.stay, now: store.now, date: $date)
                Picker("Dove", selection: $location) {
                    ForEach(DeliveryLocation.allCases, id: \.self) { Text(guestLocation($0)).tag($0) }
                }
                DatePicker("Orario preferito", selection: $time, displayedComponents: .hourAndMinute)
                if orderable && !futureTime { Text("Per oggi scegli un orario successivo a quello attuale.").font(.footnote).foregroundStyle(.red) }
                Text("Orario e disponibilità sono da confermare. Segnala eventuali allergie direttamente alla struttura prima di ordinare.")
                    .font(.footnote).foregroundStyle(.secondary)
            }
            ForEach(CatalogItem.productCategories, id: \.self) { category in
                let items = products.filter { $0.category == category }
                if !items.isEmpty {
                    Section(guestCategory(category)) {
                        ForEach(items) { item in
                            Stepper(value: Binding(get: { quantities[item.id, default: 0] }, set: { quantities[item.id] = $0 }), in: 0...20) {
                                VStack(alignment: .leading, spacing: 6) {
                                    Text("\(item.title(store.locale)) · \(quantities[item.id, default: 0])").font(.headline)
                                    if !item.detail(store.locale).isEmpty { Text(item.detail(store.locale)).font(.caption).foregroundStyle(.secondary) }
                                    Text(guestPrice(item.priceCents)).font(.caption)
                                }.padding(.vertical, 5)
                            }
                            .accessibilityLabel(item.title(store.locale))
                            .accessibilityValue("\(quantities[item.id, default: 0])")
                            .accessibilityIdentifier("guest.order.quantity.\(item.slug)")
                        }
                    }
                }
            }
            if products.isEmpty { ContentUnavailableView("Menu non disponibile", systemImage: "fork.knife") }
            Section("Note") {
                TextField("Preferenze o indicazioni", text: $notes, axis: .vertical).lineLimit(3...6)
                Text("Massimo 1.000 caratteri. Non inserire dati sanitari o altre informazioni sensibili.").font(.footnote).foregroundStyle(.secondary)
                if notes.count > 1_000 { Text("Riduci la nota a 1.000 caratteri per proseguire.").font(.footnote).foregroundStyle(.red) }
            }
            Section {
                LabeledContent("Articoli selezionati", value: "\(count)")
                Button("Rivedi ordine") {
                    review = OrderDraft(id: clientRequestID, date: RomeDay.key(date), time: guestTime(time), location: location, notes: notes, quantities: quantities.filter { $0.value > 0 }, lines: products.compactMap { item in
                        let quantity = quantities[item.id, default: 0]
                        return quantity > 0 ? OrderLine(itemID: item.id, labels: item.labels, quantity: quantity, priceCents: item.priceCents) : nil
                    })
                }
                .buttonStyle(.borderedProminent).controlSize(.large).frame(maxWidth: .infinity, minHeight: 44)
                .disabled(count == 0 || !orderable || !futureTime || notes.count > 1_000)
                .accessibilityIdentifier("guest.order.review")
            } footer: { Text("Nessun pagamento nell’app. I prezzi non indicati devono essere confermati dalla struttura.") }
        }
        .navigationTitle("Ordina")
        .sheet(item: $review) { draft in
            GuestReviewSheet(title: "Rivedi ordine") {
                Section("La tua scelta") {
                    ForEach(draft.lines) { line in
                        LabeledContent("\(line.quantity) × \(line.title(store.locale))", value: guestPrice(line.priceCents.map { $0 * line.quantity }))
                    }
                    let total = draft.lines.allSatisfy { $0.priceCents != nil } ? draft.lines.reduce(0) { $0 + ($1.priceCents ?? 0) * $1.quantity } : nil
                    LabeledContent("Totale", value: guestPrice(total))
                }
                Section("Consegna richiesta") {
                    LabeledContent("Giorno", value: guestDate(draft.date))
                    LabeledContent("Orario preferito", value: draft.time)
                    LabeledContent("Dove", value: guestLocation(draft.location))
                    if !draft.notes.isEmpty { Text(draft.notes) }
                }
            } onConfirm: {
                _ = try store.submitOrder(date: draft.date, location: draft.location, time: draft.time, notes: draft.notes, quantities: draft.quantities, clientRequestID: draft.id)
                quantities = [:]
                notes = ""
                clientRequestID = UUID().uuidString
            }
        }
    }
}

private struct OrderDraft: Identifiable {
    let id: String
    let date: String
    let time: String
    let location: DeliveryLocation
    let notes: String
    let quantities: [String: Int]
    let lines: [OrderLine]
}

struct GuestExperienceForm: View {
    @Bindable var store: PortalStore
    let item: CatalogItem
    let initialDate: Date
    @State private var date = Date()
    @State private var time = Date().addingTimeInterval(3_600)
    @State private var participants = 1
    @State private var notes = ""
    @State private var clientRequestID = UUID().uuidString
    @State private var review: ExperienceDraft?
    @State private var initialized = false
    private var orderable: Bool { store.stay.map { RomeDay.orderable(RomeDay.key(date), stay: $0, now: store.now) } ?? false }
    private var futureTime: Bool { guestFutureTime(date: date, time: time, now: store.now) }

    var body: some View {
        Form {
            Section {
                Text(item.title(store.locale)).font(.title2.weight(.semibold))
                if !item.detail(store.locale).isEmpty { Text(item.detail(store.locale)).foregroundStyle(.secondary) }
                Text(guestPrice(item.priceCents)).font(.footnote)
                if let note = item.bookingNote?[store.locale.rawValue] ?? item.bookingNote?["en"], !note.isEmpty { Text(note).font(.footnote) }
            }
            Section {
                GuestServiceDatePicker(stay: store.stay, now: store.now, date: $date)
                DatePicker("Orario preferito", selection: $time, displayedComponents: .hourAndMinute)
                if orderable && !futureTime { Text("Per oggi scegli un orario successivo a quello attuale.").font(.footnote).foregroundStyle(.red) }
                Stepper("Partecipanti: \(participants)", value: $participants, in: 1...max(1, store.stay?.guests ?? 1))
                TextField("Note per lo staff", text: $notes, axis: .vertical).lineLimit(3...6)
                if notes.count > 1_000 { Text("Riduci la nota a 1.000 caratteri per proseguire.").font(.footnote).foregroundStyle(.red) }
            } header: { Text("La tua preferenza") }
                footer: { Text("Massimo 1.000 caratteri. Orari, disponibilità e condizioni sono da confermare; la richiesta non equivale a una prenotazione.") }
            Section {
                Button("Rivedi richiesta") {
                    review = ExperienceDraft(id: clientRequestID, date: RomeDay.key(date), time: guestTime(time), participants: participants, notes: notes)
                }
                .buttonStyle(.borderedProminent).controlSize(.large).frame(maxWidth: .infinity, minHeight: 44)
                .disabled(!orderable || !futureTime || notes.count > 1_000 || (item.kind == .guide && item.requestable != true))
                .accessibilityIdentifier("guest.experience.review")
            }
        }
        .navigationTitle(item.kind == .guide ? "Richiedi assistenza" : "Richiedi esperienza")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear {
            guard !initialized else { return }
            initialized = true
            date = initialDate
            if let stay = store.stay, let first = RomeDay.date(max(store.today, stay.checkIn)), !RomeDay.orderable(RomeDay.key(initialDate), stay: stay, now: store.now) { date = first }
        }
        .sheet(item: $review) { draft in
            GuestReviewSheet(title: "Rivedi richiesta") {
                Section {
                    Text(item.title(store.locale)).font(.headline)
                    LabeledContent("Giorno", value: guestDate(draft.date))
                    LabeledContent("Orario preferito", value: draft.time)
                    LabeledContent("Partecipanti", value: "\(draft.participants)")
                    Text(guestPrice(item.priceCents))
                    if !draft.notes.isEmpty { Text(draft.notes) }
                }
            } onConfirm: {
                _ = try store.submitExperience(itemID: item.id, date: draft.date, time: draft.time, participants: draft.participants, notes: draft.notes, clientRequestID: draft.id)
                notes = ""
                clientRequestID = UUID().uuidString
            }
        }
    }
}

private struct ExperienceDraft: Identifiable {
    let id: String
    let date: String
    let time: String
    let participants: Int
    let notes: String
}

private struct GuestServiceDatePicker: View {
    let stay: Stay?
    let now: Date
    @Binding var date: Date

    var body: some View {
        if let stay, let first = RomeDay.date(max(RomeDay.key(now), stay.checkIn)),
           let checkout = RomeDay.date(stay.checkOut), first < checkout, stay.active {
            DatePicker("Giorno", selection: $date, in: first...RomeDay.adding(-1, to: checkout), displayedComponents: .date)
                .accessibilityIdentifier("guest.service.date")
            if !RomeDay.orderable(RomeDay.key(date), stay: stay, now: now) {
                Text("Scegli un giorno valido, da oggi fino al giorno prima del check-out.").font(.footnote).foregroundStyle(.red)
            }
        } else {
            Text("Non ci sono giorni disponibili per nuove richieste in questo soggiorno.")
                .foregroundStyle(.secondary)
        }
    }
}

private struct GuestReviewSheet<Details: View>: View {
    let title: String
    @ViewBuilder var details: () -> Details
    let onConfirm: () throws -> Void
    @Environment(\.dismiss) private var dismiss
    @State private var saved = false
    @State private var error: String?

    var body: some View {
        NavigationStack {
            Group {
                if saved {
                    ContentUnavailableView {
                        Label("Salvata nella demo locale", systemImage: "checkmark.circle")
                    } description: {
                        Text("Salvata nella demo locale. Nessuna richiesta inviata alla struttura. Puoi ritrovarla nella sezione Richieste.")
                    } actions: {
                        Button("Chiudi") { dismiss() }.buttonStyle(.borderedProminent).controlSize(.large).frame(minHeight: 44)
                    }
                    .accessibilityIdentifier("guest.request.saved")
                } else {
                    Form {
                        details()
                        Section {
                            Text("Confermando salvi una richiesta in attesa nella demo su questo dispositivo. Non viene inviata alla struttura e non conferma disponibilità o prenotazioni.")
                                .font(.callout)
                            Button("Conferma nella demo") {
                                do { try onConfirm(); saved = true } catch { self.error = error.localizedDescription }
                            }
                            .buttonStyle(.borderedProminent).controlSize(.large).frame(maxWidth: .infinity, minHeight: 44)
                            .accessibilityIdentifier("guest.request.confirm")
                        }
                    }
                }
            }
            .navigationTitle(saved ? "Richiesta salvata" : title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button(saved ? "Chiudi" : "Indietro") { dismiss() } }
            }
            .alert("Salvataggio non riuscito", isPresented: guestErrorBinding($error)) {
                Button("OK", role: .cancel) { error = nil }
            } message: { Text(error ?? "Il carrello è stato conservato. Riprova.") }
        }
        .tint(FeniceTheme.cobalt)
    }
}

private func guestTime(_ date: Date) -> String {
    let parts = RomeDay.calendar.dateComponents([.hour, .minute], from: date)
    return String(format: "%02d:%02d", parts.hour ?? 0, parts.minute ?? 0)
}

private func guestFutureTime(date: Date, time: Date, now: Date) -> Bool {
    RomeDay.key(date) > RomeDay.key(now) || (RomeDay.key(date) == RomeDay.key(now) && guestTime(time) > guestTime(now))
}
