import 'package:plugin_platform_interface/plugin_platform_interface.dart';

import 'inmobi_cmp_method_channel.dart';

/// The interface that implementations of inmobi_cmp must implement.
abstract class InmobiCmpPlatform extends PlatformInterface {
  /// Constructs a InmobiCmpPlatform.
  InmobiCmpPlatform() : super(token: _token);

  static final Object _token = Object();

  static InmobiCmpPlatform _instance = MethodChannelInmobiCmp();

  /// The default instance of [InmobiCmpPlatform] to use.
  static InmobiCmpPlatform get instance => _instance;

  /// Platform-specific implementations should set this with their own
  /// platform-specific class that extends [InmobiCmpPlatform] when
  /// they register themselves.
  static set instance(InmobiCmpPlatform instance) {
    PlatformInterface.verifyToken(instance, _token);
    _instance = instance;
  }

  /// Initializes the InMobi CMP SDK.
  Future<void> init({
    required String accountId,
    bool gdpr = true,
    String consentStatus = 'unknown',
  }) {
    throw UnimplementedError('init() has not been implemented.');
  }

  /// Shows the consent dialog if required.
  Future<void> showConsent() {
    throw UnimplementedError('showConsent() has not been implemented.');
  }

  /// Gets the current consent status.
  Future<String> getConsentStatus() {
    throw UnimplementedError('getConsentStatus() has not been implemented.');
  }
}
