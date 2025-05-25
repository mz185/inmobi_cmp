import Flutter
import UIKit
import InMobiCMP

public class SwiftInmobiCmpPlugin: NSObject, FlutterPlugin {
  private var channel: FlutterMethodChannel?

  public static func register(with registrar: FlutterPluginRegistrar) {
    let channel = FlutterMethodChannel(name: "com.icon.inmobi_cmp",
                                       binaryMessenger: registrar.messenger())
    let instance = SwiftInmobiCmpPlugin()
    instance.channel = channel
    registrar.addMethodCallDelegate(instance, channel: channel)
  }

  public func handle(_ call: FlutterMethodCall, result: @escaping FlutterResult) {
    switch call.method {
    case "init":
      initConsent(call: call, result: result)
    case "showConsent":
      showConsent(result: result)
    case "getConsentStatus":
      getConsentStatus(result: result)
    default:
      result(FlutterMethodNotImplemented)
    }
  }

  private func initConsent(call: FlutterMethodCall, result: FlutterResult) {
    guard let args = call.arguments as? [String: Any],
          let pCode = args["accountId"] as? String else {
      result(FlutterError(code: "INIT_ERROR", message: "Missing pCode", details: nil))
      return
    }
    // Initialize CMP via shared singleton
    ChoiceCmp.shared.startChoice(pcode: pCode,
                                 delegate: self)
    result(nil)
  }

  private func showConsent(result: FlutterResult) {
    DispatchQueue.main.async {
      ChoiceCmp.shared.forceDisplayUI()
      result(nil)
    }
  }

  private func getConsentStatus(result: FlutterResult) {
    // Async fetch GDPR data
    ChoiceCmp.shared.getGDPRDataWithCompletion { gdprData in
      if let data = gdprData {
        result("gdpr_data_available")
      } else {
        // Fallback: check non-IAB data
        if let nonIab = ChoiceCmp.shared.getNonIABData() {
          result("non_iab_data_available")
        } else {
          result("no_consent_data")
        }
      }
    }
  }
}

// MARK: - ChoiceCmpDelegate
extension SwiftInmobiCmpPlugin: ChoiceCmpDelegate {
  public func cmpDidLoadWithInfo(_ info: PingResponse) {
    let map = [
      "cmpLoaded": info.cmpLoaded,
      "apiVersion": info.apiVersion
    ] as [String : Any]
    channel?.invokeMethod("onCmpLoaded", arguments: map)
  }

  public func didReceiveIABVendorConsentWithGdprData(_ gdprData: GDPRData, updated: Bool) {
    // forward details as needed
    channel?.invokeMethod("onIABConsent", arguments: ["updated": updated, "tcString": gdprData.tcString])
  }

  public func didReceiveNonIABVendorConsentWithNonIabData(_ nonIabData: NonIABData, updated: Bool) {
    channel?.invokeMethod("onNonIABConsent", arguments: ["updated": updated, "consent": nonIabData.consent])
  }

  public func didReceiveAdditionalConsentWithAcData(_ acData: ACData, updated: Bool) {
    channel?.invokeMethod("onAdditionalConsent", arguments: ["updated": updated, "acString": acData.acString])
  }

  public func cmpDidErrorWithError(_ error: Error) {
    channel?.invokeMethod("onCmpError", arguments: ["error": error.localizedDescription])
  }

  public func didReceiveUSRegulationsConsentWithUsRegData(_ usRegData: USRegulationsData) {
    channel?.invokeMethod("onUSRegulationsConsent", arguments: ["gppString": usRegData.gppString])
  }

  public func didReceiveActionButtonTapWithAction(_ action: ActionButtons) {
    channel?.invokeMethod("onActionButtonClicked", arguments: ["action": action.rawValue])
  }

  public func cmpUIStatusChangedWithInfo(_ info: DisplayInfo) {
    channel?.invokeMethod("onUIStatusChanged", arguments: ["status": info.displayStatus.rawValue])
  }

  public func userDidMoveToOtherState() {
    channel?.invokeMethod("onUserMovedState", arguments: nil)
  }
}
