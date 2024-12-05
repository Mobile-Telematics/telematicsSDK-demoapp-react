package com.reactnativetelematicssdk;

import android.annotation.SuppressLint;
import android.content.Intent;
import android.preference.PreferenceManager;
import android.util.Log;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;

import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import com.raxeltelematics.v2.sdk.TrackingApi;
import com.raxeltelematics.v2.sdk.Settings;
import com.raxeltelematics.v2.sdk.utils.permissions.PermissionsWizardActivity;


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

  // Initialization and permission request
  @ReactMethod
  public void initialize() {
    Log.d(TAG, "init method");
    if (!api.isInitialized()) {
      api.initialize(this.getReactApplicationContext(), setTelematicsSettings());
      Log.d(TAG, "Tracking api is initialized");
      api.addTagsProcessingCallback(tagsProcessor);
      Log.d(TAG, "Tag callback is set");
    }
  }

  //startPersistentTrackingMethod
  @ReactMethod
  public void startPersistentTracking(Promise promise) {
    promise.resolve(api.startPersistentTracking());
  }

  /**
   * Default Setting constructor
   * Stop tracking time is 5 minute.
   * Parking radius is 100 meters.
   * Auto start tracking is true.
   * hfOn - true if HIGH FREQUENCY data recording from sensors (acc, gyro) is ON and false otherwise.
   * isElmOn - true if data recording from ELM327 devices is ON and false otherwise.
   * isAdOn - false to keep accident detection disabled
   */
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
  public void requestPermissions(Promise promise) {
    permissionsPromise = promise;
    if (!api.areAllRequiredPermissionsGranted()) {
      this.getReactApplicationContext().
        startActivityForResult(PermissionsWizardActivity.Companion.getStartWizardIntent(
          this.getReactApplicationContext(),
          false,
          false
        ), PermissionsWizardActivity.WIZARD_PERMISSIONS_CODE, null);
    } else {
      permissionsPromise.resolve(true);
    }
  }

  // API Status
  @ReactMethod
  public void getStatus(Promise promise) {
    promise.resolve(api.isSdkEnabled());
  }

  // Device token
  @ReactMethod
  public void getDeviceToken(Promise promise) {
    promise.resolve(api.getDeviceId());
  }

  // Enabling and disabling SDK
  @SuppressLint("MissingPermission")
  @ReactMethod
  public void enable(String deviceToken, Promise promise) {
    if(deviceToken.isEmpty()) {
      promise.reject("Error", "Missing token value");
      return;
    }
    if (!api.areAllRequiredPermissionsGranted() || !api.isInitialized()) {
      Log.d(TAG, "Failed to start SDK");
      promise.resolve(false);
      return;
    }
    api.setDeviceID(deviceToken);
    api.setEnableSdk(true);
    Log.d(TAG, "SDK Started");
    promise.resolve(true);
  }

  @SuppressLint("MissingPermission")
  @ReactMethod
  public void disable() {
    if(!api.isInitialized()) {
      Log.d(TAG, "Failed to stop SDK");
      return;
    }
    api.setEnableSdk(false);
    api.clearDeviceID();
    Log.d(TAG, "SDK is stopped");
  }

  // Tags API
  @ReactMethod
  public void getFutureTrackTags(Promise promise) {
    Log.d(TAG, "Fetching future tracks");
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

  // Permission wizard result
  @Override
  public boolean onActivityResult(int requestCode, int resultCode, Intent data) {
    if (requestCode == 50005) {
      switch(resultCode) {
        case -1:
          Log.d(TAG, "onActivityResult: WIZARD_RESULT_ALL_GRANTED");
          if(permissionsPromise == null) break;
          permissionsPromise.resolve(true);
          break;
        case 0:
          Log.d(TAG, "onActivityResult: WIZARD_RESULT_CANCELED");
          if(permissionsPromise == null) break;
          permissionsPromise.resolve(false);
          break;
        case 1:
          Log.d(TAG, "onActivityResult: WIZARD_RESULT_NOT_ALL_GRANTED");
          if(permissionsPromise == null) break;
          permissionsPromise.resolve(false);
          break;
      }
    }
    return false;
  }
}
