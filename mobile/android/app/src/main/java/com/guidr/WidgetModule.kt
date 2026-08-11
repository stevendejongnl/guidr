package com.guidr

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class WidgetModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "WidgetModule"

    @ReactMethod
    fun updateWidget(
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
            GuidrTimerWidgetProvider.saveState(
                reactApplicationContext,
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
    fun clearWidget(promise: Promise) {
        try {
            GuidrTimerWidgetProvider.clearState(reactApplicationContext)
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("WIDGET_CLEAR_ERROR", "Failed to clear widget: ${e.message}", e)
        }
    }
}
