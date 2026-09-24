package it.lafenicepositano.app

import android.app.Application
import android.app.DatePickerDialog
import android.app.TimePickerDialog
import android.content.Intent
import android.graphics.BitmapFactory
import android.net.Uri
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.ScrollState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.automirrored.filled.List
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material.icons.filled.ShoppingCart
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.saveable.rememberSaveableStateHolder
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File
import java.math.BigDecimal
import java.text.NumberFormat
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale
import java.util.UUID

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge(
            statusBarStyle = SystemBarStyle.light(android.graphics.Color.TRANSPARENT, android.graphics.Color.TRANSPARENT),
            navigationBarStyle = SystemBarStyle.light(android.graphics.Color.TRANSPARENT, android.graphics.Color.TRANSPARENT)
        )
        setContent {
            MaterialTheme(colorScheme = lightColorScheme(
                primary = Color(0xFF142C83), onPrimary = Color.White,
                background = Color(0xFFF8F5EF), surface = Color(0xFFF8F5EF),
                surfaceContainer = Color(0xFFF0EDE5), surfaceContainerLow = Color(0xFFFFFDF8),
                primaryContainer = Color(0xFFE6ECF8), onPrimaryContainer = Color(0xFF142C83),
                onSurface = Color(0xFF25352F), onSurfaceVariant = Color(0xFF59635C),
                outline = Color(0xFFADB7B1), outlineVariant = Color(0xFFDFE3DC), secondary = Color(0xFF536456)
            ), typography = feniceTypography) { PortalApp(viewModel()) }
        }
    }
}

private val feniceTypography = Typography().run {
    copy(
        headlineLarge = headlineLarge.copy(fontFamily = FontFamily.Serif, fontSize = 34.sp, lineHeight = 40.sp, fontWeight = FontWeight.Normal),
        headlineMedium = headlineMedium.copy(fontFamily = FontFamily.Serif, fontSize = 30.sp, lineHeight = 36.sp, fontWeight = FontWeight.Normal),
        headlineSmall = headlineSmall.copy(fontFamily = FontFamily.Serif, fontSize = 26.sp, lineHeight = 32.sp, fontWeight = FontWeight.Normal),
        titleLarge = titleLarge.copy(fontSize = 20.sp, lineHeight = 26.sp),
        bodyLarge = bodyLarge.copy(lineHeight = 24.sp)
    )
}

class PortalModel(application: Application) : AndroidViewModel(application) {
    var store by mutableStateOf<PortalStore?>(null); private set
    var busy by mutableStateOf(false); private set
    var error by mutableStateOf<String?>(null)
    var revision by mutableIntStateOf(0); private set
    init { open() }
    fun open() {
        if (busy) return
        busy = true
        viewModelScope.launch {
            try {
                store = withContext(Dispatchers.IO) {
                    val app = getApplication<Application>()
                    PortalStore(File(app.noBackupFilesDir, "la-fenice-demo-v1.json"),
                        PortalStore.decodeCatalog(app.assets.open("catalog.json").bufferedReader().use { it.readText() }))
                }
            } catch (e: Exception) { error = e.message ?: "Impossibile aprire i dati locali. Non sono stati cancellati." }
            finally { busy = false }
        }
    }
    fun <T> act(done: (T) -> Unit = {}, action: PortalStore.() -> T) {
        val current = store ?: return
        if (busy) return
        busy = true
        viewModelScope.launch {
            try {
                val result = withContext(Dispatchers.IO) { current.action() }
                revision++
                done(result)
            } catch (e: Exception) { error = e.message ?: "Operazione non riuscita. Riprova." }
            finally { busy = false }
        }
    }
}

private val locales = linkedMapOf("it" to "Italiano", "en" to "English", "de" to "Deutsch", "ru" to "Русский")
private val rome = ZoneId.of("Europe/Rome")
private fun dateLabel(value: String): String = runCatching {
    LocalDate.parse(value).format(DateTimeFormatter.ofPattern("d MMM yyyy", Locale.ITALIAN))
}.getOrDefault(value)
private fun price(cents: Int?): String = cents?.let { NumberFormat.getCurrencyInstance(Locale.ITALY).format(it / 100.0) } ?: "Prezzo da confermare"
private fun statusName(status: Status) = when (status) {
    Status.PENDING -> "In attesa"; Status.CONFIRMED -> "Confermata"; Status.REJECTED -> "Rifiutata"
    Status.FULFILLED -> "Completata"; Status.CANCELLED -> "Annullata"
}
private fun kindName(kind: Kind) = when (kind) { Kind.PRODUCT -> "Prodotti"; Kind.ACTIVITY -> "Esperienze"; Kind.GUIDE -> "Guida" }
private fun locationName(location: String?) = when (location) { "room" -> "Camera"; "pool" -> "Piscina"; "beach" -> "Spiaggia"; else -> "" }

// An ospite arrives needing a service and leaves with a clear, honest local request record.
@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun PortalApp(model: PortalModel) {
    val revision = model.revision
    val store = model.store
    var info by remember { mutableStateOf(false) }
    val lifecycle = LocalLifecycleOwner.current.lifecycle
    DisposableEffect(lifecycle, model) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_RESUME) model.act { refreshClock() }
        }
        lifecycle.addObserver(observer)
        onDispose { lifecycle.removeObserver(observer) }
    }
    Column(Modifier.fillMaxSize().background(MaterialTheme.colorScheme.background).safeDrawingPadding()) {
        TextButton(onClick = { info = true }, modifier = Modifier.fillMaxWidth().heightIn(min = 44.dp),
            colors = ButtonDefaults.textButtonColors(contentColor = MaterialTheme.colorScheme.onSurfaceVariant)) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Icon(Icons.Default.Info, null, Modifier.size(15.dp))
                Text("Demo locale · Nessun invio reale", style = MaterialTheme.typography.labelMedium)
            }
        }
        if (model.busy) LinearProgressIndicator(Modifier.fillMaxWidth())
        if (store == null) {
            Column(Modifier.padding(24.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                Text("La Fenice", style = MaterialTheme.typography.headlineLarge)
                Text(if (model.busy) "Apertura della demo…" else "I dati locali non sono disponibili. Nessun dato è stato sostituito.")
                if (!model.busy) Button(onClick = model::open) { Text("Riprova") }
            }
        } else {
            @Suppress("UNUSED_VARIABLE") val observe = revision
            key(store.account?.id ?: "login") {
                if (store.account == null) Login(model)
                else PortalHome(model, store)
            }
        }
    }
    if (info) AlertDialog(onDismissRequest = { info = false }, title = { Text("Prima di provare") }, text = {
        Text("I dati restano solo in questa installazione. Non sono sincronizzati con iOS, sito o staff. Nessuna email, notifica, prenotazione o pagamento viene inviato.\n\nGli accessi sono dimostrativi: usa dati fittizi. Interfaccia italiana; contenuti in quattro lingue.")
    }, confirmButton = { TextButton(onClick = { info = false }) { Text("Ho capito") } })
    model.error?.let { message -> AlertDialog(onDismissRequest = { model.error = null },
        title = { Text("Impossibile completare") }, text = { Text(message) },
        confirmButton = { TextButton(onClick = { model.error = null }) { Text("OK") } }) }
}

@Composable
private fun Login(model: PortalModel) {
    var role by rememberSaveable { mutableStateOf(Role.GUEST) }
    var code by rememberSaveable { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    Page {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(18.dp)) {
            BrandImage("Assets.xcassets/Phoenix.imageset/Phoenix.png", "La Fenice", 64, Modifier.width(72.dp))
            Column(verticalArrangement = Arrangement.spacedBy(3.dp)) {
                Eyebrow("POSITANO, LA FENICE")
                Heading("Benvenuto.")
            }
        }
        Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(20.dp))) {
            BrandImage("Assets.xcassets/Property.imageset/property.jpg", "Il mare e le terrazze di La Fenice a Positano", 108, contentScale = ContentScale.Crop)
            WelcomeWater(Modifier.fillMaxWidth().height(30.dp))
        }
        Text("Il tuo soggiorno, con calma.", style = MaterialTheme.typography.titleMedium)
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            listOf(Role.GUEST to "Sono ospite", Role.ADMIN to "Staff").forEach { (value, label) ->
                FilterChip(selected = role == value, onClick = { role = value; code = ""; password = "" },
                    label = { Text(label) }, modifier = Modifier.weight(1f), enabled = !model.busy)
            }
        }
        Field("Codice di accesso", code, { code = it }, keyboard = KeyboardType.Ascii)
        Field("Password", password, { password = it }, password = true)
        PrimaryAction(if (role == Role.GUEST) "Accedi al soggiorno" else "Apri la gestione", enabled = !model.busy && code.isNotBlank() && password.isNotEmpty(), onClick = { val enteredCode = code; val enteredPassword = password; val enteredRole = role
            model.act(done = { password = "" }) { login(enteredCode, enteredPassword, enteredRole) } },
        )
        Surface(color = MaterialTheme.colorScheme.surfaceContainer, shape = RoundedCornerShape(16.dp)) {
            Row(Modifier.padding(start = 16.dp, end = 8.dp, top = 8.dp, bottom = 8.dp), verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                    Text("Vuoi fare una prova?", style = MaterialTheme.typography.labelLarge)
                    Text(if (role == Role.GUEST) "cliente / cliente" else "admin / admin", style = MaterialTheme.typography.bodySmall)
                }
                TextButton(onClick = { code = if (role == Role.GUEST) "cliente" else "admin"; password = code }, enabled = !model.busy) { Text("Compila") }
            }
        }
        Note("Usa dati fittizi. Cognome e camera, da soli, non consentono l’accesso.")
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun PortalHome(model: PortalModel, store: PortalStore) {
    @Suppress("UNUSED_VARIABLE") val observedRevision = model.revision
    val admin = store.account?.role == Role.ADMIN
    val tabs = if (admin) listOf("Richieste", "Soggiorni", "Catalogo") else listOf("Soggiorno", "Ordina", "Esperienze", "Guida", "Richieste")
    var tab by rememberSaveable { mutableIntStateOf(0) }
    var screen by rememberSaveable { mutableStateOf("") }
    var logout by remember { mutableStateOf(false) }
    var date by rememberSaveable { mutableStateOf(store.stay?.let { maxOf(store.today, it.checkIn) } ?: store.today) }
    val savedTabs = rememberSaveableStateHolder()
    BackHandler(screen.isNotEmpty()) { screen = "" }
    Scaffold(topBar = {
        TopAppBar(title = { Text(if (screen.isEmpty()) { if (!admin && tab == 0) "La Fenice" else tabs[tab] } else when { screen.startsWith("request:") -> "Dettaglio richiesta"; screen.startsWith("stay:") -> "Soggiorno"; screen.startsWith("catalog:") -> "Catalogo"; else -> "Dettagli" }, style = MaterialTheme.typography.titleLarge) },
            navigationIcon = { if (screen.isNotEmpty()) TextButton(onClick = { screen = "" }, enabled = !model.busy) { Text("Indietro") } },
            actions = { TextButton(onClick = { logout = true }, enabled = !model.busy) { Text("Esci") } })
    }, bottomBar = {
        if (screen.isEmpty()) NavigationBar(containerColor = MaterialTheme.colorScheme.surfaceContainerLow, tonalElevation = 0.dp) {
            tabs.forEachIndexed { index, title -> NavigationBarItem(selected = tab == index,
                onClick = { tab = index }, icon = { Icon(when (title) { "Ordina" -> Icons.Default.ShoppingCart; "Esperienze" -> Icons.Default.DateRange; "Guida" -> Icons.Default.LocationOn; "Richieste" -> Icons.AutoMirrored.Filled.List; "Catalogo" -> Icons.Default.Menu; else -> Icons.Default.Home }, contentDescription = null) },
                label = { Text(title, maxLines = 1, style = MaterialTheme.typography.labelSmall) }) }
        }
    }) { padding ->
        Box(Modifier.padding(padding).fillMaxSize()) {
            when {
                screen.startsWith("request:") -> RequestDetail(model, store, screen.substringAfter(":"))
                screen.startsWith("stay:") -> StayEditor(model, store, screen.substringAfter(":")) { screen = "" }
                screen.startsWith("catalog:") -> CatalogEditor(model, store, screen.substringAfter(":")) { screen = "" }
                screen.startsWith("item:") -> store.state.catalog.firstOrNull { it.id == screen.substringAfter(":") }?.let { item -> Experience(model, store, item, date) { screen = ""; tab = tabs.lastIndex } }
                else -> savedTabs.SaveableStateProvider(tab) {
                    when {
                        admin && tab == 0 -> Requests(model, store, true) { screen = "request:$it" }
                        admin && tab == 1 -> Stays(model, store) { screen = "stay:$it" }
                        admin -> Catalog(model, store) { screen = "catalog:$it" }
                        tab == 0 -> StayPage(model, store, date, { date = it }, { tab = 1 }, { screen = "request:$it" })
                        tab == 1 -> OrderForm(model, store, date, { date = it }) { tab = tabs.lastIndex }
                        tab == 2 -> Items(model, store, Kind.ACTIVITY) { screen = "item:$it" }
                        tab == 3 -> Items(model, store, Kind.GUIDE) { screen = "item:$it" }
                        else -> Requests(model, store, false) { screen = "request:$it" }
                    }
                }
            }
        }
    }
    if (logout) AlertDialog(onDismissRequest = { logout = false }, title = { Text("Uscire dall’account?") }, text = { Text("Le richieste salvate restano sul dispositivo. I moduli non salvati verranno chiusi.") },
        confirmButton = { TextButton(onClick = { model.act { logout() } }) { Text("Esci") } },
        dismissButton = { TextButton(onClick = { logout = false }) { Text("Resta") } })
}

@Composable
private fun StayPage(model: PortalModel, store: PortalStore, date: String, changeDate: (String) -> Unit, order: () -> Unit, request: (String) -> Unit) {
    @Suppress("UNUSED_VARIABLE") val observedRevision = model.revision
    val stay = store.stay ?: return
    val orderable = RomeDay.orderable(date, stay, Instant.now())
    Page {
        Eyebrow("IL TUO TEMPO A POSITANO")
        Heading(stay.guestName)
        Surface(color = MaterialTheme.colorScheme.surfaceContainerLow, shape = RoundedCornerShape(22.dp)) {
            Column(Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text(stay.room, style = MaterialTheme.typography.titleMedium)
                Note("${stay.guests} ospiti · ${dateLabel(stay.checkIn)} — ${dateLabel(stay.checkOut)}")
                HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
                Text("Per ${dateLabel(date)}", style = MaterialTheme.typography.labelLarge)
                PrimaryAction("Ordina qualcosa", enabled = orderable && !model.busy, onClick = order)
                if (!orderable) Note(if (date == stay.checkOut) "Il giorno del check-out è consultabile, senza nuovi servizi." else "Questo giorno è consultabile, senza nuovi servizi.")
            }
        }
        SectionTitle("Organizza la tua giornata")
        DateField("Scegli il giorno", date, changeDate, stay.checkIn, stay.checkOut)
        val requests = store.visibleRequests.filter { it.serviceDate == date }
        if (requests.isEmpty()) EmptyNote("Una giornata da scegliere", "Le richieste salvate per questo giorno appariranno qui.")
        requests.forEach { RequestRow(it, store.locale) { request(it.id) } }
        Surface(color = MaterialTheme.colorScheme.surfaceContainer, shape = RoundedCornerShape(16.dp)) {
            Column(Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                SectionTitle("Una nota sulle scale")
                Text("La Fenice si sviluppa su più livelli collegati da numerose scale. Può non essere adatta a chi ha mobilità ridotta o difficoltà a percorrerle. Contatta la struttura per valutare le tue esigenze.", style = MaterialTheme.typography.bodyMedium)
            }
        }
        Choice("Lingua dei contenuti", store.locale, locales) { model.act { setLocale(it) } }
        Note("L’interfaccia è in italiano; menu, esperienze e guida seguono la lingua scelta.")
    }
}

@Composable
private fun OrderForm(model: PortalModel, store: PortalStore, date: String, changeDate: (String) -> Unit, finished: () -> Unit) {
    @Suppress("UNUSED_VARIABLE") val observedRevision = model.revision
    var quantities by rememberSaveable { mutableStateOf(mapOf<String, Int>()) }
    var time by rememberSaveable { mutableStateOf(defaultTime()) }
    var location by rememberSaveable { mutableStateOf("room") }
    var notes by rememberSaveable { mutableStateOf("") }
    var review by remember { mutableStateOf(false) }
    var receipt by remember { mutableStateOf(false) }
    var clientId by rememberSaveable { mutableStateOf(UUID.randomUUID().toString()) }
    val stay = store.stay ?: return
    val items = store.activeCatalog(Kind.PRODUCT)
    val selected = items.filter { quantities.containsKey(it.id) }
    val total = if (selected.isNotEmpty() && selected.all { it.priceCents != null }) selected.sumOf { it.priceCents!! * quantities.getValue(it.id) } else null
    val units = quantities.values.sum()
    val orderable = RomeDay.orderable(date, stay, Instant.now())
    val validTime = RomeDay.moment(date, time)?.isAfter(Instant.now()) == true
    Column(Modifier.fillMaxSize().imePadding()) {
        Box(Modifier.weight(1f)) { Page {
            Eyebrow("IL MENU DELLA CASA")
            Heading("Qualcosa di buono.")
            Note("Scegli dal menu, poi indica dove e quando. Prezzi e disponibilità restano da confermare.")
            items.groupBy { it.category }.forEach { (category, products) ->
                SectionTitle(categoryName(category))
                Surface(color = MaterialTheme.colorScheme.surfaceContainerLow, shape = RoundedCornerShape(18.dp)) {
                    Column(Modifier.padding(horizontal = 16.dp)) {
                        products.forEachIndexed { index, item ->
                            if (index > 0) HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
                            Row(Modifier.padding(vertical = 18.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                                Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(5.dp)) {
                                    Text(item.title(store.locale), style = MaterialTheme.typography.titleMedium)
                                    Text(price(item.priceCents), style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                                val quantity = quantities[item.id] ?: 0
                                Box(Modifier.width(132.dp), contentAlignment = Alignment.CenterEnd) {
                                    if (quantity == 0) OutlinedButton(onClick = { quantities = quantities + (item.id to 1) }, enabled = !model.busy,
                                        shape = RoundedCornerShape(12.dp), modifier = Modifier.heightIn(min = 48.dp).semantics { contentDescription = "Aggiungi ${item.title(store.locale)}" }) { Text("Aggiungi") }
                                    else Quantity(item.title(store.locale), quantity, 0, 20, compact = true, enabled = !model.busy) { value -> quantities = quantities.toMutableMap().apply { if (value == 0) remove(item.id) else put(item.id, value) } }
                                }
                            }
                        }
                    }
                }
            }
            if (items.isEmpty()) EmptyNote("Il menu è in preparazione", "Per informazioni rivolgiti alla struttura.")
            SectionTitle("Dove e quando")
            DateField("Giorno", date, changeDate, maxOf(store.today, stay.checkIn), stay.checkOut)
            TimeField(time) { time = it }
            if (orderable && !validTime) ErrorText("Scegli un orario futuro, nel fuso orario di Positano.")
            if (!orderable) Note("Scegli un giorno da oggi al giorno prima del check-out.")
            Choice("Consegna", location, mapOf("room" to "Camera", "pool" to "Piscina", "beach" to "Spiaggia")) { location = it }
            Field("Allergie o altre esigenze · facoltativo", notes, { notes = it }, multiline = true)
            if (notes.length > 1000) ErrorText("Accorcia le note: massimo 1000 caratteri.")
            Note("La demo salva sul dispositivo. Nessun ordine viene inviato allo staff.")
        } }
        Surface(color = MaterialTheme.colorScheme.surfaceContainerLow, shadowElevation = 5.dp) {
            Column(Modifier.padding(horizontal = 24.dp, vertical = 12.dp), verticalArrangement = Arrangement.spacedBy(9.dp)) {
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text(if (units == 1) "1 articolo" else "$units articoli", style = MaterialTheme.typography.labelLarge)
                    Text(if (units == 0) "Scegli dal menu" else price(total), style = MaterialTheme.typography.labelLarge)
                }
                PrimaryAction("Rivedi l’ordine", enabled = quantities.isNotEmpty() && notes.length <= 1000 && !model.busy && orderable && validTime) { review = true }
            }
        }
    }
    if (review) AlertDialog(onDismissRequest = { if (!model.busy) review = false }, title = { Text("Riepilogo ordine") }, text = {
        Column(Modifier.verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            items.filter { quantities.containsKey(it.id) }.forEach { Text("${quantities[it.id]} × ${it.title(store.locale)} · ${price(it.priceCents)}") }
            Text("Totale: ${price(total)}", fontWeight = FontWeight.SemiBold)
            Text("${dateLabel(date)} · $time · ${locationName(location)}")
            if (notes.isNotBlank()) Text(notes)
            Text("Verrà salvato solo in questa demo. Nessun ordine reale verrà inviato.", fontWeight = FontWeight.SemiBold)
        }
    }, confirmButton = { TextButton(enabled = !model.busy, onClick = {
        val selectedDate = date; val selectedTime = time; val destination = location; val message = notes; val lines = quantities.toMap(); val token = clientId
        model.act(done = { review = false; quantities = emptyMap(); notes = ""; clientId = UUID.randomUUID().toString(); receipt = true }) { submitOrder(selectedDate, selectedTime, destination, message, lines, token) }
    }) { Text("Conferma nella demo") } },
        dismissButton = { TextButton(onClick = { review = false }, enabled = !model.busy) { Text("Modifica") } })
    if (receipt) Receipt { receipt = false; finished() }
}

@Composable
private fun Items(model: PortalModel, store: PortalStore, kind: Kind, open: (String) -> Unit) {
    @Suppress("UNUSED_VARIABLE") val observedRevision = model.revision
    var search by rememberSaveable { mutableStateOf("") }
    var category by rememberSaveable { mutableStateOf("all") }
    val all = store.activeCatalog(kind)
    val items = all.filter { (category == "all" || it.category == category) && "${it.title(store.locale)} ${it.detail(store.locale)}".contains(search, ignoreCase = true) }
    Page {
        if (kind == Kind.GUIDE) {
            Heading("Positano e dintorni")
            Note("Guida consultabile offline. Verifica prezzi, orari e disponibilità direttamente con i fornitori.")
            Field("Cerca nella guida", search, { search = it })
            Choice("Categoria", category, linkedMapOf("all" to "Tutte").apply { all.map { it.category }.distinct().forEach { put(it, categoryName(it)) } }) { category = it }
        } else { Eyebrow("TRA MARE E GIARDINI"); Heading("Vivi il territorio."); Note("Scegli un’esperienza e proponi il giorno. Una richiesta non conferma la prenotazione.") }
        items.forEach { item -> Card(onClick = { open(item.id) }, modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceContainerLow), shape = RoundedCornerShape(20.dp)) {
            Column(Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Eyebrow(categoryName(item.category))
                Text(item.title(store.locale), style = MaterialTheme.typography.titleLarge)
                if (item.detail(store.locale).isNotBlank()) Text(item.detail(store.locale), maxLines = 4)
                if (kind == Kind.ACTIVITY) Note(price(item.priceCents))
                Text("Scopri i dettagli →", color = MaterialTheme.colorScheme.primary, style = MaterialTheme.typography.labelLarge)
            }
        } }
        if (items.isEmpty()) EmptyNote("Nessun risultato", "Prova un’altra categoria o una ricerca più breve.")
        if (kind == Kind.GUIDE) Note("Il concierge online non è collegato nella demo locale.")
    }
}

@Composable
private fun Experience(model: PortalModel, store: PortalStore, item: CatalogItem, initialDate: String, finished: () -> Unit) {
    @Suppress("UNUSED_VARIABLE") val observedRevision = model.revision
    val stay = store.stay ?: return
    var date by rememberSaveable { mutableStateOf(if (RomeDay.orderable(initialDate, stay, Instant.now())) initialDate else maxOf(store.today, stay.checkIn)) }
    var time by rememberSaveable { mutableStateOf(defaultTime()) }
    var participants by rememberSaveable { mutableIntStateOf(1) }
    var notes by rememberSaveable { mutableStateOf("") }
    var review by remember { mutableStateOf(false) }
    var receipt by remember { mutableStateOf(false) }
    val clientId = rememberSaveable { UUID.randomUUID().toString() }
    val context = LocalContext.current
    val orderable = RomeDay.orderable(date, stay, Instant.now())
    val validTime = RomeDay.moment(date, time)?.isAfter(Instant.now()) == true
    fun external(url: String) { runCatching { context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url))) }.onFailure { model.error = "Nessuna app disponibile per aprire il collegamento." } }
    Page {
        Heading(item.title(store.locale))
        if (item.detail(store.locale).isNotBlank()) Text(item.detail(store.locale))
        item.address?.takeIf { it.isNotBlank() }?.let { Text(it) }
        listOf("Sito ufficiale" to item.websiteUrl, "Apri la mappa" to item.mapsUrl).forEach { (label, url) ->
            PortalStore.safeWebURL(url)?.let { valid -> OutlinedButton(onClick = { external(valid) }) { Text("$label ↗") } }
        }
        item.phone?.takeIf { it.matches(Regex("[+0-9 ()-]{3,80}")) }?.let { number -> OutlinedButton(onClick = {
            runCatching { context.startActivity(Intent(Intent.ACTION_DIAL, Uri.parse("tel:${number.filter { it.isDigit() || it == '+' }}"))) }.onFailure { model.error = "Nessuna app telefono disponibile." }
        }) { Text("Chiama $number") } }
        item.verifiedAt?.let { Note("Riferimenti verificati: ${dateLabel(it)}. Controlla direttamente con il fornitore.") }
        item.bookingNote?.get(store.locale)?.takeIf { it.isNotBlank() }?.let { Text(it) }
        if (item.kind == Kind.ACTIVITY || item.requestable == true) {
            HorizontalDivider()
            SectionTitle("Il giorno che preferisci")
            Text(price(item.priceCents))
            DateField("Giorno preferito", date, { date = it }, maxOf(store.today, stay.checkIn), stay.checkOut)
            TimeField(time) { time = it }
            if (orderable && !validTime) ErrorText("Scegli un orario futuro, nel fuso orario di Positano.")
            if (!orderable) ErrorText("Scegli un giorno da oggi al giorno prima del check-out.")
            Quantity("Partecipanti", participants, 1, stay.guests) { participants = it }
            Field("Note · massimo 1000 caratteri", notes, { notes = it }, multiline = true)
            if (notes.length > 1000) ErrorText("Accorcia le note: massimo 1000 caratteri.")
            Note("Richiesta indicativa, non una prenotazione. Resta solo sul dispositivo.")
            PrimaryAction("Rivedi la richiesta", enabled = !model.busy && notes.length <= 1000 && orderable && validTime) { review = true }
        }
    }
    if (review) AlertDialog(onDismissRequest = { if (!model.busy) review = false }, title = { Text("Riepilogo richiesta") }, text = {
        Column(Modifier.verticalScroll(rememberScrollState())) { Text("${item.title(store.locale)}\n${dateLabel(date)} · $time\n$participants partecipanti\n${price(item.priceCents)}\n$notes\n\nSalvataggio locale: non invia una prenotazione.") }
    }, confirmButton = { TextButton(enabled = !model.busy, onClick = {
        val selectedDate = date; val selectedTime = time; val people = participants; val message = notes
        model.act(done = { review = false; receipt = true }) { submitExperience(item.id, selectedDate, selectedTime, people, message, clientId) }
    }) { Text("Conferma nella demo") } },
        dismissButton = { TextButton(onClick = { review = false }, enabled = !model.busy) { Text("Modifica") } })
    if (receipt) Receipt { receipt = false; finished() }
}

@Composable
private fun Requests(model: PortalModel, store: PortalStore, admin: Boolean, open: (String) -> Unit) {
    @Suppress("UNUSED_VARIABLE") val observedRevision = model.revision
    var filter by rememberSaveable { mutableStateOf("all") }
    val pending = store.visibleRequests.count { it.status == Status.PENDING }
    Page {
        if (admin) {
            Eyebrow("IL LAVORO DI OGGI")
            Heading(if (pending == 0) "Nessuna nuova richiesta." else if (pending == 1) "Una richiesta ti aspetta." else "$pending richieste in attesa.")
            Note("Apri una richiesta, verifica i dettagli e comunica il prossimo passo.")
            if (pending > 0 && filter != Status.PENDING.name) FilledTonalButton(onClick = { filter = Status.PENDING.name }, modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp)) { Text("Vedi le richieste da gestire") }
            Choice("Stato", filter, linkedMapOf("all" to "Tutti").apply { Status.entries.forEach { put(it.name, statusName(it)) } }) { filter = it }
        } else {
            Eyebrow("IL FILO DEL TUO SOGGIORNO")
            Heading("Le tue richieste.")
            Note("Qui ritrovi quello che hai scelto e le risposte salvate dallo staff nella demo.")
        }
        val requests = store.visibleRequests.filter { filter == "all" || it.status.name == filter }
        if (requests.isEmpty()) EmptyNote(if (admin) "Nessuna richiesta da mostrare" else "Ancora nessuna richiesta",
            if (admin) "Le richieste create dall’ospite su questo dispositivo appariranno qui. Puoi cambiare il filtro." else "Scegli qualcosa dal menu o un’esperienza: dopo il riepilogo la ritroverai qui.")
        requests.forEach { request ->
            if (admin) store.state.stays.firstOrNull { it.id == request.stayId }?.let { Text("${it.guestName} · ${it.room}", style = MaterialTheme.typography.labelLarge) }
            RequestRow(request, store.locale) { open(request.id) }
        }
    }
}

@Composable
private fun RequestRow(request: Request, locale: String, open: () -> Unit) {
    Card(onClick = open, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(18.dp), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceContainerLow)) {
        Column(Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            StatusChip(request.status)
            Text(request.title(locale), style = MaterialTheme.typography.titleMedium)
            Note("${dateLabel(request.serviceDate)} · ${request.time}")
            Text("Apri dettagli →", style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.primary)
        }
    }
}

@Composable
private fun RequestDetail(model: PortalModel, store: PortalStore, id: String) {
    @Suppress("UNUSED_VARIABLE") val observedRevision = model.revision
    val request = store.visibleRequests.firstOrNull { it.id == id } ?: return
    val admin = store.account?.role == Role.ADMIN
    var staffNote by rememberSaveable(id) { mutableStateOf(request.staffNote) }
    var status by rememberSaveable(id) { mutableStateOf(request.status) }
    var confirm by remember { mutableStateOf(false) }
    Page {
        Heading(request.title(store.locale))
        StatusChip(request.status)
        Text("${dateLabel(request.serviceDate)} · ${request.time} · ${locationName(request.location)}")
        request.participants?.let { Text("$it partecipanti") }
        request.lines.forEach { Text("${it.quantity} × ${it.title(store.locale)} · ${price(it.priceCents)}") }
        if (request.lines.isNotEmpty()) Text("Totale: ${price(request.totalCents)}", fontWeight = FontWeight.SemiBold)
        if (request.notes.isNotBlank()) { Heading("Note dell’ospite"); Text(request.notes) }
        Note("Richiesta salvata nella demo locale, non inviata allo staff.")
        if (admin) {
            Choice("Stato", status, (listOf(request.status) + request.status.next).associateWith(::statusName)) { status = it }
            Field("Nota visibile all’ospite · massimo 1000 caratteri", staffNote, { staffNote = it }, multiline = true)
            if (staffNote.length > 1000) ErrorText("Accorcia la nota: massimo 1000 caratteri.")
            PrimaryAction("Salva aggiornamento", enabled = !model.busy && staffNote.length <= 1000) { confirm = true }
        } else {
            if (request.staffNote.isNotBlank()) { Heading("Nota dello staff"); Text(request.staffNote) }
            if (request.status == Status.PENDING) OutlinedButton(onClick = { confirm = true }, enabled = !model.busy) { Text("Annulla richiesta") }
            else if (request.status == Status.CONFIRMED) Note("Per modificare una richiesta confermata rivolgiti allo staff.")
        }
    }
    if (confirm) AlertDialog(onDismissRequest = { if (!model.busy) confirm = false }, title = { Text(if (admin) "Salvare l’aggiornamento?" else "Annullare la richiesta?") },
        text = { Text(if (admin) "Stato: ${statusName(status)}. La nota sarà visibile all’ospite nella demo." else "La richiesta non potrà essere riaperta.") },
        confirmButton = { TextButton(enabled = !model.busy, onClick = { val nextStatus = status; val message = staffNote
            model.act(done = { confirm = false }) { if (admin) updateRequest(id, nextStatus, message) else cancelRequest(id) } }) { Text("Conferma") } },
        dismissButton = { TextButton(onClick = { confirm = false }, enabled = !model.busy) { Text("Indietro") } })
}

@Composable
private fun Stays(model: PortalModel, store: PortalStore, edit: (String) -> Unit) {
    @Suppress("UNUSED_VARIABLE") val observedRevision = model.revision
    var search by rememberSaveable { mutableStateOf("") }
    Page {
        Eyebrow("L’ACCOGLIENZA")
        Heading("I soggiorni.")
        PrimaryAction("Nuovo soggiorno demo") { edit("new") }
        Field("Cerca nome o camera", search, { search = it })
        store.state.stays.filter { "${it.surname} ${it.guestName} ${it.room}".contains(search, true) }.forEach { stay ->
            OutlinedCard(onClick = { edit(stay.id) }, modifier = Modifier.fillMaxWidth()) { Column(Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text(stay.guestName, style = MaterialTheme.typography.titleMedium)
                Text(stay.room)
                Text("${dateLabel(stay.checkIn)} — ${dateLabel(stay.checkOut)}")
                Text(if (stay.active) "Accesso attivo" else "Accesso disattivato")
            } }
        }
    }
}

@Composable
private fun StayEditor(model: PortalModel, store: PortalStore, id: String, close: () -> Unit) {
    @Suppress("UNUSED_VARIABLE") val observedRevision = model.revision
    val original = store.state.stays.firstOrNull { it.id == id }
    var surname by rememberSaveable(id) { mutableStateOf(original?.surname ?: "") }
    var name by rememberSaveable(id) { mutableStateOf(original?.guestName ?: "") }
    var room by rememberSaveable(id) { mutableStateOf(original?.room ?: "") }
    var guests by rememberSaveable(id) { mutableIntStateOf(original?.guests ?: 2) }
    var arrival by rememberSaveable(id) { mutableStateOf(original?.checkIn ?: store.today) }
    var departure by rememberSaveable(id) { mutableStateOf(original?.checkOut ?: LocalDate.parse(store.today).plusDays(4).toString()) }
    var locale by rememberSaveable(id) { mutableStateOf(original?.locale ?: "it") }
    var credential by remember { mutableStateOf<Credential?>(null) }
    var confirm by remember { mutableStateOf("") }
    Page {
        Heading(if (original == null) "Nuovo soggiorno" else "Modifica soggiorno")
        Note("Usa dati fittizi. Gli accessi valgono solo su questa installazione.")
        Field("Cognome", surname, { surname = it })
        Field("Nome da mostrare", name, { name = it })
        Field("Camera", room, { room = it })
        Quantity("Ospiti", guests, 1, 20) { guests = it }
        DateField("Check-in", arrival, { arrival = it })
        DateField("Check-out", departure, { departure = it })
        Choice("Lingua dei contenuti", locale, locales) { locale = it }
        Button(onClick = { val draft = Stay(surname.trim(), name.trim(), room.trim(), guests, arrival, departure, locale, original?.active ?: true, original?.id ?: UUID.randomUUID().toString())
            model.act(done = { issued: Credential? -> if (original != null) close() else credential = issued }) {
            if (original == null) createStay(draft.surname, draft.guestName, draft.room, draft.guests, draft.checkIn, draft.checkOut, draft.locale)
            else { updateStay(draft); null }
        } }, enabled = !model.busy && surname.isNotBlank() && name.isNotBlank() && room.isNotBlank()) { Text(if (original == null) "Crea e genera accesso" else "Salva soggiorno") }
        if (original != null) {
            HorizontalDivider()
            Text(if (original.active) "Accesso attivo" else "Accesso disattivato")
            OutlinedButton(onClick = { confirm = "active" }, enabled = !model.busy) { Text(if (original.active) "Disattiva accesso" else "Riattiva accesso") }
            OutlinedButton(onClick = { confirm = "password" }, enabled = !model.busy) { Text("Genera nuova password") }
        }
    }
    if (confirm.isNotEmpty()) AlertDialog(onDismissRequest = { if (!model.busy) confirm = "" }, title = { Text(if (confirm == "password") "Sostituire la password?" else "Cambiare lo stato dell’accesso?") },
        text = { Text("L’accesso precedente sarà aggiornato solo nella demo locale.") },
        confirmButton = { TextButton(enabled = !model.busy, onClick = { val reset = confirm == "password"; val nextActive = !(original?.active ?: false)
            model.act(done = { issued: Credential? -> confirm = ""; credential = issued }) { if (reset) resetPassword(id) else { setStayActive(id, nextActive); null } } }) { Text("Conferma") } },
        dismissButton = { TextButton(onClick = { confirm = "" }, enabled = !model.busy) { Text("Annulla") } })
    credential?.let { issued -> AlertDialog(onDismissRequest = {}, title = { Text("Accesso demo creato") },
        text = { androidx.compose.foundation.text.selection.SelectionContainer { Text("Codice: ${issued.loginCode}\nPassword: ${issued.password}\n\nLa password è mostrata una sola volta. Non condividerla come accesso reale alla struttura.") } },
        confirmButton = { TextButton(onClick = { credential = null; if (original == null) close() }) { Text("Ho annotato i dati") } }) }
}

@Composable
private fun Catalog(model: PortalModel, store: PortalStore, edit: (String) -> Unit) {
    @Suppress("UNUSED_VARIABLE") val observedRevision = model.revision
    var kind by rememberSaveable { mutableStateOf(Kind.PRODUCT) }
    Page {
        Choice("Tipo", kind, Kind.entries.associateWith(::kindName)) { kind = it }
        Button(onClick = { edit("new-${kind.name}") }) { Text("Aggiungi voce") }
        store.state.catalog.filter { it.kind == kind }.sortedBy { it.sortOrder }.forEach { item -> OutlinedCard(onClick = { edit(item.id) }, modifier = Modifier.fillMaxWidth()) {
            Column(Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text(item.title("it"), style = MaterialTheme.typography.titleMedium)
                Text("${categoryName(item.category)} · ${if (item.active) "Attivo" else "Nascosto"}")
                Text(price(item.priceCents))
            }
        } }
    }
}

@Composable
private fun CatalogEditor(model: PortalModel, store: PortalStore, id: String, close: () -> Unit) {
    @Suppress("UNUSED_VARIABLE") val observedRevision = model.revision
    val original = store.state.catalog.firstOrNull { it.id == id }
    val kind = original?.kind ?: Kind.valueOf(id.removePrefix("new-"))
    val draftId = rememberSaveable { UUID.randomUUID().toString() }
    var labels by rememberSaveable { mutableStateOf(original?.labels ?: locales.keys.associateWith { "" }) }
    var descriptions by rememberSaveable { mutableStateOf(original?.description ?: locales.keys.associateWith { "" }) }
    var booking by rememberSaveable { mutableStateOf(original?.bookingNote ?: locales.keys.associateWith { "" }) }
    var category by rememberSaveable { mutableStateOf(original?.category ?: CatalogItem.categories(kind).first()) }
    var amount by rememberSaveable { mutableStateOf(original?.priceCents?.let { BigDecimal(it).movePointLeft(2).toPlainString() } ?: "") }
    var active by rememberSaveable { mutableStateOf(original?.active ?: true) }
    var sort by rememberSaveable { mutableStateOf((original?.sortOrder ?: 0).toString()) }
    var address by rememberSaveable { mutableStateOf(original?.address ?: "") }
    var phone by rememberSaveable { mutableStateOf(original?.phone ?: "") }
    var website by rememberSaveable { mutableStateOf(original?.websiteUrl ?: "") }
    var maps by rememberSaveable { mutableStateOf(original?.mapsUrl ?: "") }
    var verified by rememberSaveable { mutableStateOf(original?.verifiedAt ?: "") }
    var requestable by rememberSaveable { mutableStateOf(original?.requestable ?: false) }
    var language by rememberSaveable { mutableStateOf("it") }
    Page {
        Heading(if (original == null) "Nuova voce" else original.title("it"))
        Choice("Categoria", category, CatalogItem.categories(kind).associateWith(::categoryName)) { category = it }
        Choice("Lingua da modificare", language, locales) { language = it }
        Field("Nome · ${locales[language]}", labels[language] ?: "", { labels = labels + (language to it) })
        Field("Descrizione · ${locales[language]}", descriptions[language] ?: "", { descriptions = descriptions + (language to it) }, multiline = true)
        Note("I quattro nomi sono obbligatori. Se aggiungi una descrizione o una nota, completa tutte le lingue.")
        Field("Prezzo EUR · vuoto = da confermare", amount, { amount = it }, keyboard = KeyboardType.Decimal)
        Field("Ordine di visualizzazione", sort, { sort = it }, keyboard = KeyboardType.Number)
        Toggle("Visibile agli ospiti", active) { active = it }
        if (kind == Kind.GUIDE) {
            Field("Indirizzo", address, { address = it })
            Field("Telefono", phone, { phone = it }, keyboard = KeyboardType.Phone)
            Field("Sito ufficiale HTTPS", website, { website = it }, keyboard = KeyboardType.Uri)
            Field("Mappa HTTPS", maps, { maps = it }, keyboard = KeyboardType.Uri)
            Field("Riferimenti verificati · AAAA-MM-GG", verified, { verified = it })
            Toggle("Richiesta assistenza disponibile", requestable) { requestable = it }
            Field("Nota di prenotazione · ${locales[language]}", booking[language] ?: "", { booking = booking + (language to it) }, multiline = true)
        }
        Button(onClick = {
            val selectedAmount = amount; val selectedSort = sort
            val draft = CatalogItem(id = original?.id ?: draftId, slug = original?.slug ?: draftId, kind = kind, category = category,
                labels = labels.mapValues { it.value.trim() }, description = descriptions.takeIf { it.values.any(String::isNotBlank) },
                active = active, address = address.ifBlank { null }, phone = phone.ifBlank { null },
                websiteUrl = website.ifBlank { null }, mapsUrl = maps.ifBlank { null }, verifiedAt = verified.ifBlank { null }, requestable = requestable,
                bookingNote = booking.takeIf { it.values.any(String::isNotBlank) })
            model.act(done = { close() }) {
            val cents = if (selectedAmount.isBlank()) null else try { BigDecimal(selectedAmount.replace(',', '.')).movePointRight(2).intValueExact().also { require(it in 0..1_000_000) } } catch (_: Exception) { throw IllegalArgumentException("Inserisci un prezzo tra 0 e 10.000 EUR con massimo due decimali.") }
            val ordering = selectedSort.toIntOrNull() ?: throw IllegalArgumentException("Inserisci un ordine numerico valido.")
            saveItem(draft.copy(sortOrder = ordering, priceCents = cents))
        } }, enabled = !model.busy && locales.keys.all { !labels[it].isNullOrBlank() }, modifier = Modifier.fillMaxWidth()) { Text("Salva nel catalogo demo") }
    }
}

@Composable private fun Page(scroll: ScrollState = rememberScrollState(), content: @Composable ColumnScope.() -> Unit) {
    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.TopCenter) {
        Column(Modifier.widthIn(max = 680.dp).fillMaxWidth().verticalScroll(scroll).imePadding().padding(horizontal = 24.dp, vertical = 12.dp), verticalArrangement = Arrangement.spacedBy(16.dp), content = content)
    }
}
@Composable private fun Heading(text: String) { Text(text, style = MaterialTheme.typography.headlineSmall, modifier = Modifier.semantics { heading() }) }
@Composable private fun Eyebrow(text: String) { Text(text.uppercase(Locale.ITALIAN), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.primary, letterSpacing = 1.5.sp) }
@Composable private fun SectionTitle(text: String) { Text(text, style = MaterialTheme.typography.titleMedium, modifier = Modifier.semantics { heading() }) }
@Composable private fun PrimaryAction(text: String, enabled: Boolean = true, onClick: () -> Unit) {
    Button(onClick = onClick, enabled = enabled, modifier = Modifier.fillMaxWidth().heightIn(min = 54.dp), shape = RoundedCornerShape(14.dp)) { Text(text, style = MaterialTheme.typography.labelLarge) }
}
@Composable private fun EmptyNote(title: String, message: String) {
    Column(Modifier.fillMaxWidth().padding(vertical = 10.dp), verticalArrangement = Arrangement.spacedBy(7.dp)) {
        Text(title, style = MaterialTheme.typography.titleMedium)
        Note(message)
    }
}
@Composable private fun StatusChip(status: Status) {
    val colors = when (status) {
        Status.PENDING -> Color(0xFFF1E8D5) to Color(0xFF695018)
        Status.CONFIRMED -> Color(0xFFE3EBF8) to Color(0xFF142C83)
        Status.FULFILLED -> Color(0xFFE0ECE2) to Color(0xFF315A3C)
        Status.REJECTED, Status.CANCELLED -> Color(0xFFE8E7E2) to Color(0xFF555D57)
    }
    Surface(color = colors.first, contentColor = colors.second, shape = RoundedCornerShape(50)) {
        Text(statusName(status), Modifier.padding(horizontal = 11.dp, vertical = 6.dp), style = MaterialTheme.typography.labelMedium)
    }
}
@Composable private fun Note(text: String) { Text(text, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant) }
@Composable private fun ErrorText(text: String) { Text(text, color = MaterialTheme.colorScheme.error) }
@Composable private fun Field(label: String, value: String, change: (String) -> Unit, multiline: Boolean = false, keyboard: KeyboardType = KeyboardType.Text, password: Boolean = false) {
    OutlinedTextField(value, change, label = { Text(label) }, modifier = Modifier.fillMaxWidth(), singleLine = !multiline, minLines = if (multiline) 3 else 1, shape = RoundedCornerShape(12.dp),
        keyboardOptions = KeyboardOptions(keyboardType = if (password) KeyboardType.Password else keyboard),
        visualTransformation = if (password) PasswordVisualTransformation() else VisualTransformation.None)
}
@Composable private fun <T> Choice(label: String, value: T, choices: Map<T, String>, change: (T) -> Unit) {
    var expanded by remember { mutableStateOf(false) }
    Column {
        Text(label, style = MaterialTheme.typography.labelLarge)
        Box { OutlinedButton(onClick = { expanded = true }, modifier = Modifier.fillMaxWidth().heightIn(min = 52.dp), shape = RoundedCornerShape(12.dp)) { Text("${choices[value] ?: value} ▾") }
            DropdownMenu(expanded, onDismissRequest = { expanded = false }) { choices.forEach { (key, name) -> DropdownMenuItem(text = { Text(name) }, onClick = { change(key); expanded = false }) } }
        }
    }
}
@Composable private fun Quantity(label: String, value: Int, min: Int, max: Int, compact: Boolean = false, enabled: Boolean = true, change: (Int) -> Unit) {
    Column {
        if (!compact) Text(label, style = MaterialTheme.typography.labelLarge)
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            OutlinedIconButton(onClick = { change(value - 1) }, enabled = enabled && value > min, modifier = Modifier.size(48.dp).semantics { contentDescription = "Diminuisci $label" }, shape = RoundedCornerShape(12.dp)) { Text("−", style = MaterialTheme.typography.titleLarge) }
            Text(value.toString(), modifier = Modifier.widthIn(min = 24.dp), style = MaterialTheme.typography.titleMedium, textAlign = androidx.compose.ui.text.style.TextAlign.Center)
            OutlinedIconButton(onClick = { change(value + 1) }, enabled = enabled && value < max, modifier = Modifier.size(48.dp).semantics { contentDescription = "Aumenta $label" }, shape = RoundedCornerShape(12.dp)) { Text("+", style = MaterialTheme.typography.titleLarge) }
        }
    }
}
@Composable private fun Toggle(label: String, checked: Boolean, change: (Boolean) -> Unit) {
    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) { Text(label, Modifier.weight(1f)); Switch(checked, change, modifier = Modifier.semantics { contentDescription = label }) }
}
@Composable private fun DateField(label: String, value: String, change: (String) -> Unit, min: String? = null, max: String? = null) {
    val context = LocalContext.current
    val date = runCatching { LocalDate.parse(value) }.getOrDefault(LocalDate.now(rome))
    Column { Text(label, style = MaterialTheme.typography.labelLarge)
        OutlinedButton(onClick = {
            DatePickerDialog(context, { _, year, month, day -> change(LocalDate.of(year, month + 1, day).toString()) }, date.year, date.monthValue - 1, date.dayOfMonth).apply {
                // Native picker uses device timezone for epoch bounds; the saved calendar day stays Rome-local.
                val zone = ZoneId.systemDefault()
                if (min != null && (max == null || min <= max)) datePicker.minDate = LocalDate.parse(min).atStartOfDay(zone).toInstant().toEpochMilli()
                if (max != null && (min == null || min <= max)) datePicker.maxDate = LocalDate.parse(max).atStartOfDay(zone).toInstant().toEpochMilli()
            }.show()
        }, modifier = Modifier.fillMaxWidth().heightIn(min = 56.dp), shape = RoundedCornerShape(12.dp)) { Icon(Icons.Default.DateRange, null, Modifier.size(20.dp)); Spacer(Modifier.width(10.dp)); Text(dateLabel(value), style = MaterialTheme.typography.titleMedium) }
    }
}
@Composable private fun TimeField(value: String, change: (String) -> Unit) {
    val context = LocalContext.current
    Column { Text("Orario preferito · Positano", style = MaterialTheme.typography.labelLarge)
        OutlinedButton(onClick = { val parts = value.split(":"); TimePickerDialog(context, { _, hour, minute -> change("%02d:%02d".format(Locale.ROOT, hour, minute)) }, parts[0].toInt(), parts[1].toInt(), true).show() }, modifier = Modifier.fillMaxWidth().heightIn(min = 52.dp), shape = RoundedCornerShape(12.dp)) { Text(value, style = MaterialTheme.typography.titleMedium) }
    }
}
private fun defaultTime() = Instant.now().atZone(rome).plusHours(1).format(DateTimeFormatter.ofPattern("HH:mm"))
@Composable private fun Receipt(close: () -> Unit) { AlertDialog(onDismissRequest = close, title = { Text("Richiesta salvata") }, text = { Text("È nella demo su questo dispositivo. Nessun ordine o prenotazione è stato inviato realmente. Puoi entrare come admin per provare la gestione.") }, confirmButton = { TextButton(onClick = close) { Text("Vedi richieste") } }) }
@Composable private fun BrandImage(path: String, description: String, height: Int, modifier: Modifier = Modifier, contentScale: ContentScale = ContentScale.Fit) {
    val context = LocalContext.current
    val bitmap = remember(path) { runCatching { context.assets.open(path).use { BitmapFactory.decodeStream(it)?.asImageBitmap() } }.getOrNull() }
    bitmap?.let { Image(it, description, modifier.fillMaxWidth().height(height.dp), contentScale = contentScale) }
}
private fun categoryName(value: String) = mapOf("lunch" to "Pranzo · Menu del giorno", "dinner" to "La sera · Pizza Fenice", "food" to "Cucina", "classic-drink" to "Bevande", "wine" to "Vini", "champagne" to "Champagne", "raw-fish" to "Crudi di mare", "fishing" to "Pesca", "boat-trip" to "In barca", "lemon-grove" to "Limonaia", "other" to "Altre esperienze", "dining" to "A tavola", "after-dark" to "La sera", "sea" to "Sul mare", "see" to "Da vedere", "getting-around" to "Come muoversi", "essentials" to "Informazioni utili")[value] ?: value
