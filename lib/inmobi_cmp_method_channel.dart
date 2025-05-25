import 'package:flutter/services.dart';

import 'inmobi_cmp_platform_interface.dart';

/// An implementation of [InmobiCmpPlatform] that uses method channels.
class MethodChannelInmobiCmp extends InmobiCmpPlatform {
  /// The method channel used to interact with the native platforms.
  final MethodChannel _channel = const MethodChannel('com.icon.inmobi_cmp');

  @override
  Future<void> init({
    required String packageId,
    required String pCode
  }) async {
    await _channel.invokeMethod<void>('init', {
      'packageId': packageId,
      'pCode': pCode
    });
  }

  @override
  Future<void> showConsent() async {
    await _channel.invokeMethod<void>('showConsent');
  }

  @override
  Future<String> getConsentStatus() async {
    final String? status =
        await _channel.invokeMethod<String>('getConsentStatus');
    return status ?? 'unknown';
  }
}
