import SwiftUI

enum FeniceTheme {
    static let cobalt = Color(uiColor: UIColor { traits in
        traits.userInterfaceStyle == .dark
            ? UIColor(red: 0.60, green: 0.72, blue: 1, alpha: 1)
            : UIColor(red: 0.078, green: 0.173, blue: 0.514, alpha: 1)
    })
    static let action = Color(red: 0.078, green: 0.173, blue: 0.514)
    static let paper = Color(uiColor: UIColor { traits in
        traits.userInterfaceStyle == .dark ? UIColor.systemGroupedBackground : UIColor(red: 0.975, green: 0.963, blue: 0.939, alpha: 1)
    })
}

struct RootView: View {
    @Bindable var store: PortalStore
    @Environment(\.scenePhase) private var scenePhase
    @State private var showDemoInfo = false

    var body: some View {
        VStack(spacing: 0) {
            Button { showDemoInfo = true } label: {
                HStack(spacing: 8) {
                    Image(systemName: "info.circle")
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Demo locale").font(.subheadline.weight(.semibold))
                        Text("Nessun ordine inviato · Usa dati fittizi").font(.caption)
                    }
                    Spacer(minLength: 8)
                    Image(systemName: "chevron.right").font(.caption.weight(.medium))
                }
                .foregroundStyle(FeniceTheme.cobalt)
                .padding(.horizontal, 20).padding(.vertical, 9)
                .frame(maxWidth: .infinity, minHeight: 44)
                .background(.regularMaterial)
            }
            .buttonStyle(.plain)
            .accessibilityLabel("Informazioni sulla demo locale. Nessun ordine viene inviato.")
            Group {
                if let account = store.account {
                    if account.role == .admin { AdminView(store: store) }
                    else { GuestView(store: store) }
                } else { LoginView(store: store) }
            }
            .id(store.account?.id ?? "login")
        }
        .tint(FeniceTheme.cobalt)
        .scrollContentBackground(.hidden)
        .background(FeniceTheme.paper)
        .environment(\.locale, Locale(identifier: "it_IT"))
        .environment(\.calendar, RomeDay.calendar)
        .environment(\.timeZone, RomeDay.calendar.timeZone)
        .sheet(isPresented: $showDemoInfo) {
            NavigationStack {
                List {
                    Section("Cosa puoi provare") {
                        Text("Entra come ospite, salva un ordine o un’esperienza e segui lo stato. Esci ed entra come admin sullo stesso dispositivo per gestire la richiesta.")
                    }
                    Section("Cosa non è collegato") {
                        Text("I dati restano in questa installazione dell’app. Non sono sincronizzati con il sito, altri iPhone o lo staff di La Fenice.")
                        Text("Non vengono inviate email o notifiche. Nessuna prenotazione, pagamento o disponibilità viene confermata realmente.")
                        Text("Gli accessi sono dimostrativi, non un sistema di autenticazione per dati reali. Usa soltanto nomi e note fittizi.")
                    }
                    Section("Contenuti") {
                        Text("Il menu, le esperienze e la guida provengono dai contenuti del sito in inglese, italiano, tedesco e russo. L’interfaccia nativa di questa prima versione è in italiano.")
                    }
                }
                .navigationTitle("Prima di provare")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar { ToolbarItem(placement: .confirmationAction) { Button("Chiudi") { showDemoInfo = false } } }
            }
        }
        .onChange(of: scenePhase) { _, phase in
            if phase == .active { store.refreshClock() }
        }
    }
}

private struct LoginView: View {
    @Bindable var store: PortalStore
    @State private var role = PortalRole.guest
    @State private var code = ""
    @State private var password = ""
    @State private var error: String?
    @FocusState private var field: Field?
    private enum Field { case code, password }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 22) {
                    WelcomeHeader()
                    VStack(alignment: .leading, spacing: 6) {
                        Text(role == .guest ? "Benvenuti a La Fenice." : "La giornata, in ordine.")
                            .font(.system(.title, design: .serif).weight(.medium))
                            .foregroundStyle(FeniceTheme.cobalt)
                        Text(role == .guest ? "Il tuo soggiorno, dal giardino al mare." : "Richieste e soggiorni, sullo stesso dispositivo.")
                            .font(.subheadline).foregroundStyle(.secondary)
                    }

                    VStack(alignment: .leading, spacing: 18) {
                        Picker("Profilo", selection: $role) {
                            Text("Ospite").tag(PortalRole.guest)
                            Text("Admin").tag(PortalRole.admin)
                        }.pickerStyle(.segmented).accessibilityIdentifier("login.role")

                        VStack(alignment: .leading, spacing: 8) {
                            Text("Codice di accesso").font(.subheadline.weight(.medium))
                            TextField("Codice ricevuto", text: $code)
                                .textContentType(.username).textInputAutocapitalization(.never).autocorrectionDisabled()
                                .padding(15).background(.background, in: RoundedRectangle(cornerRadius: 12))
                                .focused($field, equals: .code).submitLabel(.next)
                                .accessibilityLabel("Codice di accesso").accessibilityIdentifier("login.code")
                                .onSubmit { field = .password }
                        }
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Password").font(.subheadline.weight(.medium))
                            SecureField("Password", text: $password)
                                .textContentType(.password).padding(15)
                                .background(.background, in: RoundedRectangle(cornerRadius: 12))
                                .focused($field, equals: .password).submitLabel(.go)
                                .accessibilityIdentifier("login.password").onSubmit(login)
                        }
                        if let error {
                            Label(error, systemImage: "exclamationmark.circle").font(.callout).foregroundStyle(.red)
                                .accessibilityIdentifier("login.error")
                        }
                        Button(role == .guest ? "Entra nel tuo soggiorno" : "Entra come admin", action: login)
                            .buttonStyle(FenicePrimaryButtonStyle())
                            .disabled(code.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || password.isEmpty)
                            .accessibilityIdentifier("login.enter")
                    }

                    VStack(alignment: .leading, spacing: 4) {
                        Button("Prova con l’accesso demo", systemImage: "arrow.right.circle") {
                            code = role == .guest ? "cliente" : "admin"
                            password = code
                            error = nil
                            field = nil
                        }.frame(minHeight: 44).accessibilityIdentifier("login.demo")
                        Text(role == .guest ? "Codice e password: cliente" : "Codice e password: admin")
                            .font(.footnote).foregroundStyle(.secondary).textSelection(.enabled)
                        Text("Usa solo dati fittizi. Cognome e camera non sono credenziali.")
                            .font(.footnote).foregroundStyle(.secondary)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
                .padding(22).frame(maxWidth: 560)
                .frame(maxWidth: .infinity)
            }
            .scrollDismissesKeyboard(.interactively)
            .background(FeniceTheme.paper)
            .toolbar(.hidden, for: .navigationBar)
            .onChange(of: role) { _, _ in code = ""; password = ""; error = nil }
        }
    }

    private func login() {
        do {
            try store.login(code: code, password: password, role: role)
            password = ""
            error = nil
            field = nil
        } catch { self.error = error.localizedDescription }
    }
}
