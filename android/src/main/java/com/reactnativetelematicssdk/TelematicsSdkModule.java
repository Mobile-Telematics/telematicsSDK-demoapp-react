package com.reactnativetelematicssdk;

import android.annotation.SuppressLint;
import android.content.Intent;
import android.preference.PreferenceManager;
import android.util.Log;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReactApplicationContext;

import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import com.telematicssdk.tracking.TrackingApi;
import com.telematicssdk.tracking.Settings;
import com.telematicssdk.tracking.utils.permissions.PermissionsWizardActivity;
import com.telematicssdk.tracking.server.model.sdk.TrackTag;
import com.telematicssdk.tracking.model.realtime.configuration.AccidentDetectionSensitivity;


public class TelematicsSdkModule extends ReactContextBaseJavaModule implements PreferenceManager.OnActivityResultListener {
  public static final String NAME = "TelematicsSdk";
  private static final String TAG = "TelematicsSdkModule";

  private Promise permissionsPromise = null;

  private final TrackingApi api = TrackingApi.getInstance();
  private final TagsProcessor tagsProcessor = new TagsProcessor();

  public TelematicsSdkModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  @NonNull
  public String getName() {
    return NAME;
  }

  @ReactMethod
  public void initialize() {
    if (!api.isInitialized()) {
      api.initialize(this.getReactApplicationContext(), setTelematicsSettings());
      api.addTagsProcessingCallback(tagsProcessor);
    }
  }

  public Settings setTelematicsSettings() {
    Settings settings = new Settings(
      Settings.getStopTrackingTimeHigh(),
      Settings.getAccuracyHigh(),
      true,
      true,
      false
    );
    Log.d(TAG, "setTelematicsSettings");
    return settings;
  }

  @ReactMethod
  public void isInitialized(Promise promise) {
    promise.resolve(api.isInitialized());
  }

  @ReactMethod
  public void getDeviceId(Promise promise) {
    promise.resolve(api.getDeviceId());
  }

  @ReactMethod
  public void setDeviceId(String deviceId, Promise promise) {
    api.setDeviceID(deviceId);
    promise.resolve(null);
  }

  @ReactMethod
  public void logout(Promise promise) {
    api.logout();
    promise.resolve(null);
  }

  @ReactMethod
  public void isAllRequiredPermissionsAndSensorsGranted(Promise promise) {
    promise.resolve(api.areAllRequiredPermissionsAndSensorsGranted());
  }

  @ReactMethod
  public void isSdkEnabled(Promise promise) {
    promise.resolve(api.isSdkEnabled());
  }

  @ReactMethod
  public void isTracking(Promise promise) {
    promise.resolve(api.isTracking());
  }

  @ReactMethod
  public void setEnableSdk(boolean enable, Promise promise) {
    api.setEnableSdk(enable);
    promise.resolve(null);
  }

  @ReactMethod
  public void startManualTracking(Promise promise) {
    api.startTracking();
    promise.resolve(null);
  }

  @ReactMethod
  public void startManualPersistentTracking(Promise promise) {
    api.startPersistentTracking();
    promise.resolve(null);
  }

  @ReactMethod
  public void stopManualTracking(Promise promise) {
    api.stopTracking();
    promise.resolve(null);
  }

  @ReactMethod
  public void uploadUnsentTrips(Promise promise) {
    api.uploadUnsentTrips();
    promise.resolve(null);
  }

  @ReactMethod
  public void getUnsentTripCount(Promise promise) {
    int count = api.getUnsentTripCount();
    promise.resolve(count);
  }

  @ReactMethod
  public void sendCustomHeartbeats(String reason, Promise promise) {
    api.sendCustomHeartbeats(reason)
    promise.resolve(null);
  }

  @ReactMethod
  public void showPermissionWizard(boolean enableAggressivePermissionsWizard, boolean enableAggressivePermissionsWizardPage, Promise promise) {
    if (!api.areAllRequiredPermissionsGranted()) {
      permissionsPromise = promise;
      this.getReactApplicationContext().
        startActivityForResult(PermissionsWizardActivity.Companion.getStartWizardIntent(
          this.getReactApplicationContext(),
          enableAggressivePermissionsWizard,
          enableAggressivePermissionsWizardPage
        ), PermissionsWizardActivity.WIZARD_PERMISSIONS_CODE, null);
    } else {
      promise.resolve(true);
    }
  }

  // Permission wizard result
  @Override
  public boolean onActivityResult(int requestCode, int resultCode, Intent data) {
    if (requestCode == 50005) {
      switch(resultCode) {
        case -1:
          if(permissionsPromise == null) break;
          permissionsPromise.resolve(true);
          break;
        case 0:
          if(permissionsPromise == null) break;
          permissionsPromise.resolve(false);
          break;
        case 1:
          if(permissionsPromise == null) break;
          permissionsPromise.resolve(false);
          break;
      }
    }
    return false;
  }

  @ReactMethod
  public void setAccidentDetectionSensitivity(ReadableMap params, Promise promise) {
    if (!params.hasKey("accidentDetectionSensitivity")) {
      promise.reject(
        "INVALID_PARAMS",
        "Missing accidentDetectionSensitivity"
      );
      return;
    }

    int value = params.getInt("accidentDetectionSensitivity");
    AccidentDetectionSensitivity sensitivity;

    switch (value) {
      case 1:
        sensitivity = AccidentDetectionSensitivity.Sensitive;
        break;
      case 2:
        sensitivity = AccidentDetectionSensitivity.Tough;
        break;
      case 0:
      default:
        sensitivity = AccidentDetectionSensitivity.Normal;
        break;
    }

    api.setAccidentDetectionMode(sensitivity);
    promise.resolve(null);
  }

  @ReactMethod
  public void isRTLDEnabled(Promise promise) {
    promise.resolve(api.isRtdEnabled());
  }

  @ReactMethod
  public void enableAccidents(boolean enable, Promise promise) {
    api.setAccidentDetectionEnabled(enable);
    promise.resolve(null);
  }

  @ReactMethod
  public void isEnabledAccidents(Promise promise) {
    promise.resolve(api.isAccidentDetectionEnabled());
  }

  @ReactMethod
  public void setAndroidAutoStartEnabled(ReadableMap params, Promise promise) {
    if (!params.hasKey("enable") || !params.hasKey("permanent")) {
      promise.reject("INVALID_PARAMS", "Missing 'enable' or 'permanent'");
      return;
    }

    boolean enable = params.getBoolean("enable");
    boolean permanent = params.getBoolean("permanent");

    api.setAutoStartEnabled(enable, permanent);
    promise.resolve(null);
  }

  @ReactMethod
  public void isAndroidAutoStartEnabled(Promise promise) {
    promise.resolve(api.isAutoStartEnabled());
  }

  // Tags API
  @ReactMethod
  public void getFutureTrackTags(Promise promise) {
    if(!api.isInitialized()) {
      promise.reject("Error", "Tracking api is not initialized");
      return;
    }
    tagsProcessor.setOnGetTags(promise);
    api.getFutureTrackTags();
  }

  @ReactMethod
  public void addFutureTrackTag(String tag, String source, Promise promise) {
    Log.d(TAG, "Adding new track");
    if(!api.isInitialized()) {
      promise.reject("Error", "Tracking api is not initialized");
      return;
    }
    tagsProcessor.setOnAddTag(promise);
    api.addFutureTrackTag(tag, source);
  }

  @ReactMethod
  public void removeFutureTrackTag(String tag, Promise promise) {
    Log.d(TAG, "Removing track");
    if(!api.isInitialized()) {
      promise.reject("Error", "Tracking api is not initialized");
      return;
    }
    tagsProcessor.setOnTagRemove(promise);
    api.removeFutureTrackTag(tag);
  }

  @ReactMethod
  public void removeAllFutureTrackTags(Promise promise) {
    Log.d(TAG, "Removing all tracks");
    if(!api.isInitialized()) {
      promise.reject("Error", "Tracking api is not initialized");
      return;
    }
    tagsProcessor.setOnAllTagsRemove(promise);
    api.removeAllFutureTrackTags();
  }
}
