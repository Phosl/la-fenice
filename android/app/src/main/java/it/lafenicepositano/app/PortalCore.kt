package it.lafenicepositano.app

import java.io.File
import java.io.FileOutputStream
import java.net.URI
import java.nio.file.Files
import java.nio.file.StandardCopyOption
import java.security.MessageDigest
import java.security.SecureRandom
import java.time.Instant
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime
import java.time.ZoneId
import java.time.temporal.ChronoUnit
import java.util.Locale
import java.util.UUID
import javax.crypto.SecretKeyFactory
import javax.crypto.spec.PBEKeySpec
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

val portalLocales = listOf("en", "it", "de", "ru")

@Serializable enum class Role { @SerialName("guest") GUEST, @SerialName("admin") ADMIN }
@Serializable enum class Kind { @SerialName("product") PRODUCT, @SerialName("activity") ACTIVITY, @SerialName("guide") GUIDE }
@Serializable enum class ServiceKind { @SerialName("order") ORDER, @SerialName("activity") ACTIVITY, @SerialName("guide") GUIDE }
@Serializable enum class Status {
    @SerialName("pending") PENDING, @SerialName("confirmed") CONFIRMED,
    @SerialName("rejected") REJECTED, @SerialName("fulfilled") FULFILLED, @SerialName("cancelled") CANCELLED;
    val next: List<Status> get() = when (this) {
        PENDING -> listOf(CONFIRMED, REJECTED, CANCELLED)
        CONFIRMED -> listOf(FULFILLED, CANCELLED)
        else -> emptyList()
    }
}

@Serializable data class Stay(
    val surname: String, val guestName: String, val room: String, val guests: Int,
    val checkIn: String, val checkOut: String, val locale: String = "it", val active: Boolean = true,
    val id: String = UUID.randomUUID().toString(),
)

@Serializable data class Account(
    val loginCode: String, val passwordHash: String, val role: Role, val stayId: String? = null,
    val active: Boolean = true, val credentialVersion: Int = 1, val id: String = UUID.randomUUID().toString(),
)

@Serializable data class CatalogItem(
    val kind: Kind, val category: String, val labels: Map<String, String>,
    val id: String = UUID.randomUUID().toString(), val slug: String = id,
    val description: Map<String, String>? = null, val active: Boolean = true,
    val sortOrder: Int = 0, val priceCents: Int? = null, val address: String? = null,
    val phone: String? = null, val websiteUrl: String? = null, val mapsUrl: String? = null,
    val bookingNote: Map<String, String>? = null, val requestable: Boolean? = null,
    val verifiedAt: String? = null,
) {
    fun title(locale: String) = labels[locale] ?: labels["en"] ?: slug
    fun detail(locale: String) = description?.get(locale) ?: description?.get("en") ?: ""
    val categories: List<String> get() = categories(kind)
    companion object {
        fun categories(kind: Kind): List<String> = when (kind) {
            Kind.PRODUCT -> listOf("lunch", "dinner", "food", "classic-drink", "wine", "champagne", "raw-fish")
            Kind.ACTIVITY -> listOf("fishing", "boat-trip", "lemon-grove", "other")
            Kind.GUIDE -> listOf("dining", "after-dark", "sea", "see", "getting-around", "essentials")
        }
    }
}

@Serializable data class OrderLine(
    val itemId: String, val labels: Map<String, String>, val quantity: Int, val priceCents: Int? = null,
) { fun title(locale: String) = labels[locale] ?: labels["en"] ?: itemId }

@Serializable data class Request(
    val clientId: String, val stayId: String, val kind: ServiceKind, val labels: Map<String, String>,
    val serviceDate: String, val time: String, val notes: String, val createdAt: Long, val updatedAt: Long,
    val id: String = UUID.randomUUID().toString(), val itemId: String? = null,
    val lines: List<OrderLine> = emptyList(), val location: String? = null, val participants: Int? = null,
    val status: Status = Status.PENDING, val staffNote: String = "",
) {
    fun title(locale: String) = labels[locale] ?: labels["en"] ?: "Richiesta"
    val totalCents: Int? get() = if (lines.isEmpty() || lines.any { it.priceCents == null }) null
        else lines.sumOf { it.priceCents!! * it.quantity }
}

@Serializable data class State(
    val accounts: List<Account>, val stays: List<Stay>, val catalog: List<CatalogItem>,
    val requests: List<Request> = emptyList(), val version: Int = 1,
)
data class Credential(val loginCode: String, val password: String)
class PortalException(message: String) : IllegalArgumentException(message)

object RomeDay {
    val zone: ZoneId = ZoneId.of("Europe/Rome")
    fun today(now: Instant = Instant.now()): String = now.atZone(zone).toLocalDate().toString()
    fun date(key: String): LocalDate? = if (!key.matches(Regex("[0-9]{4}-[0-9]{2}-[0-9]{2}"))) null
        else runCatching { LocalDate.parse(key).takeIf { it.year > 0 } }.getOrNull()
    fun days(stay: Stay): List<String> {
        val start = date(stay.checkIn) ?: return emptyList()
        val end = date(stay.checkOut) ?: return emptyList()
        val nights = ChronoUnit.DAYS.between(start, end)
        return if (nights !in 1..60) emptyList() else (0..nights).map { start.plusDays(it).toString() }
    }
    fun orderable(key: String, stay: Stay, now: Instant = Instant.now()): Boolean = date(key) != null &&
        stay.active && key >= stay.checkIn && key < stay.checkOut && key >= today(now)

    fun moment(date: String, time: String): Instant? {
        val day = this.date(date) ?: return null
        if (!time.matches(Regex("(?:[01][0-9]|2[0-3]):[0-5][0-9]"))) return null
        val local = LocalDateTime.of(day, LocalTime.parse(time))
        // Reject a missing DST time; choose the first occurrence when the clock repeats.
        val offset = zone.rules.getValidOffsets(local).firstOrNull() ?: return null
        return local.toInstant(offset)
    }
}

// These credentials protect the local demo only; they are not server authentication.
object Password {
    private const val rounds = 120_000
    private val random = SecureRandom()
    private val pattern = Regex("pbkdf2-sha256:120000:([a-fA-F0-9]{32}):([a-fA-F0-9]{64})")
    fun normalize(value: String) = value.trim().uppercase(Locale.ITALIAN).replace(Regex("\\s+"), "-")
    fun wellFormed(value: String) = pattern.matches(value)
    fun hash(value: String): String {
        checkInput(value.isNotEmpty() && value.toByteArray(Charsets.UTF_8).size <= 256)
        val salt = ByteArray(16).also(random::nextBytes)
        return "pbkdf2-sha256:$rounds:${hex(salt)}:${hex(derive(value, salt))}"
    }
    fun verify(value: String, hash: String): Boolean {
        if (value.isEmpty() || value.toByteArray(Charsets.UTF_8).size > 256) return false
        val match = pattern.matchEntire(hash) ?: return false
        return runCatching {
            MessageDigest.isEqual(derive(value, bytes(match.groupValues[1])), bytes(match.groupValues[2]))
        }.getOrDefault(false)
    }
    fun generate(): String = hex(ByteArray(12).also(random::nextBytes)).chunked(6).joinToString("-")
    private fun derive(value: String, salt: ByteArray): ByteArray {
        val spec = PBEKeySpec(value.toCharArray(), salt, rounds, 256)
        return try { SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256").generateSecret(spec).encoded }
        finally { spec.clearPassword() }
    }
    private fun hex(bytes: ByteArray) = bytes.joinToString("") { "%02x".format(it.toInt() and 255) }
    private fun bytes(hex: String) = hex.chunked(2).map { it.toInt(16).toByte() }.toByteArray()
}

private fun checkInput(condition: Boolean, message: String = "Controlla i campi: i valori non sono validi.") {
    if (!condition) throw PortalException(message)
}

class PortalStore(
    private val file: File? = null, catalog: List<CatalogItem>, private val clock: () -> Instant = Instant::now,
) {
    var state: State
        private set
    var now: Instant = clock()
        private set
    var locale: String = "it"
        private set
    private var session: Pair<String, Int>? = null
    val today: String get() = RomeDay.today(now)
    val account: Account? get() {
        val session = session ?: return null
        return state.accounts.firstOrNull {
            it.id == session.first && it.credentialVersion == session.second && it.active &&
                (it.role == Role.ADMIN || state.stays.any { stay -> stay.id == it.stayId && stay.active })
        }
    }
    val stay: Stay? get() = state.stays.firstOrNull { it.id == account?.stayId }
    val visibleRequests: List<Request> get() {
        val account = account ?: return emptyList()
        return state.requests.filter { account.role == Role.ADMIN || it.stayId == account.stayId }
            .sortedByDescending { it.createdAt }
    }

    init {
        if (file?.exists() == true) {
            state = try {
                checkInput(file.isFile && file.length() <= 20_000_000)
                json.decodeFromString<State>(file.readText()).also(::validate)
            } catch (_: Exception) { throw PortalException("I dati locali non sono leggibili. Non sono stati cancellati o sostituiti.") }
        } else {
            val day = now.atZone(RomeDay.zone).toLocalDate()
            val stay = Stay("Rossi", "Famiglia Rossi", "Camera 3 · Terrazza mare", 2,
                day.minusDays(2).toString(), day.plusDays(4).toString())
            state = State(listOf(
                Account("CLIENTE", Password.hash("cliente"), Role.GUEST, stay.id),
                Account("ADMIN", Password.hash("admin"), Role.ADMIN),
            ), listOf(stay), catalog.toList())
            validate(state)
            persist(state)
        }
    }

    fun refreshClock() { now = clock() }
    fun login(code: String, password: String, role: Role) {
        refreshClock()
        session = null
        val candidate = state.accounts.firstOrNull { it.loginCode == Password.normalize(code) }
        checkInput(candidate != null && candidate.role == role && candidate.active &&
            Password.verify(password, candidate.passwordHash) && (role == Role.ADMIN ||
            state.stays.any { it.id == candidate.stayId && it.active }),
            "Codice o password non validi, oppure accesso disattivato.")
        session = candidate!!.id to candidate.credentialVersion
        locale = stay?.locale ?: "it"
    }
    fun logout() { session = null }
    fun setLocale(value: String) {
        checkInput(value in portalLocales)
        stay?.let { stay -> commit(state.copy(stays = state.stays.map { if (it.id == stay.id) it.copy(locale = value) else it })) }
        locale = value
    }
    fun activeCatalog(kind: Kind) = state.catalog.filter { it.active && it.kind == kind }
        .sortedWith(compareBy<CatalogItem> { it.sortOrder }.thenBy { it.id })

    fun submitOrder(date: String, time: String, location: String, notes: String,
                    quantities: Map<String, Int>, clientId: String): Request {
        val stay = requireGuest()
        repeated(clientId, stay.id, ServiceKind.ORDER, null)?.let { return it }
        validateRequest(date, time, notes, stay)
        checkInput(location in locations && quantities.isNotEmpty() && quantities.size <= 100)
        val lines = quantities.toSortedMap().map { (id, quantity) ->
            checkInput(quantity in 1..20)
            val item = state.catalog.firstOrNull { it.id == id && it.active && it.kind == Kind.PRODUCT }
                ?: throw PortalException("Questo servizio non è disponibile.")
            OrderLine(id, item.labels.toMap(), quantity, item.priceCents)
        }
        return append(Request(clientId, stay.id, ServiceKind.ORDER,
            mapOf("it" to "Ordine", "en" to "Order", "de" to "Bestellung", "ru" to "Заказ"),
            date, time, notes.trim(), now.toEpochMilli(), now.toEpochMilli(), lines = lines, location = location))
    }
    fun submitExperience(itemId: String, date: String, time: String, participants: Int,
                         notes: String, clientId: String): Request {
        val stay = requireGuest()
        val item = state.catalog.firstOrNull { it.id == itemId && it.kind != Kind.PRODUCT }
            ?: throw PortalException("Questo servizio non è disponibile.")
        val kind = if (item.kind == Kind.GUIDE) ServiceKind.GUIDE else ServiceKind.ACTIVITY
        repeated(clientId, stay.id, kind, itemId)?.let { return it }
        checkInput(item.active && (item.kind != Kind.GUIDE || item.requestable == true), "Questo servizio non è disponibile.")
        validateRequest(date, time, notes, stay)
        checkInput(participants in 1..stay.guests)
        return append(Request(clientId, stay.id, kind, item.labels.toMap(), date, time, notes.trim(),
            now.toEpochMilli(), now.toEpochMilli(), itemId = itemId, participants = participants))
    }
    fun cancelRequest(id: String) {
        val stay = requireGuest()
        val request = state.requests.firstOrNull { it.id == id && it.stayId == stay.id }
            ?: throw PortalException("Accedi con il profilo autorizzato per questa azione.")
        checkInput(request.status == Status.PENDING, "La richiesta non può passare a questo stato.")
        replaceRequest(request.copy(status = Status.CANCELLED, updatedAt = now.toEpochMilli()))
    }
    fun updateRequest(id: String, status: Status, staffNote: String) {
        requireAdmin()
        val request = state.requests.firstOrNull { it.id == id } ?: throw PortalException("Richiesta non trovata.")
        checkInput(staffNote.length <= 1_000)
        checkInput(status == request.status || status in request.status.next, "La richiesta non può passare a questo stato.")
        replaceRequest(request.copy(status = status, staffNote = staffNote.trim(), updatedAt = now.toEpochMilli()))
    }
    fun createStay(surname: String, guestName: String, room: String, guests: Int,
                   checkIn: String, checkOut: String, locale: String): Credential {
        requireAdmin()
        val stay = Stay(surname.trim(), guestName.trim(), room.trim(), guests, checkIn, checkOut, locale)
        validateStay(stay)
        val code = "OSPITE-${UUID.randomUUID().toString().take(8).uppercase(Locale.ROOT)}"
        checkInput(state.accounts.none { it.loginCode == code }, "Questo codice di accesso è già utilizzato.")
        val credential = Credential(code, Password.generate())
        commit(state.copy(stays = state.stays + stay,
            accounts = state.accounts + Account(code, Password.hash(credential.password), Role.GUEST, stay.id)))
        return credential
    }
    fun updateStay(stay: Stay) {
        requireAdmin()
        validateStay(stay)
        checkInput(state.stays.any { it.id == stay.id })
        checkInput(state.requests.filter { it.stayId == stay.id }.all {
            it.serviceDate >= stay.checkIn && it.serviceDate < stay.checkOut && (it.participants ?: 1) <= stay.guests
        }, "Le nuove date o il numero di ospiti non sono compatibili con le richieste esistenti.")
        commit(state.copy(stays = state.stays.map { if (it.id == stay.id) stay else it },
            accounts = state.accounts.map {
                if (it.stayId == stay.id && it.active != stay.active) it.copy(active = stay.active, credentialVersion = it.credentialVersion + 1) else it
            }))
    }
    fun setStayActive(id: String, active: Boolean) {
        requireAdmin()
        val stay = state.stays.firstOrNull { it.id == id } ?: throw PortalException("Soggiorno non trovato.")
        updateStay(stay.copy(active = active))
    }
    fun resetPassword(stayId: String): Credential {
        requireAdmin()
        val account = state.accounts.firstOrNull { it.stayId == stayId && it.role == Role.GUEST }
            ?: throw PortalException("Soggiorno non trovato.")
        val credential = Credential(account.loginCode, Password.generate())
        val changed = account.copy(passwordHash = Password.hash(credential.password), credentialVersion = account.credentialVersion + 1)
        commit(state.copy(accounts = state.accounts.map { if (it.id == account.id) changed else it }))
        return credential
    }
    fun saveItem(item: CatalogItem) {
        requireAdmin()
        validateItem(item)
        val existing = state.catalog.firstOrNull { it.id == item.id }
        checkInput(existing == null || existing.kind == item.kind)
        val snapshot = item.copy(labels = item.labels.toMap(), description = item.description?.toMap(), bookingNote = item.bookingNote?.toMap())
        commit(state.copy(catalog = if (existing == null) state.catalog + snapshot else state.catalog.map { if (it.id == item.id) snapshot else it }))
    }
    fun setItemActive(id: String, active: Boolean) {
        requireAdmin()
        val item = state.catalog.firstOrNull { it.id == id } ?: throw PortalException("Servizio non trovato.")
        saveItem(item.copy(active = active))
    }
    private fun requireAdmin() {
        refreshClock()
        checkInput(account?.role == Role.ADMIN, "Accedi con il profilo autorizzato per questa azione.")
    }
    private fun requireGuest(): Stay {
        refreshClock()
        checkInput(account?.role == Role.GUEST, "Accedi con il profilo autorizzato per questa azione.")
        return stay ?: throw PortalException("Soggiorno non disponibile.")
    }
    private fun validateRequest(date: String, time: String, notes: String, stay: Stay) {
        checkInput(RomeDay.orderable(date, stay, now), "Puoi richiedere servizi da oggi fino al giorno prima del check-out.")
        checkInput(notes.length <= 1_000)
        checkInput(RomeDay.moment(date, time)?.isAfter(now) == true, "Scegli un orario futuro valido, nel fuso orario di Positano.")
    }
    private fun repeated(id: String, stayId: String, kind: ServiceKind, itemId: String?): Request? {
        checkInput(validUuid(id))
        val existing = state.requests.firstOrNull { it.stayId == stayId && it.clientId == id }
        checkInput(existing == null || (existing.kind == kind && existing.itemId == itemId))
        return existing
    }
    private fun append(request: Request): Request {
        commit(state.copy(requests = state.requests + request))
        return request
    }
    private fun replaceRequest(request: Request) = commit(state.copy(requests = state.requests.map { if (it.id == request.id) request else it }))
    private fun commit(next: State) {
        validate(next)
        persist(next) // Publish success only after the atomic replacement succeeds.
        state = next
    }
    private fun persist(next: State) {
        val file = file ?: return
        var temporary: File? = null
        try {
            val bytes = json.encodeToString(next).toByteArray(Charsets.UTF_8)
            checkInput(bytes.size <= 20_000_000)
            val directory = file.absoluteFile.parentFile ?: throw IllegalStateException()
            Files.createDirectories(directory.toPath())
            temporary = Files.createTempFile(directory.toPath(), ".fenice-", ".tmp").toFile()
            FileOutputStream(temporary).use { output ->
                output.write(bytes)
                output.fd.sync()
            }
            // Fail safely if this filesystem cannot replace atomically; never delete the old file first.
            Files.move(temporary.toPath(), file.toPath(), StandardCopyOption.ATOMIC_MOVE, StandardCopyOption.REPLACE_EXISTING)
        } catch (_: Exception) {
            throw PortalException("Salvataggio non riuscito. La modifica non è stata applicata: riprova.")
        } finally { temporary?.delete() }
    }

    companion object {
        val locations = listOf("room", "pool", "beach")
        private val json = Json { ignoreUnknownKeys = true; encodeDefaults = true }
        fun decodeCatalog(value: String): List<CatalogItem> = json.decodeFromString<List<CatalogItem>>(value).also { it.forEach(::validateItem) }
        fun safeWebURL(value: String?): String? = runCatching {
            value?.let { URI(it) }?.takeIf { it.scheme.equals("https", true) && !it.host.isNullOrBlank() && it.rawUserInfo == null }?.toString()
        }.getOrNull()
        private fun validUuid(value: String) = runCatching { UUID.fromString(value).toString().equals(value, true) }.getOrDefault(false)
        private fun nonempty(value: String, max: Int) = value.isNotBlank() && value.length <= max
        private fun labels(values: Map<String, String>, max: Int = 160) = portalLocales.all { nonempty(values[it] ?: "", max) }
        private fun validateStay(stay: Stay) {
            checkInput(nonempty(stay.id, 120) && nonempty(stay.surname, 100) && nonempty(stay.guestName, 160) &&
                nonempty(stay.room, 100) && stay.guests in 1..20 && stay.locale in portalLocales)
            checkInput(RomeDay.days(stay).isNotEmpty(), "Inserisci date valide e un soggiorno da 1 a 60 notti.")
        }
        private fun validateItem(item: CatalogItem) {
            checkInput(nonempty(item.id, 120) && nonempty(item.slug, 160) && item.category in item.categories &&
                labels(item.labels) && item.sortOrder in 0..100_000 && (item.priceCents == null || item.priceCents in 0..1_000_000))
            listOfNotNull(item.description, item.bookingNote).forEach { checkInput(labels(it, 4_000)) }
            listOfNotNull(item.websiteUrl, item.mapsUrl).filter { it.isNotEmpty() }.forEach {
                checkInput(it.length <= 2_048 && safeWebURL(it) != null)
            }
            checkInput((item.address?.length ?: 0) <= 500 && (item.phone?.length ?: 0) <= 80 &&
                (item.verifiedAt.isNullOrEmpty() || RomeDay.date(item.verifiedAt) != null))
        }
        private fun validate(state: State) {
            checkInput(state.version == 1 && state.accounts.any { it.role == Role.ADMIN && it.active } &&
                state.accounts.map { it.id }.distinct().size == state.accounts.size &&
                state.accounts.map { it.loginCode }.distinct().size == state.accounts.size &&
                state.stays.map { it.id }.distinct().size == state.stays.size &&
                state.catalog.map { it.id }.distinct().size == state.catalog.size &&
                state.requests.map { it.id }.distinct().size == state.requests.size &&
                state.requests.map { it.stayId to it.clientId }.distinct().size == state.requests.size)
            state.accounts.forEach { account ->
                checkInput(nonempty(account.id, 120) && nonempty(account.loginCode, 120) && account.loginCode == Password.normalize(account.loginCode) &&
                    account.credentialVersion in 1 until Int.MAX_VALUE && Password.wellFormed(account.passwordHash) &&
                    if (account.role == Role.ADMIN) account.stayId == null else state.stays.any { it.id == account.stayId && it.active == account.active })
            }
            state.stays.forEach { stay ->
                validateStay(stay)
                checkInput(state.accounts.count { it.stayId == stay.id && it.role == Role.GUEST } == 1)
            }
            state.catalog.forEach(::validateItem)
            state.requests.forEach { request ->
                val stay = state.stays.firstOrNull { it.id == request.stayId } ?: throw PortalException("Soggiorno non trovato.")
                checkInput(nonempty(request.id, 120) && validUuid(request.clientId) &&
                    request.serviceDate >= stay.checkIn && request.serviceDate < stay.checkOut &&
                    RomeDay.moment(request.serviceDate, request.time) != null && request.notes.length <= 1_000 &&
                    request.staffNote.length <= 1_000 && labels(request.labels) && request.createdAt >= 0 && request.createdAt <= request.updatedAt)
                if (request.kind == ServiceKind.ORDER) {
                    checkInput(request.lines.isNotEmpty() && request.lines.size <= 100 && request.location in locations &&
                        request.itemId == null && request.participants == null && request.lines.map { it.itemId }.distinct().size == request.lines.size)
                    request.lines.forEach { line -> checkInput(line.quantity in 1..20 && labels(line.labels) &&
                        (line.priceCents == null || line.priceCents in 0..1_000_000) && state.catalog.any { it.id == line.itemId && it.kind == Kind.PRODUCT }) }
                } else {
                    val kind = if (request.kind == ServiceKind.GUIDE) Kind.GUIDE else Kind.ACTIVITY
                    checkInput(request.lines.isEmpty() && request.location == null && (request.participants ?: 0) in 1..stay.guests &&
                        state.catalog.any { it.id == request.itemId && it.kind == kind })
                }
            }
        }
    }
}
