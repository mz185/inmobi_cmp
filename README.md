# InMobi CMP Plugin

A Flutter plugin to integrate the InMobi Consent Management Platform (CMP) for GDPR/CCPA compliance on **Android** and **iOS**.

---

## 🚀 Features

- **Initialize** the InMobi CMP SDK with package ID and pCode
- **Display** consent UI
- **Retrieve** consent status
- **Receive** native consent lifecycle events via `MethodChannel`

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

Then run:

```bash
flutter pub get
```

---

## 🔧 Dart Usage

```dart
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:inmobi_cmp/inmobi_cmp.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await InmobiCmp.init(
    packageId: 'com.yourcompany.yourapp',
    pCode: 'YOUR_INMOBI_PCODE',
  );

  const MethodChannel channel = MethodChannel('com.icon.inmobi_cmp');
  channel.setMethodCallHandler((call) async {
    if (call.method == 'onCmpEvent') {
      debugPrint('CMP Event: ${call.arguments}');
    }
  });

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: Scaffold(
        appBar: AppBar(title: const Text('InMobi CMP')),
        body: Center(
          child: ElevatedButton(
            onPressed: () async {
              await InmobiCmp.showConsent();
            },
            child: const Text('Show Consent UI'),
          ),
        ),
      ),
    );
  }
}
```

### Available Dart Methods

```dart
InmobiCmp.init({ required String packageId, required String pCode })
InmobiCmp.showConsent()
InmobiCmp.getConsentStatus()
```

---

## ⚙️ Android Setup

1. **Add AAR or Maven Dependency**

   Option A — Maven:
   ```groovy
   implementation 'com.inmobi:inmobicmp:2.2.2'
   ```

   Option B — Local AAR:
   - Place `inmobicmp-2.2.2.aar` in `android/libs/`
   - Then:
     ```groovy
     implementation fileTree(dir: 'libs', include: ['*.aar'])
     ```

2. **Proguard Rules**

   Add to `android/consumer-rules.pro`:
   ```proguard
   -keep class com.inmobi.cmp.** { *; }
   -keep interface com.inmobi.cmp.** { *; }
   ```

3. **Native Plugin Events**

   The plugin logs events back to Flutter through `onCmpEvent`. Expect messages like:
   - `"CMP loaded: ..."`
   - `"IAB vendor consent given: ..."`
   - `"Non-IAB vendor consent given: ..."`
   - `"CMP UI status changed: ..."`
   - etc.

---

## 🍎 iOS Setup

1. **Add Framework**

   - Download `InMobiCMP.xcframework` from the InMobi portal.
   - Place it in `ios/Frameworks/`.

2. **Update Podspec**

   `ios/inmobi_cmp.podspec`:

   ```ruby
   Pod::Spec.new do |s|
     s.name             = 'inmobi_cmp'
     s.version          = '0.1.0'
     s.summary          = 'Flutter plugin for InMobi CMP'
     s.description      = 'GDPR/CCPA compliance via InMobi CMP SDK'
     s.homepage         = 'https://github.com/mz185/inmobi_cmp'
     s.license          = { :type => 'MIT' }
     s.author           = { 'Your Name' => 'you@example.com' }
     s.source_files     = 'Classes/**/*'
     s.vendored_frameworks = 'Frameworks/InMobiCMP.xcframework'
     s.platform         = :ios, '12.0'
     s.swift_version    = '5.0'
     s.dependency       = 'Flutter'
   end
   ```

3. **Native Events**

   Similar to Android, events are sent back to Flutter through `onCmpEvent`.

---

## ▶️ Example App

Run the sample app included in the repository:

```bash
cd example
flutter pub get
flutter run
```

---

## 📃 License

MIT License. See [LICENSE](LICENSE) for details.