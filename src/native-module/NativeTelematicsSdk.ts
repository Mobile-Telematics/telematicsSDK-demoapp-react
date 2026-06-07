import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

import type { Double, Int32 } from 'react-native/Libraries/Types/CodegenTypes';

/**
 * Native Telematics SDK TurboModule surface (React Native codegen).
 *
 * This is the low-level native contract. Prefer using the high-level wrapper created by
 * {@link createTelematicsSdk} / {@link TelematicsSdk} for app code, and keep this interface
 * aligned with the native implementations and codegen constraints.
 *
 * Notes:
 * - Some return types are deliberately `Object` or flattened params to avoid generating C++ structs.
 * - Platform-specific methods should be called only on the matching platform.
 */
export interface Spec extends TurboModule {
  // Lifecycle
  /** Initializes the native SDK. */
  initializeSdk(): Promise<void>;
  /** Returns whether the native SDK is initialized. */
  isInitializedSdk(): Promise<boolean>;

  // Device token
  /** Returns the current virtual device identifier (token). */
  getDeviceId(): Promise<string>;
  /** Returns the latest known device identifier registration state. */
  getDeviceIdRegistrationState(): Promise<Object>;
  /** Sets the virtual device identifier (token). */
  setDeviceId(deviceId: string): Promise<void>;
  /** Performs a full logout on the native SDK. */
  logout(): Promise<void>;

  // Permissions & tracking
  /** Checks whether all required permissions and sensors are granted/available. */
  isAllRequiredPermissionsAndSensorsGranted(): Promise<boolean>;
  /** Returns whether the native SDK is currently enabled. */
  isSdkEnabled(): Promise<boolean>;
  /** Returns whether tracking is currently active. */
  isTracking(): Promise<boolean>;
  /** Enables or disables the native SDK globally. */
  setEnableSdk(enable: boolean): Promise<void>;
  /** Starts tracking manually. */
  startManualTracking(): Promise<void>;
  /** Starts persistent tracking manually. */
  startTrackAsPersistent(): Promise<void>;
  /** Stops tracking manually. */
  stopManualTracking(): Promise<void>;
  /** Sets the maximum duration, in minutes, for a single persistent tracking session. */
  setMaxPersistentTrackingInterval(minutes: Int32): Promise<void>;
  /** Returns the maximum duration, in minutes, for a single persistent tracking session. */
  getMaxPersistentTrackingInterval(): Promise<Double>;
  /** Sets whether tracking runs in standard or persistent mode. */
  setTrackingMode(trackingMode: Int32): Promise<void>;
  /** Returns the current tracking mode. */
  getTrackingMode(): Promise<Int32>;
  /** Returns current automatic and manual tracking availability state. */
  getTrackingState(): Promise<Object>;

  // Upload
  /** Triggers upload of locally stored, unsent trips if any. */
  uploadUnsentTrips(): Promise<void>;
  /** Returns the number of unsent trips currently stored locally. */
  getUnsentTripCount(): Promise<Double>;

  // Heartbeats
  /** Sends a custom heartbeat with an application-defined reason. */
  sendCustomHeartbeats(reason: string): Promise<void>;

  // Wizard
  /** Shows the native permissions wizard UI. */
  showPermissionWizard(
    enableAggressivePermissionsWizard: boolean,
    enableAggressivePermissionsWizardPage: boolean
  ): Promise<boolean>;

  // Accidents / RTLD
  /** Sets accident detection sensitivity (enum value). */
  setAccidentDetectionSensitivity(value: Int32): Promise<void>;
  /** Returns whether RTLD (real-time data logging) is enabled. */
  isRTLDEnabled(): Promise<boolean>;
  /** Enables or disables accident detection. */
  enableAccidents(enable: boolean): Promise<void>;
  /** Returns whether accident detection is enabled. */
  isEnabledAccidents(): Promise<boolean>;

  // Tags API — return types are untyped Object to avoid C++ codegen structs
  /** Requests the current list of Future Track tags. */
  getFutureTrackTags(): Promise<Object>;
  /** Adds a Future Track tag. */
  addFutureTrackTag(tag: string, source: string | null): Promise<Object>;
  /** Removes a Future Track tag. */
  removeFutureTrackTag(tag: string, source: string | null): Promise<Object>;
  /** Removes all Future Track tags. */
  removeAllFutureTrackTags(): Promise<string>;

  // Speed violations — flattened params to avoid C++ struct on iOS
  /** Enables speed limit monitoring and configures speed violation parameters. */
  registerSpeedViolations(
    speedLimitKmH: Double,
    speedLimitTimeout: Int32
  ): Promise<void>;

  // iOS-only
  /** iOS only: returns whether aggressive heartbeat mode is enabled. */
  isAggressiveHeartbeats(): Promise<boolean>;
  /** iOS only: enables or disables aggressive heartbeat mode. */
  setAggressiveHeartbeats(enable: boolean): Promise<void>;
  /** iOS only: disables or enables user-initiated tracking. */
  setDisableTracking(value: boolean): Promise<void>;
  /** iOS only: returns whether user-initiated tracking is disabled. */
  isDisableTracking(): Promise<boolean>;
  /** iOS only: returns whether current location accuracy is insufficient. */
  isWrongAccuracyState(): Promise<boolean>;
  /** iOS only: requests "Always" location permission from the system. */
  requestIOSLocationAlwaysPermission(): Promise<void>;
  /** iOS only: requests Motion/Fitness permission from the system. */
  requestIOSMotionPermission(): Promise<void>;
  /** iOS only: returns the API language configured in the native SDK. */
  getApiLanguage(): Promise<string>;
  /** iOS only: sets the API language used by the native SDK. */
  setApiLanguage(language: string): Promise<void>;

  // Android-only — flattened params to avoid C++ struct on iOS
  /** Android only: enables or disables SDK autostart behavior. */
  setAndroidAutoStartEnabled(
    enable: boolean,
    permanent: boolean
  ): Promise<void>;
  /** Android only: returns whether SDK autostart is enabled. */
  isAndroidAutoStartEnabled(): Promise<boolean>;

  // Events (required by NativeEventEmitter)
  /** Registers an event listener on the native side. */
  addListener(eventName: string): void;
  /** Removes event listeners on the native side. */
  removeListeners(count: Double): void;
}

export default TurboModuleRegistry.get<Spec>('TelematicsSdk');
