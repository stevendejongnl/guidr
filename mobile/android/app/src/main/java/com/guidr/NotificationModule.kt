package com.guidr

import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.SystemClock
import androidx.core.app.NotificationCompat
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class NotificationModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val CHANNEL_DEFAULT = "guidr_timer"
        // v2: the original channel was created with no explicit sound/AudioAttributes,
        // so its default IMPORTANCE_HIGH sound was silenced by ringer=Vibrate mode.
        // NotificationChannel settings are immutable after first creation on a device,
        // so fixing this requires a new channel ID — old devices get a fresh channel,
        // the old one is deleted below so it doesn't linger as a dead duplicate.
        private const val CHANNEL_CRITICAL_LEGACY = "guidr_timer_critical"
        private const val CHANNEL_CRITICAL = "guidr_timer_critical_v2"
        private const val CHANNEL_UPDATES = "guidr_updates"
        private const val UPDATE_NOTIFICATION_ID = 2000
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

            manager.deleteNotificationChannel(CHANNEL_CRITICAL_LEGACY)

            val defaultChannel = NotificationChannel(
                CHANNEL_DEFAULT,
                "Timer Notifications",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "Notifications when step timers complete"
            }
            manager.createNotificationChannel(defaultChannel)

            // No channel-level sound: NotificationManagerService silently declines to play
            // a channel's sound at all when the ringer is set to Vibrate, regardless of the
            // sound's AudioAttributes usage — the AudioAttributes only pick a stream *if*
            // the system decides to play something. CriticalSoundPlayer plays the sound
            // directly on the alarm stream instead, bypassing that gate. Vibration is
            // unaffected by ringer mode and stays on the channel as normal.
            val criticalChannel = NotificationChannel(
                CHANNEL_CRITICAL,
                "Critical Timer Notifications",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "High-priority notifications that break through Do Not " +
                    "Disturb and vibrate-only mode"
                setSound(null, null)
                enableVibration(true)
            }
            manager.createNotificationChannel(criticalChannel)

            val updatesChannel = NotificationChannel(
                CHANNEL_UPDATES,
                "App Updates",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "Notifications when a new version of Guidr is available"
            }
            manager.createNotificationChannel(updatesChannel)
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

            if (critical) {
                CriticalSoundPlayer.play(context)
            }

            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("NOTIFICATION_ERROR", "Failed to show notification: ${e.message}", e)
        }
    }

    @ReactMethod
    fun showUpdateNotification(
        latestVersion: String,
        isMandatory: Boolean,
        promise: Promise
    ) {
        try {
            val context = reactApplicationContext

            val launchIntent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            val contentIntent = PendingIntent.getActivity(
                context,
                0,
                launchIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            val title = if (isMandatory) "Update Required" else "Update Available"
            val text = "Guidr $latestVersion is ready to install"

            val notification = NotificationCompat.Builder(context, CHANNEL_UPDATES)
                .setContentTitle(title)
                .setContentText(text)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setAutoCancel(true)
                .setContentIntent(contentIntent)
                .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                .build()

            val manager = context.getSystemService(
                Context.NOTIFICATION_SERVICE
            ) as NotificationManager
            // Fixed ID: a repeat notification (e.g. from a later re-check) replaces the
            // existing one instead of stacking duplicates for the same pending update.
            manager.notify(UPDATE_NOTIFICATION_ID, notification)

            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("UPDATE_NOTIFICATION_ERROR", "Failed to show update notification: ${e.message}", e)
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
        try {
            val context = reactApplicationContext
            val alarmManager = context.getSystemService(
                Context.ALARM_SERVICE
            ) as AlarmManager

            val intent = Intent(context, TimerNotificationReceiver::class.java).apply {
                putExtra("stepTitle", stepTitle)
                putExtra("guideTitle", guideTitle)
                putExtra("critical", critical)
                putExtra("notificationId", stepId.hashCode())
            }

            val pendingIntent = PendingIntent.getBroadcast(
                context,
                stepId.hashCode(),
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            val triggerAt = SystemClock.elapsedRealtime() + remainingSeconds * 1000L
            alarmManager.setExactAndAllowWhileIdle(
                AlarmManager.ELAPSED_REALTIME_WAKEUP,
                triggerAt,
                pendingIntent
            )

            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject(
                "SCHEDULE_ERROR",
                "Failed to schedule notification: ${e.message}",
                e
            )
        }
    }

    @ReactMethod
    fun cancelNotification(stepId: String, promise: Promise) {
        try {
            val context = reactApplicationContext
            val alarmManager = context.getSystemService(
                Context.ALARM_SERVICE
            ) as AlarmManager

            val intent = Intent(context, TimerNotificationReceiver::class.java)
            val pendingIntent = PendingIntent.getBroadcast(
                context,
                stepId.hashCode(),
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            alarmManager.cancel(pendingIntent)
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject(
                "CANCEL_ERROR",
                "Failed to cancel notification: ${e.message}",
                e
            )
        }
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
