import Foundation
import XCTest
@testable import LaFeniceCore

@MainActor
final class PortalStoreTests: XCTestCase {
    func testDecorativePulseClampsAndReturnsToRest() {
        let start = Date(timeIntervalSince1970: 100)
        var pulse = WaterPulse(startedAt: start)
        XCTAssertEqual(pulse.elapsed(at: start.addingTimeInterval(-10)), 0)
        XCTAssertEqual(pulse.elapsed(at: start.addingTimeInterval(1.2)), 1.2)
        XCTAssertEqual(pulse.elapsed(at: start.addingTimeInterval(500)), Float(WaterPulse.duration))
        pulse.startedAt = nil
        XCTAssertEqual(pulse.elapsed(at: start.addingTimeInterval(500)), 0)
        pulse.startedAt = start.addingTimeInterval(500)
        XCTAssertEqual(pulse.elapsed(at: start.addingTimeInterval(500)), 0)
    }

    private var referenceNow: Date {
        ISO8601DateFormatter().date(from: "2026-09-23T10:00:00Z")!
    }

    private func catalog() throws -> [CatalogItem] {
        let url = URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent().deletingLastPathComponent()
            .appendingPathComponent("LaFenice/Resources/catalog.json")
        return try JSONDecoder().decode([CatalogItem].self, from: Data(contentsOf: url))
    }

    private func store(at fileURL: URL? = nil, now: Date? = nil) throws -> PortalStore {
        let fixedNow = now ?? referenceNow
        return try PortalStore(catalog: catalog(), fileURL: fileURL, clock: { fixedNow })
    }

    private func guest(_ store: PortalStore) throws {
        store.logout()
        try store.login(code: "cliente", password: "cliente", role: .guest)
    }

    private func admin(_ store: PortalStore) throws {
        store.logout()
        try store.login(code: "admin", password: "admin", role: .admin)
    }

    @discardableResult
    private func order(_ store: PortalStore, id: String = UUID().uuidString,
                       date: String? = nil, time: String = "14:30", quantity: Int = 1, tipCents: Int = 0) throws -> ServiceRequest {
        let item = try XCTUnwrap(store.activeCatalog(.product).first)
        return try store.submitOrder(date: date ?? store.today, location: .beach, time: time,
                                     notes: "  Senza pomodoro  ", quantities: [item.id: quantity], tipCents: tipCents, clientRequestID: id)
    }

    private func expect(_ error: PortalError, _ operation: () throws -> Void,
                        file: StaticString = #filePath, line: UInt = #line) {
        XCTAssertThrowsError(try operation(), file: file, line: line) {
            XCTAssertEqual($0 as? PortalError, error, file: file, line: line)
        }
    }

    private func temporaryDirectory() throws -> URL {
        let directory = FileManager.default.temporaryDirectory
            .appendingPathComponent("LaFeniceCoreTests-\(UUID().uuidString)", isDirectory: true)
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: false)
        addTeardownBlock {
            // Only the unique directory created by this test is removed.
            try FileManager.default.removeItem(at: directory)
        }
        return directory
    }

    func testLoginRolesAndMutationAuthorization() async throws {
        let store = try store()
        expect(.unauthorized) { _ = try order(store) }
        expect(.unauthorized) {
            _ = try store.createStay(surname: "Bianchi", guestName: "Anna", room: "2", guests: 2,
                                     checkIn: store.today, checkOut: "2026-09-25", locale: .it)
        }
        expect(.credentials) { try store.login(code: "admin", password: "admin", role: .guest) }
        expect(.credentials) { try store.login(code: "cliente", password: "cliente", role: .admin) }
        expect(.credentials) { try store.login(code: "cliente", password: "wrong", role: .guest) }
        XCTAssertNil(store.account)
        try store.login(code: "  ClIeNtE\n", password: "cliente", role: .guest)
        XCTAssertEqual(store.account?.role, .guest)
        expect(.unauthorized) { try store.updateRequest(id: UUID().uuidString, status: .confirmed, staffNote: "") }
        expect(.unauthorized) { try store.saveItem(try XCTUnwrap(store.state.catalog.first)) }
        try admin(store)
        expect(.unauthorized) { _ = try order(store) }
        store.logout()
        XCTAssertTrue(store.visibleRequests.isEmpty)
    }

    func testOrderIdempotencyUnknownPriceSnapshotsAndStaffLifecycle() async throws {
        let store = try store()
        try guest(store)
        let id = UUID().uuidString
        let request = try order(store, id: id, quantity: 2, tipCents: 350)
        XCTAssertNil(request.subtotalCents)
        XCTAssertNil(request.totalCents, "An unspecified price must never become a zero-price promise")
        XCTAssertEqual(request.gratuityCents, 350)
        XCTAssertEqual(request.notes, "Senza pomodoro")
        XCTAssertEqual(try order(store, id: id, quantity: 2, tipCents: 900), request)
        XCTAssertEqual(store.state.requests.count, 1)
        try admin(store)
        var item = try XCTUnwrap(store.state.catalog.first { $0.id == request.lines[0].itemID })
        item.priceCents = 1_200
        item.labels["it"] = "Nome aggiornato"
        try store.saveItem(item)
        XCTAssertEqual(store.state.requests[0].lines, request.lines)
        try store.updateRequest(id: request.id, status: .confirmed, staffNote: "  Alle 14:30 in spiaggia  ")
        try guest(store)
        XCTAssertEqual(store.visibleRequests.first?.status, .confirmed)
        XCTAssertEqual(store.visibleRequests.first?.staffNote, "Alle 14:30 in spiaggia")
        expect(.invalidTransition) { try store.cancelRequest(id: request.id) }
        try admin(store)
        try store.updateRequest(id: request.id, status: .fulfilled, staffNote: "Consegnato")
        expect(.invalidTransition) { try store.updateRequest(id: request.id, status: .pending, staffNote: "") }
        try guest(store)
        XCTAssertEqual(store.visibleRequests.first?.status, .fulfilled)
    }

    func testStayIsolationAndIdempotencyAreScopedToGuest() async throws {
        let store = try store()
        try guest(store)
        let clientID = UUID().uuidString
        let first = try order(store, id: clientID, tipCents: 200)
        try admin(store)
        try store.updateRequest(id: first.id, status: .confirmed, staffNote: "")
        let credential = try store.createStay(surname: "Bianchi", guestName: "Anna Bianchi", room: "7", guests: 1,
                                              checkIn: store.today, checkOut: "2026-09-26", locale: .de)
        store.logout()
        try store.login(code: credential.loginCode, password: credential.password, role: .guest)
        XCTAssertEqual(store.locale, .de)
        XCTAssertTrue(store.visibleRequests.isEmpty)
        expect(.unauthorized) { try store.cancelRequest(id: first.id) }
        let second = try order(store, id: clientID, tipCents: 700)
        XCTAssertNotEqual(second.stayID, first.stayID)
        XCTAssertEqual(store.visibleRequests.map(\.id), [second.id])
        XCTAssertNil(store.orderBill(for: first.stayID).totalCents)
        XCTAssertEqual(store.orderBill(for: first.stayID).tipCents, 0)
        XCTAssertEqual(store.orderBill(for: first.stayID).orderCount, 0)
        XCTAssertEqual(store.orderBill(for: second.stayID).pendingTipCents, 700)
        try admin(store)
        XCTAssertEqual(Set(store.visibleRequests.map(\.id)), Set([first.id, second.id]))
        XCTAssertEqual(store.orderBill(for: first.stayID).tipCents, 200)
        XCTAssertEqual(store.orderBill(for: second.stayID).pendingTipCents, 700)
        try guest(store)
        XCTAssertEqual(store.visibleRequests.map(\.id), [first.id])
        XCTAssertEqual(store.orderBill(for: second.stayID).pendingTipCents, 0)
        store.logout()
        XCTAssertNil(store.orderBill(for: first.stayID).totalCents)
        XCTAssertEqual(store.orderBill(for: first.stayID).tipCents, 0)
        XCTAssertEqual(store.orderBill(for: first.stayID).orderCount, 0)
    }

    func testDatesAndTimesCannotRequestPastCheckoutOrInvalidCalendarValues() async throws {
        let store = try store()
        try guest(store)
        let stay = try XCTUnwrap(store.stay)
        for date in ["2026-09-22", stay.checkOut, "2026-02-30", "2026-9-24", "2026-09-28"] {
            expect(.notOrderable) { _ = try order(store, date: date) }
        }
        for time in ["24:00", "12:60", "9:00", "11:59", "12:00", "n/a"] {
            expect(.invalidTime) { _ = try order(store, time: time) }
        }
        XCTAssertTrue(store.state.requests.isEmpty)
        XCTAssertEqual(try order(store, time: "12:01").time, "12:01")
        XCTAssertEqual(try order(store, date: "2026-09-24", time: "00:00").serviceDate, "2026-09-24")
    }

    func testQuantitiesNotesAndClientIDsAreValidated() async throws {
        let store = try store()
        try guest(store)
        for quantity in [-1, 0, 21, Int.max] {
            expect(.invalidInput) { _ = try order(store, quantity: quantity) }
        }
        for tip in [-1, OrderTip.maximumCents + 1, Int.max] {
            expect(.invalidInput) { _ = try order(store, tipCents: tip) }
        }
        expect(.invalidInput) { _ = try order(store, id: "not-a-uuid") }
        expect(.invalidInput) {
            _ = try store.submitOrder(date: store.today, location: .room, time: "14:30", notes: "",
                                      quantities: [:], clientRequestID: UUID().uuidString)
        }
        let item = try XCTUnwrap(store.activeCatalog(.product).first)
        expect(.invalidInput) {
            _ = try store.submitOrder(date: store.today, location: .room, time: "14:30",
                                      notes: String(repeating: "x", count: 1_001),
                                      quantities: [item.id: 1], clientRequestID: UUID().uuidString)
        }
        XCTAssertTrue(store.state.requests.isEmpty)
        XCTAssertEqual(try order(store, quantity: 1).lines[0].quantity, 1)
        XCTAssertEqual(try order(store, quantity: 20).lines[0].quantity, 20)
    }

    func testInactiveAndUnknownCatalogItemsCannotBeRequested() async throws {
        let store = try store()
        let product = try XCTUnwrap(store.activeCatalog(.product).first)
        let activity = try XCTUnwrap(store.activeCatalog(.activity).first)
        var guide = try XCTUnwrap(store.activeCatalog(.guide).first)
        try admin(store)
        try store.setItemActive(id: product.id, active: false)
        try store.setItemActive(id: activity.id, active: false)
        guide.requestable = false
        try store.saveItem(guide)
        try guest(store)
        for id in [product.id, "unknown-product"] {
            expect(.unavailable) {
                _ = try store.submitOrder(date: store.today, location: .pool, time: "14:30", notes: "",
                                          quantities: [id: 1], clientRequestID: UUID().uuidString)
            }
        }
        for id in [activity.id, guide.id, "unknown-activity", product.id] {
            expect(.unavailable) {
                _ = try store.submitExperience(itemID: id, date: store.today, time: "14:30", participants: 1,
                                               notes: "", clientRequestID: UUID().uuidString)
            }
        }
        XCTAssertTrue(store.state.requests.isEmpty)
    }

    func testExperienceGuideParticipantsAndIdempotency() async throws {
        let store = try store()
        try guest(store)
        let activity = try XCTUnwrap(store.activeCatalog(.activity).first)
        let guide = try XCTUnwrap(store.activeCatalog(.guide).first { $0.requestable == true })
        for count in [-1, 0, 3] {
            expect(.invalidInput) {
                _ = try store.submitExperience(itemID: activity.id, date: store.today, time: "14:30", participants: count,
                                               notes: "", clientRequestID: UUID().uuidString)
            }
        }
        let id = UUID().uuidString
        let first = try store.submitExperience(itemID: activity.id, date: store.today, time: "14:30", participants: 2,
                                               notes: "", clientRequestID: id)
        XCTAssertEqual(try store.submitExperience(itemID: activity.id, date: store.today, time: "14:30", participants: 2,
                                                  notes: "", clientRequestID: id), first)
        expect(.invalidInput) { _ = try order(store, id: id) }
        expect(.invalidInput) {
            _ = try store.submitExperience(itemID: guide.id, date: store.today, time: "14:30", participants: 1,
                                           notes: "", clientRequestID: id)
        }
        let guideRequest = try store.submitExperience(itemID: guide.id, date: store.today, time: "15:00", participants: 1,
                                                      notes: "Un tavolo", clientRequestID: UUID().uuidString)
        XCTAssertEqual(first.kind, .activity)
        XCTAssertEqual(guideRequest.kind, .guide)
        XCTAssertEqual(guideRequest.labels, guide.labels)
        XCTAssertEqual(store.state.requests.count, 2)
    }

    func testPendingCancellationAndTerminalStatusesCannotBeReopened() async throws {
        let store = try store()
        try guest(store)
        let cancelled = try order(store)
        try store.cancelRequest(id: cancelled.id)
        expect(.invalidTransition) { try store.cancelRequest(id: cancelled.id) }
        let rejected = try order(store)
        try admin(store)
        try store.updateRequest(id: rejected.id, status: .rejected, staffNote: "Non disponibile")
        for id in [cancelled.id, rejected.id] {
            for status in [RequestStatus.pending, .confirmed, .fulfilled] {
                expect(.invalidTransition) { try store.updateRequest(id: id, status: status, staffNote: "") }
            }
        }
        try guest(store)
        expect(.invalidTransition) { try store.cancelRequest(id: rejected.id) }
        XCTAssertEqual(Set(store.visibleRequests.map(\.status)), Set([.cancelled, .rejected]))
    }

    func testStayEditingPreservesEvenTerminalRequestHistory() async throws {
        let store = try store()
        try guest(store)
        let activity = try XCTUnwrap(store.activeCatalog(.activity).first)
        let request = try store.submitExperience(itemID: activity.id, date: "2026-09-25", time: "10:00", participants: 2,
                                                 notes: "", clientRequestID: UUID().uuidString)
        try store.cancelRequest(id: request.id)
        var edited = try XCTUnwrap(store.stay)
        try admin(store)
        edited.checkOut = "2026-09-25"
        expect(.invalidStayChange) { try store.updateStay(edited) }
        edited.checkOut = "2026-09-27"
        edited.guests = 1
        expect(.invalidStayChange) { try store.updateStay(edited) }
        edited.guests = 2
        edited.room = "Camera 8"
        try store.updateStay(edited)
        XCTAssertEqual(store.state.stays.first?.room, "Camera 8")
        XCTAssertEqual(store.state.requests.first?.status, .cancelled)
        XCTAssertEqual(store.state.requests.first?.participants, 2)
    }

    func testStayCreationRejectsInvalidRangesAndPartySize() async throws {
        let store = try store()
        try admin(store)
        for (checkIn, checkOut) in [("2026-02-30", "2026-03-03"), ("2026-09-23", "2026-09-23"),
                                    ("2026-09-24", "2026-09-23"), ("2026-09-23", "2026-11-23")] {
            expect(.invalidDate) {
                _ = try store.createStay(surname: "Bianchi", guestName: "Anna", room: "7", guests: 1,
                                         checkIn: checkIn, checkOut: checkOut, locale: .it)
            }
        }
        for count in [0, 21] {
            expect(.invalidInput) {
                _ = try store.createStay(surname: "Bianchi", guestName: "Anna", room: "7", guests: count,
                                         checkIn: store.today, checkOut: "2026-09-25", locale: .it)
            }
        }
        XCTAssertEqual(store.state.stays.count, 1)
        XCTAssertEqual(store.state.accounts.count, 2)
    }

    func testPasswordResetAndDisabledStayRejectOldCredentials() async throws {
        let store = try store()
        try guest(store)
        let stayID = try XCTUnwrap(store.stay?.id)
        try admin(store)
        let credential = try store.resetPassword(stayID: stayID)
        XCTAssertNotEqual(credential.password, "cliente")
        XCTAssertEqual(store.state.accounts.first { $0.stayID == stayID }?.credentialVersion, 2)
        store.logout()
        expect(.credentials) { try store.login(code: "cliente", password: "cliente", role: .guest) }
        try store.login(code: credential.loginCode, password: credential.password, role: .guest)
        XCTAssertEqual(store.stay?.id, stayID)
        try admin(store)
        try store.setStayActive(id: stayID, active: false)
        XCTAssertFalse(try XCTUnwrap(store.state.stays.first).active)
        store.logout()
        expect(.credentials) { try store.login(code: credential.loginCode, password: credential.password, role: .guest) }
        try admin(store)
        try store.setStayActive(id: stayID, active: true)
        store.logout()
        try store.login(code: credential.loginCode, password: credential.password, role: .guest)
        XCTAssertEqual(store.account?.credentialVersion, 4)
    }

    func testCatalogRejectsUnsafeURLsAndChangedKinds() async throws {
        let store = try store()
        try admin(store)
        let original = try XCTUnwrap(store.activeCatalog(.guide).first)
        for url in ["javascript:alert(1)", "http://example.com", "file:///tmp/file", "https://user:password@example.com",
                    "https:///", "data:text/html,test"] {
            var item = original
            item.websiteUrl = url
            expect(.invalidInput) { try store.saveItem(item) }
            XCTAssertNil(PortalStore.safeWebURL(url))
        }
        var safe = original
        safe.websiteUrl = "https://example.com/visit"
        try store.saveItem(safe)
        XCTAssertEqual(store.state.catalog.first { $0.id == safe.id }?.websiteUrl, safe.websiteUrl)
        safe.kind = .product
        safe.category = "food"
        expect(.invalidInput) { try store.saveItem(safe) }
        safe = original
        safe.labels.removeValue(forKey: "ru")
        expect(.invalidInput) { try store.saveItem(safe) }
    }

    func testFailedPersistenceDoesNotPublishMutationOrDestroyPreviousData() async throws {
        let directory = try temporaryDirectory()
        let fileURL = directory.appendingPathComponent("state.json")
        let backupURL = directory.appendingPathComponent("previous-state.json")
        let store = try store(at: fileURL)
        try guest(store)
        let before = try Data(contentsOf: fileURL)
        try FileManager.default.moveItem(at: fileURL, to: backupURL)
        try FileManager.default.createDirectory(at: fileURL, withIntermediateDirectories: false)
        expect(.persistence) { _ = try order(store) }
        XCTAssertTrue(store.state.requests.isEmpty)
        XCTAssertEqual(try Data(contentsOf: backupURL), before)
        var isDirectory: ObjCBool = false
        XCTAssertTrue(FileManager.default.fileExists(atPath: fileURL.path, isDirectory: &isDirectory))
        XCTAssertTrue(isDirectory.boolValue)
    }

    func testCorruptFileIsRejectedWithoutErasingOrReseedingIt() async throws {
        let fileURL = try temporaryDirectory().appendingPathComponent("state.json")
        let bytes = Data("{broken user data".utf8)
        try bytes.write(to: fileURL)
        expect(.corruptData) { _ = try store(at: fileURL) }
        XCTAssertEqual(try Data(contentsOf: fileURL), bytes)
    }

    func testPersistedDomainCorruptionIsRejectedWithoutErasure() async throws {
        let fileURL = try temporaryDirectory().appendingPathComponent("state.json")
        let original = try store(at: fileURL)
        var invalid = original.state
        invalid.accounts.append(invalid.accounts[0])
        let bytes = try JSONEncoder().encode(invalid)
        try bytes.write(to: fileURL)
        expect(.corruptData) { _ = try store(at: fileURL) }
        XCTAssertEqual(try Data(contentsOf: fileURL), bytes)
    }

    func testRoundTripPreservesRequestsLocaleAndDoesNotPersistSession() async throws {
        let fileURL = try temporaryDirectory().appendingPathComponent("state.json")
        let original = try store(at: fileURL)
        try guest(original)
        try original.setLocale(.ru)
        let request = try order(original, tipCents: 275)
        try admin(original)
        try original.updateRequest(id: request.id, status: .confirmed, staffNote: "Confermato dallo staff")
        let reopened = try store(at: fileURL)
        XCTAssertNil(reopened.account)
        XCTAssertTrue(reopened.visibleRequests.isEmpty)
        try guest(reopened)
        XCTAssertEqual(reopened.locale, .ru)
        XCTAssertEqual(reopened.visibleRequests.first?.id, request.id)
        XCTAssertEqual(reopened.visibleRequests.first?.status, .confirmed)
        XCTAssertEqual(reopened.visibleRequests.first?.staffNote, "Confermato dallo staff")
        XCTAssertEqual(reopened.visibleRequests.first?.gratuityCents, 275)
        XCTAssertEqual(reopened.orderBill(for: request.stayID).tipCents, 275)
        XCTAssertNil(reopened.orderBill(for: request.stayID).totalCents)
        XCTAssertEqual(reopened.state.catalog, original.state.catalog)
    }

    func testTipParserUsesExactCentsAndRejectsAmbiguousOrInvalidAmounts() {
        for (amount, cents) in [("", 0), (" \n", 0), ("0", 0), ("0,00", 0), ("0.01", 1),
                                 ("2", 200), ("2,5", 250), ("2.05", 205), (" 12,34 ", 1_234),
                                 ("0002.00", 200), ("999.99", 99_999), ("1000", 100_000), ("1000,00", 100_000)] {
            XCTAssertEqual(OrderTip.cents(from: amount), cents, amount)
        }
        for amount in ["-1", "+1", "1e2", "NaN", "inf", "∞", "€2", "2 EUR", "1 000", "1,000", "1.000",
                       "1,000.00", "1.000,00", "2.001", "1000.01", "1001", ".50", "2.", "2,", "1..2", "1,,2",
                       "１", "١", "1\n2", String(repeating: "9", count: 1_000)] {
            XCTAssertNil(OrderTip.cents(from: amount), amount)
        }
    }

    func testDiningCatalogUpgradePreservesStateAndAdminOverrides() async throws {
        let fileURL = try temporaryDirectory().appendingPathComponent("state.json")
        let bundle = try catalog()
        let diningIDs = ["product-daily-lunch", "product-pizza-fenice"]
        let original = try PortalStore(catalog: bundle.filter { !diningIDs.contains($0.id) }, fileURL: fileURL, clock: { self.referenceNow })
        try guest(original)
        _ = try order(original, tipCents: 250)
        try admin(original)
        var edited = try XCTUnwrap(original.state.catalog.first)
        edited.labels["it"] = "Nome scelto dallo staff"
        edited.priceCents = 1_800
        edited.active = false
        try original.saveItem(edited)

        let upgraded = try store(at: fileURL)
        XCTAssertEqual(upgraded.state.catalog.filter { !diningIDs.contains($0.id) }, original.state.catalog)
        XCTAssertEqual(upgraded.state.catalog.count, original.state.catalog.count + 2)
        XCTAssertEqual(upgraded.state.requests, original.state.requests)
        XCTAssertEqual(upgraded.state.stays, original.state.stays)
        XCTAssertEqual(upgraded.state.accounts.map(\.id), original.state.accounts.map(\.id))
        XCTAssertEqual(upgraded.state.accounts.map(\.passwordHash), original.state.accounts.map(\.passwordHash))
        try admin(upgraded)
        var lunch = try XCTUnwrap(upgraded.state.catalog.first { $0.id == diningIDs[0] })
        lunch.labels["it"] = "Menu aggiornato dallo staff"
        lunch.priceCents = 2_200
        lunch.active = false
        try upgraded.saveItem(lunch)

        let savedBytes = try Data(contentsOf: fileURL)
        let reopened = try store(at: fileURL)
        XCTAssertEqual(reopened.state.catalog, upgraded.state.catalog)
        XCTAssertEqual(try Data(contentsOf: fileURL), savedBytes, "A repeated launch must not rewrite or reactivate staff content")
        XCTAssertNil(reopened.account)
    }

    func testDiningCatalogUpgradeRespectsSlugConflictsAndDoesNotWriteInvalidData() async throws {
        let bundle = try catalog()
        let diningIDs = ["product-daily-lunch", "product-pizza-fenice"]
        let previousCatalog = bundle.filter { !diningIDs.contains($0.id) }
        let fileURL = try temporaryDirectory().appendingPathComponent("state.json")
        let original = try PortalStore(catalog: previousCatalog, fileURL: fileURL, clock: { self.referenceNow })
        try admin(original)
        var staffItem = try XCTUnwrap(bundle.first { $0.id == diningIDs[0] })
        staffItem.id = "staff-owned-lunch"
        staffItem.labels["it"] = "Proposta dello staff"
        try original.saveItem(staffItem)
        let upgraded = try store(at: fileURL)
        XCTAssertEqual(upgraded.state.catalog.first { $0.slug == staffItem.slug }, staffItem)
        XCTAssertFalse(upgraded.state.catalog.contains { $0.id == diningIDs[0] })
        XCTAssertTrue(upgraded.state.catalog.contains { $0.id == diningIDs[1] })

        let invalidFile = try temporaryDirectory().appendingPathComponent("state.json")
        _ = try PortalStore(catalog: previousCatalog, fileURL: invalidFile, clock: { self.referenceNow })
        let bytes = try Data(contentsOf: invalidFile)
        var invalidBundle = bundle
        let index = try XCTUnwrap(invalidBundle.firstIndex { $0.id == diningIDs[0] })
        invalidBundle[index].priceCents = -1
        expect(.invalidInput) {
            _ = try PortalStore(catalog: invalidBundle, fileURL: invalidFile, clock: { self.referenceNow })
        }
        XCTAssertEqual(try Data(contentsOf: invalidFile), bytes)
    }

    func testLunchAndEveningPizzaReuseOrderSnapshotsAndTipAccounting() async throws {
        let store = try store()
        try guest(store)
        let lunch = try XCTUnwrap(store.activeCatalog(.product).first { $0.id == "product-daily-lunch" })
        let pizza = try XCTUnwrap(store.activeCatalog(.product).first { $0.id == "product-pizza-fenice" })
        XCTAssertEqual(lunch.category, "lunch")
        XCTAssertEqual(pizza.category, "dinner")
        for item in [lunch, pizza] {
            XCTAssertNil(item.priceCents)
            for locale in PortalLocale.allCases {
                XCTAssertFalse(item.title(locale).isEmpty)
                XCTAssertFalse(item.detail(locale).isEmpty)
            }
        }
        let lunchRequest = try store.submitOrder(date: store.today, location: .room, time: "14:30", notes: "",
                                                quantities: [lunch.id: 2], tipCents: 200, clientRequestID: UUID().uuidString)
        let pizzaRequest = try store.submitOrder(date: store.today, location: .room, time: "20:30", notes: "",
                                                quantities: [pizza.id: 1], tipCents: 300, clientRequestID: UUID().uuidString)
        XCTAssertNil(lunchRequest.totalCents)
        XCTAssertNil(pizzaRequest.totalCents)
        try admin(store)
        var updatedLunch = lunch
        updatedLunch.labels["it"] = "Menu del giorno seguente"
        updatedLunch.priceCents = 2_500
        try store.saveItem(updatedLunch)
        try store.updateRequest(id: lunchRequest.id, status: .confirmed, staffNote: "Da concordare")
        XCTAssertEqual(store.state.requests.first { $0.id == lunchRequest.id }?.lines, lunchRequest.lines)
        let bill = store.orderBill(for: lunchRequest.stayID)
        XCTAssertNil(bill.totalCents)
        XCTAssertEqual(bill.tipCents, 200)
        XCTAssertEqual(bill.pendingTipCents, 300)
    }

    func testKnownOrderTotalIncludesTipExactlyOnceAndAcceptsBoundary() async throws {
        let store = try store()
        try admin(store)
        var item = try XCTUnwrap(store.activeCatalog(.product).first)
        item.priceCents = 1_200
        try store.saveItem(item)
        try guest(store)
        let request = try order(store, quantity: 2, tipCents: 350)
        XCTAssertEqual(request.subtotalCents, 2_400)
        XCTAssertEqual(request.totalCents, 2_750)
        XCTAssertEqual(try order(store, tipCents: OrderTip.maximumCents).totalCents, 101_200)
        XCTAssertEqual(try order(store).totalCents, 1_200)
    }

    func testOrderBillSeparatesPendingTipsAndExcludesCancelledRejectedAndExperiences() async throws {
        let store = try store()
        try admin(store)
        var item = try XCTUnwrap(store.activeCatalog(.product).first)
        item.priceCents = 1_200
        try store.saveItem(item)
        try guest(store)
        let stayID = try XCTUnwrap(store.stay?.id)
        XCTAssertEqual(store.orderBill(for: stayID).totalCents, 0)
        let confirmed = try order(store, quantity: 2, tipCents: 250)
        let fulfilled = try order(store, tipCents: 400)
        let pending = try order(store, tipCents: 100)
        let cancelled = try order(store, tipCents: 200)
        let rejected = try order(store, tipCents: 300)
        let activity = try XCTUnwrap(store.activeCatalog(.activity).first)
        let experience = try store.submitExperience(itemID: activity.id, date: store.today, time: "14:30", participants: 1,
                                                    notes: "", clientRequestID: UUID().uuidString)
        try store.cancelRequest(id: cancelled.id)
        try admin(store)
        try store.updateRequest(id: confirmed.id, status: .confirmed, staffNote: "")
        try store.updateRequest(id: fulfilled.id, status: .confirmed, staffNote: "")
        try store.updateRequest(id: fulfilled.id, status: .fulfilled, staffNote: "")
        try store.updateRequest(id: rejected.id, status: .rejected, staffNote: "")
        try store.updateRequest(id: experience.id, status: .confirmed, staffNote: "")
        let bill = store.orderBill(for: stayID)
        XCTAssertEqual(bill.totalCents, 4_250)
        XCTAssertEqual(bill.tipCents, 650)
        XCTAssertEqual(bill.pendingTipCents, 100)
        XCTAssertEqual(bill.orderCount, 2)
        XCTAssertNil(store.orderBill(for: "missing-stay").totalCents)
        item.priceCents = nil
        try store.saveItem(item)
        try guest(store)
        let unknown = try order(store, tipCents: 150)
        try admin(store)
        try store.updateRequest(id: unknown.id, status: .confirmed, staffNote: "")
        XCTAssertNil(store.orderBill(for: stayID).totalCents)
        XCTAssertEqual(store.orderBill(for: stayID).tipCents, 800)
        XCTAssertEqual(store.orderBill(for: stayID).orderCount, 3)
        try store.updateRequest(id: unknown.id, status: .cancelled, staffNote: "")
        try guest(store)
        try store.cancelRequest(id: pending.id)
        XCTAssertEqual(store.orderBill(for: stayID).totalCents, 4_250)
        XCTAssertEqual(store.orderBill(for: stayID).pendingTipCents, 0)
    }

    func testLegacyRequestWithoutTipLoadsWithoutRewritingOrLosingHistory() async throws {
        let fileURL = try temporaryDirectory().appendingPathComponent("state.json")
        let original = try store(at: fileURL)
        try guest(original)
        let request = try order(original)
        var json = try XCTUnwrap(JSONSerialization.jsonObject(with: Data(contentsOf: fileURL)) as? [String: Any])
        var requests = try XCTUnwrap(json["requests"] as? [[String: Any]])
        requests[0].removeValue(forKey: "tipCents")
        json["requests"] = requests
        let legacyBytes = try JSONSerialization.data(withJSONObject: json)
        try legacyBytes.write(to: fileURL)
        let reopened = try store(at: fileURL)
        try guest(reopened)
        XCTAssertEqual(reopened.visibleRequests.count, 1)
        XCTAssertEqual(reopened.visibleRequests.first?.id, request.id)
        XCTAssertEqual(reopened.visibleRequests.first?.lines, request.lines)
        XCTAssertNil(reopened.visibleRequests.first?.tipCents)
        XCTAssertEqual(reopened.visibleRequests.first?.gratuityCents, 0)
        XCTAssertEqual(try Data(contentsOf: fileURL), legacyBytes)
    }

    func testCorruptPersistedTipsAreRejectedWithoutErasure() async throws {
        let fileURL = try temporaryDirectory().appendingPathComponent("state.json")
        let original = try store(at: fileURL)
        try guest(original)
        try order(original)
        let activity = try XCTUnwrap(original.activeCatalog(.activity).first)
        _ = try original.submitExperience(itemID: activity.id, date: original.today, time: "14:30", participants: 1,
                                          notes: "", clientRequestID: UUID().uuidString)
        for (index, tip) in [(0, -1), (0, OrderTip.maximumCents + 1), (0, Int.max), (1, 1)] {
            var invalid = original.state
            invalid.requests[index].tipCents = tip
            let bytes = try JSONEncoder().encode(invalid)
            try bytes.write(to: fileURL)
            expect(.corruptData) { _ = try store(at: fileURL) }
            XCTAssertEqual(try Data(contentsOf: fileURL), bytes)
        }
    }

    func testRomeCalendarDSTAndNonexistentServiceTime() async throws {
        XCTAssertEqual(RomeDay.calendar.firstWeekday, 2)
        let formatter = ISO8601DateFormatter()
        let beforeSpring = try XCTUnwrap(RomeDay.date("2026-03-28"))
        XCTAssertEqual(RomeDay.key(RomeDay.adding(1, to: beforeSpring)), "2026-03-29")
        XCTAssertEqual(RomeDay.adding(1, to: beforeSpring).timeIntervalSince(beforeSpring), 23 * 60 * 60)
        let beforeAutumn = try XCTUnwrap(RomeDay.date("2026-10-24"))
        XCTAssertEqual(RomeDay.key(RomeDay.adding(1, to: beforeAutumn)), "2026-10-25")
        XCTAssertEqual(RomeDay.adding(1, to: beforeAutumn).timeIntervalSince(beforeAutumn), 25 * 60 * 60)
        XCTAssertEqual(RomeDay.key(try XCTUnwrap(formatter.date(from: "2026-09-22T22:30:00Z"))), "2026-09-23")
        XCTAssertNil(RomeDay.date("2026-02-29"))
        XCTAssertNotNil(RomeDay.date("2028-02-29"))
        let store = try store(now: XCTUnwrap(formatter.date(from: "2026-03-28T10:00:00Z")))
        try guest(store)
        expect(.invalidTime) { _ = try order(store, date: "2026-03-29", time: "02:30") }
        XCTAssertEqual(try order(store, date: "2026-03-29", time: "03:30").time, "03:30")
    }

    func testClockRefreshRejectsRequestAfterChosenTimePasses() async throws {
        var clock = referenceNow
        let store = try PortalStore(catalog: catalog(), clock: { clock })
        try guest(store)
        clock = clock.addingTimeInterval(3 * 60 * 60)
        expect(.invalidTime) { _ = try order(store, time: "14:30") }
        XCTAssertEqual(store.now, clock)
        XCTAssertEqual(try order(store, time: "15:01").time, "15:01")
    }

    func testPasswordHashingRejectsTamperingAndExcessiveParameters() async throws {
        let hash = try Password.hash("un segreto locale")
        XCTAssertTrue(Password.wellFormed(hash))
        XCTAssertTrue(Password.verify("un segreto locale", hash: hash))
        XCTAssertFalse(Password.verify("altro segreto", hash: hash))
        XCTAssertFalse(Password.verify("un segreto locale", hash: hash.replacingOccurrences(of: ":120000:", with: ":2147483647:")))
        XCTAssertFalse(Password.verify("un segreto locale", hash: "pbkdf2-sha256:120000:zz:ff"))
        expect(.invalidInput) { _ = try Password.hash("") }
        expect(.invalidInput) { _ = try Password.hash(String(repeating: "x", count: 257)) }
        XCTAssertEqual(Password.normalize("  Rossi  23\n"), "ROSSI-23")
        XCTAssertNotEqual(try Password.generate(), try Password.generate())
    }
}
