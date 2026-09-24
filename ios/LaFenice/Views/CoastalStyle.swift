import Metal
import SwiftUI

extension View {
    @ViewBuilder
    func feniceAdaptiveTabs() -> some View {
        if #available(iOS 18.0, *) {
            self.tabViewStyle(.sidebarAdaptable)
        } else {
            self
        }
    }

    func feniceReadableWidth(_ maximum: CGFloat = 760) -> some View {
        modifier(FeniceReadableWidth(maximum: maximum))
    }
}

private struct FeniceReadableWidth: ViewModifier {
    let maximum: CGFloat
    @Environment(\.horizontalSizeClass) private var sizeClass

    func body(content: Content) -> some View {
        content
            .frame(maxWidth: sizeClass == .regular ? maximum : .infinity)
            .frame(maxWidth: .infinity)
            .background(FeniceTheme.paper)
    }
}

struct FenicePrimaryButtonStyle: ButtonStyle {
    @Environment(\.isEnabled) private var isEnabled

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.body.weight(.semibold))
            .frame(maxWidth: .infinity, minHeight: 52)
            .padding(.horizontal, 16)
            .foregroundStyle(isEnabled ? Color.white : Color.secondary)
            .background(isEnabled ? FeniceTheme.action : Color.secondary.opacity(0.12), in: RoundedRectangle(cornerRadius: 15))
            .opacity(configuration.isPressed ? 0.82 : 1)
    }
}

struct RequestStatusBadge: View {
    let status: RequestStatus
    @Environment(\.colorScheme) private var colorScheme

    private var color: Color {
        switch status {
        case .pending: FeniceTheme.cobalt
        case .confirmed, .fulfilled: colorScheme == .dark ? Color(red: 0.60, green: 0.85, blue: 0.71) : Color(red: 0.12, green: 0.36, blue: 0.27)
        case .rejected: colorScheme == .dark ? Color(red: 1, green: 0.64, blue: 0.62) : Color(red: 0.63, green: 0.15, blue: 0.14)
        case .cancelled: .secondary
        }
    }

    private var symbol: String {
        switch status {
        case .pending: "clock"
        case .confirmed: "checkmark.circle"
        case .fulfilled: "checkmark.seal"
        case .rejected: "xmark.circle"
        case .cancelled: "minus.circle"
        }
    }

    var body: some View {
        Label(AdminCopy.status(status), systemImage: symbol)
            .font(.caption.weight(.semibold))
            .foregroundStyle(color)
            .padding(.horizontal, 10).padding(.vertical, 6)
            .background(color.opacity(0.09), in: Capsule())
            .fixedSize(horizontal: false, vertical: true)
    }
}

/// The photo remains the evidence; a brief analytical ripple only changes its light.
/// No fluid solver, no persistent render loop, no distortion of text or controls.
struct WelcomeHeader: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.scenePhase) private var scenePhase
    @State private var pulse = WaterPulse()
    @State private var origin = CGPoint(x: 0.52, y: 0.52)
    @State private var visible = false
    private static let supportsMetal = MTLCreateSystemDefaultDevice() != nil

    private var canAnimate: Bool { !reduceMotion && Self.supportsMetal && visible && scenePhase == .active }

    var body: some View {
        GeometryReader { geometry in
            TimelineView(.animation(minimumInterval: 1.0 / 30, paused: !canAnimate || pulse.startedAt == nil)) { context in
                Image("Property").resizable().scaledToFill()
                    .frame(width: geometry.size.width, height: geometry.size.height)
                    .clipped()
                    .colorEffect(ShaderLibrary.feniceWater(
                        .float2(geometry.size),
                        .float(pulse.elapsed(at: context.date)),
                        .float2(origin.x * geometry.size.width, origin.y * geometry.size.height)
                    ), isEnabled: canAnimate && pulse.startedAt != nil)
            }
            .contentShape(Rectangle())
            .onTapGesture { point in
                guard canAnimate else { return }
                origin = CGPoint(x: min(max(point.x / geometry.size.width, 0), 1), y: min(max(point.y / geometry.size.height, 0), 1))
                pulse.startedAt = Date()
            }
            .accessibilityHidden(true)

            Image("Phoenix").resizable().scaledToFit()
                .frame(width: 65, height: 58).padding(11)
                .background(Color(red: 0.98, green: 0.97, blue: 0.94), in: RoundedRectangle(cornerRadius: 17))
                .padding(14)
                .accessibilityLabel("La Fenice, Positano")
                .allowsHitTesting(false)
        }
        .frame(height: 156)
        .clipShape(RoundedRectangle(cornerRadius: 23))
        .onGeometryChange(for: Bool.self) { geometry in
            let frame = geometry.frame(in: .global)
            return frame.maxY > 0 && frame.minY < UIScreen.main.bounds.height
        } action: { inViewport in
            visible = inViewport
            if !inViewport { pulse.startedAt = nil }
        }
        .task(id: pulse.startedAt) {
            guard pulse.startedAt != nil else { return }
            do { try await Task.sleep(for: .seconds(WaterPulse.duration)) } catch { return }
            pulse.startedAt = nil
        }
        .onAppear { visible = true; if canAnimate { pulse.startedAt = Date() } }
        .onDisappear { visible = false; pulse.startedAt = nil }
        .onChange(of: scenePhase) { _, phase in if phase != .active { pulse.startedAt = nil } }
        .onChange(of: reduceMotion) { _, reduced in if reduced { pulse.startedAt = nil } }
    }
}
