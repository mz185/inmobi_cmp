import 'inmobi_cmp_platform_interface.dart';

/// The main class to interact with InMobi CMP.
class InmobiCmp {
  /// Initializes the InMobi CMP SDK.
  static Future<void> init({
    required String packageId,
    required String pCode
  }) {
    return InmobiCmpPlatform.instance.init(
      packageId: packageId,
      pCode: pCode
    );
  }

  /// Shows the consent dialog if required.
  static Future<void> showConsent() {
    return InmobiCmpPlatform.instance.showConsent();
  }

  /// Gets the current consent status.
  static Future<String> getConsentStatus() {
    return InmobiCmpPlatform.instance.getConsentStatus();
  }
}
