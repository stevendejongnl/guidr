package com.guidr

import android.content.Intent
import android.widget.RemoteViewsService

class WidgetTimerListService : RemoteViewsService() {
    override fun onGetViewFactory(intent: Intent): RemoteViewsFactory {
        return WidgetTimerListFactory(applicationContext)
    }
}
