package com.reactnativetelematicssdk;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.preference.PreferenceManager;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.app.ActivityCompat;

import android.location.Location;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReactApplicationContext;

import com.facebook.react.bridge.ReactContextBaseJavaModule;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import com.telematicssdk.tracking.TrackingApi;
import com.telematicssdk.tracking.Settings;
import com.telematicssdk.tracking.utils.permissions.PermissionsWizardActivity;
import com.telematicssdk.tracking.model.realtime.configuration.AccidentDetectionSensitivity;
import com.telematicssdk.tracking.SpeedViolation;

public class TelematicsSdkModule extends ReactContextBaseJavaModule implements PreferenceManager.OnActivityResultListener {
  public static final String NAME = "TelematicsSdk";
  private static final String TAG = "TelematicsSdkModule";

  private Promise permissionsPromise = null;
  private final ReactApplicationContext reactContext;
  private boolean hasListeners = false;

  private final TrackingApi api = TrackingApi.getInstance();
  private final TagsProcessor tagsProcessor = new TagsProcessor();
  private final LocationListenerImpl locationListener;

  private final TrackingStateListenerImpl trackingStateListener;

  public TelematicsSdkModule(ReactApplicationContext reactContext) {
    super(reactContext);
    this.reactContext = reactContext;
    this.locationListener = new LocationListenerImpl(this);
    this.trackingStateListener = new TrackingStateListenerImpl(this);
  }

  @Override
  @NonNull
  public String getName() {
    return NAME;
  }

  @ReactMethod
  public void addListener(String eventName) {
    hasListeners = true;
  }

  @ReactMethod
  public void removeListeners(double count) {
    hasListeners = false;
  }

  boolean hasListeners() {
    return hasListeners;
  }

  @Override
  public void invalidate() {
    super.invalidate();
    try {
      api.setLocationListener(null);
      api.unregisterCallback(trackingStateListener);
    } catch (Exception ignored) {
    }
  }

  void emitLocationChanged(@Nullable Location location) {
    if (!hasListeners || location == null) return;

    WritableMap payload = Arguments.createMap();
    payload.putDouble("latitude", location.getLatitude());
    payload.putDouble("longitude", location.getLongitude());

    reactContext.runOnUiQueueThread(() ->
      reactContext
        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
        .emit("onLocationChanged", payload)
    );
  }

  void emitTrackingStateChanged(boolean state) {
    if (!hasListeners) return;

    reactContext.runOnUiQueueThread(() ->
      reactContext
        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
        .emit("onTrackingStateChanged", state)
    );
  }

  @ReactMethod
  public void initialize() {
    if (!api.isInitialized()) {
      api.initialize(this.getReactApplicationContext(), setTelematicsSettings());
      api.addTagsProcessingCallback(tagsProcessor);
      api.setLocationListener(locationListener);
      api.registerCallback(trackingStateListener);
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
    if (ActivityCompat.checkSelfPermission(
      this.getReactApplicationContext(),
      Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED
    ) {
      promise.reject(
        "INVALID_PERMISSION",
        "Missing premission Manifest.permission.ACCESS_FINE_LOCATION"
      );
      return;
    }
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
    api.sendCustomHeartbeats(reason);
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
  public void setAccidentDetectionSensitivity(int value, Promise promise) {
    AccidentDetectionSensitivity sensitivity = switch (value) {
      case 1 -> AccidentDetectionSensitivity.Sensitive;
      case 2 -> AccidentDetectionSensitivity.Tough;
      default -> AccidentDetectionSensitivity.Normal;
    };

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

  @ReactMethod
  public void registerSpeedViolations(ReadableMap params, Promise promise) {
    if (!params.hasKey("speedLimitKmH") || !params.hasKey("speedLimitTimeout")) {
      promise.reject("INVALID_PARAMS", "Missing speedLimitKmH/speedLimitTimeout");
      return;
    }

    double speedLimitKmH = params.getDouble("speedLimitKmH");
    int speedLimitTimeoutSeconds = params.getInt("speedLimitTimeout");
    long timeoutMs = (long) speedLimitTimeoutSeconds * 1000L;

    api.registerSpeedViolations(
      (float)speedLimitKmH,
      timeoutMs,
      new SpeedViolationsListenerImpl(this)
    );
  }

  void emitSpeedViolation(SpeedViolation speedViolation) {
    WritableMap payload = Arguments.createMap();
    payload.putDouble("date", speedViolation.getDate());
    payload.putDouble("latitude", speedViolation.getLatitude());
    payload.putDouble("longitude", speedViolation.getLong());
    payload.putDouble("speed", speedViolation.getYourSpeed());
    payload.putDouble("speedLimit", speedViolation.getSpeedLimit());

    reactContext.runOnUiQueueThread(() ->
      reactContext
        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
        .emit("onSpeedViolation", payload)
    );
  }

}
