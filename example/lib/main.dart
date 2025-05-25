import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:inmobi_cmp/inmobi_cmp.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await InmobiCmp.init(
    packageId: 'YOUR_PACKAGE_ID',
    pCode: 'YOUR_P_CODE',
  );
  runApp(const MyApp());
}

class MyApp extends StatefulWidget {
  const MyApp({super.key});

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  String _status = 'Unknown';
  final MethodChannel _channel = const MethodChannel('com.icon.inmobi_cmp');

  @override
  void initState() {
    super.initState();
    _channel.setMethodCallHandler(_handleNative);
  }

  Future<void> _handleNative(MethodCall call) async {
    switch (call.method) {
      case 'onCmpEvent':
        final String message = call.arguments ?? 'No message';
        setState(() => _status = message);
        debugPrint('[InMobi CMP] $message');
        break;
      default:
        debugPrint('[InMobi CMP] Unknown method call: ${call.method}');
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: Scaffold(
        appBar: AppBar(title: const Text('InMobi CMP Example')),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text('Status: $_status'),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => InmobiCmp.showConsent(),
                child: const Text('Show Consent UI'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
