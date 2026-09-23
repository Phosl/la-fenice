import Foundation

enum PortalLocale: String, Codable, CaseIterable, Identifiable {
    case en, it, de, ru
    var id: String { rawValue }
    var title: String { switch self { case .en: "English"; case .it: "Italiano"; case .de: "Deutsch"; case .ru: "Русский" } }
}

enum PortalRole: String, Codable, CaseIterable { case guest, admin }
enum CatalogKind: String, Codable, CaseIterable { case product, activity, guide }
enum ServiceKind: String, Codable, CaseIterable { case order, activity, guide }
enum DeliveryLocation: String, Codable, CaseIterable { case room, pool, beach }
enum RequestStatus: String, Codable, CaseIterable {
    case pending, confirmed, rejected, fulfilled, cancelled
    var next: [RequestStatus] {
        switch self {
        case .pending: [.confirmed, .rejected, .cancelled]
        case .confirmed: [.fulfilled, .cancelled]
        case .rejected, .fulfilled, .cancelled: []
        }
    }
}

struct CatalogItem: Codable, Identifiable, Equatable {
    var id: String = UUID().uuidString
    var slug: String = UUID().uuidString
    var kind: CatalogKind
    var category: String
    var labels: [String: String]
    var description: [String: String]?
    var active: Bool = true
    var sortOrder: Int = 0
    var priceCents: Int?
    var address: String?
    var phone: String?
    var websiteUrl: String?
    var mapsUrl: String?
    var bookingNote: [String: String]?
    var requestable: Bool?
    var verifiedAt: String?

    func title(_ locale: PortalLocale) -> String { labels[locale.rawValue] ?? labels["en"] ?? slug }
    func detail(_ locale: PortalLocale) -> String { description?[locale.rawValue] ?? description?["en"] ?? "" }
    static let productCategories = ["food", "classic-drink", "wine", "champagne", "raw-fish"]
    static let activityCategories = ["fishing", "boat-trip", "lemon-grove", "other"]
    static let guideCategories = ["dining", "after-dark", "sea", "see", "getting-around", "essentials"]
    var categories: [String] {
        switch kind { case .product: Self.productCategories; case .activity: Self.activityCategories; case .guide: Self.guideCategories }
    }
}

struct Stay: Codable, Identifiable, Equatable {
    var id: String = UUID().uuidString
    var surname: String
    var guestName: String
    var room: String
    var guests: Int
    var checkIn: String
    var checkOut: String
    var locale: PortalLocale
    var active: Bool = true
}

struct PortalAccount: Codable, Identifiable {
    var id: String = UUID().uuidString
    var loginCode: String
    var passwordHash: String
    var role: PortalRole
    var stayID: String?
    var active: Bool = true
    var credentialVersion: Int = 1
}

struct OrderLine: Codable, Identifiable, Equatable {
    var id: String { itemID }
    var itemID: String
    var labels: [String: String]
    var quantity: Int
    var priceCents: Int?
    func title(_ locale: PortalLocale) -> String { labels[locale.rawValue] ?? labels["en"] ?? itemID }
}

struct ServiceRequest: Codable, Identifiable, Equatable {
    var id: String = UUID().uuidString
    var clientRequestID: String
    var stayID: String
    var kind: ServiceKind
    var itemID: String?
    var labels: [String: String]
    var lines: [OrderLine] = []
    var serviceDate: String
    var time: String
    var location: DeliveryLocation?
    var participants: Int?
    var notes: String
    var status: RequestStatus = .pending
    var staffNote: String = ""
    var createdAt: Date
    var updatedAt: Date
    func title(_ locale: PortalLocale) -> String { labels[locale.rawValue] ?? labels["en"] ?? "Request" }
    var totalCents: Int? {
        guard !lines.isEmpty, lines.allSatisfy({ $0.priceCents != nil }) else { return nil }
        return lines.reduce(0) { $0 + ($1.priceCents ?? 0) * $1.quantity }
    }
}

struct PortalState: Codable {
    var version = 1
    var accounts: [PortalAccount]
    var stays: [Stay]
    var catalog: [CatalogItem]
    var requests: [ServiceRequest] = []
}

struct IssuedCredential: Identifiable {
    let id = UUID()
    var loginCode: String
    var password: String
}

enum PortalError: Error, LocalizedError, Equatable {
    case unauthorized, credentials, invalidInput, invalidDate, invalidTime, notOrderable, unavailable, invalidTransition, invalidStayChange, duplicateCode, persistence, corruptData
    var errorDescription: String? {
        switch self {
        case .unauthorized: "Accedi con il profilo autorizzato per questa azione."
        case .credentials: "Codice o password non validi, oppure accesso disattivato."
        case .invalidInput: "Controlla i campi: i valori non sono validi."
        case .invalidDate: "Inserisci date valide e un soggiorno da 1 a 60 notti."
        case .invalidTime: "Scegli un orario futuro valido, nel fuso orario di Positano."
        case .notOrderable: "Puoi richiedere servizi da oggi fino al giorno prima del check-out."
        case .unavailable: "Questo servizio non è disponibile."
        case .invalidTransition: "La richiesta non può passare a questo stato."
        case .invalidStayChange: "Le nuove date o il numero di ospiti non sono compatibili con le richieste esistenti."
        case .duplicateCode: "Questo codice di accesso è già utilizzato."
        case .persistence: "Salvataggio non riuscito. La modifica non è stata applicata: riprova."
        case .corruptData: "I dati locali non sono leggibili. Non sono stati cancellati o sostituiti."
        }
    }
}

enum RomeDay {
    static var calendar: Calendar {
        var result = Calendar(identifier: .gregorian)
        result.timeZone = TimeZone(identifier: "Europe/Rome")!
        result.locale = Locale(identifier: "it_IT")
        result.firstWeekday = 2
        return result
    }
    static func key(_ date: Date) -> String {
        let parts = calendar.dateComponents([.year, .month, .day], from: date)
        return String(format: "%04d-%02d-%02d", parts.year!, parts.month!, parts.day!)
    }
    static func date(_ key: String) -> Date? {
        guard key.range(of: #"^\d{4}-\d{2}-\d{2}$"#, options: .regularExpression) != nil else { return nil }
        let values = key.split(separator: "-").compactMap { Int($0) }
        guard values.count == 3,
              let date = calendar.date(from: DateComponents(year: values[0], month: values[1], day: values[2], hour: 12)),
              Self.key(date) == key else { return nil }
        return date
    }
    static func adding(_ days: Int, to date: Date) -> Date { calendar.date(byAdding: .day, value: days, to: date)! }
    static func days(_ stay: Stay) -> [String] {
        guard let start = date(stay.checkIn), let end = date(stay.checkOut) else { return [] }
        let nights = calendar.dateComponents([.day], from: start, to: end).day ?? 0
        guard (1...60).contains(nights) else { return [] }
        return (0...nights).map { key(adding($0, to: start)) }
    }
    static func orderable(_ key: String, stay: Stay, now: Date) -> Bool {
        date(key) != nil && stay.active && key >= stay.checkIn && key < stay.checkOut && key >= Self.key(now)
    }
}
