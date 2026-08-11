package com.guidr

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.SharedPreferences
import android.os.Build
import android.os.SystemClock
import android.util.SizeF
import android.view.View
import android.widget.RemoteViews

class GuidrTimerWidgetProvider : AppWidgetProvider() {

    companion object {
        private const val PREFS_NAME = "guidr_widget_prefs"
        private const val KEY_STEP_ID = "step_id"
        private const val KEY_GUIDE_TITLE = "guide_title"
        private const val KEY_STEP_TITLE = "step_title"
        private const val KEY_TOTAL_DURATION_SECONDS = "total_duration_seconds"
        private const val KEY_REMAINING_SECONDS = "remaining_seconds"
        private const val KEY_IS_PAUSED = "is_paused"
        private const val KEY_IS_COMPLETE = "is_complete"
        private const val KEY_UPDATED_AT = "updated_at"

        // Safety net only: if a "running" timer's state hasn't been refreshed in this long,
        // assume the app was killed rather than trust a countdown that may have run past zero.
        private const val STALE_THRESHOLD_MS = 6 * 60 * 60 * 1000L

        private fun prefs(context: Context): SharedPreferences =
            context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

        fun saveState(
            context: Context,
            stepId: String,
            guideTitle: String,
            stepTitle: String,
            totalDurationSeconds: Int,
            remainingSeconds: Int,
            isPaused: Boolean,
            isComplete: Boolean,
        ) {
            prefs(context).edit()
                .putString(KEY_STEP_ID, stepId)
                .putString(KEY_GUIDE_TITLE, guideTitle)
                .putString(KEY_STEP_TITLE, stepTitle)
                .putInt(KEY_TOTAL_DURATION_SECONDS, totalDurationSeconds)
                .putInt(KEY_REMAINING_SECONDS, remainingSeconds)
                .putBoolean(KEY_IS_PAUSED, isPaused)
                .putBoolean(KEY_IS_COMPLETE, isComplete)
                .putLong(KEY_UPDATED_AT, System.currentTimeMillis())
                .apply()
            refreshAllWidgets(context)
        }

        fun clearState(context: Context) {
            prefs(context).edit().clear().apply()
            refreshAllWidgets(context)
        }

        fun refreshAllWidgets(context: Context) {
            val manager = AppWidgetManager.getInstance(context)
            val ids = manager.getAppWidgetIds(
                ComponentName(context, GuidrTimerWidgetProvider::class.java)
            )
            for (id in ids) {
                manager.updateAppWidget(id, buildRemoteViews(context))
            }
        }

        private fun buildRemoteViews(context: Context): RemoteViews {
            val small = buildViews(context, R.layout.widget_timer_small, isSmall = true)
            val medium = buildViews(context, R.layout.widget_timer_medium, isSmall = false)

            // Size-aware RemoteViews (API 31+) let the system pick the best-fitting layout as
            // the user resizes the widget. On older API levels, always use the medium layout.
            return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                RemoteViews(
                    mapOf(
                        SizeF(110f, 40f) to small,
                        SizeF(250f, 100f) to medium,
                    )
                )
            } else {
                medium
            }
        }

        private fun buildViews(context: Context, layoutRes: Int, isSmall: Boolean): RemoteViews {
            val views = RemoteViews(context.packageName, layoutRes)
            val p = prefs(context)

            val stepId = p.getString(KEY_STEP_ID, null)
            val isComplete = p.getBoolean(KEY_IS_COMPLETE, false)
            val isPaused = p.getBoolean(KEY_IS_PAUSED, false)
            val remainingSeconds = p.getInt(KEY_REMAINING_SECONDS, 0)
            val totalDurationSeconds = p.getInt(KEY_TOTAL_DURATION_SECONDS, 0)
            val updatedAt = p.getLong(KEY_UPDATED_AT, 0L)
            val guideTitle = p.getString(KEY_GUIDE_TITLE, "") ?: ""
            val stepTitle = p.getString(KEY_STEP_TITLE, "") ?: ""

            val isStale = !isPaused && !isComplete &&
                (System.currentTimeMillis() - updatedAt) > STALE_THRESHOLD_MS

            if (stepId == null || isStale) {
                renderIdle(context, views, isSmall)
                return views
            }

            views.setTextViewText(R.id.widget_step_title, stepTitle)
            views.setViewVisibility(R.id.widget_time, View.VISIBLE)

            if (!isSmall) {
                views.setTextViewText(R.id.widget_guide_title, guideTitle)
                views.setViewVisibility(R.id.widget_guide_title, View.VISIBLE)
                views.setViewVisibility(R.id.widget_idle_subtitle, View.GONE)

                if (totalDurationSeconds > 0) {
                    val progress = (
                        (totalDurationSeconds - remainingSeconds).toFloat() / totalDurationSeconds * 1000
                    ).toInt().coerceIn(0, 1000)
                    views.setProgressBar(R.id.widget_progress, 1000, progress, false)
                    views.setViewVisibility(R.id.widget_progress, View.VISIBLE)
                } else {
                    views.setViewVisibility(R.id.widget_progress, View.GONE)
                }
            }

            when {
                isComplete -> renderComplete(context, views)
                isPaused -> renderPaused(views, remainingSeconds)
                else -> renderRunning(views, remainingSeconds)
            }

            return views
        }

        private fun renderIdle(context: Context, views: RemoteViews, isSmall: Boolean) {
            views.setTextViewText(R.id.widget_step_title, context.getString(R.string.widget_idle_title))
            views.setChronometerCountDown(R.id.widget_time, false)
            views.setViewVisibility(R.id.widget_time, View.GONE)
            if (!isSmall) {
                views.setViewVisibility(R.id.widget_guide_title, View.GONE)
                views.setViewVisibility(R.id.widget_idle_subtitle, View.VISIBLE)
                views.setViewVisibility(R.id.widget_progress, View.GONE)
            }
        }

        private fun renderRunning(views: RemoteViews, remainingSeconds: Int) {
            val base = SystemClock.elapsedRealtime() + (remainingSeconds.coerceAtLeast(0) * 1000L)
            views.setChronometerCountDown(R.id.widget_time, true)
            views.setChronometer(R.id.widget_time, base, null, true)
        }

        private fun renderPaused(views: RemoteViews, remainingSeconds: Int) {
            views.setChronometerCountDown(R.id.widget_time, false)
            views.setChronometer(R.id.widget_time, 0L, null, false)
            views.setTextViewText(R.id.widget_time, formatSeconds(remainingSeconds))
        }

        private fun renderComplete(context: Context, views: RemoteViews) {
            views.setChronometerCountDown(R.id.widget_time, false)
            views.setChronometer(R.id.widget_time, 0L, null, false)
            views.setTextViewText(R.id.widget_time, context.getString(R.string.widget_complete_time))
        }

        private fun formatSeconds(totalSeconds: Int): String {
            val safeSeconds = totalSeconds.coerceAtLeast(0)
            val minutes = safeSeconds / 60
            val seconds = safeSeconds % 60
            return String.format("%d:%02d", minutes, seconds)
        }
    }

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray,
    ) {
        for (id in appWidgetIds) {
            appWidgetManager.updateAppWidget(id, buildRemoteViews(context))
        }
    }
}
