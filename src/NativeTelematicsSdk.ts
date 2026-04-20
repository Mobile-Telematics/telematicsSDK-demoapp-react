import type {TurboModule} from 'react-native';
import {TurboModuleRegistry} from 'react-native';

export type FutureTrackTag = {
  tag: string;
  source?: string | null;
};

export type FutureTrackTagsResult = {
  status: string;
  tags: FutureTrackTag[];
};

export type FutureTrackTagResult = {
  status: string;
  tag: FutureTrackTag;
};

export interface Spec extends TurboModule {
  addListener(eventName: string): void;
  removeListeners(count: number): void;

  initialize(): void;
  isInitialized(): Promise<boolean>;
  getDeviceId(): Promise<string>;
  setDeviceId(deviceId: string): Promise<void>;
  logout(): Promise<void>;
  isAllRequiredPermissionsAndSensorsGranted(): Promise<boolean>;
  isSdkEnabled(): Promise<boolean>;
  isTracking(): Promise<boolean>;
  setEnableSdk(enable: boolean): Promise<void>;
  startManualTracking(): Promise<void>;
  startManualPersistentTracking(): Promise<void>;
  stopManualTracking(): Promise<void>;
  uploadUnsentTrips(): Promise<void>;
  getUnsentTripCount(): Promise<number>;
  sendCustomHeartbeats(reason: string): Promise<void>;
  showPermissionWizard(
    enableAggressivePermissionsWizard: boolean,
    enableAggressivePermissionsWizardPage: boolean
  ): Promise<boolean>;
  setAccidentDetectionSensitivity(value: number): Promise<void>;
  isRTLDEnabled(): Promise<boolean>;
  enableAccidents(enable: boolean): Promise<void>;
  isEnabledAccidents(): Promise<boolean>;
  isAggressiveHeartbeat(): Promise<boolean | null>;
  setAggressiveHeartbeats(enable: boolean): Promise<void>;
  setDisableTracking(value: boolean): Promise<void>;
  isDisableTracking(): Promise<boolean | null>;
  isWrongAccuracyState(): Promise<boolean | null>;
  requestIOSLocationAlwaysPermission(): Promise<boolean | null>;
  requestIOSMotionPermission(): Promise<boolean | null>;
  getApiLanguage(): Promise<string | null>;
  setApiLanguage(language: string): Promise<void>;
  addFutureTrackTag(tag: string, source: string | null): Promise<FutureTrackTagResult>;
  removeFutureTrackTag(tag: string): Promise<FutureTrackTagResult>;
  removeAllFutureTrackTags(): Promise<string>;
  getFutureTrackTags(): Promise<FutureTrackTagsResult>;
  registerSpeedViolations(speedLimitKmH: number, speedLimitTimeout: number): Promise<void>;
  setAndroidAutoStartEnabled(enable: boolean, permanent: boolean): Promise<void>;
  isAndroidAutoStartEnabled(): Promise<boolean | null>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('TelematicsSdk');
