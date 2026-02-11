package com.guidr

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import androidx.core.app.NotificationCompat
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class NotificationModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val CHANNEL_DEFAULT = "guidr_timer"
        private const val CHANNEL_CRITICAL = "guidr_timer_critical"
        private var notificationId = 1000
    }

    override fun getName(): String = "NotificationModule"

    init {
        createNotificationChannels()
    }

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val manager = reactApplicationContext.getSystemService(
                Context.NOTIFICATION_SERVICE
            ) as NotificationManager

            val defaultChannel = NotificationChannel(
                CHANNEL_DEFAULT,
                "Timer Notifications",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "Notifications when step timers complete"
            }
            manager.createNotificationChannel(defaultChannel)

            val criticalChannel = NotificationChannel(
                CHANNEL_CRITICAL,
                "Critical Timer Notifications",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "High-priority notifications that break through Do Not Disturb"
            }
            manager.createNotificationChannel(criticalChannel)
        }
    }

    @ReactMethod
    fun requestPermission(promise: Promise) {
        // On Android, permission is handled via PermissionsAndroid in JS
        promise.resolve(true)
    }

    @ReactMethod
    fun showNotification(
        stepId: String,
        stepTitle: String,
        guideTitle: String,
        critical: Boolean,
        promise: Promise
    ) {
        try {
            val channelId = if (critical) CHANNEL_CRITICAL else CHANNEL_DEFAULT
            val context = reactApplicationContext

            val notification = NotificationCompat.Builder(context, channelId)
                .setContentTitle("Timer Complete")
                .setContentText("$stepTitle — $guideTitle")
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setAutoCancel(true)
                .setPriority(
                    if (critical) NotificationCompat.PRIORITY_HIGH
                    else NotificationCompat.PRIORITY_DEFAULT
                )
                .build()

            val manager = context.getSystemService(
                Context.NOTIFICATION_SERVICE
            ) as NotificationManager
            manager.notify(notificationId++, notification)

            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("NOTIFICATION_ERROR", "Failed to show notification: ${e.message}", e)
        }
    }

    @ReactMethod
    fun scheduleNotification(
        stepId: String,
        stepTitle: String,
        guideTitle: String,
        remainingSeconds: Int,
        critical: Boolean,
        promise: Promise
    ) {
        // Scheduling is iOS-only; on Android this is a no-op
        promise.resolve(null)
    }

    @ReactMethod
    fun cancelNotification(stepId: String, promise: Promise) {
        // Cancel is iOS-only for scheduled notifications
        promise.resolve(null)
    }

    @ReactMethod
    fun cancelAllNotifications(promise: Promise) {
        promise.resolve(null)
    }

    @ReactMethod
    fun syncPreferences(timerEnabled: Boolean, criticalEnabled: Boolean, promise: Promise) {
        // UserDefaults sync is iOS-only
        promise.resolve(null)
    }
}
