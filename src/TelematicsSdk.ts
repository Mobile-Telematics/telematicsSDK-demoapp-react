import type {
  AccidentDetectionSensitivity,
  ApiLanguage,
  AndroidPermissionWizardOptions,
  DeviceIdRegistrationState,
  IosMissingPermissionsAlertConfiguration,
  IosPermissionWizardConfiguration,
  StringDictionary,
  Tag,
  TrackingState,
} from './types';
import { TrackingMode } from './types';
import { getNativeTelematicsSdk } from './createTelematicsSdk';

/**
 * High-level React Native API for interacting with the native Telematics SDK.
 *
 * This module is a thin wrapper around the platform-native SDK exposed through React Native.
 * Most methods forward directly to the underlying native implementation.
 *
 * Typical usage:
 * 1. Create an instance via {@link createTelematicsSdk}.
 * 2. Initialize on the native side via {@link TelematicsSdk.initializeSdk}.
 * 3. Configure the virtual device id/token via {@link TelematicsSdk.setDeviceId}.
 * 4. Start tracking via {@link TelematicsSdk.startManualTracking} or {@link TelematicsSdk.startTrackAsPersistent}.
 */
export interface TelematicsSdk {
  // Lifecycle

  /**
   * Initializes the native SDK.
   *
   * This is typically the first call you make before using any other API.
   */
  initializeSdk(): Promise<void>;

  /** Returns whether the native SDK is initialized. */
  isInitializedSdk(): Promise<boolean>;

  // Device token

  /** Returns the current virtual device identifier (token) configured in the native SDK. */
  getDeviceId(): Promise<string>;

  /** Returns the latest known device identifier registration state. */
  getDeviceIdRegistrationState(): Promise<DeviceIdRegistrationState>;

  /**
   * Sets the virtual device identifier (token) used by the native SDK.
   *
   * Pass the Damoov-issued DeviceToken received from your backend before enabling
   * the SDK or starting a manual trip. Do not create an unregistered local UUID.
   */
  setDeviceId(deviceId: string): Promise<void>;

  /**
   * Performs a full logout on the native SDK.
   *
   * Typically disables the SDK and clears the stored device token.
   */
  logout(): Promise<void>;

  // Permissions & tracking

  /**
   * Checks whether all required permissions and sensors are granted/available.
   *
   * This includes the platform requirements needed for tracking, such as Location
   * and Motion/Fitness. Call it before enabling the SDK or starting manual tracking.
   */
  isAllRequiredPermissionsAndSensorsGranted(): Promise<boolean>;

  /** Returns whether the native SDK is currently enabled. */
  isSdkEnabled(): Promise<boolean>;

  /** Returns whether tracking is currently active on the native side. */
  isTracking(): Promise<boolean>;

  /**
   * Enables or disables the native SDK globally.
   *
   * Disabling the SDK typically stops tracking and background activity.
   */
  setEnableSdk(enable: boolean): Promise<void>;

  /**
   * Starts a manual tracking session using the current {@link TrackingMode}.
   * Configure a DeviceToken and the required permissions first.
   */
  startManualTracking(): Promise<void>;

  /**
   * Starts a one-time persistent manual tracking session.
   * Set the maximum interval first with {@link setMaxPersistentTrackingInterval}.
   */
  startTrackAsPersistent(): Promise<void>;

  /** Stops the active manual tracking session. It does not clear the DeviceToken. */
  stopManualTracking(): Promise<void>;

  /**
   * Sets the maximum duration for one persistent session.
   * @param minutes An integer from 5 through 600. The native default is 240.
   */
  setMaxPersistentTrackingInterval(minutes: number): Promise<void>;

  /** Returns the maximum duration, in minutes, for a single persistent tracking session. */
  getMaxPersistentTrackingInterval(): Promise<number>;

  /**
   * Selects the mode for subsequent SDK-started and manually-started sessions.
   * Use {@link TrackingMode.Persistent} only when the product requires it.
   */
  setTrackingMode(trackingMode: TrackingMode): Promise<void>;

  /** Returns the current tracking mode. */
  getTrackingMode(): Promise<TrackingMode>;

  /** Returns the current automatic and manual tracking availability state. */
  getTrackingState(): Promise<TrackingState>;

  // Upload

  /** Triggers upload of locally stored, unsent trips if any. */
  uploadUnsentTrips(): Promise<void>;

  /** Returns the number of unsent trips currently stored locally by the native SDK. */
  getUnsentTripCount(): Promise<number>;

  // Heartbeats

  /**
   * Sends a custom heartbeat to the native SDK with an application-defined reason.
   *
   * @param reason A string used for analytics on the backend.
   */
  sendCustomHeartbeats(reason: string): Promise<void>;

  // Wizard

  /**
   * Shows the native permissions wizard and resolves `true` only when all required
   * permissions and sensors are available.
   *
   * Call without arguments to use the native default appearance and behaviour.
   * To customize Android, pass {@link AndroidPermissionWizardOptions}. To
   * customize iOS, call {@link configureIosPermissionWizard} beforehand and,
   * when needed, configure the missing-permissions alert with
   * {@link configureIosMissingPermissionsAlert} and
   * {@link setIosMissingPermissionsAlertEnabled}.
   *
   * On Android 4.1+, it guides the user through precise and background location,
   * activity recognition, and battery-optimization exclusion. Use
   * {@link AndroidPermissionWizardOptions} to control its appearance and exit
   * behaviour. On iOS, options are ignored. This replaces the removed two-boolean
   * overload from versions before 3.1.0.
   */
  showPermissionWizard(
    options?: AndroidPermissionWizardOptions
  ): Promise<boolean>;

  /**
   * Replaces the persistent properties attached to trips for the current SDK user.
   *
   * The dictionary is flat string metadata and replaces the complete previous
   * dictionary; it does not merge keys. A different dictionary during active
   * tracking completes the current trip and starts a new one with updated
   * properties; the same dictionary does not restart tracking. Properties are
   * cleared on logout or DeviceToken change. Supply 1--20 entries with non-empty
   * keys and values of at most 255 characters. Use {@link clearProperties}, not
   * `{}`.
   * @param properties Complete properties dictionary to associate with trips.
   */
  setProperties(properties: StringDictionary): Promise<void>;
  /**
   * Returns the complete persistent properties dictionary for the current SDK user.
   * Read it before changing one key, then pass the full updated dictionary to
   * {@link setProperties}.
   */
  getProperties(): Promise<StringDictionary>;
  /**
   * Removes all persistent properties. If they are not already empty during
   * active tracking, completes the current trip and starts a new trip without
   * properties.
   */
  clearProperties(): Promise<void>;
  /**
   * Replaces the persistent sub-units used to classify subsequent trips, for
   * example by driver, vehicle, depot, or session.
   *
   * The dictionary is flat string metadata and replaces the complete previous
   * dictionary; it does not merge keys. It is cleared on logout or DeviceToken
   * change. Setting or clearing sub-units never restarts active tracking; a
   * change during a trip applies to the next trip. Supply 1--5 entries with
   * non-empty keys and values of at most 255 characters. Use
   * {@link clearSubUnits}, not `{}`.
   */
  setSubUnits(subUnits: StringDictionary): Promise<void>;
  /**
   * Returns the complete persistent sub-units dictionary for the current SDK user.
   * Read it before changing one key, then pass the full updated dictionary to
   * {@link setSubUnits}.
   */
  getSubUnits(): Promise<StringDictionary>;
  /**
   * Removes all persistent sub-units. This does not restart active tracking;
   * the change applies to the next trip.
   */
  clearSubUnits(): Promise<void>;
  /**
   * Adds a business event to the currently active trip without stopping or
   * splitting it. Entries can be sent only while tracking is active, with at most
   * 100 entries per trip. A later properties change completes the trip and keeps
   * its existing activity-log entries attached to that completed trip.
   * @param text Human-readable description, from 1 through 1000 characters.
   * @param data String-only metadata attached to the entry; pass `{}` when none is needed.
   */
  addActivityLog(text: string, data: StringDictionary): Promise<void>;

  // Accidents / RTLD

  /** Sets accident detection sensitivity in the native SDK. */
  setAccidentDetectionSensitivity(
    accidentDetectionSensitivity: AccidentDetectionSensitivity
  ): Promise<void>;

  /** Returns whether RTLD (real-time data logging) is enabled in the native SDK. */
  isRTLDEnabled(): Promise<boolean>;

  /** Enables or disables accident detection in the native SDK. */
  setAccidentDetectionEnabled(enable: boolean): Promise<void>;

  /** Returns whether accident detection is enabled in the native SDK. */
  isAccidentDetectionEnabled(): Promise<boolean>;

  // Tags

  /**
   * @deprecated Future Tags are deprecated on iOS and Android. Use the Properties
   * APIs instead; this method remains only for backwards compatibility.
   */
  getFutureTrackTags(): Promise<{ status: string; tags: Tag[] }>;

  /**
   * @deprecated Future Tags are deprecated on iOS and Android. Use the Properties
   * APIs instead; this method remains only for backwards compatibility.
   */
  addFutureTrackTag(
    tag: string,
    source?: string
  ): Promise<{ status: string; tag: Tag }>;

  /**
   * @deprecated Future Tags are deprecated on iOS and Android. Use the Properties
   * APIs instead; this method remains only for backwards compatibility.
   */
  removeFutureTrackTag(
    tag: string,
    source?: string
  ): Promise<{ status: string; tag: Tag }>;

  /**
   * @deprecated Future Tags are deprecated on iOS and Android. Use the Properties
   * APIs instead; this method remains only for backwards compatibility.
   */
  removeAllFutureTrackTags(): Promise<string>;

  // Speed violations

  /**
   * Enables speed limit monitoring and configures speed violation parameters.
   */
  registerSpeedViolations(params: {
    speedLimitKmH: number;
    speedLimitTimeout: number;
  }): Promise<void>;

  // iOS only

  /** iOS only: returns whether aggressive heartbeat mode is enabled. */
  isAggressiveHeartbeats(): Promise<boolean>;

  /** iOS only: enables or disables aggressive heartbeat mode. */
  setAggressiveHeartbeats(enable: boolean): Promise<void>;

  /** iOS only: disables or enables user-initiated tracking. */
  setDisableTracking(value: boolean): Promise<void>;

  /** iOS only: returns whether user-initiated tracking is disabled. */
  isDisableTracking(): Promise<boolean>;

  /** iOS only: returns whether the native SDK considers current location accuracy insufficient. */
  isWrongAccuracyState(): Promise<boolean>;

  /**
   * iOS only: requests "Always" location permission from the system.
   * Use only in a custom permission flow; do not request the same permission
   * separately while the native permissions wizard is running.
   */
  requestIOSLocationAlwaysPermission(): Promise<void>;

  /**
   * iOS only: requests Motion/Fitness permission from the system.
   * Use only in a custom permission flow; do not request the same permission
   * separately while the native permissions wizard is running.
   */
  requestIOSMotionPermission(): Promise<void>;

  /**
   * iOS only: applies partial copy and visual configuration to the iOS SDK 7.2
   * wizard. It guides Location While Using, Location Always, and Motion & Fitness;
   * omitted fields retain native defaults. Call before {@link showPermissionWizard}.
   */
  configureIosPermissionWizard(
    configuration: IosPermissionWizardConfiguration
  ): Promise<void>;

  /**
   * iOS only: applies partial copy and visual configuration to the alert shown
   * when required permissions are missing or revoked. Omitted fields retain
   * native defaults. Call before enabling the alert or invoking tracking flows.
   */
  configureIosMissingPermissionsAlert(
    configuration: IosMissingPermissionsAlertConfiguration
  ): Promise<void>;

  /** iOS only: enables or disables the configured missing-permissions alert. */
  setIosMissingPermissionsAlertEnabled(enabled: boolean): Promise<void>;

  /** iOS only: returns the API language configured in the native SDK. */
  getApiLanguage(): Promise<ApiLanguage>;

  /** iOS only: sets the API language used by the native SDK. */
  setApiLanguage(language: ApiLanguage): Promise<void>;

  // Android only

  /**
   * Android only: enables or disables SDK autostart behavior.
   *
   * @param params.enable Whether autostart is enabled.
   * @param params.permanent Whether the choice should be persisted permanently.
   */
  setAndroidAutoStartEnabled(params: {
    enable: boolean;
    permanent: boolean;
  }): Promise<void>;

  /** Android only: returns whether SDK autostart is enabled. */
  isAndroidAutoStartEnabled(): Promise<boolean>;
}

/** Creates a high-level JS wrapper around the native Telematics SDK module. */
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
  getDeviceIdRegistrationState() {
    return this.native.getDeviceIdRegistrationState() as Promise<DeviceIdRegistrationState>;
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
  startTrackAsPersistent() {
    return this.native.startTrackAsPersistent();
  }
  stopManualTracking() {
    return this.native.stopManualTracking();
  }
  setMaxPersistentTrackingInterval(minutes: number) {
    return this.native.setMaxPersistentTrackingInterval(minutes);
  }
  getMaxPersistentTrackingInterval() {
    return this.native.getMaxPersistentTrackingInterval();
  }
  setTrackingMode(trackingMode: TrackingMode) {
    return this.native.setTrackingMode(trackingMode);
  }
  getTrackingMode() {
    return this.native.getTrackingMode() as Promise<TrackingMode>;
  }
  getTrackingState() {
    return this.native.getTrackingState() as Promise<TrackingState>;
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

  showPermissionWizard(options: AndroidPermissionWizardOptions = {}) {
    return this.native.showPermissionWizardWithOptions(
      options.themeMode ?? 'system',
      options.blockEarlyExit ?? false,
      options.skipWizardPages ?? false
    );
  }

  setProperties(properties: StringDictionary) {
    return this.native.setProperties(JSON.stringify(properties));
  }
  async getProperties(): Promise<StringDictionary> {
    return JSON.parse(await this.native.getProperties()) as StringDictionary;
  }
  clearProperties() {
    return this.native.clearProperties();
  }
  setSubUnits(subUnits: StringDictionary) {
    return this.native.setSubUnits(JSON.stringify(subUnits));
  }
  async getSubUnits(): Promise<StringDictionary> {
    return JSON.parse(await this.native.getSubUnits()) as StringDictionary;
  }
  clearSubUnits() {
    return this.native.clearSubUnits();
  }
  addActivityLog(text: string, data: StringDictionary) {
    return this.native.addActivityLog(text, JSON.stringify(data));
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
  setAccidentDetectionEnabled(enable: boolean) {
    return this.native.setAccidentDetectionEnabled(enable);
  }
  isAccidentDetectionEnabled() {
    return this.native.isAccidentDetectionEnabled();
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
  removeFutureTrackTag(tag: string, source?: string) {
    return this.native.removeFutureTrackTag(tag, source ?? null) as Promise<{
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

  isAggressiveHeartbeats() {
    return this.native.isAggressiveHeartbeats();
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
  configureIosPermissionWizard(
    configuration: IosPermissionWizardConfiguration
  ) {
    return this.native.configureIosPermissionWizard(
      JSON.stringify(configuration)
    );
  }
  configureIosMissingPermissionsAlert(
    configuration: IosMissingPermissionsAlertConfiguration
  ) {
    return this.native.configureIosMissingPermissionsAlert(
      JSON.stringify(configuration)
    );
  }
  setIosMissingPermissionsAlertEnabled(enabled: boolean) {
    return this.native.setIosMissingPermissionsAlertEnabled(enabled);
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
