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

export enum TrackingMode {
  Standard = 0,
  Persistent = 1,
}

export enum DeviceIdRegistrationStatus {
  NotSet = 'NOT_SET',
  Unknown = 'UNKNOWN',
  Registered = 'REGISTERED',
  NotRegistered = 'NOT_REGISTERED',
}

export type DeviceIdRegistrationState = {
  status: DeviceIdRegistrationStatus;
  checkedAtMillis: number;
};

export enum TrackingStatus {
  Enabled = 'ENABLED',
  DeviceIdNotSet = 'DEVICE_ID_NOT_SET',
  SdkDisabled = 'SDK_DISABLED',
  DisabledBySettings = 'DISABLED_BY_SETTINGS',
  DisabledByServer = 'DISABLED_BY_SERVER',
  DisabledBySchedule = 'DISABLED_BY_SCHEDULE',
  Unknown = 'UNKNOWN',
}

export type TrackingState = {
  automaticTrackingStatus: TrackingStatus;
  manualTrackingStatus: TrackingStatus;
};

export type Tag = {
  tag: string;
  source?: string;
};
