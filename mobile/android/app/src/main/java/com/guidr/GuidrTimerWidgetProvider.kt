package com.guidr

import android.app.AlarmManager
import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.SystemClock
import android.util.SizeF
import android.view.View
import android.widget.RemoteViews

class GuidrTimerWidgetProvider : AppWidgetProvider() {

    companion object {
        // Extra keys on the launch Intent MainActivity reads to deep-link into the
        // active timer's step, and on the per-timer completion-check alarm below.
        const val EXTRA_GUIDE_ID = "guide_id"
        const val EXTRA_STEP_ID = "step_id"

        // Fired by AlarmManager at the moment a running timer is due to complete, so the
        // widget flips itself to "Complete" even if the app's JS thread isn't running to
        // notice (backgrounded/killed) — Chronometer has no built-in stop-at-zero, it just
        // keeps ticking into negative time forever unless something tells it to stop. One
        // alarm per timer (keyed by stepId), since each may complete at a different time.
        private const val ACTION_TIMER_COMPLETE_CHECK = "com.guidr.ACTION_TIMER_COMPLETE_CHECK"

        // The Chronometer text ticks on its own (system-rendered), but the progress bar(s)
        // are plain RemoteViews values set once at update time — nothing repaints them as
        // time passes. Self-reschedule a lightweight shared alarm while any timer is running
        // so the bar(s) keep moving.
        private const val ACTION_WIDGET_TICK = "com.guidr.ACTION_WIDGET_TICK"
        private const val TICK_REQUEST_CODE = 9002
        private const val TICK_INTERVAL_MS = 15_000L

        private fun completeCheckPendingIntent(context: Context, stepId: String): PendingIntent {
            val intent = Intent(context, GuidrTimerWidgetProvider::class.java).apply {
                action = ACTION_TIMER_COMPLETE_CHECK
                putExtra(EXTRA_STEP_ID, stepId)
            }
            return PendingIntent.getBroadcast(
                context,
                stepId.hashCode(),
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
            )
        }

        private fun scheduleCompleteCheck(context: Context, stepId: String, remainingSeconds: Int) {
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            try {
                alarmManager.setExactAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP,
                    System.currentTimeMillis() + remainingSeconds * 1000L,
                    completeCheckPendingIntent(context, stepId),
                )
            } catch (e: Exception) {
                // Missing SCHEDULE_EXACT_ALARM on some OEM configurations (or any other
                // alarm-scheduling failure) — the widget just won't self-correct until the
                // app itself updates it again. Must not propagate: this call happens before
                // refreshAllWidgets() in upsertTimer, and an uncaught exception here would
                // silently abort that whole update, leaving the widget stuck on stale data
                // even though it was saved correctly.
            }
        }

        private fun cancelCompleteCheck(context: Context, stepId: String) {
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            alarmManager.cancel(completeCheckPendingIntent(context, stepId))
        }

        private fun tickPendingIntent(context: Context): PendingIntent {
            val intent = Intent(context, GuidrTimerWidgetProvider::class.java).apply {
                action = ACTION_WIDGET_TICK
            }
            return PendingIntent.getBroadcast(
                context,
                TICK_REQUEST_CODE,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
            )
        }

        private fun scheduleNextTick(context: Context) {
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            try {
                alarmManager.setExactAndAllowWhileIdle(
                    AlarmManager.ELAPSED_REALTIME_WAKEUP,
                    SystemClock.elapsedRealtime() + TICK_INTERVAL_MS,
                    tickPendingIntent(context),
                )
            } catch (e: Exception) {
                // Missing SCHEDULE_EXACT_ALARM (or any other alarm-scheduling failure) — the
                // progress bar(s) just won't animate. Must not propagate: this runs before
                // refreshAllWidgets() in upsertTimer/removeTimer, so an uncaught exception
                // here would silently abort the widget's visual refresh entirely.
            }
        }

        private fun cancelTick(context: Context) {
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            alarmManager.cancel(tickPendingIntent(context))
        }

        private fun syncTickAlarm(context: Context, timers: List<WidgetTimerRecord>) {
            val hasRunning = timers.any { !it.isPaused && !it.isComplete }
            if (hasRunning) scheduleNextTick(context) else cancelTick(context)
        }

        // Adds/replaces the record for this stepId — each guide screen reports only the one
        // step it knows about, so timers started from different guides accumulate here
        // instead of clobbering each other the way a single flat record used to.
        fun upsertTimer(
            context: Context,
            guideId: String,
            stepId: String,
            guideTitle: String,
            stepTitle: String,
            totalDurationSeconds: Int,
            remainingSeconds: Int,
            isPaused: Boolean,
            isComplete: Boolean,
        ) {
            val record = WidgetTimerRecord(
                guideId = guideId,
                stepId = stepId,
                guideTitle = guideTitle,
                stepTitle = stepTitle,
                totalDurationSeconds = totalDurationSeconds,
                remainingSeconds = remainingSeconds,
                isPaused = isPaused,
                isComplete = isComplete,
                updatedAt = System.currentTimeMillis(),
            )
            val timers = loadWidgetTimers(context).filterNot { it.stepId == stepId } + record
            saveWidgetTimers(context, timers)

            // The record above is already persisted — the widget must repaint to reflect it
            // even if alarm scheduling (best-effort; used only for auto-complete/animation)
            // fails for some reason.
            try {
                if (!isPaused && !isComplete && remainingSeconds > 0) {
                    scheduleCompleteCheck(context, stepId, remainingSeconds)
                } else {
                    cancelCompleteCheck(context, stepId)
                }
                syncTickAlarm(context, timers)
            } catch (e: Exception) {
                // Best-effort alarm bookkeeping only — must never block the widget refresh
                // below, which is what actually makes the running timer visible.
            }
            refreshAllWidgets(context)
        }

        fun removeTimer(context: Context, stepId: String) {
            val timers = loadWidgetTimers(context).filterNot { it.stepId == stepId }
            saveWidgetTimers(context, timers)
            try {
                cancelCompleteCheck(context, stepId)
                syncTickAlarm(context, timers)
            } catch (e: Exception) {
                // Best-effort alarm bookkeeping only — must never block the widget refresh
                // below, which is what actually makes the removal visible.
            }
            refreshAllWidgets(context)
        }

        fun refreshAllWidgets(context: Context) {
            val manager = AppWidgetManager.getInstance(context)
            val ids = manager.getAppWidgetIds(
                ComponentName(context, GuidrTimerWidgetProvider::class.java)
            )
            if (ids.isEmpty()) return
            for (id in ids) {
                manager.updateAppWidget(id, buildRemoteViews(context))
            }
            manager.notifyAppWidgetViewDataChanged(ids, R.id.widget_timer_list)
        }

        // Among running timers, the one closest to completion; falls back to any paused
        // timer, then the most recently completed one, so there's always something sensible
        // to show as long as at least one timer is tracked.
        private fun selectPrimary(timers: List<WidgetTimerRecord>): WidgetTimerRecord? {
            timers.filter { !it.isPaused && !it.isComplete }
                .minByOrNull { it.projectedRemainingSeconds }
                ?.let { return it }
            timers.filter { it.isPaused }.minByOrNull { it.projectedRemainingSeconds }?.let { return it }
            return timers.maxByOrNull { it.updatedAt }
        }

        private fun buildRemoteViews(context: Context): RemoteViews {
            val small = buildViews(context, R.layout.widget_timer_small, isSmall = true)
            val medium = buildViews(context, R.layout.widget_timer_medium, isSmall = false)

            // Size-aware RemoteViews (API 31+) let the system pick the best-fitting layout as
            // the user resizes the widget. On older API levels, always use the medium layout.
            return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val large = try {
                    buildListViews(context)
                } catch (e: Exception) {
                    // If the list view fails to build for any reason, fall back to medium
                    // rather than losing the whole widget.
                    medium
                }
                RemoteViews(
                    mapOf(
                        SizeF(110f, 40f) to small,
                        SizeF(250f, 100f) to medium,
                        SizeF(250f, 180f) to large,
                    )
                )
            } else {
                medium
            }
        }

        private fun buildViews(context: Context, layoutRes: Int, isSmall: Boolean): RemoteViews {
            val views = RemoteViews(context.packageName, layoutRes)
            val timers = loadWidgetTimers(context).filterNot { it.isStale }
            val primary = selectPrimary(timers)
            val otherCount = (timers.size - 1).coerceAtLeast(0)

            if (primary == null) {
                views.setOnClickPendingIntent(R.id.widget_root, buildLaunchIntent(context, null, null))
                renderIdle(context, views, isSmall)
                return views
            }

            views.setOnClickPendingIntent(
                R.id.widget_root,
                buildLaunchIntent(context, primary.guideId, primary.stepId),
            )
            val countSuffix = if (otherCount > 0) "  •  +$otherCount" else ""
            views.setTextViewText(
                R.id.widget_step_title,
                if (isSmall) primary.stepTitle + countSuffix else primary.stepTitle,
            )
            views.setViewVisibility(R.id.widget_time, View.VISIBLE)

            if (!isSmall) {
                views.setTextViewText(R.id.widget_guide_title, primary.guideTitle + countSuffix)
                views.setViewVisibility(R.id.widget_guide_title, View.VISIBLE)
                views.setViewVisibility(R.id.widget_idle_subtitle, View.GONE)

                if (primary.totalDurationSeconds > 0) {
                    val remaining = primary.projectedRemainingSeconds
                    val progress = (
                        (primary.totalDurationSeconds - remaining).toFloat() /
                            primary.totalDurationSeconds * 1000
                    ).toInt().coerceIn(0, 1000)
                    views.setProgressBar(R.id.widget_progress, 1000, progress, false)
                    views.setViewVisibility(R.id.widget_progress, View.VISIBLE)
                } else {
                    views.setViewVisibility(R.id.widget_progress, View.GONE)
                }
            }

            when {
                primary.isComplete -> renderComplete(context, views)
                primary.isPaused -> renderPaused(views, primary.projectedRemainingSeconds)
                else -> renderRunning(views, primary.projectedRemainingSeconds)
            }

            return views
        }

        // Shown when the widget is resized tall enough: every tracked timer, scrollable,
        // backed by WidgetTimerListService/WidgetTimerListFactory reading the same storage.
        private fun buildListViews(context: Context): RemoteViews {
            val views = RemoteViews(context.packageName, R.layout.widget_timer_list)
            val timers = loadWidgetTimers(context).filterNot { it.isStale }

            val serviceIntent = Intent(context, WidgetTimerListService::class.java)
            views.setRemoteAdapter(R.id.widget_timer_list, serviceIntent)
            views.setEmptyView(R.id.widget_timer_list, R.id.widget_list_empty)
            views.setTextViewText(
                R.id.widget_list_empty,
                context.getString(R.string.widget_idle_title),
            )

            val templateIntent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            val templatePendingIntent = PendingIntent.getActivity(
                context,
                0,
                templateIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_MUTABLE,
            )
            views.setPendingIntentTemplate(R.id.widget_timer_list, templatePendingIntent)

            val primary = selectPrimary(timers)
            views.setOnClickPendingIntent(
                R.id.widget_list_header,
                buildLaunchIntent(context, primary?.guideId, primary?.stepId),
            )

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
            views.setTextViewText(R.id.widget_time, formatWidgetSeconds(remainingSeconds))
        }

        private fun renderComplete(context: Context, views: RemoteViews) {
            views.setChronometerCountDown(R.id.widget_time, false)
            views.setChronometer(R.id.widget_time, 0L, null, false)
            views.setTextViewText(R.id.widget_time, context.getString(R.string.widget_complete_time))
        }

        // Explicit intent to MainActivity — no need to match its MAIN/LAUNCHER intent-filter.
        // singleTask launch mode means a running instance is reused via onNewIntent() instead
        // of creating a new one, so JS reads the fresh guide/step extras on resume too.
        private fun buildLaunchIntent(context: Context, guideId: String?, stepId: String?): PendingIntent {
            val intent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
                if (guideId != null && stepId != null) {
                    putExtra(EXTRA_GUIDE_ID, guideId)
                    putExtra(EXTRA_STEP_ID, stepId)
                }
            }
            return PendingIntent.getActivity(
                context,
                0,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
            )
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
        appWidgetManager.notifyAppWidgetViewDataChanged(appWidgetIds, R.id.widget_timer_list)
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)

        when (intent.action) {
            ACTION_TIMER_COMPLETE_CHECK -> {
                val stepId = intent.getStringExtra(EXTRA_STEP_ID) ?: return
                val timers = loadWidgetTimers(context)
                val index = timers.indexOfFirst { it.stepId == stepId }
                if (index == -1) return
                val record = timers[index]
                // Only flip to complete if this timer is still the one running — it may
                // have been paused, reset, or restarted (which reschedules this same
                // per-stepId alarm) in the time since it fired.
                if (record.isPaused || record.isComplete) return
                val updated = timers.toMutableList()
                updated[index] = record.copy(
                    isComplete = true,
                    remainingSeconds = 0,
                    updatedAt = System.currentTimeMillis(),
                )
                saveWidgetTimers(context, updated)
                syncTickAlarm(context, updated)
                refreshAllWidgets(context)
            }
            ACTION_WIDGET_TICK -> {
                refreshAllWidgets(context)
                syncTickAlarm(context, loadWidgetTimers(context))
            }
        }
    }
}
