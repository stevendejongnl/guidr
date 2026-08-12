package com.guidr

import android.content.Context
import android.content.Intent
import android.os.SystemClock
import android.widget.RemoteViews
import android.widget.RemoteViewsService

// Backs the ListView shown when the widget is resized tall enough (widget_timer_list.xml).
// Reads the same SharedPreferences-backed timer set as GuidrTimerWidgetProvider; the system
// calls onDataSetChanged() after notifyAppWidgetViewDataChanged() to pick up fresh data.
class WidgetTimerListFactory(private val context: Context) : RemoteViewsService.RemoteViewsFactory {

    private var timers: List<WidgetTimerRecord> = emptyList()

    override fun onCreate() {}

    override fun onDataSetChanged() {
        timers = loadWidgetTimers(context)
            .filterNot { it.isStale }
            .sortedWith(
                compareBy(
                    { it.isComplete },
                    { it.isPaused },
                    { it.projectedRemainingSeconds },
                )
            )
    }

    override fun onDestroy() {
        timers = emptyList()
    }

    override fun getCount(): Int = timers.size

    override fun getViewAt(position: Int): RemoteViews {
        val record = timers[position]
        val views = RemoteViews(context.packageName, R.layout.widget_timer_list_item)
        views.setTextViewText(R.id.widget_item_step_title, record.stepTitle)

        val remaining = record.projectedRemainingSeconds
        when {
            record.isComplete -> {
                views.setChronometerCountDown(R.id.widget_item_time, false)
                views.setChronometer(R.id.widget_item_time, 0L, null, false)
                views.setTextViewText(R.id.widget_item_time, context.getString(R.string.widget_complete_time))
            }
            record.isPaused -> {
                views.setChronometerCountDown(R.id.widget_item_time, false)
                views.setChronometer(R.id.widget_item_time, 0L, null, false)
                views.setTextViewText(R.id.widget_item_time, formatWidgetSeconds(remaining))
            }
            else -> {
                val base = SystemClock.elapsedRealtime() + (remaining.coerceAtLeast(0) * 1000L)
                views.setChronometerCountDown(R.id.widget_item_time, true)
                views.setChronometer(R.id.widget_item_time, base, null, true)
            }
        }

        if (record.totalDurationSeconds > 0) {
            val progress = (
                (record.totalDurationSeconds - remaining).toFloat() /
                    record.totalDurationSeconds * 1000
            ).toInt().coerceIn(0, 1000)
            views.setProgressBar(R.id.widget_item_progress, 1000, progress, false)
        } else {
            views.setProgressBar(R.id.widget_item_progress, 1000, 0, false)
        }

        val fillInIntent = Intent().apply {
            putExtra(GuidrTimerWidgetProvider.EXTRA_GUIDE_ID, record.guideId)
            putExtra(GuidrTimerWidgetProvider.EXTRA_STEP_ID, record.stepId)
        }
        views.setOnClickFillInIntent(R.id.widget_list_item_root, fillInIntent)

        return views
    }

    override fun getLoadingView(): RemoteViews? = null

    override fun getViewTypeCount(): Int = 1

    override fun getItemId(position: Int): Long = timers[position].stepId.hashCode().toLong()

    override fun hasStableIds(): Boolean = true
}
