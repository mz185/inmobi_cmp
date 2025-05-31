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
              let pCode = args["pCode"] as? String else {
            result(FlutterError(code: "INIT_ERROR", message: "Missing pCode", details: nil))
            return
        }
        
        // Start CMP
        ChoiceCmp.shared.startChoice(pcode: pCode, delegate: self)
        result(nil)
    }
    
    private func showConsent(result: @escaping FlutterResult) {
        DispatchQueue.main.async {
            ChoiceCmp.shared.forceDisplayUI()
            result(nil)
        }
    }
    
    private func getConsentStatus(result: @escaping FlutterResult) {
        ChoiceCmp.shared.getGDPRData { gdprData in
            DispatchQueue.main.async {
                if !gdprData.tcString.isEmpty {
                    result("gdpr_data_available")
                } else if let _ = ChoiceCmp.shared.getNonIABData() {
                    result("non_iab_data_available")
                } else {
                    result("no_consent_data")
                }
            }
        }
    }
    
    private func sendLogToFlutter(_ message: String) {
        DispatchQueue.main.async {
            self.channel?.invokeMethod("onCmpEvent", arguments: message)
        }
    }
}

// MARK: - ChoiceCmpDelegate
extension SwiftInmobiCmpPlugin: ChoiceCmpDelegate {
    public func cmpDidLoad(info: InMobiCMP.PingResponse) {
        sendLogToFlutter("CMP did load: \(info)")
    }
    
    public func didReceiveIABVendorConsent(gdprData: GDPRData, updated: Bool) {
        sendLogToFlutter("IAB vendor consent given: updated=\(updated).")
    }
    
    public func didReceiveNonIABVendorConsent(nonIabData: NonIABData, updated: Bool) {
        sendLogToFlutter("Non-IAB vendor consent given: updated=\(updated).")
    }
    
    public func didReceiveAdditionalConsent(acData: ACData, updated: Bool) {
        sendLogToFlutter("Google vendor consent given: updated=\(updated).")
    }
    
    public func didReceiveCCPAConsent(string: String) {
        sendLogToFlutter("CCPA Consent given.")
    }
    
    public func cmpDidError(error: Error) {
        sendLogToFlutter("CMP error: \(error.localizedDescription)")
    }
    
    public func didReceiveUSRegulationsConsent(usRegData: USRegulationsData) {
        sendLogToFlutter("US regulations consent received.")
    }
    
    public func userDidMoveToOtherState() {
        sendLogToFlutter("User moved to another state.")
    }
    
    public func cmpUIStatusChanged(info: DisplayInfo) {
        sendLogToFlutter("CMP UI status changed.")
    }
    
    public func didReceiveActionButtonTap(action: ActionButtons) {
        sendLogToFlutter("Action button clicked.")
    }
}
