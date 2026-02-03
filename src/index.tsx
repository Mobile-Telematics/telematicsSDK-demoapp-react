/**
 * High-level React Native API for interacting with the native Telematics SDK.
 *
 * This package is a thin wrapper around the platform-native SDKs exposed through React Native.
 * It provides:
 * - **Commands** (async methods) to control SDK lifecycle, tracking, and configuration.
 * - **Event listeners** to receive asynchronous events emitted by the native SDK.
 *
 * Most methods forward directly to the underlying native implementation.
 * Platform-specific APIs should be called only on the matching platform:
 * - iOS-only methods/listeners throw an `Error` when called on a non-iOS platform.
 * - Android-only methods/listeners throw an `Error` when called on a non-Android platform.
 *
 * Typical usage:
 * 1. Initialize the SDK on the native side using {@link TelematicsSdk.initialize}.
 * 2. Configure the virtual device id/token using {@link TelematicsSdk.setDeviceId}.
 * 3. Start tracking with {@link TelematicsSdk.startManualTracking} or {@link TelematicsSdk.startManualPersistentTracking}.
 * 4. Subscribe to events such as {@link addOnTrackingStateChangedListener} and {@link addOnLocationChangedListener}.
 */
import {
  type EventSubscription,
  type NativeModule,
  NativeEventEmitter,
  NativeModules,
  Platform
} from 'react-native';

/**
 * Accident detection sensitivity levels.
 *
 * Higher sensitivity may detect more events but can increase false positives.
 *
 * - `Normal` (0): balanced.
 * - `Sensitive` (1): more sensitive.
 * - `Tough` (2): less sensitive / more strict.
 */
export enum AccidentDetectionSensitivity {
  Normal = 0,
  Sensitive = 1,
  Tough = 2,
}

/**
 * API language used by the native SDK (iOS only).
 *
 * Values match the native representation (e.g. "English").
 */
export enum ApiLanguage {
  none = 'None',
  english = 'English',
  russian = 'Russian',
  portuguese = 'Portuguese',
  spanish = 'Spanish',
}

interface Tag {
  tag: string;
  source?: string;
}

/** Payload for the `onLowPowerMode` event (iOS only). */
export type LowPowerModeEvent = {
  enabled: boolean;
};

/** Payload for the `onLocationChanged` event (cross-platform). */
export type LocationChangedEvent = {
  latitude: number;
  longitude: number;
};

/** Payload for the `onSpeedViolation` event (cross-platform). */
export type SpeedViolationEvent = {
  date: number;
  latitude: number;
  longitude: number;
  speed: number;
  speedLimit: number;
};

/** Payload for the `onTrackingStateChanged` event (cross-platform). */
export type TrackingStateChangedEvent = boolean;

interface TelematicsSdkType {
    /**
   * Initializes the native SDK.
   *
   * This is typically the first call you make before using any other API.
   */
  initialize: () => void;

  /**
   * Returns whether the native SDK is initialized.
   */
  isInitialized: () => Promise<boolean>;

  /**
   * Returns the current virtual device identifier (token) configured in the native SDK.
   */
  getDeviceId: () => Promise<string>;

  /**
   * Sets the virtual device identifier (token) used by the native SDK.
   *
   * Passing a non-empty value typically associates the SDK session with a backend user/device.
   */
  setDeviceId: (deviceId: string) => Promise<void>;

  /**
   * Performs a full logout on the native SDK.
   *
   * Typically disables the SDK and clears the stored device token.
   */
  logout: () => Promise<void>;

  /**
   * Checks whether all required permissions and sensors are granted/available.
   *
   * This usually includes Location + Motion (and other platform-specific requirements).
   */
  isAllRequiredPermissionsAndSensorsGranted: () => Promise<boolean>;

  /** Returns whether the native SDK is currently enabled. */
  isSdkEnabled: () => Promise<boolean>;

  /** Returns whether tracking is currently active on the native side. */
  isTracking: () => Promise<boolean>;

  /**
   * Enables or disables the native SDK globally.
   *
   * Disabling the SDK typically stops tracking and background activity.
   */
  setEnableSdk: (enable: boolean) => Promise<void>;

  /** Starts tracking manually. */
  startManualTracking: () => Promise<void>;

  /** Starts persistent tracking manually (continues across background/app restarts). */
  startManualPersistentTracking: () => Promise<void>;

  /** Stops tracking manually. */
  stopManualTracking: () => Promise<void>;

  /** Triggers upload of locally stored, unsent trips if any. */
  uploadUnsentTrips: () => Promise<void>;

  /** Returns the number of unsent trips currently stored locally by the native SDK. */
  getUnsentTripCount: () => Promise<number>;

  /**
   * Sends a custom heartbeat to the native SDK with an application-defined reason.
   *
   * @param reason A string used for analytics on the backend.
   */
  sendCustomHeartbeats: (reason: string) => Promise<void>;

  /**
   * Shows the native permissions wizard UI.
   *
   * @param enableAggressivePermissionsWizard If `true`, the wizard finishes only when all required permissions are granted.
   * @param enableAggressivePermissionsWizardPage If `true`, the wizard auto-advances when permissions are granted on the current page.
   * @returns `true` when all required permissions are granted after the wizard, otherwise `false`.
   */
  showPermissionWizard: (
    enableAggressivePermissionsWizard: boolean,
    enableAggressivePermissionsWizardPage: boolean
  ) => Promise<boolean>;

  /** Sets accident detection sensitivity in the native SDK. */
  setAccidentDetectionSensitivity: (
    accidentDetectionSensitivity: AccidentDetectionSensitivity
  ) => Promise<void>;

  /** Returns whether RTLD (real-time data logging) is enabled in the native SDK. */
  isRTLDEnabled: () => Promise<boolean>;

  /** Enables or disables accident detection in the native SDK. */
  enableAccidents: (enable: boolean) => Promise<void>;

  /** Returns whether accident detection is enabled in the native SDK. */
  isEnabledAccidents: () => Promise<boolean>;

  /**
   * Requests the current list of Future Track tags from the native SDK.
   */
  getFutureTrackTags: () => Promise<{ status: string; tags: Tag[] }>;

  /**
   * Adds a Future Track tag.
   *
   * @param tag Tag identifier.
   * @param source Optional source string (e.g. feature/module name).
   */
  addFutureTrackTag: (tag: string, source?: string) => Promise<{ status: string; tag: Tag }>;

  /**
   * Removes a Future Track tag.
   *
   * @param tag Tag identifier.
   */
  removeFutureTrackTag: (tag: string) => Promise<{ status: string; tag: Tag }>;

  /** Removes all Future Track tags. */
  removeAllFutureTrackTags: () => Promise<string>;
    /**
   * Enables speed limit monitoring and configures speed violation parameters.
   *
   * Speed violation events are delivered via {@link addOnSpeedViolationListener}.
   */
  registerSpeedViolations: (params: {
    speedLimitKmH: number;
    speedLimitTimeout: number; // seconds
  }) => Promise<void>;

  // iOS only

  /** iOS only: returns whether aggressive heartbeat mode is enabled. */
  isAggressiveHeartbeat: () => Promise<boolean | null>;

  /** iOS only: enables or disables aggressive heartbeat mode. */
  setAggressiveHeartbeats: (enable: boolean) => Promise<void>;

  /** iOS only: disables or enables user-initiated tracking. */
  setDisableTracking: (value: boolean) => Promise<void>;

  /** iOS only: returns whether user-initiated tracking is disabled. */
  isDisableTracking: () => Promise<boolean | null>;

  /** iOS only: returns whether the native SDK considers current location accuracy insufficient. */
  isWrongAccuracyState: () => Promise<boolean | null>;

  /** iOS only: requests "Always" location permission from the system. */
  requestIOSLocationAlwaysPermission: () => Promise<boolean | null>;

  /** iOS only: requests Motion/Fitness permission from the system. */
  requestIOSMotionPermission: () => Promise<boolean | null>;

  /** iOS only: returns the API language configured in the native SDK. */
  getApiLanguage: () => Promise<ApiLanguage | null>;

  /** iOS only: sets the API language used by the native SDK. */
  setApiLanguage: (language: ApiLanguage) => Promise<void>;

  // Android only

  /**
   * Android only: enables or disables SDK autostart behavior.
   *
   * @param params.enable Whether autostart is enabled.
   * @param params.permanent Whether the choice should be persisted permanently.
   */
  setAndroidAutoStartEnabled: (params: { enable: boolean; permanent: boolean }) => Promise<void>;

  /** Android only: returns whether SDK autostart is enabled. */
  isAndroidAutoStartEnabled: () => Promise<boolean | null>;
}


const { TelematicsSdk } = NativeModules;
export default TelematicsSdk as TelematicsSdkType & EventSubscription & NativeModule;
const telematicsEmitter = new NativeEventEmitter(TelematicsSdk);

/**
 * iOS only: subscribe to Low Power Mode changes.
 *
 * Emits `{ enabled: true }` when Low Power Mode is enabled and `{ enabled: false }` when disabled.
 *
 * @throws Error if called on a non-iOS platform.
 */
export function addOnLowPowerModeListener(handler: (event: LowPowerModeEvent) => void) {
  if (Platform.OS !== 'ios') {
    throw new Error('addOnnLowPowerModeListener is only available on iOS.');
  }

  return telematicsEmitter.addListener('onLowPowerMode', handler);
}

/**
 * Subscribe to location updates produced by the native SDK while tracking is active.
 */
export function addOnLocationChangedListener(
  handler: (event: LocationChangedEvent) => void
) {
  return telematicsEmitter.addListener('onLocationChanged', handler);
}

/**
 * Subscribe to tracking state changes (`true` = started, `false` = stopped).
 */
export function addOnTrackingStateChangedListener(
  handler: (state: boolean) => void
) {
  return telematicsEmitter.addListener('onTrackingStateChanged', handler);
}

/**
 * iOS only: emitted when the SDK detects that Precise Location is not available
 * (e.g., the user granted Reduced Accuracy).
 *
 * Use this to prompt the user to enable Precise Location in system settings.
 *
 * @throws Error if called on a non-iOS platform.
 */
export function addOnWrongAccuracyAuthorizationListener(handler: () => void) {
  if (Platform.OS !== 'ios') {
    throw new Error('addOnWrongAccuracyAuthorizationListener is only available on iOS.');
  }

  return telematicsEmitter.addListener('onWrongAccuracyAuthorization', handler);
}

/**
 * iOS only: emitted when RTLD (real-time data logging) has collected a data chunk.
 *
 * @throws Error if called on a non-iOS platform.
 */
export function addOnRtldColectedData(handler: () => void) {
  if (Platform.OS !== 'ios') {
    throw new Error('addOnRtldColectedData is only available on iOS.');
  }

  return telematicsEmitter.addListener('onRtldColectedData', handler);
}

/**
 * Subscribe to speed violation events produced by the native SDK.
 *
 * Configure monitoring via {@link TelematicsSdk.registerSpeedViolations}.
 */
export function addOnSpeedViolationListener(
  handler: (event: SpeedViolationEvent) => void
) {
  return telematicsEmitter.addListener('onSpeedViolation', handler);
}