import Foundation
import Observation

@MainActor @Observable
final class PortalStore {
    private(set) var state: PortalState
    private(set) var now: Date
    var locale: PortalLocale = .it
    private var session: (id: String, version: Int)?
    @ObservationIgnored private let fileURL: URL?
    @ObservationIgnored private let clock: () -> Date

    var today: String { RomeDay.key(now) }
    var account: PortalAccount? {
        guard let session, let account = state.accounts.first(where: { $0.id == session.id }),
              account.active, account.credentialVersion == session.version else { return nil }
        if account.role == .guest && !state.stays.contains(where: { $0.id == account.stayID && $0.active }) { return nil }
        return account
    }
    var stay: Stay? { state.stays.first { $0.id == account?.stayID } }
    var visibleRequests: [ServiceRequest] {
        guard let account else { return [] }
        return state.requests.filter { account.role == .admin || $0.stayID == account.stayID }
            .sorted { $0.createdAt > $1.createdAt }
    }

    func orderBill(for stayID: String) -> (totalCents: Int?, tipCents: Int, pendingTipCents: Int, orderCount: Int) {
        guard let account, account.role == .admin || account.stayID == stayID,
              state.stays.contains(where: { $0.id == stayID }) else { return (nil, 0, 0, 0) }
        let orders = visibleRequests.filter { $0.stayID == stayID && $0.kind == .order }
        let accepted = orders.filter { $0.status == .confirmed || $0.status == .fulfilled }
        let total = accepted.allSatisfy { $0.totalCents != nil }
            ? accepted.reduce(0) { $0 + ($1.totalCents ?? 0) } : nil
        return (total, accepted.reduce(0) { $0 + $1.gratuityCents },
                orders.filter { $0.status == .pending }.reduce(0) { $0 + $1.gratuityCents }, accepted.count)
    }

    static func openDemo() throws -> PortalStore {
        guard let resource = Bundle.main.url(forResource: "catalog", withExtension: "json") else { throw PortalError.corruptData }
        let catalog = try JSONDecoder().decode([CatalogItem].self, from: Data(contentsOf: resource))
        let directory = try FileManager.default.url(for: .applicationSupportDirectory, in: .userDomainMask, appropriateFor: nil, create: true)
            .appendingPathComponent("LaFenice", isDirectory: true)
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        var excluded = directory
        var values = URLResourceValues()
        values.isExcludedFromBackup = true // Demo data is not a user's real stay record.
        try excluded.setResourceValues(values)
        return try PortalStore(catalog: catalog, fileURL: directory.appendingPathComponent("demo-v1.json"))
    }

    init(catalog: [CatalogItem], fileURL: URL? = nil, clock: @escaping () -> Date = Date.init) throws {
        self.fileURL = fileURL
        self.clock = clock
        let instant = clock()
        now = instant
        if let fileURL, FileManager.default.fileExists(atPath: fileURL.path) {
            do {
                let bytes = try Data(contentsOf: fileURL)
                guard bytes.count <= 20_000_000 else { throw PortalError.corruptData }
                state = try JSONDecoder().decode(PortalState.self, from: bytes)
                try Self.validate(state)
            } catch { throw PortalError.corruptData }
        } else {
            let stay = Stay(surname: "Rossi", guestName: "Famiglia Rossi", room: "Camera 3 · Terrazza mare", guests: 2,
                            checkIn: RomeDay.key(RomeDay.adding(-2, to: instant)), checkOut: RomeDay.key(RomeDay.adding(4, to: instant)), locale: .it)
            state = PortalState(accounts: [
                PortalAccount(loginCode: "CLIENTE", passwordHash: try Password.hash("cliente"), role: .guest, stayID: stay.id),
                PortalAccount(loginCode: "ADMIN", passwordHash: try Password.hash("admin"), role: .admin)
            ], stays: [stay], catalog: catalog)
            try Self.validate(state)
            try persist(state)
        }
    }

    func refreshClock() { now = clock() }

    func login(code: String, password: String, role: PortalRole) throws {
        refreshClock()
        session = nil
        guard let candidate = state.accounts.first(where: { $0.loginCode == Password.normalize(code) }),
              candidate.role == role, candidate.active, Password.verify(password, hash: candidate.passwordHash),
              role == .admin || state.stays.contains(where: { $0.id == candidate.stayID && $0.active }) else { throw PortalError.credentials }
        session = (candidate.id, candidate.credentialVersion)
        if let stay { locale = stay.locale }
    }

    func logout() { session = nil }

    func setLocale(_ locale: PortalLocale) throws {
        if let stay {
            var next = state
            next.stays[next.stays.firstIndex(where: { $0.id == stay.id })!].locale = locale
            try commit(next)
        }
        self.locale = locale
    }

    func activeCatalog(_ kind: CatalogKind) -> [CatalogItem] {
        state.catalog.filter { $0.active && $0.kind == kind }.sorted {
            $0.sortOrder == $1.sortOrder ? $0.id < $1.id : $0.sortOrder < $1.sortOrder
        }
    }

    func submitOrder(date: String, location: DeliveryLocation, time: String, notes: String,
                     quantities: [String: Int], tipCents: Int = 0, clientRequestID: String) throws -> ServiceRequest {
        let stay = try requireGuest()
        if let existing = try repeated(clientRequestID, stay: stay, kind: .order, itemID: nil) { return existing }
        try validateRequest(date: date, time: time, notes: notes, stay: stay)
        guard !quantities.isEmpty, quantities.count <= 100,
              (0...OrderTip.maximumCents).contains(tipCents) else { throw PortalError.invalidInput }
        let lines = try quantities.sorted(by: { $0.key < $1.key }).map { id, quantity in
            guard (1...20).contains(quantity) else { throw PortalError.invalidInput }
            guard let item = state.catalog.first(where: { $0.id == id && $0.active && $0.kind == .product }) else { throw PortalError.unavailable }
            return OrderLine(itemID: id, labels: item.labels, quantity: quantity, priceCents: item.priceCents)
        }
        let request = ServiceRequest(clientRequestID: clientRequestID, stayID: stay.id, kind: .order,
                                     labels: ["it": "Ordine", "en": "Order", "de": "Bestellung", "ru": "Заказ"], lines: lines, tipCents: tipCents,
                                     serviceDate: date, time: time, location: location, notes: notes.trimmingCharacters(in: .whitespacesAndNewlines),
                                     createdAt: now, updatedAt: now)
        return try append(request)
    }

    func submitExperience(itemID: String, date: String, time: String, participants: Int,
                          notes: String, clientRequestID: String) throws -> ServiceRequest {
        let stay = try requireGuest()
        guard let item = state.catalog.first(where: { $0.id == itemID && $0.kind != .product }) else { throw PortalError.unavailable }
        let kind: ServiceKind = item.kind == .guide ? .guide : .activity
        if let existing = try repeated(clientRequestID, stay: stay, kind: kind, itemID: itemID) { return existing }
        guard item.active, item.kind != .guide || item.requestable == true else { throw PortalError.unavailable }
        try validateRequest(date: date, time: time, notes: notes, stay: stay)
        guard (1...stay.guests).contains(participants) else { throw PortalError.invalidInput }
        return try append(ServiceRequest(clientRequestID: clientRequestID, stayID: stay.id, kind: kind, itemID: itemID,
                                         labels: item.labels, serviceDate: date, time: time, participants: participants,
                                         notes: notes.trimmingCharacters(in: .whitespacesAndNewlines), createdAt: now, updatedAt: now))
    }

    func cancelRequest(id: String) throws {
        let stay = try requireGuest()
        guard let index = state.requests.firstIndex(where: { $0.id == id && $0.stayID == stay.id }) else { throw PortalError.unauthorized }
        guard state.requests[index].status == .pending else { throw PortalError.invalidTransition }
        var next = state
        next.requests[index].status = .cancelled
        next.requests[index].updatedAt = now
        try commit(next)
    }

    func updateRequest(id: String, status: RequestStatus, staffNote: String) throws {
        try requireAdmin()
        guard let index = state.requests.firstIndex(where: { $0.id == id }), staffNote.count <= 1_000 else { throw PortalError.invalidInput }
        let current = state.requests[index].status
        guard status == current || current.next.contains(status) else { throw PortalError.invalidTransition }
        var next = state
        next.requests[index].status = status
        next.requests[index].staffNote = staffNote.trimmingCharacters(in: .whitespacesAndNewlines)
        next.requests[index].updatedAt = now
        try commit(next)
    }

    func createStay(surname: String, guestName: String, room: String, guests: Int, checkIn: String,
                    checkOut: String, locale: PortalLocale) throws -> IssuedCredential {
        try requireAdmin()
        let stay = Stay(surname: surname.trimmingCharacters(in: .whitespacesAndNewlines),
                        guestName: guestName.trimmingCharacters(in: .whitespacesAndNewlines),
                        room: room.trimmingCharacters(in: .whitespacesAndNewlines), guests: guests,
                        checkIn: checkIn, checkOut: checkOut, locale: locale)
        try Self.validateStay(stay)
        let code = "OSPITE-" + UUID().uuidString.prefix(8)
        guard !state.accounts.contains(where: { $0.loginCode == code }) else { throw PortalError.duplicateCode }
        let credential = IssuedCredential(loginCode: code, password: try Password.generate())
        var next = state
        next.stays.append(stay)
        next.accounts.append(PortalAccount(loginCode: code, passwordHash: try Password.hash(credential.password), role: .guest, stayID: stay.id))
        try commit(next)
        return credential
    }

    func updateStay(_ stay: Stay) throws {
        try requireAdmin()
        try Self.validateStay(stay)
        guard let index = state.stays.firstIndex(where: { $0.id == stay.id }) else { throw PortalError.invalidInput }
        // Retain history: changing dates/party size must not orphan even a terminal request.
        guard state.requests.filter({ $0.stayID == stay.id }).allSatisfy({
            $0.serviceDate >= stay.checkIn && $0.serviceDate < stay.checkOut && ($0.participants ?? 1) <= stay.guests
        }) else { throw PortalError.invalidStayChange }
        var next = state
        next.stays[index] = stay
        if next.stays[index].active != state.stays[index].active {
            try Self.setActive(&next, stayID: stay.id, active: stay.active)
        }
        try commit(next)
    }

    func setStayActive(id: String, active: Bool) throws {
        try requireAdmin()
        var next = state
        try Self.setActive(&next, stayID: id, active: active)
        try commit(next)
    }

    func resetPassword(stayID: String) throws -> IssuedCredential {
        try requireAdmin()
        guard let index = state.accounts.firstIndex(where: { $0.stayID == stayID && $0.role == .guest }) else { throw PortalError.invalidInput }
        let credential = IssuedCredential(loginCode: state.accounts[index].loginCode, password: try Password.generate())
        var next = state
        next.accounts[index].passwordHash = try Password.hash(credential.password)
        next.accounts[index].credentialVersion += 1
        try commit(next)
        return credential
    }

    func saveItem(_ item: CatalogItem) throws {
        try requireAdmin()
        try Self.validateItem(item)
        var next = state
        if let index = next.catalog.firstIndex(where: { $0.id == item.id }) {
            guard next.catalog[index].kind == item.kind else { throw PortalError.invalidInput }
            next.catalog[index] = item
        } else { next.catalog.append(item) }
        try commit(next)
    }

    func setItemActive(id: String, active: Bool) throws {
        try requireAdmin()
        guard var item = state.catalog.first(where: { $0.id == id }) else { throw PortalError.invalidInput }
        item.active = active
        try saveItem(item)
    }

    private func requireAdmin() throws {
        refreshClock()
        guard account?.role == .admin else { throw PortalError.unauthorized }
    }

    private func requireGuest() throws -> Stay {
        refreshClock()
        guard account?.role == .guest, let stay, stay.active else { throw PortalError.unauthorized }
        return stay
    }

    private func validateRequest(date: String, time: String, notes: String, stay: Stay) throws {
        guard RomeDay.orderable(date, stay: stay, now: now) else { throw PortalError.notOrderable }
        guard notes.count <= 1_000 else { throw PortalError.invalidInput }
        guard let moment = Self.serviceMoment(date: date, time: time), moment > now else { throw PortalError.invalidTime }
    }

    private static func serviceMoment(date: String, time: String) -> Date? {
        guard time.range(of: #"^(?:[01]\d|2[0-3]):[0-5]\d$"#, options: .regularExpression) != nil,
              let day = RomeDay.date(date) else { return nil }
        let parts = time.split(separator: ":").compactMap { Int($0) }
        guard let result = RomeDay.calendar.date(bySettingHour: parts[0], minute: parts[1], second: 0, of: day,
                                                 matchingPolicy: .strict, repeatedTimePolicy: .first, direction: .forward),
              RomeDay.key(result) == date else { return nil }
        return result
    }

    private func repeated(_ id: String, stay: Stay, kind: ServiceKind, itemID: String?) throws -> ServiceRequest? {
        guard UUID(uuidString: id) != nil else { throw PortalError.invalidInput }
        let existing = state.requests.first { $0.stayID == stay.id && $0.clientRequestID == id }
        if let existing, existing.kind != kind || existing.itemID != itemID { throw PortalError.invalidInput }
        return existing
    }

    private func append(_ request: ServiceRequest) throws -> ServiceRequest {
        var next = state
        next.requests.append(request)
        try commit(next)
        return request
    }

    private func commit(_ next: PortalState) throws {
        try Self.validate(next)
        try persist(next) // Publish success only after the atomic write succeeds.
        state = next
    }

    private func persist(_ next: PortalState) throws {
        guard let fileURL else { return }
        do {
            let bytes = try JSONEncoder().encode(next)
            #if os(iOS)
            try bytes.write(to: fileURL, options: [.atomic, .completeFileProtection])
            #else
            try bytes.write(to: fileURL, options: .atomic)
            #endif
        } catch { throw PortalError.persistence }
    }

    private static func setActive(_ next: inout PortalState, stayID: String, active: Bool) throws {
        guard let stayIndex = next.stays.firstIndex(where: { $0.id == stayID }),
              let accountIndex = next.accounts.firstIndex(where: { $0.stayID == stayID }) else { throw PortalError.invalidInput }
        next.stays[stayIndex].active = active
        if next.accounts[accountIndex].active != active { next.accounts[accountIndex].credentialVersion += 1 }
        next.accounts[accountIndex].active = active
    }

    private static func nonempty(_ value: String, max: Int) -> Bool {
        !value.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && value.count <= max
    }

    private static func validateStay(_ stay: Stay) throws {
        guard nonempty(stay.surname, max: 100), nonempty(stay.guestName, max: 160), nonempty(stay.room, max: 100),
              (1...20).contains(stay.guests) else { throw PortalError.invalidInput }
        guard !RomeDay.days(stay).isEmpty else { throw PortalError.invalidDate }
    }

    private static func validateLabels(_ labels: [String: String], max: Int = 160) -> Bool {
        PortalLocale.allCases.allSatisfy { nonempty(labels[$0.rawValue] ?? "", max: max) }
    }

    static func safeWebURL(_ value: String?) -> URL? {
        guard let value, let url = URL(string: value), url.scheme?.lowercased() == "https",
              let host = url.host, !host.isEmpty, url.user == nil, url.password == nil else { return nil }
        return url
    }

    private static func validateItem(_ item: CatalogItem) throws {
        guard nonempty(item.id, max: 120), nonempty(item.slug, max: 160), item.categories.contains(item.category),
              validateLabels(item.labels), (0...100_000).contains(item.sortOrder),
              item.priceCents == nil || (0...1_000_000).contains(item.priceCents!) else { throw PortalError.invalidInput }
        for values in [item.description, item.bookingNote].compactMap({ $0 }) {
            guard validateLabels(values, max: 4_000) else { throw PortalError.invalidInput }
        }
        for value in [item.websiteUrl, item.mapsUrl].compactMap({ $0 }).filter({ !$0.isEmpty }) {
            guard value.count <= 2_048, safeWebURL(value) != nil else { throw PortalError.invalidInput }
        }
        guard (item.address?.count ?? 0) <= 500, (item.phone?.count ?? 0) <= 80,
              item.verifiedAt == nil || item.verifiedAt == "" || RomeDay.date(item.verifiedAt!) != nil else { throw PortalError.invalidInput }
    }

    private static func validate(_ state: PortalState) throws {
        guard state.version == 1, Set(state.accounts.map(\.id)).count == state.accounts.count,
              Set(state.accounts.map(\.loginCode)).count == state.accounts.count,
              Set(state.stays.map(\.id)).count == state.stays.count,
              Set(state.catalog.map(\.id)).count == state.catalog.count,
              Set(state.requests.map(\.id)).count == state.requests.count,
              Set(state.requests.map { "\($0.stayID):\($0.clientRequestID)" }).count == state.requests.count,
              state.accounts.contains(where: { $0.role == .admin && $0.active }) else { throw PortalError.corruptData }
        for account in state.accounts {
            guard nonempty(account.loginCode, max: 120), account.loginCode == Password.normalize(account.loginCode),
                  (1..<Int.max).contains(account.credentialVersion), Password.wellFormed(account.passwordHash),
                  account.role == .admin ? account.stayID == nil : state.stays.contains(where: { $0.id == account.stayID && $0.active == account.active }) else { throw PortalError.corruptData }
        }
        for stay in state.stays {
            try validateStay(stay)
            guard state.accounts.filter({ $0.stayID == stay.id && $0.role == .guest }).count == 1 else { throw PortalError.corruptData }
        }
        for item in state.catalog { try validateItem(item) }
        for request in state.requests {
            guard UUID(uuidString: request.clientRequestID) != nil,
                  let stay = state.stays.first(where: { $0.id == request.stayID }),
                  request.serviceDate >= stay.checkIn, request.serviceDate < stay.checkOut,
                  serviceMoment(date: request.serviceDate, time: request.time) != nil,
                  request.notes.count <= 1_000, request.staffNote.count <= 1_000,
                  (0...OrderTip.maximumCents).contains(request.gratuityCents),
                  validateLabels(request.labels), request.createdAt <= request.updatedAt else { throw PortalError.corruptData }
            if request.kind == .order {
                guard !request.lines.isEmpty, request.lines.count <= 100, request.location != nil,
                      Set(request.lines.map(\.itemID)).count == request.lines.count,
                      request.lines.allSatisfy({ line in (1...20).contains(line.quantity) && validateLabels(line.labels)
                          && (line.priceCents == nil || (0...1_000_000).contains(line.priceCents!))
                          && state.catalog.contains(where: { $0.id == line.itemID && $0.kind == .product }) }) else { throw PortalError.corruptData }
            } else {
                guard request.lines.isEmpty, request.gratuityCents == 0, (1...stay.guests).contains(request.participants ?? 0),
                      state.catalog.contains(where: { $0.id == request.itemID && $0.kind == (request.kind == .guide ? .guide : .activity) }) else { throw PortalError.corruptData }
            }
        }
    }
}
