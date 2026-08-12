package com.guidr

import android.content.Context
import android.content.SharedPreferences
import org.json.JSONArray
import org.json.JSONObject

// Shared by GuidrTimerWidgetProvider (rendering the small/medium single-timer views) and
// WidgetTimerListFactory (rendering the scrollable list shown when the widget is resized
// tall) — both read the same persisted set of active timers.

internal const val WIDGET_PREFS_NAME = "guidr_widget_prefs"
private const val KEY_TIMERS = "timers_json"

// Safety net only: if a "running" timer's state hasn't been refreshed in this long, assume
// the app was killed rather than trust a countdown that may have run past zero.
internal const val WIDGET_STALE_THRESHOLD_MS = 6 * 60 * 60 * 1000L

internal data class WidgetTimerRecord(
    val guideId: String,
    val stepId: String,
    val guideTitle: String,
    val stepTitle: String,
    val totalDurationSeconds: Int,
    val remainingSeconds: Int,
    val isPaused: Boolean,
    val isComplete: Boolean,
    val updatedAt: Long,
) {
    // remainingSeconds is only a snapshot as of updatedAt — project it forward to "now" so
    // repeated re-renders (the periodic tick, an OS-triggered widget refresh) stay accurate
    // instead of re-anchoring the countdown to a stale value each time.
    val projectedRemainingSeconds: Int
        get() {
            if (isPaused || isComplete) return remainingSeconds
            val elapsedSeconds = ((System.currentTimeMillis() - updatedAt) / 1000L).toInt()
            return (remainingSeconds - elapsedSeconds).coerceAtLeast(0)
        }

    val isStale: Boolean
        get() = !isPaused && !isComplete &&
            (System.currentTimeMillis() - updatedAt) > WIDGET_STALE_THRESHOLD_MS

    fun toJson(): JSONObject = JSONObject().apply {
        put("guideId", guideId)
        put("stepId", stepId)
        put("guideTitle", guideTitle)
        put("stepTitle", stepTitle)
        put("totalDurationSeconds", totalDurationSeconds)
        put("remainingSeconds", remainingSeconds)
        put("isPaused", isPaused)
        put("isComplete", isComplete)
        put("updatedAt", updatedAt)
    }

    companion object {
        fun fromJson(json: JSONObject): WidgetTimerRecord = WidgetTimerRecord(
            guideId = json.getString("guideId"),
            stepId = json.getString("stepId"),
            guideTitle = json.optString("guideTitle", ""),
            stepTitle = json.optString("stepTitle", ""),
            totalDurationSeconds = json.optInt("totalDurationSeconds", 0),
            remainingSeconds = json.optInt("remainingSeconds", 0),
            isPaused = json.optBoolean("isPaused", false),
            isComplete = json.optBoolean("isComplete", false),
            updatedAt = json.optLong("updatedAt", 0L),
        )
    }
}

internal fun widgetPrefs(context: Context): SharedPreferences =
    context.getSharedPreferences(WIDGET_PREFS_NAME, Context.MODE_PRIVATE)

internal fun loadWidgetTimers(context: Context): List<WidgetTimerRecord> {
    val raw = widgetPrefs(context).getString(KEY_TIMERS, null) ?: return emptyList()
    return try {
        val array = JSONArray(raw)
        (0 until array.length()).mapNotNull { i ->
            try {
                WidgetTimerRecord.fromJson(array.getJSONObject(i))
            } catch (e: Exception) {
                null
            }
        }
    } catch (e: Exception) {
        emptyList()
    }
}

internal fun saveWidgetTimers(context: Context, timers: List<WidgetTimerRecord>) {
    val array = JSONArray()
    timers.forEach { array.put(it.toJson()) }
    widgetPrefs(context).edit().putString(KEY_TIMERS, array.toString()).apply()
}

internal fun formatWidgetSeconds(totalSeconds: Int): String {
    val safeSeconds = totalSeconds.coerceAtLeast(0)
    val minutes = safeSeconds / 60
    val seconds = safeSeconds % 60
    return String.format("%d:%02d", minutes, seconds)
}
