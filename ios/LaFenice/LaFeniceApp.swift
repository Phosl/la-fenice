import SwiftUI

@main
@MainActor
struct LaFeniceApp: App {
    @State private var store: PortalStore?
    @State private var startupError: String?

    var body: some Scene {
        WindowGroup {
            Group {
                if let store {
                    RootView(store: store)
                } else if let startupError {
                    ContentUnavailableView {
                        Label("Impossibile aprire La Fenice", systemImage: "exclamationmark.triangle")
                    } description: {
                        Text("I dati salvati non sono stati modificati.\n\(startupError)")
                    } actions: {
                        Button("Riprova", action: openStore)
                            .buttonStyle(.borderedProminent)
                    }
                } else {
                    ProgressView("Apertura La Fenice…")
                }
            }
            .task {
                if store == nil && startupError == nil { openStore() }
            }
        }
    }

    private func openStore() {
        do {
            store = try PortalStore.openDemo()
            startupError = nil
        } catch {
            startupError = error.localizedDescription
        }
    }
}
