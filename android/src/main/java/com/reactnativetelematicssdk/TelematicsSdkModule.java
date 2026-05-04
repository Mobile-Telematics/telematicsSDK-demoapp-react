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
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import com.telematicssdk.tracking.TrackingApi;
import com.telematicssdk.tracking.Settings;
import com.telematicssdk.tracking.utils.permissions.PermissionsWizardActivity;
import com.telematicssdk.tracking.model.realtime.configuration.AccidentDetectionSensitivity;
import com.telematicssdk.tracking.SpeedViolation;

public class TelematicsSdkModule extends NativeTelematicsSdkSpec
    implements PreferenceManager.OnActivityResultListener {

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

  @Override
  public void addListener(String eventName) {
    hasListeners = true;
  }

  @Override
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

  // MARK: - Lifecycle

  @Override
  public void initialize() {
    if (!api.isInitialized()) {
      api.initialize(this.getReactApplicationContext(), setTelematicsSettings());
      api.addTagsProcessingCallback(tagsProcessor);
      api.setLocationListener(locationListener);
      api.registerCallback(trackingStateListener);
    }
  }

  private Settings setTelematicsSettings() {
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

  @Override
  public void isInitialized(Promise promise) {
    promise.resolve(api.isInitialized());
  }

  // MARK: - Device token

  @Override
  public void getDeviceId(Promise promise) {
    promise.resolve(api.getDeviceId());
  }

  @Override
  public void setDeviceId(String deviceId, Promise promise) {
    api.setDeviceID(deviceId);
    promise.resolve(null);
  }

  @Override
  public void logout(Promise promise) {
    api.logout();
    promise.resolve(null);
  }

  // MARK: - Permissions & tracking

  @Override
  public void isAllRequiredPermissionsAndSensorsGranted(Promise promise) {
    promise.resolve(api.areAllRequiredPermissionsAndSensorsGranted());
  }

  @Override
  public void isSdkEnabled(Promise promise) {
    promise.resolve(api.isSdkEnabled());
  }

  @Override
  public void isTracking(Promise promise) {
    promise.resolve(api.isTracking());
  }

  @Override
  public void setEnableSdk(boolean enable, Promise promise) {
    if (ActivityCompat.checkSelfPermission(
      this.getReactApplicationContext(),
      Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED
    ) {
      promise.reject(
        "INVALID_PERMISSION",
        "Missing permission Manifest.permission.ACCESS_FINE_LOCATION"
      );
      return;
    }
    api.setEnableSdk(enable);
    promise.resolve(null);
  }

  @Override
  public void startManualTracking(Promise promise) {
    api.startTracking();
    promise.resolve(null);
  }

  @Override
  public void startManualPersistentTracking(Promise promise) {
    api.startPersistentTracking();
    promise.resolve(null);
  }

  @Override
  public void stopManualTracking(Promise promise) {
    api.stopTracking();
    promise.resolve(null);
  }

  // MARK: - Upload

  @Override
  public void uploadUnsentTrips(Promise promise) {
    api.uploadUnsentTrips();
    promise.resolve(null);
  }

  @Override
  public void getUnsentTripCount(Promise promise) {
    int count = api.getUnsentTripCount();
    promise.resolve((double) count);
  }

  // MARK: - Heartbeats

  @Override
  public void sendCustomHeartbeats(String reason, Promise promise) {
    api.sendCustomHeartbeats(reason);
    promise.resolve(null);
  }

  // MARK: - Wizard

  @Override
  public void showPermissionWizard(boolean enableAggressivePermissionsWizard,
      boolean enableAggressivePermissionsWizardPage, Promise promise) {
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

  @Override
  public boolean onActivityResult(int requestCode, int resultCode, Intent data) {
    if (requestCode == 50005) {
      switch (resultCode) {
        case -1:
          if (permissionsPromise == null) break;
          permissionsPromise.resolve(true);
          break;
        case 0:
        case 1:
          if (permissionsPromise == null) break;
          permissionsPromise.resolve(false);
          break;
      }
    }
    return false;
  }

  // MARK: - Accidents / RTLD

  @Override
  public void setAccidentDetectionSensitivity(double value, Promise promise) {
    int intValue = (int) value;
    AccidentDetectionSensitivity sensitivity = switch (intValue) {
      case 1 -> AccidentDetectionSensitivity.Sensitive;
      case 2 -> AccidentDetectionSensitivity.Tough;
      default -> AccidentDetectionSensitivity.Normal;
    };

    api.setAccidentDetectionMode(sensitivity);
    promise.resolve(null);
  }

  @Override
  public void isRTLDEnabled(Promise promise) {
    promise.resolve(api.isRtdEnabled());
  }

  @Override
  public void enableAccidents(boolean enable, Promise promise) {
    api.setAccidentDetectionEnabled(enable);
    promise.resolve(null);
  }

  @Override
  public void isEnabledAccidents(Promise promise) {
    promise.resolve(api.isAccidentDetectionEnabled());
  }

  // MARK: - Tags API

  @Override
  public void getFutureTrackTags(Promise promise) {
    if (!api.isInitialized()) {
      promise.reject("Error", "Tracking api is not initialized");
      return;
    }
    tagsProcessor.setOnGetTags(promise);
    api.getFutureTrackTags();
  }

  @Override
  public void addFutureTrackTag(String tag, @Nullable String source, Promise promise) {
    Log.d(TAG, "Adding new track");
    if (!api.isInitialized()) {
      promise.reject("Error", "Tracking api is not initialized");
      return;
    }
    tagsProcessor.setOnAddTag(promise);
    api.addFutureTrackTag(tag, source == null ? "" : source);
  }

  @Override
  public void removeFutureTrackTag(String tag, Promise promise) {
    Log.d(TAG, "Removing track");
    if (!api.isInitialized()) {
      promise.reject("Error", "Tracking api is not initialized");
      return;
    }
    tagsProcessor.setOnTagRemove(promise);
    api.removeFutureTrackTag(tag);
  }

  @Override
  public void removeAllFutureTrackTags(Promise promise) {
    Log.d(TAG, "Removing all tracks");
    if (!api.isInitialized()) {
      promise.reject("Error", "Tracking api is not initialized");
      return;
    }
    tagsProcessor.setOnAllTagsRemove(promise);
    api.removeAllFutureTrackTags();
  }

  // MARK: - Speed violations (flattened params)

  @Override
  public void registerSpeedViolations(double speedLimitKmH, double speedLimitTimeout, Promise promise) {
    int speedLimitTimeoutSeconds = (int) speedLimitTimeout;
    long timeoutMs = (long) speedLimitTimeoutSeconds * 1000L;

    api.registerSpeedViolations(
      (float) speedLimitKmH,
      timeoutMs,
      new SpeedViolationsListenerImpl(this)
    );
    promise.resolve(null);
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

  // MARK: - Android-only

  @Override
  public void setAndroidAutoStartEnabled(boolean enable, boolean permanent, Promise promise) {
    api.setAutoStartEnabled(enable, permanent);
    promise.resolve(null);
  }

  @Override
  public void isAndroidAutoStartEnabled(Promise promise) {
    promise.resolve(api.isAutoStartEnabled());
  }

  // MARK: - iOS-only stubs (required by codegen, no-op on Android)

  @Override
  public void isAggressiveHeartbeat(Promise promise) {
    promise.reject("PLATFORM_ERROR", "isAggressiveHeartbeat is not available on Android");
  }

  @Override
  public void setAggressiveHeartbeats(boolean enable, Promise promise) {
    promise.reject("PLATFORM_ERROR", "setAggressiveHeartbeats is not available on Android");
  }

  @Override
  public void setDisableTracking(boolean value, Promise promise) {
    promise.reject("PLATFORM_ERROR", "setDisableTracking is not available on Android");
  }

  @Override
  public void isDisableTracking(Promise promise) {
    promise.reject("PLATFORM_ERROR", "isDisableTracking is not available on Android");
  }

  @Override
  public void isWrongAccuracyState(Promise promise) {
    promise.reject("PLATFORM_ERROR", "isWrongAccuracyState is not available on Android");
  }

  @Override
  public void requestIOSLocationAlwaysPermission(Promise promise) {
    promise.reject("PLATFORM_ERROR", "requestIOSLocationAlwaysPermission is not available on Android");
  }

  @Override
  public void requestIOSMotionPermission(Promise promise) {
    promise.reject("PLATFORM_ERROR", "requestIOSMotionPermission is not available on Android");
  }

  @Override
  public void getApiLanguage(Promise promise) {
    promise.reject("PLATFORM_ERROR", "getApiLanguage is not available on Android");
  }

  @Override
  public void setApiLanguage(String language, Promise promise) {
    promise.reject("PLATFORM_ERROR", "setApiLanguage is not available on Android");
  }
}
