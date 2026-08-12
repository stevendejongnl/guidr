package com.guidr

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import io.sentry.android.core.SentryAndroid

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          // Packages that cannot be autolinked yet can be added manually here, for example:
          add(ApkInstallerPackage())
          add(NotificationPackage())
          add(WidgetPackage())
        },
    )
  }

  override fun onCreate() {
    super.onCreate()
    initNativeSentry()
    loadReactNative(this)
  }

  // GuidrTimerWidgetProvider's AlarmManager-triggered receiver runs in this same
  // process and can fire before React Native (and its own Sentry.init() call in
  // App.tsx) ever starts -- e.g. a scheduled tick alarm waking the app up from
  // fully killed. Initializing the native SDK here, ahead of loadReactNative(),
  // means failures on that path are still captured. Sentry.init() from JS
  // re-initializes on top of this once RN starts, which is fine -- RNSentry
  // detects the existing native client rather than conflicting with it.
  private fun initNativeSentry() {
    if (BuildConfig.DEBUG || BuildConfig.SENTRY_DSN.isEmpty()) return
    SentryAndroid.init(this) { options ->
      options.dsn = BuildConfig.SENTRY_DSN
      options.environment = "production"
    }
  }
}
