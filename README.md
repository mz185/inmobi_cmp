# InMobi CMP Plugin

A Flutter plugin to integrate the InMobi Consent Management Platform (CMP) for GDPR/CCPA compliance
on Android and iOS.

---

## Installation

```yaml
dependencies:
  inmobi_cmp:
    git:
      url: https://github.com/mz185/inmobi_cmp.git
      ref: main
```

```bash
flutter pub get
```

---

## Usage

```dart
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:inmobi_cmp/inmobi_cmp.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize CMP
  await InmobiCmp.init(
    packageId: 'com.yourcompany.yourapp',
    pCode: 'YOUR_INMOBI_PCODE',
  );

  // Listen for CMP events
  const MethodChannel('com.icon.inmobi_cmp').setMethodCallHandler((call) async {
    if (call.method == 'onCmpEvent') {
      debugPrint('CMP Event: ${call.arguments}');
    }
  });

  runApp(const MyApp());
}

// Show consent UI
await
InmobiCmp.showConsent
();

// Get consent status
final status = await
InmobiCmp.getConsentStatus
();
```

---

## License

MIT License. See [LICENSE](LICENSE) for details.