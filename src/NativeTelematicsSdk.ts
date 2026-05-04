import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

import type { Double, Int32 } from 'react-native/Libraries/Types/CodegenTypes';

export interface Spec extends TurboModule {
  // Lifecycle
  initializeSdk(): Promise<void>;
  isInitializedSdk(): Promise<boolean>;

  // Device token
  getDeviceId(): Promise<string>;
  setDeviceId(deviceId: string): Promise<void>;
  logout(): Promise<void>;

  // Permissions & tracking
  isAllRequiredPermissionsAndSensorsGranted(): Promise<boolean>;
  isSdkEnabled(): Promise<boolean>;
  isTracking(): Promise<boolean>;
  setEnableSdk(enable: boolean): Promise<void>;
  startManualTracking(): Promise<void>;
  startManualPersistentTracking(): Promise<void>;
  stopManualTracking(): Promise<void>;

  // Upload
  uploadUnsentTrips(): Promise<void>;
  getUnsentTripCount(): Promise<Double>;

  // Heartbeats
  sendCustomHeartbeats(reason: string): Promise<void>;

  // Wizard
  showPermissionWizard(
    enableAggressivePermissionsWizard: boolean,
    enableAggressivePermissionsWizardPage: boolean
  ): Promise<boolean>;

  // Accidents / RTLD
  setAccidentDetectionSensitivity(value: Int32): Promise<void>;
  isRTLDEnabled(): Promise<boolean>;
  enableAccidents(enable: boolean): Promise<void>;
  isEnabledAccidents(): Promise<boolean>;

  // Tags API — return types are untyped Object to avoid C++ codegen structs
  getFutureTrackTags(): Promise<Object>;
  addFutureTrackTag(tag: string, source: string | null): Promise<Object>;
  removeFutureTrackTag(tag: string): Promise<Object>;
  removeAllFutureTrackTags(): Promise<string>;

  // Speed violations — flattened params to avoid C++ struct on iOS
  registerSpeedViolations(
    speedLimitKmH: Double,
    speedLimitTimeout: Int32
  ): Promise<void>;

  // iOS-only
  isAggressiveHeartbeat(): Promise<boolean>;
  setAggressiveHeartbeats(enable: boolean): Promise<void>;
  setDisableTracking(value: boolean): Promise<void>;
  isDisableTracking(): Promise<boolean>;
  isWrongAccuracyState(): Promise<boolean>;
  requestIOSLocationAlwaysPermission(): Promise<void>;
  requestIOSMotionPermission(): Promise<void>;
  getApiLanguage(): Promise<string>;
  setApiLanguage(language: string): Promise<void>;

  // Android-only — flattened params to avoid C++ struct on iOS
  setAndroidAutoStartEnabled(
    enable: boolean,
    permanent: boolean
  ): Promise<void>;
  isAndroidAutoStartEnabled(): Promise<boolean>;

  // Events (required by NativeEventEmitter)
  addListener(eventName: string): void;
  removeListeners(count: Double): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('TelematicsSdk');
