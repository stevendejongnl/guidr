package com.guidr

import android.content.Context
import android.media.AudioAttributes
import android.media.Ringtone
import android.media.RingtoneManager
import android.provider.Settings

// Plays a critical timer's sound directly on the alarm stream instead of relying on
// NotificationChannel's own sound, which NotificationManagerService silently declines to
// play when the ringer is set to Vibrate — the channel's AudioAttributes(usage=ALARM)
// only affects which stream *would* carry the sound, not whether the notification-posting
// pipeline decides to play it at all under Vibrate. Playing the Ringtone ourselves sidesteps
// that gate entirely: it's a direct AudioManager/MediaPlayer call on STREAM_ALARM, which is
// the one stream ringer mode never mutes.
object CriticalSoundPlayer {
    private val criticalAudioAttributes: AudioAttributes = AudioAttributes.Builder()
        .setUsage(AudioAttributes.USAGE_ALARM)
        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
        .build()

    fun play(context: Context) {
        try {
            val soundUri = RingtoneManager.getActualDefaultRingtoneUri(context, RingtoneManager.TYPE_NOTIFICATION)
                ?: Settings.System.DEFAULT_NOTIFICATION_URI
            val ringtone: Ringtone? = RingtoneManager.getRingtone(context, soundUri)
            ringtone?.audioAttributes = criticalAudioAttributes
            ringtone?.play()
        } catch (e: Exception) {
            // Best-effort — vibration (set on the channel) still gets the user's attention.
        }
    }
}
