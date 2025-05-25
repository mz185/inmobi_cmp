import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:inmobi_cmp/inmobi_cmp.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await InmobiCmp.init(
    accountId: 'YOUR_PCODE', // replace with your real pCode
    gdpr: true,
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
      case 'onCmpLoaded':
        setState(() => _status = 'CMP Loaded');
        break;
      case 'onIABConsent':
        setState(() => _status = 'IAB Consent Received');
        break;
      default:
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