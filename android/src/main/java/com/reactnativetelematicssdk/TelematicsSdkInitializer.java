package com.reactnativetelematicssdk;

import android.content.Context;
import android.util.Log;

import androidx.annotation.NonNull;

import com.telematicssdk.tracking.Settings;
import com.telematicssdk.tracking.TrackingApi;

/**
 * Initializes the native Telematics SDK outside of React Native.
 *
 * Call {@link #initialize(Context)} from {@code Application.onCreate()}. The SDK's
 * tracking service can be started by the system without any UI or JS running
 * (sticky restart after the process was killed, boot, background trip
 * detection). If the SDK is initialized only from JS ({@code initializeSdk()}),
 * that service runs against an uninitialized SDK. Initializing in
 * {@code Application.onCreate()} runs on every process start, before any service.
 *
 * The Expo config plugin adds this call to MainApplication automatically.
 * {@code initializeSdk()} from JS stays valid and is a no-op once this ran.
 */
public final class TelematicsSdkInitializer {
  private static final String TAG = "TelematicsSdkInit";

  private TelematicsSdkInitializer() {}

  /** Initializes the SDK if it is not initialized yet. Safe to call more than once. */
  public static synchronized void initialize(@NonNull Context context) {
    TrackingApi api = TrackingApi.getInstance();
    if (api.isInitialized()) {
      return;
    }
    api.initialize(context.getApplicationContext(), defaultSettings());
    Log.d(TAG, "TrackingApi initialized");
  }

  static Settings defaultSettings() {
    return new Settings()
      .stopTrackingTimeout(Settings.getStopTrackingTimeHigh())
      .accuracy(Settings.getAccuracyHigh())
      .autoStartOn(true)
      .passiveDetectionOn(true);
  }
}
