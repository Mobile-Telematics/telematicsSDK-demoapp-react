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
export type { DeviceIdRegistrationState, TrackingState } from './types';

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

export type { TelematicsSdk };

const telematicsSdk = createTelematicsSdk();

export default telematicsSdk;

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

export function addOnWrongAccuracyAuthorizationListener(handler: () => void) {
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
