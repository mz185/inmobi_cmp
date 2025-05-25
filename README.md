# InMobi CMP Plugin

A Flutter plugin to integrate the InMobi Consent Management Platform (CMP) for GDPR/CCPA compliance
on **Android** and **iOS**.

---

## 🚀 Features

- **Initialize** the InMobi CMP SDK from Dart
- **Show** consent UI flows
- **Retrieve** consent status
- **Listen** to native consent events via MethodChannel

---

## 📦 Installation

Add the plugin to your `pubspec.yaml`:

```yaml
dependencies:
  inmobi_cmp:
    git:
      url: https://github.com/mz185/inmobi_cmp.git
      ref: main
```

Run:

```bash
flutter pub get
```

---

## 🔧 Dart-side Usage

```dart
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:inmobi_cmp/inmobi_cmp.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // 1️⃣ Initialize with your InMobi pCode
  await InmobiCmp.init(
    accountId: 'YOUR_PCODE',
    gdpr: true,
  );

  // 2️⃣ (Optional) Listen for native consent events
  const channel = MethodChannel('com.icon.inmobi_cmp');
  channel.setMethodCallHandler((call) async {
    switch (call.method) {
      case 'onCmpLoaded':
        final info = call.arguments as Map;
        debugPrint('CMP Loaded: $info');
        break;
      case 'onIABConsent':
        debugPrint('IAB Consent: ${call.arguments}');
        break;
    // handle other callbacks as needed
    }
  });

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: Scaffold(
        appBar: AppBar(title: const Text('InMobi CMP Example')),
        body: Center(
          child: ElevatedButton(
            onPressed: () => InmobiCmp.showConsent(),
            child: const Text('Show Consent UI'),
          ),
        ),
      ),
    );
  }
}
```

This covers the core Dart API:

- `InmobiCmp.init(accountId: String, gdpr: bool)`
- `InmobiCmp.showConsent()`
- `InmobiCmp.getConsentStatus()`

---

## ⚙️ Plugin Structure

```
inmobi_cmp/
├── lib/
│   ├── inmobi_cmp.dart
│   ├── inmobi_cmp_method_channel.dart
│   └── inmobi_cmp_platform_interface.dart
├── android/
│   ├── build.gradle
│   └── src/main/kotlin/com/icon/inmobi_cmp/InmobiCmpPlugin.kt
└── ios/
    ├── inmobi_cmp.podspec
    ├── Frameworks/InMobiCMP.xcframework/
    └── Classes/SwiftInmobiCmpPlugin.swift
```

---

## 🛠 Android Setup

1. **Add AAR & Maven**
    - Create `android/libs/` and drop `inmobicmp-2.2.2.aar`.
    - Or use Maven: `implementation 'com.inmobi:inmobicmp:2.2.2'`.

2. **Update** `<plugin>/android/build.gradle`:

   ```gradle
   buildscript {
     repositories { google(); mavenCentral(); flatDir { dirs 'libs' } }
     dependencies { classpath 'com.android.tools.build:gradle:8.7.3' }
   }
   allprojects {
     repositories { google(); mavenCentral(); flatDir { dirs 'libs' } }
   }
   apply plugin: 'com.android.library'

   android {
     compileSdk = 35
     defaultConfig { minSdk = 21 }
     consumerProguardFiles 'consumer-rules.pro'
   }

   dependencies {
     implementation fileTree(dir: 'libs', include: ['*.aar'])
     implementation 'com.inmobi:inmobicmp:2.2.2'
     // AndroidX libraries...
   }
   ```

3. **ProGuard Rules** (`android/consumer-rules.pro`):

   ```proguard
   -keep class com.inmobi.cmp.ChoiceCmp { *; }
   -keep interface com.inmobi.cmp.ChoiceCmpCallback { *; }
   -keep class com.inmobi.cmp.model.* { *; }
   -keep class com.inmobi.cmp.core.model.* { *; }
   ```

4. **Plugin Implementation**
    - `android/src/main/kotlin/com/icon/inmobi_cmp/InmobiCmpPlugin.kt`

---

## 🍎 iOS Setup

1. **Add Framework**
    - Download `InMobiCMP.xcframework` from your portal.
    - In `ios/Frameworks/`, place both Simulator and Device slices.

2. **Podspec** (`ios/inmobi_cmp.podspec`):

   ```ruby
   Pod::Spec.new do |s|
     s.name                 = 'inmobi_cmp'
     s.version              = '0.1.0'
     s.summary              = 'Flutter plugin for InMobi CMP'
     s.platform             = :ios, '12.0'
     s.source_files         = 'Classes/**/*'
     s.vendored_frameworks  = 'Frameworks/InMobiCMP.xcframework'
     s.dependency           = 'Flutter'
     s.swift_version        = '5.0'
   end
   ```

3. **Plugin Implementation**
    - `ios/Classes/SwiftInmobiCmpPlugin.swift`: uses `ChoiceCmp.shared`, `forceDisplayUI()`,
      `getGDPRDataWithCompletion`, and implements `ChoiceCmpDelegate`.

---

## 🎯 Example App

An example Flutter app is under the `example/` directory. To run:

```bash
cd example
flutter pub get
flutter run
```

---

## 📝 Changelog

See [CHANGELOG.md](CHANGELOG.md) for details on releases.

---

## 📖 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
