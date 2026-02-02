import {
  type EventSubscription,
  type NativeModule,
  NativeEventEmitter,
  NativeModules,
  Platform
} from 'react-native';

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
  initialize: () => Promise<void>;
  isInitialized: () => Promise<boolean>;
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
  showPermissionWizard: (enableAggressivePermissionsWizard: boolean, enableAggressivePermissionsWizardPage: boolean) => Promise<boolean>;
  setAccidentDetectionSensitivity: (accidentDetectionSensitivity: AccidentDetectionSensitivity) => Promise<void>;
  isRTLDEnabled: () => Promise<boolean>;
  enableAccidents: (enable: boolean) => Promise<void>;
  isEnabledAccidents: () => Promise<boolean>;
  getFutureTrackTags: () => Promise<{ status: string; tags: Tag[] }>;
  addFutureTrackTag: (tag: string, source?: string) => Promise<{ status: string; tag: Tag }>;
  removeFutureTrackTag: (tag: string) => Promise<{ status: string; tag: Tag }>;
  removeAllFutureTrackTags: () => Promise<string>;
  registerSpeedViolations: (params: { speedLimitKmH: number; speedLimitTimeout: number; }) => Promise<void>;

  // iOS only
  isAggressiveHeartbeat: () => Promise<boolean | null>; 
  setAggressiveHeartbeats: (enable: boolean) => Promise<void>;
  setDisableTracking: (value: boolean) => Promise<void>;
  isDisableTracking: () => Promise<boolean | null>;
  isWrongAccuracyState: () => Promise<boolean | null>;
  requestIOSLocationAlwaysPermission: () => Promise<boolean | null>;
  requestIOSMotionPermission: () => Promise<boolean | null>;
  getApiLanguage: () => Promise<ApiLanguage | null>;
  setApiLanguage: (language: ApiLanguage) => Promise<void>;

  // Android only
  setAndroidAutoStartEnabled: (params: { enable: boolean; permanent: boolean }) => Promise<void>;
  isAndroidAutoStartEnabled: () => Promise<boolean | null>;
}

const { TelematicsSdk } = NativeModules;
const sdk = TelematicsSdk as TelematicsSdkType & EventSubscription & NativeModule;
const telematicsEmitter = new NativeEventEmitter(TelematicsSdk);

export default {
  ...sdk,
  isAggressiveHeartbeat: () => {
    ensureIOS('isAggressiveHeartbeat');
    return sdk.isAggressiveHeartbeat();
  },
  setAggressiveHeartbeats: (enable: boolean) => {
    ensureIOS('setAggressiveHeartbeats');
    return sdk.setAggressiveHeartbeats(enable);
  },
    setDisableTracking: (value: boolean) => {
    ensureIOS('setDisableTracking');
    return sdk.setDisableTracking(value);
  },
  isDisableTracking: () => {
    ensureIOS('isDisableTracking');
    return sdk.isDisableTracking();
  },
  isWrongAccuracyState: () => {
    ensureIOS('isWrongAccuracyState');
    return sdk.isWrongAccuracyState();
  },
  requestIOSLocationAlwaysPermission: () => {
    ensureIOS('requestIOSLocationAlwaysPermission');
    return sdk.requestIOSLocationAlwaysPermission();
  },
  requestIOSMotionPermission: () => {
    ensureIOS('requestIOSMotionPermission');
    return sdk.requestIOSMotionPermission();
  },
  getApiLanguage: () => {
    ensureIOS('getApiLanguage');
    return sdk.getApiLanguage().then((value: string | null) => {
      if (!value) return null;

      switch (value) {
       case ApiLanguage.none:
       case ApiLanguage.english:
       case ApiLanguage.russian:
       case ApiLanguage.portuguese:
       case ApiLanguage.spanish:
        return value as ApiLanguage;
      default:
        return null;
      }
    });
  },
  setApiLanguage: (language: ApiLanguage) => {
    ensureIOS('setApiLanguage');
    return sdk.setApiLanguage(language);
  },
  setAndroidAutoStartEnabled: (params: { enable: boolean; permanent: boolean }) => {
    ensureAndroid('setAndroidAutoStartEnabled');
    return sdk.setAndroidAutoStartEnabled(params);
  },
  isAndroidAutoStartEnabled: () => {
    ensureAndroid('isAndroidAutoStartEnabled');
    return sdk.isAndroidAutoStartEnabled();
  },
};

export function addOnLowPowerModeListener(handler: (event: LowPowerModeEvent) => void) {
  if (Platform.OS !== 'ios') {
    throw new Error('addOnnLowPowerModeListener is only available on iOS.');
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
    throw new Error('addOnWrongAccuracyAuthorizationListener is only available on iOS.');
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

function ensureIOS(methodName: string): void {
  if (Platform.OS !== 'ios') {
    throw new Error(`${methodName} is only available on iOS.`);
  }
}

function ensureAndroid(methodName: string): void {
  if (Platform.OS !== 'android') {
    throw new Error(`${methodName} is only available on Android.`);
  }
}