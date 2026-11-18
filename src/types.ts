/** Sensitivity used by the native accident-detection algorithm. */
export enum AccidentDetectionSensitivity {
  Normal = 0,
  Sensitive = 1,
  Tough = 2,
}

/** Language used by iOS-native SDK UI and API messages. iOS only. */
export enum ApiLanguage {
  none = 'None',
  english = 'English',
  russian = 'Russian',
  portuguese = 'Portuguese',
  spanish = 'Spanish',
}

/** Mode used for SDK-started and manually-started tracking sessions. */
export enum TrackingMode {
  Standard = 0,
  Persistent = 1,
}

/** Server registration status of the current virtual device identifier. */
export enum DeviceIdRegistrationStatus {
  NotSet = 'NOT_SET',
  Unknown = 'UNKNOWN',
  Registered = 'REGISTERED',
  NotRegistered = 'NOT_REGISTERED',
}

/** Snapshot of device-identifier registration status returned by the native SDK. */
export type DeviceIdRegistrationState = {
  /** Registration status known to the SDK. */
  status: DeviceIdRegistrationStatus;
  /** Unix timestamp in milliseconds when the status was last checked. */
  checkedAtMillis: number;
};

/** Status of the current user in the SDK configuration (TelematicsSDK 7.3.0+). */
export enum SdkUserStatus {
  Unknown = 'UNKNOWN',
  Active = 'ACTIVE',
  Deactivated = 'DEACTIVATED',
  Deleted = 'DELETED',
  Suspended = 'SUSPENDED',
  NotFound = 'NOT_FOUND',
}

/** Heartbeats mode from the SDK configuration (TelematicsSDK 7.3.0+). */
export enum SdkHeartbeatsMode {
  Disabled = 'DISABLED',
  Standard = 'STANDARD',
  Extended = 'EXTENDED',
  Unknown = 'UNKNOWN',
}

/**
 * SDK configuration snapshot returned by {@link TelematicsSdk.getSdkConfigs}.
 * The values come from the Damoov backend; the app cannot change them.
 */
export type SdkConfigs = {
  /** Device identifier the configuration belongs to. */
  deviceId: string;
  /** `false` while the SDK still uses its built-in defaults. */
  isFetchedFromServer: boolean;
  /** When the configuration was fetched, epoch milliseconds, or `null` if never. */
  configFetchedAtMillis: number | null;
  user: { status: SdkUserStatus };
  accidents: {
    enabled: boolean;
    bufferRawSamplesEnabled: boolean;
    bufferRawSamplesMode: AccidentRawBufferMode;
  };
  heartbeats: { mode: SdkHeartbeatsMode };
  tripsTracking: { enabled: boolean; pointQuantilesEnabled: boolean };
  schedule: { enabled: boolean };
  /** Sensor sampling rates the SDK uses, in Hz. */
  sensors: {
    accelerometer: { rateHz: number };
    gyroscope: { rateHz: number };
  };
  debug: { logsEnabled: boolean };
  /** On Android unset values come back as empty strings / 0 rather than `null`. */
  liveTracking: {
    enabled: boolean;
    endpoint: string | null;
    frqSec: number | null;
    imei: string | null;
    port: number | null;
    topic: string | null;
    type: number | null;
  };
};

/** Which accident candidates get raw sensor buffers uploaded. */
export enum AccidentRawBufferMode {
  ConfirmedOnly = 'CONFIRMED_ONLY',
  AllCandidates = 'ALL_CANDIDATES',
  Unknown = 'UNKNOWN',
}

/** Reason why automatic or manual tracking is currently unavailable. */
export enum TrackingStatus {
  Enabled = 'ENABLED',
  DeviceIdNotSet = 'DEVICE_ID_NOT_SET',
  SdkDisabled = 'SDK_DISABLED',
  DisabledBySettings = 'DISABLED_BY_SETTINGS',
  DisabledByServer = 'DISABLED_BY_SERVER',
  DisabledBySchedule = 'DISABLED_BY_SCHEDULE',
  Unknown = 'UNKNOWN',
}

/** Availability state for automatic and manual tracking. */
export type TrackingState = {
  automaticTrackingStatus: TrackingStatus;
  manualTrackingStatus: TrackingStatus;
};

/**
 * A Future Tag entry.
 * @deprecated Future Tags are deprecated on iOS and Android; use Properties APIs instead.
 */
export type Tag = {
  tag: string;
  source?: string;
};

/** String-only metadata sent to or returned from the native SDK. */
export type StringDictionary = Record<string, string>;

/** Appearance mode for the Android permissions wizard. */
export type AndroidPermissionWizardThemeMode = 'light' | 'dark' | 'system';

/** Configuration for the Android 4.1+ permissions wizard. */
export type AndroidPermissionWizardOptions = {
  /** Wizard colour scheme. Defaults to `system`. Android only. */
  themeMode?: AndroidPermissionWizardThemeMode;
  /** Prevent closing the wizard before it completes. Defaults to `false`. Android only. */
  blockEarlyExit?: boolean;
  /** Skip the wizard's informational pages. Defaults to `false`. Android only. */
  skipWizardPages?: boolean;
};

/** Copy displayed by one iOS permissions-wizard page. iOS only. */
export type IosPermissionWizardPageConfiguration = {
  title?: string;
  body?: string;
  primaryButtonTitle?: string;
  hintLead?: string;
  permissionHint?: string;
};

/** Copy displayed by the iOS permissions-wizard status page. iOS only. */
export type IosPermissionWizardStatusConfiguration = {
  title?: string;
  body?: string;
  locationTitle?: string;
  motionTitle?: string;
  locationEnabledText?: string;
  locationAlwaysRequiredText?: string;
  locationPreciseRequiredText?: string;
  locationActionNeededText?: string;
  motionEnabledText?: string;
  motionActionNeededText?: string;
  fixInSettingsButtonTitle?: string;
  skipButtonTitle?: string;
};

/**
 * Colour palette used by the iOS permissions wizard and missing-permissions alert.
 * Colours use `#RRGGBB` or `#AARRGGBB` notation. iOS only.
 */
export type IosPermissionWizardTheme = {
  backgroundColor?: string;
  gradientStartColor?: string;
  gradientEndColor?: string;
  titleTextColor?: string;
  bodyTextColor?: string;
  primaryElementColor?: string;
  secondaryElementColor?: string;
  buttonTextColor?: string;
  cardBackgroundColor?: string;
  successElementColor?: string;
  warningElementColor?: string;
  secondaryButtonTextColor?: string;
  secondaryButtonBackgroundColor?: string;
  statusIndicatorTextColor?: string;
  modalScrimColor?: string;
};

/**
 * Partial configuration for the iOS SDK 7.2 permissions wizard.
 * Omitted fields retain the native SDK defaults.
 */
export type IosPermissionWizardConfiguration = {
  locationWhenInUse?: IosPermissionWizardPageConfiguration;
  locationAlways?: IosPermissionWizardPageConfiguration;
  motion?: IosPermissionWizardPageConfiguration;
  status?: IosPermissionWizardStatusConfiguration;
  lightTheme?: IosPermissionWizardTheme;
  darkTheme?: IosPermissionWizardTheme;
};

/**
 * Partial configuration for the iOS alert displayed when required permissions
 * are missing. Omitted fields retain the native SDK defaults.
 */
export type IosMissingPermissionsAlertConfiguration = {
  title?: string;
  body?: string;
  locationTitle?: string;
  motionTitle?: string;
  locationEnabledText?: string;
  locationAlwaysRequiredText?: string;
  locationPreciseRequiredText?: string;
  locationActionNeededText?: string;
  motionEnabledText?: string;
  motionActionNeededText?: string;
  fixInSettingsButtonTitle?: string;
  isBlocking?: boolean;
  skipButtonTitle?: string;
  lightTheme?: IosPermissionWizardTheme;
  darkTheme?: IosPermissionWizardTheme;
};
