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
 */
import {
  NativeEventEmitter,
  Platform,
} from 'react-native';
import NativeTelematicsSdk from './NativeTelematicsSdk';

export enum AccidentDetectionSensitivity {
  Normal = 0,
  Sensitive = 1,
  Tough = 2,
}

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

export type LowPowerModeEvent = {
  enabled: boolean;
};

export type LocationChangedEvent = {
  latitude: number;
  longitude: number;
};

export type SpeedViolationEvent = {
  date: number;
  latitude: number;
  longitude: number;
  speed: number;
  speedLimit: number;
};

export type TrackingStateChangedEvent = boolean;

interface TelematicsSdkType {
  initializeSdk: () => Promise<void>;
  isInitializedSdk: () => Promise<boolean>;
  getDeviceId: () => Promise<string>;
  setDeviceId: (deviceId: string) => Promise<void>;
  logout: () => Promise<void>;
  isAllRequiredPermissionsAndSensorsGranted: () => Promise<boolean>;
  isSdkEnabled: () => Promise<boolean>;
  isTracking: () => Promise<boolean>;
  setEnableSdk: (enable: boolean) => Promise<void>;
  startManualTracking: () => Promise<void>;
  startManualPersistentTracking: () => Promise<void>;
  stopManualTracking: () => Promise<void>;
  uploadUnsentTrips: () => Promise<void>;
  getUnsentTripCount: () => Promise<number>;
  sendCustomHeartbeats: (reason: string) => Promise<void>;
  showPermissionWizard: (
    enableAggressivePermissionsWizard: boolean,
    enableAggressivePermissionsWizardPage: boolean
  ) => Promise<boolean>;
  setAccidentDetectionSensitivity: (
    accidentDetectionSensitivity: AccidentDetectionSensitivity
  ) => Promise<void>;
  isRTLDEnabled: () => Promise<boolean>;
  enableAccidents: (enable: boolean) => Promise<void>;
  isEnabledAccidents: () => Promise<boolean>;
  getFutureTrackTags: () => Promise<{ status: string; tags: Tag[] }>;
  addFutureTrackTag: (
    tag: string,
    source?: string
  ) => Promise<{ status: string; tag: Tag }>;
  removeFutureTrackTag: (tag: string) => Promise<{ status: string; tag: Tag }>;
  removeAllFutureTrackTags: () => Promise<string>;
  registerSpeedViolations: (params: {
    speedLimitKmH: number;
    speedLimitTimeout: number;
  }) => Promise<void>;

  // iOS only
  isAggressiveHeartbeat: () => Promise<boolean>;
  setAggressiveHeartbeats: (enable: boolean) => Promise<void>;
  setDisableTracking: (value: boolean) => Promise<void>;
  isDisableTracking: () => Promise<boolean>;
  isWrongAccuracyState: () => Promise<boolean>;
  requestIOSLocationAlwaysPermission: () => Promise<void>;
  requestIOSMotionPermission: () => Promise<void>;
  getApiLanguage: () => Promise<ApiLanguage>;
  setApiLanguage: (language: ApiLanguage) => Promise<void>;

  // Android only
  setAndroidAutoStartEnabled: (params: {
    enable: boolean;
    permanent: boolean;
  }) => Promise<void>;
  isAndroidAutoStartEnabled: () => Promise<boolean>;
}

const TelematicsSdk: TelematicsSdkType = {
  initializeSdk: () => NativeTelematicsSdk.initializeSdk(),
  isInitializedSdk: () => NativeTelematicsSdk.isInitializedSdk(),
  getDeviceId: () => NativeTelematicsSdk.getDeviceId(),
  setDeviceId: (deviceId) => NativeTelematicsSdk.setDeviceId(deviceId),
  logout: () => NativeTelematicsSdk.logout(),
  isAllRequiredPermissionsAndSensorsGranted: () =>
    NativeTelematicsSdk.isAllRequiredPermissionsAndSensorsGranted(),
  isSdkEnabled: () => NativeTelematicsSdk.isSdkEnabled(),
  isTracking: () => NativeTelematicsSdk.isTracking(),
  setEnableSdk: (enable) => NativeTelematicsSdk.setEnableSdk(enable),
  startManualTracking: () => NativeTelematicsSdk.startManualTracking(),
  startManualPersistentTracking: () =>
    NativeTelematicsSdk.startManualPersistentTracking(),
  stopManualTracking: () => NativeTelematicsSdk.stopManualTracking(),
  uploadUnsentTrips: () => NativeTelematicsSdk.uploadUnsentTrips(),
  getUnsentTripCount: () => NativeTelematicsSdk.getUnsentTripCount(),
  sendCustomHeartbeats: (reason) =>
    NativeTelematicsSdk.sendCustomHeartbeats(reason),
  showPermissionWizard: (wizard, page) =>
    NativeTelematicsSdk.showPermissionWizard(wizard, page),
  setAccidentDetectionSensitivity: (v) =>
    NativeTelematicsSdk.setAccidentDetectionSensitivity(v),
  isRTLDEnabled: () => NativeTelematicsSdk.isRTLDEnabled(),
  enableAccidents: (enable) => NativeTelematicsSdk.enableAccidents(enable),
  isEnabledAccidents: () => NativeTelematicsSdk.isEnabledAccidents(),
  getFutureTrackTags: () =>
    NativeTelematicsSdk.getFutureTrackTags() as Promise<{
      status: string;
      tags: Tag[];
    }>,
  addFutureTrackTag: (tag, source) =>
    NativeTelematicsSdk.addFutureTrackTag(tag, source ?? null) as Promise<{
      status: string;
      tag: Tag;
    }>,
  removeFutureTrackTag: (tag) =>
    NativeTelematicsSdk.removeFutureTrackTag(tag) as Promise<{
      status: string;
      tag: Tag;
    }>,
  removeAllFutureTrackTags: () =>
    NativeTelematicsSdk.removeAllFutureTrackTags(),
  registerSpeedViolations: (params) =>
    NativeTelematicsSdk.registerSpeedViolations(
      params.speedLimitKmH,
      params.speedLimitTimeout
    ),
  isAggressiveHeartbeat: () => NativeTelematicsSdk.isAggressiveHeartbeat(),
  setAggressiveHeartbeats: (enable) =>
    NativeTelematicsSdk.setAggressiveHeartbeats(enable),
  setDisableTracking: (value) =>
    NativeTelematicsSdk.setDisableTracking(value),
  isDisableTracking: () => NativeTelematicsSdk.isDisableTracking(),
  isWrongAccuracyState: () => NativeTelematicsSdk.isWrongAccuracyState(),
  requestIOSLocationAlwaysPermission: () =>
    NativeTelematicsSdk.requestIOSLocationAlwaysPermission(),
  requestIOSMotionPermission: () =>
    NativeTelematicsSdk.requestIOSMotionPermission(),
  getApiLanguage: () =>
    NativeTelematicsSdk.getApiLanguage() as Promise<ApiLanguage>,
  setApiLanguage: (language) =>
    NativeTelematicsSdk.setApiLanguage(language),
  setAndroidAutoStartEnabled: (params) =>
    NativeTelematicsSdk.setAndroidAutoStartEnabled(
      params.enable,
      params.permanent
    ),
  isAndroidAutoStartEnabled: () =>
    NativeTelematicsSdk.isAndroidAutoStartEnabled(),
};

export default TelematicsSdk;

const telematicsEmitter = new NativeEventEmitter(NativeTelematicsSdk);

export function addOnLowPowerModeListener(
  handler: (event: LowPowerModeEvent) => void
) {
  if (Platform.OS !== 'ios') {
    throw new Error('addOnLowPowerModeListener is only available on iOS.');
  }
  return telematicsEmitter.addListener('onLowPowerMode', handler);
}

export function addOnLocationChangedListener(
  handler: (event: LocationChangedEvent) => void
) {
  return telematicsEmitter.addListener('onLocationChanged', handler);
}

export function addOnTrackingStateChangedListener(
  handler: (state: boolean) => void
) {
  return telematicsEmitter.addListener('onTrackingStateChanged', handler);
}

export function addOnWrongAccuracyAuthorizationListener(
  handler: () => void
) {
  if (Platform.OS !== 'ios') {
    throw new Error(
      'addOnWrongAccuracyAuthorizationListener is only available on iOS.'
    );
  }
  return telematicsEmitter.addListener('onWrongAccuracyAuthorization', handler);
}

export function addOnRtldColectedData(handler: () => void) {
  if (Platform.OS !== 'ios') {
    throw new Error('addOnRtldColectedData is only available on iOS.');
  }
  return telematicsEmitter.addListener('onRtldColectedData', handler);
}

export function addOnSpeedViolationListener(
  handler: (event: SpeedViolationEvent) => void
) {
  return telematicsEmitter.addListener('onSpeedViolation', handler);
}
