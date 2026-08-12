package com.guidr

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class WidgetModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "WidgetModule"

    @ReactMethod
    fun updateWidget(
        guideId: String,
        stepId: String,
        guideTitle: String,
        stepTitle: String,
        totalDurationSeconds: Int,
        remainingSeconds: Int,
        isPaused: Boolean,
        isComplete: Boolean,
        promise: Promise,
    ) {
        try {
            GuidrTimerWidgetProvider.upsertTimer(
                reactApplicationContext,
                guideId,
                stepId,
                guideTitle,
                stepTitle,
                totalDurationSeconds,
                remainingSeconds,
                isPaused,
                isComplete,
            )
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("WIDGET_UPDATE_ERROR", "Failed to update widget: ${e.message}", e)
        }
    }

    @ReactMethod
    fun clearWidget(stepId: String, promise: Promise) {
        try {
            GuidrTimerWidgetProvider.removeTimer(reactApplicationContext, stepId)
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("WIDGET_CLEAR_ERROR", "Failed to clear widget: ${e.message}", e)
        }
    }

    // Reads the guide/step the widget was tapped for (set as launch Intent extras by
    // GuidrTimerWidgetProvider's PendingIntent) and clears it so it's only consumed once —
    // otherwise re-foregrounding the app later would keep re-navigating to a stale target.
    @ReactMethod
    fun getAndClearWidgetLaunchTarget(promise: Promise) {
        try {
            val intent = reactApplicationContext.currentActivity?.intent
            val guideId = intent?.getStringExtra(GuidrTimerWidgetProvider.EXTRA_GUIDE_ID)
            val stepId = intent?.getStringExtra(GuidrTimerWidgetProvider.EXTRA_STEP_ID)

            if (intent != null && guideId != null && stepId != null) {
                intent.removeExtra(GuidrTimerWidgetProvider.EXTRA_GUIDE_ID)
                intent.removeExtra(GuidrTimerWidgetProvider.EXTRA_STEP_ID)
                val result = Arguments.createMap()
                result.putString("guideId", guideId)
                result.putString("stepId", stepId)
                promise.resolve(result)
            } else {
                promise.resolve(null)
            }
        } catch (e: Exception) {
            promise.reject("WIDGET_LAUNCH_TARGET_ERROR", "Failed to read widget launch target: ${e.message}", e)
        }
    }
}
