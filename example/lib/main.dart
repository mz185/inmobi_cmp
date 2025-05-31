import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:inmobi_cmp/inmobi_cmp.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await InmobiCmp.init(
    packageId: 'com.example.packageID',
    pCode: 'pcODE',
  );

  runApp(const MyApp());
}

class MyApp extends StatefulWidget {
  const MyApp({super.key});

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  String _log = 'Waiting for CMP events...';
  final MethodChannel _channel = const MethodChannel('com.icon.inmobi_cmp');

  @override
  void initState() {
    super.initState();
    _channel.setMethodCallHandler(_handleNativeCall);
    // DO NOT call showConsent() — it happens automatically
  }

  Future<void> _handleNativeCall(MethodCall call) async {
    switch (call.method) {
      case 'onCmpEvent':
        final message = call.arguments?.toString() ?? 'No message';
        setState(() => _log = '[CMP] $message');
        debugPrint(_log);
        break;
      default:
        debugPrint('[CMP] Unknown method: ${call.method}');
    }
  }

  Future<void> _getConsentStatus() async {
    try {
      final status = await InmobiCmp.getConsentStatus();
      setState(() {
        _log = 'Consent status: $status';
      });
    } on PlatformException catch (e) {
      setState(() {
        _log = 'Error: ${e.message}';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'InMobi CMP Plugin Example',
      home: Scaffold(
        appBar: AppBar(title: const Text('InMobi CMP Example')),
        body: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(_log, textAlign: TextAlign.center),
              const SizedBox(height: 32),
              ElevatedButton(
                onPressed: _getConsentStatus,
                child: const Text('Get Consent Status'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
