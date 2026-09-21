// swift-tools-version: 5.9
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

// InMobi has no Swift package of their own yet: github.com/InMobi/InMobiCMP-Swift-Package
// is registered but empty. Their CocoaPods release is a zipped XCFramework, and
// Swift Package Manager reads that same archive as a binary target. Swap this
// for their package once they publish one.
//
// To move to a newer SDK: change the version in the url, download the zip and
// run `swift package compute-checksum <file>.zip`, then put that here. The pod
// dependency in inmobi_cmp.podspec has to move to the same version.
let package = Package(
    name: "inmobi_cmp",
    platforms: [
        .iOS("15.0")
    ],
    products: [
        .library(name: "inmobi-cmp", targets: ["inmobi_cmp"])
    ],
    dependencies: [
        .package(name: "FlutterFramework", path: "../FlutterFramework")
    ],
    targets: [
        .binaryTarget(
            name: "InMobiCMP",
            url: "https://choice.inmobi.com/choice-mobile-ios/InMobiCMP-iOS-v2.3.1.zip",
            checksum: "f509cb29742edf4adc421671357d71cf731589b923aacd1a5502b7dd9f427e1b"
        ),
        .target(
            name: "inmobi_cmp",
            dependencies: [
                .product(name: "FlutterFramework", package: "FlutterFramework"),
                "InMobiCMP"
            ],
            resources: [
                .process("PrivacyInfo.xcprivacy")
            ]
        )
    ]
)
