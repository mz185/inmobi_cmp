package com.icon.inmobi_cmp

import android.app.Activity
import android.content.Context
import com.inmobi.cmp.ChoiceCmp
import com.inmobi.cmp.ChoiceCmpCallback
import com.inmobi.cmp.core.model.ACData
import com.inmobi.cmp.core.model.GDPRData
import com.inmobi.cmp.core.model.gbc.GoogleBasicConsents
import com.inmobi.cmp.core.model.mspa.USRegulationData
import com.inmobi.cmp.model.ActionButton
import com.inmobi.cmp.model.ChoiceError
import com.inmobi.cmp.model.DisplayInfo
import com.inmobi.cmp.model.NonIABData
import com.inmobi.cmp.model.PingReturn
import io.flutter.embedding.engine.plugins.FlutterPlugin
import io.flutter.embedding.engine.plugins.activity.ActivityAware
import io.flutter.embedding.engine.plugins.activity.ActivityPluginBinding
import io.flutter.plugin.common.MethodCall
import io.flutter.plugin.common.MethodChannel

class InmobiCmpPlugin : FlutterPlugin, ActivityAware, MethodChannel.MethodCallHandler{
    private lateinit var channel: MethodChannel
    private var applicationContext: Context? = null
    private var activity: Activity? = null

    override fun onAttachedToEngine(binding: FlutterPlugin.FlutterPluginBinding) {
        applicationContext = binding.applicationContext
        channel = MethodChannel(binding.binaryMessenger, "com.icon.inmobi_cmp")
        channel.setMethodCallHandler(this)
    }

    override fun onDetachedFromEngine(binding: FlutterPlugin.FlutterPluginBinding) {
        channel.setMethodCallHandler(null)
        applicationContext = null
    }

    override fun onAttachedToActivity(binding: ActivityPluginBinding) {
        activity = binding.activity
    }

    override fun onDetachedFromActivity() {
        activity = null
    }

    override fun onReattachedToActivityForConfigChanges(binding: ActivityPluginBinding) {
        activity = binding.activity
    }

    override fun onDetachedFromActivityForConfigChanges() {
        activity = null
    }

    override fun onMethodCall(call: MethodCall, result: MethodChannel.Result) {
        when (call.method) {
            "init" -> initConsent(call, result)
            "showConsent" -> showConsent(result)
            "getConsentStatus" -> getConsentStatus(result)
            else -> result.notImplemented()
        }
    }

    private fun initConsent(call: MethodCall, result: MethodChannel.Result) {
        val packageId = call.argument<String>("packageId").orEmpty()
        val pCode = call.argument<String>("pCode").orEmpty()

        if (packageId.isEmpty()) {
            result.error("INIT_ERROR", "packageId missing", null)
            return
        }

        if (pCode.isEmpty()) {
            result.error("INIT_ERROR", "pCode missing", null)
            return
        }

        ChoiceCmp.startChoice(
            app = applicationContext as? android.app.Application
                ?: throw IllegalStateException("Invalid application context"),
            packageId = packageId,
            pCode = pCode,
            callback = object : ChoiceCmpCallback {
                override fun onActionButtonClicked(actionButton: ActionButton) {
                    sendLogToFlutter("Action button clicked: $actionButton")
                }

                override fun onCCPAConsentGiven(consentString: String) {
                    sendLogToFlutter("CCPA Consent given: $consentString")
                }

                override fun onCMPUIStatusChanged(status: DisplayInfo) {
                    sendLogToFlutter("CMP UI status changed: $status")
                }

                override fun onCmpError(error: ChoiceError) {
                    sendLogToFlutter("CMP error: $error")
                }

                override fun onCmpLoaded(info: PingReturn) {
                    sendLogToFlutter("CMP loaded: $info")
                }

                override fun onGoogleBasicConsentChange(consents: GoogleBasicConsents) {
                    sendLogToFlutter("Google basic consent change: $consents")
                }

                override fun onGoogleVendorConsentGiven(acData: ACData) {
                    sendLogToFlutter("Google vendor consent given: $acData")
                }

                override fun onIABVendorConsentGiven(gdprData: GDPRData) {
                    sendLogToFlutter("IAB vendor consent given: $gdprData")
                }

                override fun onNonIABVendorConsentGiven(nonIABData: NonIABData) {
                    sendLogToFlutter("Non-IAB vendor consent given: $nonIABData")
                }

                override fun onReceiveUSRegulationsConsent(usRegulationData: USRegulationData) {
                    sendLogToFlutter("US regulations consent received: $usRegulationData")
                }

                override fun onUserMovedToOtherState() {
                    sendLogToFlutter("User moved to another state")
                }
            }
        )
        result.success(null)
    }

    private fun showConsent(result: MethodChannel.Result) {
        if (activity == null) {
            result.error("NO_ACTIVITY", "Activity is null.", null)
        } else {
            ChoiceCmp.forceDisplayUI(activity!!)
            result.success(null)
        }
    }

    private fun getConsentStatus(result: MethodChannel.Result) {
        val gdprData: GDPRData? = ChoiceCmp.getGDPRData()
        val nonIABData: NonIABData? = ChoiceCmp.getNonIABData()
        val status = when {
            gdprData != null -> "gdpr_data_available"
            nonIABData != null -> "non_iab_data_available"
            else -> "no_consent_data"
        }
        result.success(status)
    }

    private fun sendLogToFlutter(message: String) {
        channel.invokeMethod("onCmpEvent", message)
    }
}