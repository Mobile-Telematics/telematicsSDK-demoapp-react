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
import { NativeEventEmitter, Platform } from 'react-native';
import { getNativeTelematicsSdk } from './createTelematicsSdk';
import { createTelematicsSdk } from './TelematicsSdk';
import type { TelematicsSdk } from './TelematicsSdk';
import {
  AccidentDetectionSensitivity,
  ApiLanguage,
  DeviceIdRegistrationStatus,
  TrackingMode,
  TrackingStatus,
} from './types';

const NativeTelematicsSdk = getNativeTelematicsSdk();

export {
  AccidentDetectionSensitivity,
  ApiLanguage,
  DeviceIdRegistrationStatus,
  TrackingMode,
  TrackingStatus,
};
export type {
  AndroidPermissionWizardOptions,
  AndroidPermissionWizardThemeMode,
  DeviceIdRegistrationState,
  IosMissingPermissionsAlertConfiguration,
  IosPermissionWizardConfiguration,
  IosPermissionWizardPageConfiguration,
  IosPermissionWizardStatusConfiguration,
  IosPermissionWizardTheme,
  StringDictionary,
  TrackingState,
} from './types';

/** Payload emitted when iOS Low Power Mode changes. */
export type LowPowerModeEvent = {
  enabled: boolean;
};

/** Geographic position emitted by the native SDK. */
export type LocationChangedEvent = {
  latitude: number;
  longitude: number;
};

/** Details of a detected speed-limit violation. */
export type SpeedViolationEvent = {
  date: number;
  latitude: number;
  longitude: number;
  speed: number;
  speedLimit: number;
};

/** `true` while the native SDK reports an active tracking session. */
export type TrackingStateChangedEvent = boolean;

export type { TelematicsSdk };

const telematicsSdk = createTelematicsSdk();

export default telematicsSdk;

const telematicsEmitter = new NativeEventEmitter(NativeTelematicsSdk);

/**
 * Subscribes to iOS Low Power Mode changes.
 * @throws {Error} When called on a non-iOS platform.
 * @returns A subscription; call `remove()` during component cleanup.
 */
export function addOnLowPowerModeListener(
  handler: (event: LowPowerModeEvent) => void
) {
  if (Platform.OS !== 'ios') {
    throw new Error('addOnLowPowerModeListener is only available on iOS.');
  }
  return telematicsEmitter.addListener('onLowPowerMode', handler);
}

/**
 * Subscribes to locations emitted by the native SDK on iOS and Android.
 * @returns A subscription; call `remove()` during component cleanup.
 */
export function addOnLocationChangedListener(
  handler: (event: LocationChangedEvent) => void
) {
  return telematicsEmitter.addListener('onLocationChanged', handler);
}

/**
 * Subscribes to changes in whether native tracking is active.
 * @returns A subscription; call `remove()` during component cleanup.
 */
export function addOnTrackingStateChangedListener(
  handler: (state: boolean) => void
) {
  return telematicsEmitter.addListener('onTrackingStateChanged', handler);
}

/**
 * Subscribes to iOS notifications that location accuracy authorization is insufficient.
 * @throws {Error} When called on a non-iOS platform.
 * @returns A subscription; call `remove()` during component cleanup.
 */
export function addOnWrongAccuracyAuthorizationListener(handler: () => void) {
  if (Platform.OS !== 'ios') {
    throw new Error(
      'addOnWrongAccuracyAuthorizationListener is only available on iOS.'
    );
  }
  return telematicsEmitter.addListener('onWrongAccuracyAuthorization', handler);
}

/**
 * Subscribes to iOS real-time-location-data collection events.
 * @throws {Error} When called on a non-iOS platform.
 * @returns A subscription; call `remove()` during component cleanup.
 */
export function addOnRtldColectedData(handler: () => void) {
  if (Platform.OS !== 'ios') {
    throw new Error('addOnRtldColectedData is only available on iOS.');
  }
  return telematicsEmitter.addListener('onRtldColectedData', handler);
}

/**
 * Subscribes to speed-limit violations emitted by the native SDK.
 * @returns A subscription; call `remove()` during component cleanup.
 */
export function addOnSpeedViolationListener(
  handler: (event: SpeedViolationEvent) => void
) {
  return telematicsEmitter.addListener('onSpeedViolation', handler);
}
