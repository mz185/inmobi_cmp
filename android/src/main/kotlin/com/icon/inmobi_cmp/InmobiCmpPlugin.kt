package com.icon.inmobi_cmp

import android.app.Activity
import android.content.Context
import androidx.annotation.NonNull
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

class InmobiCmpPlugin : FlutterPlugin, ActivityAware, MethodChannel.MethodCallHandler {
    private lateinit var channel: MethodChannel
    private var context: Context? = null
    private var activity: Activity? = null

    override fun onAttachedToEngine(binding: FlutterPlugin.FlutterPluginBinding) {
        context = binding.applicationContext
        channel = MethodChannel(binding.binaryMessenger, "com.icon.inmobi_cmp")
        channel.setMethodCallHandler(this)
    }

    override fun onDetachedFromEngine(binding: FlutterPlugin.FlutterPluginBinding) {
        channel.setMethodCallHandler(null)
        context = null
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
        val accountId = call.argument<String>("accountId").orEmpty()
        if (context == null || accountId.isEmpty()) {
            result.error("INIT_ERROR", "accountId missing", null)
            return
        }
        ChoiceCmp.startChoice(
            app = context as? android.app.Application
                ?: throw IllegalStateException("Invalid application context"),
            packageId = context!!.packageName,
            pCode = accountId,
            callback = object : ChoiceCmpCallback {
                override fun onCmpLoaded(info: PingReturn) {}
                override fun onCMPUIStatusChanged(status: DisplayInfo) {}
                override fun onCmpError(error: ChoiceError) {}
                override fun onGoogleBasicConsentChange(consents: GoogleBasicConsents) {}
                override fun onGoogleVendorConsentGiven(acData: ACData) {}
                override fun onIABVendorConsentGiven(gdprData: GDPRData) {}
                override fun onNonIABVendorConsentGiven(nonIABData: NonIABData) {}
                override fun onReceiveUSRegulationsConsent(usRegulationData: USRegulationData) {}
                override fun onUserMovedToOtherState() {}
                override fun onActionButtonClicked(actionButton: ActionButton) {}
                override fun onCCPAConsentGiven(consentString: String) {}
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
}