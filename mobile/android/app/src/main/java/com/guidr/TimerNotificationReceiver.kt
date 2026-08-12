package com.guidr

import android.app.NotificationManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import androidx.core.app.NotificationCompat

class TimerNotificationReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val stepTitle = intent.getStringExtra("stepTitle") ?: "Step"
        val guideTitle = intent.getStringExtra("guideTitle") ?: "Guide"
        val critical = intent.getBooleanExtra("critical", false)
        val notificationId = intent.getIntExtra("notificationId", 0)

        // Must match NotificationModule.CHANNEL_CRITICAL / CHANNEL_DEFAULT — the sound
        // and AudioAttributes that make critical notifications audible in vibrate-only
        // mode are configured once on the channel itself, not per-notification here.
        val channelId = if (critical) "guidr_timer_critical_v2" else "guidr_timer"

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
        manager.notify(notificationId, notification)

        // The critical channel no longer carries its own sound (see NotificationModule) —
        // play it ourselves so it survives ringer=Vibrate.
        if (critical) {
            CriticalSoundPlayer.play(context)
        }
    }
}
