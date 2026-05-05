import type { AccidentDetectionSensitivity, ApiLanguage, Tag } from './types';
import { getNativeTelematicsSdk } from './createTelematicsSdk';

/**
 * High-level React Native API for interacting with the native Telematics SDK.
 *
 * This module is a thin wrapper around the platform-native SDK exposed through React Native.
 * Most methods forward directly to the underlying native implementation.
 *
 * Typical usage:
 * 1. Create an instance via {@link createTelematicsSdk}.
 * 2. Initialize on the native side via {@link TelematicsSdk.initializeSdk}.
 * 3. Configure the virtual device id/token via {@link TelematicsSdk.setDeviceId}.
 * 4. Start tracking via {@link TelematicsSdk.startManualTracking} or {@link TelematicsSdk.startManualPersistentTracking}.
 */
export interface TelematicsSdk {
  // Lifecycle

  /**
   * Initializes the native SDK.
   *
   * This is typically the first call you make before using any other API.
   */
  initializeSdk(): Promise<void>;

  /** Returns whether the native SDK is initialized. */
  isInitializedSdk(): Promise<boolean>;

  // Device token

  /** Returns the current virtual device identifier (token) configured in the native SDK. */
  getDeviceId(): Promise<string>;

  /**
   * Sets the virtual device identifier (token) used by the native SDK.
   *
   * Passing a non-empty value typically associates the SDK session with a backend user/device.
   */
  setDeviceId(deviceId: string): Promise<void>;

  /**
   * Performs a full logout on the native SDK.
   *
   * Typically disables the SDK and clears the stored device token.
   */
  logout(): Promise<void>;

  // Permissions & tracking

  /**
   * Checks whether all required permissions and sensors are granted/available.
   *
   * This usually includes Location + Motion (and other platform-specific requirements).
   */
  isAllRequiredPermissionsAndSensorsGranted(): Promise<boolean>;

  /** Returns whether the native SDK is currently enabled. */
  isSdkEnabled(): Promise<boolean>;

  /** Returns whether tracking is currently active on the native side. */
  isTracking(): Promise<boolean>;

  /**
   * Enables or disables the native SDK globally.
   *
   * Disabling the SDK typically stops tracking and background activity.
   */
  setEnableSdk(enable: boolean): Promise<void>;

  /** Starts tracking manually. */
  startManualTracking(): Promise<void>;

  /** Starts persistent tracking manually (continues across background/app restarts). */
  startManualPersistentTracking(): Promise<void>;

  /** Stops tracking manually. */
  stopManualTracking(): Promise<void>;

  // Upload

  /** Triggers upload of locally stored, unsent trips if any. */
  uploadUnsentTrips(): Promise<void>;

  /** Returns the number of unsent trips currently stored locally by the native SDK. */
  getUnsentTripCount(): Promise<number>;

  // Heartbeats

  /**
   * Sends a custom heartbeat to the native SDK with an application-defined reason.
   *
   * @param reason A string used for analytics on the backend.
   */
  sendCustomHeartbeats(reason: string): Promise<void>;

  // Wizard

  /**
   * Shows the native permissions wizard UI.
   *
   * @param enableAggressivePermissionsWizard If `true`, the wizard finishes only when all required permissions are granted.
   * @param enableAggressivePermissionsWizardPage If `true`, the wizard auto-advances when permissions are granted on the current page.
   * @returns `true` when all required permissions are granted after the wizard, otherwise `false`.
   */
  showPermissionWizard(
    enableAggressivePermissionsWizard: boolean,
    enableAggressivePermissionsWizardPage: boolean
  ): Promise<boolean>;

  // Accidents / RTLD

  /** Sets accident detection sensitivity in the native SDK. */
  setAccidentDetectionSensitivity(
    accidentDetectionSensitivity: AccidentDetectionSensitivity
  ): Promise<void>;

  /** Returns whether RTLD (real-time data logging) is enabled in the native SDK. */
  isRTLDEnabled(): Promise<boolean>;

  /** Enables or disables accident detection in the native SDK. */
  enableAccidents(enable: boolean): Promise<void>;

  /** Returns whether accident detection is enabled in the native SDK. */
  isEnabledAccidents(): Promise<boolean>;

  // Tags

  /** Requests the current list of Future Track tags from the native SDK. */
  getFutureTrackTags(): Promise<{ status: string; tags: Tag[] }>;

  /**
   * Adds a Future Track tag.
   *
   * @param tag Tag identifier.
   * @param source Optional source string (e.g. feature/module name).
   */
  addFutureTrackTag(
    tag: string,
    source?: string
  ): Promise<{ status: string; tag: Tag }>;

  /**
   * Removes a Future Track tag.
   *
   * @param tag Tag identifier.
   */
  removeFutureTrackTag(tag: string): Promise<{ status: string; tag: Tag }>;

  /** Removes all Future Track tags. */
  removeAllFutureTrackTags(): Promise<string>;

  // Speed violations

  /**
   * Enables speed limit monitoring and configures speed violation parameters.
   */
  registerSpeedViolations(params: {
    speedLimitKmH: number;
    speedLimitTimeout: number;
  }): Promise<void>;

  // iOS only

  /** iOS only: returns whether aggressive heartbeat mode is enabled. */
  isAggressiveHeartbeat(): Promise<boolean>;

  /** iOS only: enables or disables aggressive heartbeat mode. */
  setAggressiveHeartbeats(enable: boolean): Promise<void>;

  /** iOS only: disables or enables user-initiated tracking. */
  setDisableTracking(value: boolean): Promise<void>;

  /** iOS only: returns whether user-initiated tracking is disabled. */
  isDisableTracking(): Promise<boolean>;

  /** iOS only: returns whether the native SDK considers current location accuracy insufficient. */
  isWrongAccuracyState(): Promise<boolean>;

  /** iOS only: requests "Always" location permission from the system. */
  requestIOSLocationAlwaysPermission(): Promise<void>;

  /** iOS only: requests Motion/Fitness permission from the system. */
  requestIOSMotionPermission(): Promise<void>;

  /** iOS only: returns the API language configured in the native SDK. */
  getApiLanguage(): Promise<ApiLanguage>;

  /** iOS only: sets the API language used by the native SDK. */
  setApiLanguage(language: ApiLanguage): Promise<void>;

  // Android only

  /**
   * Android only: enables or disables SDK autostart behavior.
   *
   * @param params.enable Whether autostart is enabled.
   * @param params.permanent Whether the choice should be persisted permanently.
   */
  setAndroidAutoStartEnabled(params: {
    enable: boolean;
    permanent: boolean;
  }): Promise<void>;

  /** Android only: returns whether SDK autostart is enabled. */
  isAndroidAutoStartEnabled(): Promise<boolean>;
}

/** Creates a high-level JS wrapper around the native Telematics SDK module. */
export function createTelematicsSdk(): TelematicsSdk {
  return new TelematicsSdkImpl();
}

class TelematicsSdkImpl implements TelematicsSdk {
  private get native() {
    return getNativeTelematicsSdk();
  }

  initializeSdk() {
    return this.native.initializeSdk();
  }
  isInitializedSdk() {
    return this.native.isInitializedSdk();
  }

  getDeviceId() {
    return this.native.getDeviceId();
  }
  setDeviceId(deviceId: string) {
    return this.native.setDeviceId(deviceId);
  }
  logout() {
    return this.native.logout();
  }

  isAllRequiredPermissionsAndSensorsGranted() {
    return this.native.isAllRequiredPermissionsAndSensorsGranted();
  }
  isSdkEnabled() {
    return this.native.isSdkEnabled();
  }
  isTracking() {
    return this.native.isTracking();
  }
  setEnableSdk(enable: boolean) {
    return this.native.setEnableSdk(enable);
  }
  startManualTracking() {
    return this.native.startManualTracking();
  }
  startManualPersistentTracking() {
    return this.native.startManualPersistentTracking();
  }
  stopManualTracking() {
    return this.native.stopManualTracking();
  }

  uploadUnsentTrips() {
    return this.native.uploadUnsentTrips();
  }
  getUnsentTripCount() {
    return this.native.getUnsentTripCount();
  }

  sendCustomHeartbeats(reason: string) {
    return this.native.sendCustomHeartbeats(reason);
  }

  showPermissionWizard(
    enableAggressivePermissionsWizard: boolean,
    enableAggressivePermissionsWizardPage: boolean
  ) {
    return this.native.showPermissionWizard(
      enableAggressivePermissionsWizard,
      enableAggressivePermissionsWizardPage
    );
  }

  setAccidentDetectionSensitivity(
    accidentDetectionSensitivity: AccidentDetectionSensitivity
  ) {
    return this.native.setAccidentDetectionSensitivity(
      accidentDetectionSensitivity
    );
  }
  isRTLDEnabled() {
    return this.native.isRTLDEnabled();
  }
  enableAccidents(enable: boolean) {
    return this.native.enableAccidents(enable);
  }
  isEnabledAccidents() {
    return this.native.isEnabledAccidents();
  }

  getFutureTrackTags() {
    return this.native.getFutureTrackTags() as Promise<{
      status: string;
      tags: Tag[];
    }>;
  }
  addFutureTrackTag(tag: string, source?: string) {
    return this.native.addFutureTrackTag(tag, source ?? null) as Promise<{
      status: string;
      tag: Tag;
    }>;
  }
  removeFutureTrackTag(tag: string) {
    return this.native.removeFutureTrackTag(tag) as Promise<{
      status: string;
      tag: Tag;
    }>;
  }
  removeAllFutureTrackTags() {
    return this.native.removeAllFutureTrackTags();
  }

  registerSpeedViolations(params: {
    speedLimitKmH: number;
    speedLimitTimeout: number;
  }) {
    return this.native.registerSpeedViolations(
      params.speedLimitKmH,
      params.speedLimitTimeout
    );
  }

  isAggressiveHeartbeat() {
    return this.native.isAggressiveHeartbeat();
  }
  setAggressiveHeartbeats(enable: boolean) {
    return this.native.setAggressiveHeartbeats(enable);
  }
  setDisableTracking(value: boolean) {
    return this.native.setDisableTracking(value);
  }
  isDisableTracking() {
    return this.native.isDisableTracking();
  }
  isWrongAccuracyState() {
    return this.native.isWrongAccuracyState();
  }
  requestIOSLocationAlwaysPermission() {
    return this.native.requestIOSLocationAlwaysPermission();
  }
  requestIOSMotionPermission() {
    return this.native.requestIOSMotionPermission();
  }
  getApiLanguage() {
    return this.native.getApiLanguage() as Promise<ApiLanguage>;
  }
  setApiLanguage(language: ApiLanguage) {
    return this.native.setApiLanguage(language);
  }

  setAndroidAutoStartEnabled(params: { enable: boolean; permanent: boolean }) {
    return this.native.setAndroidAutoStartEnabled(
      params.enable,
      params.permanent
    );
  }
  isAndroidAutoStartEnabled() {
    return this.native.isAndroidAutoStartEnabled();
  }
}
