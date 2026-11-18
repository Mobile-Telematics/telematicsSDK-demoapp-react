package com.example.reactnativetelematicssdk;

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactPackage
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.reactnativetelematicssdk.TelematicsSdkInitializer

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          // Packages that cannot be autolinked yet can be added manually here.
        },
    )
  }

  override fun onCreate() {
    super.onCreate()
    // Must run on every process start: the SDK's tracking service can be
    // started by the system without any UI or JS (see the README).
    TelematicsSdkInitializer.initialize(this)
    loadReactNative(this)
  }
}
