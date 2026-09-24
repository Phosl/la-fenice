package it.lafenicepositano.app

import java.io.File
import java.time.Instant
import java.util.UUID
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

class PortalCoreTest {
    @get:Rule val temporary = TemporaryFolder()
    private val instant = Instant.parse("2026-09-23T06:00:00Z")
    private fun words(value: String) = portalLocales.associateWith { value }
    private fun catalog() = listOf(
        CatalogItem(Kind.PRODUCT, "food", words("Caprese"), id = "caprese"),
        CatalogItem(Kind.PRODUCT, "food", words("Panino"), id = "panino", priceCents = 550),
        CatalogItem(Kind.ACTIVITY, "boat-trip", words("Gita in barca"), id = "boat"),
        CatalogItem(Kind.GUIDE, "dining", words("Ristorante"), id = "guide", requestable = true),
        CatalogItem(Kind.GUIDE, "essentials", words("Farmacia"), id = "info", requestable = false),
    )
    private fun store(file: File? = null, clock: () -> Instant = { instant }) = PortalStore(file, catalog(), clock)
    private fun PortalStore.guest() = login("cliente", "cliente", Role.GUEST)
    private fun PortalStore.admin() = login("admin", "admin", Role.ADMIN)
    private fun id() = UUID.randomUUID().toString()
    private fun PortalStore.order(clientId: String = id(), date: String = today, time: String = "12:00",
                                  quantities: Map<String, Int> = mapOf("caprese" to 1)) =
        submitOrder(date, time, "beach", "Prova locale", quantities, clientId)
    private fun fails(block: () -> Unit) { assertThrows(PortalException::class.java, block) }

    @Test fun authorizationAndFailedLoginClearTheSession() {
        val store = store()
        fails { store.order() }
        fails { store.setItemActive("caprese", false) }
        store.guest()
        assertEquals(Role.GUEST, store.account?.role)
        fails { store.updateRequest(id(), Status.CONFIRMED, "") }
        fails { store.createStay("A", "A", "1", 1, "2026-09-23", "2026-09-25", "it") }
        fails { store.login("cliente", "cliente", Role.ADMIN) }
        assertNull(store.account)
        store.admin()
        fails { store.order() }
        store.logout()
        assertTrue(store.visibleRequests.isEmpty())
    }

    @Test fun unknownPricesSnapshotsAndIdempotencyRemainStable() {
        val store = store()
        store.guest()
        val token = id()
        val request = store.order(token)
        assertNull(request.totalCents)
        assertEquals(request, store.order(token, quantities = mapOf("panino" to 2)))
        fails { store.submitExperience("boat", store.today, "12:00", 1, "", token) }
        store.admin()
        store.saveItem(store.state.catalog.first().copy(labels = words("Nome nuovo"), priceCents = 1_000))
        assertEquals("Caprese", store.visibleRequests.first().lines.first().title("it"))
        assertNull(store.visibleRequests.first().totalCents)
        store.guest()
        assertEquals(1_100, store.order(quantities = mapOf("panino" to 2)).totalCents)
        assertEquals(2, store.visibleRequests.size)
    }

    @Test fun statusMachineAndGuestCancellation() {
        val store = store()
        store.guest()
        val cancelled = store.order()
        store.cancelRequest(cancelled.id)
        fails { store.cancelRequest(cancelled.id) }
        val confirmed = store.order()
        store.admin()
        fails { store.updateRequest(cancelled.id, Status.PENDING, "") }
        store.updateRequest(confirmed.id, Status.CONFIRMED, "Consegna alla spiaggia")
        store.guest()
        fails { store.cancelRequest(confirmed.id) }
        assertEquals("Consegna alla spiaggia", store.visibleRequests.first { it.id == confirmed.id }.staffNote)
        store.admin()
        store.updateRequest(confirmed.id, Status.FULFILLED, "Eseguito")
        fails { store.updateRequest(confirmed.id, Status.CONFIRMED, "") }
        store.updateRequest(confirmed.id, Status.FULFILLED, "Nota aggiornata")
    }

    @Test fun datesTimeQuantitiesAndNotesAreValidated() {
        val store = store()
        store.guest()
        fails { store.order(date = store.stay!!.checkOut) }
        fails { store.order(date = "2026-09-22") }
        fails { store.order(date = "2026-02-30") }
        fails { store.order(time = "08:00") }
        fails { store.order(time = "25:00") }
        fails { store.order(quantities = emptyMap()) }
        fails { store.order(quantities = mapOf("caprese" to 0)) }
        fails { store.order(quantities = mapOf("caprese" to 21)) }
        fails { store.order(quantities = mapOf("missing" to 1)) }
        fails { store.order(clientId = "1-1-1-1-1") }
        fails { store.submitOrder(store.today, "12:00", "boat", "", mapOf("caprese" to 1), id()) }
        fails { store.submitOrder(store.today, "12:00", "room", "a".repeat(1001), mapOf("caprese" to 1), id()) }
        assertTrue(store.state.requests.isEmpty())
    }

    @Test fun activitiesGuideAndInactiveItems() {
        val store = store()
        store.guest()
        fails { store.submitExperience("boat", store.today, "12:00", 3, "", id()) }
        fails { store.submitExperience("info", store.today, "12:00", 1, "", id()) }
        val token = id()
        val request = store.submitExperience("guide", store.today, "12:00", 2, "", token)
        assertEquals(ServiceKind.GUIDE, request.kind)
        assertEquals(request, store.submitExperience("guide", store.today, "12:00", 2, "", token))
        store.admin()
        store.setItemActive("boat", false)
        store.setItemActive("caprese", false)
        assertTrue(store.activeCatalog(Kind.ACTIVITY).isEmpty())
        store.guest()
        fails { store.submitExperience("boat", store.today, "12:00", 1, "", id()) }
        fails { store.order() }
    }

    @Test fun otherGuestsCannotSeeOrCancelAnotherStayRequests() {
        val store = store()
        store.guest()
        val first = store.order()
        store.admin()
        val credential = store.createStay("Bianchi", "Famiglia Bianchi", "2", 3, "2026-09-23", "2026-09-28", "de")
        store.login(credential.loginCode, credential.password, Role.GUEST)
        assertEquals("de", store.locale)
        assertTrue(store.visibleRequests.isEmpty())
        fails { store.cancelRequest(first.id) }
        store.order()
        assertEquals(1, store.visibleRequests.size)
        store.admin()
        assertEquals(2, store.visibleRequests.size)
    }

    @Test fun stayEditsRetainHistoricalDatesAndPartySize() {
        val store = store()
        store.guest()
        val original = store.stay!!
        val request = store.submitExperience("boat", store.today, "12:00", 2, "", id())
        store.cancelRequest(request.id)
        store.admin()
        fails { store.updateStay(original.copy(checkOut = "2026-09-23")) }
        fails { store.updateStay(original.copy(guests = 1)) }
        fails { store.updateStay(original.copy(checkOut = "2026-12-23")) }
        store.updateStay(original.copy(room = "Camera 5"))
        store.guest()
        assertEquals("Camera 5", store.stay?.room)
    }

    @Test fun resetsAndDisabledStaysRejectOldCredentials() {
        val store = store()
        store.guest()
        val stayId = store.stay!!.id
        store.admin()
        val credential = store.resetPassword(stayId)
        assertEquals(4, credential.password.split('-').size)
        fails { store.login("cliente", "cliente", Role.GUEST) }
        store.login(credential.loginCode, credential.password, Role.GUEST)
        store.admin()
        store.setStayActive(stayId, false)
        fails { store.login(credential.loginCode, credential.password, Role.GUEST) }
        store.admin()
        store.setStayActive(stayId, true)
        store.login(credential.loginCode, credential.password, Role.GUEST)
        assertNotNull(store.stay)
    }

    @Test fun localeRoundTripPersistsButSessionDoesNot() {
        val file = File(temporary.root, "demo.json")
        val store = store(file)
        store.guest()
        store.setLocale("ru")
        val request = store.order()
        val reopened = store(file)
        assertNull(reopened.account)
        assertTrue(reopened.visibleRequests.isEmpty())
        reopened.guest()
        assertEquals("ru", reopened.locale)
        assertEquals(request, reopened.visibleRequests.single())
        fails { reopened.setLocale("fr") }
    }

    @Test fun corruptAndSemanticallyInvalidFilesAreNeverOverwritten() {
        val file = File(temporary.root, "demo.json")
        file.writeText("{bad json")
        fails { store(file) }
        assertEquals("{bad json", file.readText())
        val invalid = store().state.copy(version = 99)
        val encoded = Json.encodeToString(invalid)
        file.writeText(encoded)
        fails { store(file) }
        assertEquals(encoded, file.readText())
        val badDate = store().state.let { it.copy(stays = listOf(it.stays.first().copy(checkOut = "not-a-date"))) }
        file.writeText(Json.encodeToString(badDate))
        fails { store(file) }
    }

    @Test fun failedWriteDoesNotPublishSuccessOrDestroyOldData() {
        val directory = File(temporary.root, "data").also { it.mkdir() }
        val file = File(directory, "demo.json")
        val store = store(file)
        store.guest()
        val previous = file.readText()
        val backup = File(temporary.root, "backup")
        assertTrue(directory.renameTo(backup))
        directory.writeText("Simulated unavailable directory")
        fails { store.order() }
        assertTrue(store.state.requests.isEmpty())
        assertEquals(previous, File(backup, "demo.json").readText())
    }

    @Test fun catalogValidationAndSafeLinks() {
        val store = store()
        store.admin()
        val item = store.state.catalog.first()
        fails { store.saveItem(item.copy(labels = mapOf("it" to "Nome"))) }
        fails { store.saveItem(item.copy(priceCents = -1)) }
        fails { store.saveItem(item.copy(priceCents = 1_000_001)) }
        fails { store.saveItem(item.copy(websiteUrl = "javascript:alert(1)")) }
        fails { store.saveItem(item.copy(websiteUrl = "https://user:password@example.com")) }
        fails { store.saveItem(item.copy(verifiedAt = "2026-02-30")) }
        fails { store.saveItem(item.copy(kind = Kind.ACTIVITY, category = "other")) }
        fails { store.saveItem(item.copy(description = mapOf("it" to "Descrizione"))) }
        assertEquals("https://example.com/path", PortalStore.safeWebURL("https://example.com/path"))
        assertNull(PortalStore.safeWebURL("http://example.com"))
        store.saveItem(item.copy(priceCents = 0))
        assertEquals(0, store.state.catalog.first().priceCents)
    }

    @Test fun daylightSavingTimesAndClockRefresh() {
        assertNull(RomeDay.date("2026-02-30"))
        assertNull(RomeDay.date("2026-9-23"))
        assertNull(RomeDay.moment("2026-03-29", "02:30"))
        assertEquals(Instant.parse("2026-10-25T00:30:00Z"), RomeDay.moment("2026-10-25", "02:30"))
        assertEquals("2026-09-24", RomeDay.today(Instant.parse("2026-09-23T22:00:00Z")))
        var now = instant
        val store = store(clock = { now })
        store.guest()
        now = instant.plusSeconds(5 * 3600)
        fails { store.order(time = "12:00") }
        assertEquals(now, store.now)
    }

    @Test fun passwordValidationAndTamperBounds() {
        val encoded = Password.hash("prova")
        assertTrue(Password.wellFormed(encoded))
        assertTrue(Password.verify("prova", encoded))
        assertFalse(Password.verify("errata", encoded))
        assertFalse(Password.verify("prova", encoded.replace("120000", "999999999")))
        assertFalse(Password.verify("x".repeat(257), encoded))
        assertFalse(Password.wellFormed("pbkdf2-sha256:120000:00:00"))
        fails { Password.hash("") }
        assertEquals("FAMIGLIA-ROSSI", Password.normalize(" famiglia  rossi "))
    }

    @Test fun bundledFormatDecodesLowercaseKindsAndIgnoresExportMetadata() {
        val json = """[{"id":"caprese","slug":"caprese","kind":"product","category":"food",
            "labels":{"en":"Caprese","it":"Caprese","de":"Caprese","ru":"Капрезе"},
            "createdAt":"2026-09-23T00:00:00Z","updatedAt":"2026-09-23T00:00:00Z"}]"""
        val item = PortalStore.decodeCatalog(json).single()
        assertEquals(Kind.PRODUCT, item.kind)
        assertEquals("Капрезе", item.title("ru"))
        assertNull(item.priceCents)
    }

    @Test fun actualBundledCatalogAcceptsDiningWithoutRewritingExistingState() {
        val resource = javaClass.classLoader!!.getResourceAsStream("catalog.json")
            ?: error("catalog.json non presente nelle risorse del test")
        val catalog = resource.bufferedReader().use { PortalStore.decodeCatalog(it.readText()) }
        assertEquals(37, catalog.size)
        assertEquals(10, catalog.count { it.kind == Kind.PRODUCT })
        assertEquals(3, catalog.count { it.kind == Kind.ACTIVITY })
        assertEquals(24, catalog.count { it.kind == Kind.GUIDE })
        assertTrue(catalog.all { item -> portalLocales.all { !item.labels[it].isNullOrBlank() } })
        for ((id, category) in mapOf("product-daily-lunch" to "lunch", "product-pizza-fenice" to "dinner")) {
            val item = catalog.single { it.id == id }
            assertEquals(category, item.category)
            assertNull(item.priceCents)
            assertTrue(portalLocales.all { !item.description?.get(it).isNullOrBlank() })
        }
        val file = File(temporary.root, "real-catalog.json")
        val initial = PortalStore(file, catalog) { instant }
        assertEquals(initial.state, PortalStore(file, emptyList()) { instant }.state)
        val previousFile = File(temporary.root, "previous-catalog.json")
        val previous = store(previousFile)
        previous.guest()
        previous.order()
        val bytes = previousFile.readBytes()
        assertEquals(previous.state, PortalStore(previousFile, catalog) { instant }.state)
        assertArrayEquals(bytes, previousFile.readBytes())
    }
}
