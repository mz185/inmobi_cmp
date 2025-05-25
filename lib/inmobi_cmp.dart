import 'inmobi_cmp_platform_interface.dart';

/// The main class to interact with InMobi CMP.
class InmobiCmp {
  /// Initializes the InMobi CMP SDK.
  static Future<void> init({
    required String accountId,
    bool gdpr = true,
    String consentStatus = 'unknown',
  }) {
    return InmobiCmpPlatform.instance.init(
      accountId: accountId,
      gdpr: gdpr,
      consentStatus: consentStatus,
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
