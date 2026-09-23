// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "LaFeniceCore",
    platforms: [.iOS(.v17), .macOS(.v14)],
    products: [.library(name: "LaFeniceCore", targets: ["LaFeniceCore"])],
    targets: [
        .target(name: "LaFeniceCore", path: "LaFenice/Core"),
        .testTarget(name: "LaFeniceCoreTests", dependencies: ["LaFeniceCore"], path: "Tests"),
    ]
)
