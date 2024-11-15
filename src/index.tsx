import {
  type EventSubscription,
  type NativeModule,
  NativeModules,
} from 'react-native';

interface Tag {
  tag: string;
  source?: string;
}

interface TelematicsSdkType {
  initialize: () => Promise<void>;

  requestPermissions: () => Promise<boolean>;
  enable: (token: string) => Promise<boolean>;
  getStatus: () => Promise<boolean>;
  getDeviceToken: () => Promise<string>;
  disable: () => Promise<void>;

  getFutureTrackTags: () => Promise<{ status: string; tags: Tag[] }>;
  addFutureTrackTag: (
    tag: string,
    source?: string
  ) => Promise<{ status: string; tag: Tag }>;
  removeFutureTrackTag: (tag: string) => Promise<{ status: string; tag: Tag }>;
  removeAllFutureTrackTags: () => Promise<string>;
  startPersistentTracking: () => Promise<boolean | null>;
}

const { TelematicsSdk } = NativeModules;

export default TelematicsSdk as TelematicsSdkType &
  EventSubscription &
  NativeModule;
