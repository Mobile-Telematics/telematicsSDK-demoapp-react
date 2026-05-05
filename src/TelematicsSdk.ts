import type { AccidentDetectionSensitivity, ApiLanguage, Tag } from './types';
import { getNativeTelematicsSdk } from './createTelematicsSdk';

export interface TelematicsSdk {
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
  getUnsentTripCount(): Promise<number>;

  // Heartbeats
  sendCustomHeartbeats(reason: string): Promise<void>;

  // Wizard
  showPermissionWizard(
    enableAggressivePermissionsWizard: boolean,
    enableAggressivePermissionsWizardPage: boolean
  ): Promise<boolean>;

  // Accidents / RTLD
  setAccidentDetectionSensitivity(
    accidentDetectionSensitivity: AccidentDetectionSensitivity
  ): Promise<void>;
  isRTLDEnabled(): Promise<boolean>;
  enableAccidents(enable: boolean): Promise<void>;
  isEnabledAccidents(): Promise<boolean>;

  // Tags
  getFutureTrackTags(): Promise<{ status: string; tags: Tag[] }>;
  addFutureTrackTag(
    tag: string,
    source?: string
  ): Promise<{ status: string; tag: Tag }>;
  removeFutureTrackTag(tag: string): Promise<{ status: string; tag: Tag }>;
  removeAllFutureTrackTags(): Promise<string>;

  // Speed violations
  registerSpeedViolations(params: {
    speedLimitKmH: number;
    speedLimitTimeout: number;
  }): Promise<void>;

  // iOS only
  isAggressiveHeartbeat(): Promise<boolean>;
  setAggressiveHeartbeats(enable: boolean): Promise<void>;
  setDisableTracking(value: boolean): Promise<void>;
  isDisableTracking(): Promise<boolean>;
  isWrongAccuracyState(): Promise<boolean>;
  requestIOSLocationAlwaysPermission(): Promise<void>;
  requestIOSMotionPermission(): Promise<void>;
  getApiLanguage(): Promise<ApiLanguage>;
  setApiLanguage(language: ApiLanguage): Promise<void>;

  // Android only
  setAndroidAutoStartEnabled(params: {
    enable: boolean;
    permanent: boolean;
  }): Promise<void>;
  isAndroidAutoStartEnabled(): Promise<boolean>;
}

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
