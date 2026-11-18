# Changelog

All notable changes to this repository are documented here.

## [3.2.0] - pre-release
Pre-release for early integration, built on native SDKs that are not published
yet: TelematicsSDK **7.3.0-rc10** (iOS) and `com.telematicssdk:tracking`
**4.2.0** (Android). Both ship inside the package; the switch back to the
public SPM and Maven repositories happens once they are released.

**Native SDKs**
- iOS: TelematicsSDK 7.3.0-rc10 is vendored as
  `ios/Frameworks/TelematicsSDK.xcframework` instead of being pulled with
  `spm_dependency`; CocoaPods embeds it like any other pod framework. The Expo
  config plugin no longer adds the SPM app-target fix to the Podfile, which
  would otherwise attach the old remote package and put two copies of
  TelematicsSDK into the app. **Expo projects upgrading from 3.1.x should run
  `npx expo prebuild --clean`**; without it the plugin removes the 3.1.x
  Podfile block and the package reference on the next `pod install`.
- Android: `tracking:4.2.0` ships as a local Maven repository in
  `android/maven`. The host app must declare it (see README, Android step 2);
  the Expo config plugin does this for you in place of the S3 repository.

**Android: initialize the SDK in `Application.onCreate()`**
- Added `TelematicsSdkInitializer.initialize(context)`. Call it from
  `MainApplication.onCreate()`; the Expo config plugin adds the call. The SDK's
  tracking service can be restarted by the system with no UI and no JS (a
  sticky restart after the process was killed, a reboot), and with JS-only
  initialization that process crashed in a loop with "SDK not initialized".
  `initializeSdk()` from JS still works; once this ran it no longer
  initializes anything.

**New API (both platforms)**
- `getSdkConfigs()` returns `SdkConfigs`: the server-side configuration that
  now drives accident detection, heartbeats, live tracking and sensor sampling
  rates (`sensors.accelerometer.rateHz`, `sensors.gyroscope.rateHz`,
  `accidents.bufferRawSamplesMode`).
- `refreshSdkConfig()` asks the SDK to refetch it and resolves a boolean:
  on Android `false` when the device ID is invalid or a refresh was already
  queued within the last minute; on iOS always `true`.
- `getHeartbeatsCount()` and `getLastHeartbeatsSyncDate()`.
- iOS only: `setIosAutoStartEnabled()` / `isIosAutoStartEnabled()` (Android
  keeps `setAndroidAutoStartEnabled()` / `isAndroidAutoStartEnabled()`).

**Android: R8 consumer rules**
- The module now ships `consumer-rules.pro` with `-dontwarn` rules for the
  optional netty modules and logging backends that the SDK's MQTT client
  references but does not use. Without them R8 failed with "Missing classes
  detected" on every minified release build, e.g. on Expo SDK 58, whose
  template enables minification by default. Not new in 4.2.0: 4.1.0 had the
  same gap.

**Breaking**
- Removed `isRTLDEnabled()`. Both SDKs now control real-time data through the
  SDK configuration; read `(await getSdkConfigs()).liveTracking.enabled`.

**Changed / deprecated**
- `setAccidentDetectionEnabled()` is a no-op on both platforms: accident
  detection comes from the SDK configuration. `isAccidentDetectionEnabled()`
  returns the effective value.
- `getDeviceIdRegistrationState()` is deprecated in favour of `getSdkConfigs()`
  (`user.status`, `deviceId`).
- iOS: `setDisableTracking()` / `isDisableTracking()` are deprecated in favour
  of `setIosAutoStartEnabled()` / `isIosAutoStartEnabled()` (inverted meaning)
  and run on the new native API; `setDisableTracking(true)` still stops the
  active trip, as before.
- iOS: `isAggressiveHeartbeats()` / `setAggressiveHeartbeats()` are deprecated
  (deprecated in SDK 7.3.0 without a replacement); they keep working for now.

## [3.1.2]
- Fixed Android builds failing on EAS and other hosted CI while succeeding
  locally. `com.telematicssdk:tracking:4.1.0` declares `minCompileSdk=37` in its
  AAR metadata, which forced `compileSdk 37` — and Android SDK Platform 37 is
  preview-channel only, installable locally with `sdkmanager --channel=3` but
  not on Expo's build machines. Nothing in the AAR actually needs API 37: its
  highest transitive requirement is 36 (`androidx.activity 1.13.0`), its
  bytecode references no class added in API 37, and its resources stop at
  `values-v31`. The package now targets stable `compileSdk 36` and skips the AAR
  metadata check via `android.experimental.disableCompileSdkChecks=true`, which
  the Expo config plugin sets automatically. Verified by building the example
  app in both debug and release, and by building Expo SDK 55 and Expo SDK 57
  apps through `expo prebuild` against an Android SDK installation with
  Platform 37 removed. Apps that prefer `compileSdk 37` can still use it by
  setting `TelematicsSdk_compileSdkVersion=37`.
- Fixed the Android module ignoring the host app's `compileSdk`. It read only
  `TelematicsSdk_compileSdkVersion` and otherwise fell back to a hard-coded
  value, so an app on `compileSdk 37` still built this module on the fallback.
  It now inherits the app's `compileSdkVersion` when no module-specific
  override is set.

## [3.1.1]
- Added support for React Native 0.83 and newer, covering Expo SDK 55, 56 and
  57. Verified building and running on React Native 0.83.10, 0.85.3 and 0.86.3
  across an Android emulator and an iOS simulator. The `react-native` peer
  dependency range is now `>=0.83.0`.
- Added an Expo config plugin, so projects using Continuous Native Generation
  get a complete integration from `expo prebuild` without hand-editing the
  generated `ios` and `android` projects. It wires the iOS AppDelegate and, on
  scene-based projects, the SceneDelegate, the Info.plist background modes and
  usage descriptions, dynamic framework linkage, and the Android Gradle
  settings the native SDK requires. Every edit is idempotent and survives
  `expo prebuild --clean`.
- Added JavaScript-side SDK initialization on iOS, so `initializeSdk()` now
  behaves the same way on both platforms. Native initialization in the
  AppDelegate remains required for background tracking.
- Added a dedicated `SDK_NOT_INITIALIZED` rejection to the iOS bridge, so calls
  made before initialization report the cause instead of failing opaquely.
- Added build-time diagnostics for the Android toolchain: the compileSdk error
  now names every setting needed to resolve it, and a Kotlin Gradle Plugin
  check reports version mismatches with the remedy for both bare React Native
  and Expo projects.
- Documented the Android host-app requirements in full: the Telematics Maven
  repository, compileSdk 37, the Kotlin toolchain settings for each project
  type, core library desugaring, and the packaging excludes.
- Reworked the README into two explicit integration paths, Expo and bare React
  Native, each with an end-to-end sequence from install through to recording
  trips.
- Added the TelematicsSDK Swift Package to the application target during
  `expo prebuild`, through a `post_install` hook injected into the generated
  Podfile, so Expo projects get a runnable iOS build without hand-editing
  Xcode. React Native's `spm_dependency(...)` helper attaches the package to
  the CocoaPods pod target only, which is why the app target needs it added
  separately; bare React Native projects do this once by hand in Xcode.
- Added per-Expo-SDK support for the iOS scene lifecycle that iOS 26 and
  newer require. The plugin adds the SceneDelegate forwards automatically on
  Expo SDK 58 and newer, where `expo prebuild` generates `SceneDelegate.swift`
  itself; on Expo SDK 57, where scene adoption is opt-in through
  `expo-build-properties` and Expo supplies its own scene delegate, it
  reports a clear `expo prebuild` error with the SceneDelegate to add.
  Expo SDK 55 and 56 have no scene support and are unaffected. Bare React
  Native continues to be handled by the existing AppDelegate/SceneDelegate
  detection.
- Kept Telematics iOS SDK v7.2.0 and Android SDK v4.1.0.

## [3.1.0]
- Added Telematics iOS SDK v7.2.0 and Android SDK v4.1.0 support.
- Updated the React Native plugin and example app to React Native v0.86.0.
- Added Android 4.1 permissions wizard options and iOS 7.2 wizard and
  missing-permissions-alert configuration APIs.
- Added properties, sub-units, and activity-log APIs.
- Deprecated Future Tags APIs; they remain available only for backwards
  compatibility. New integrations should use Properties APIs, and Future Tags
  are no longer shown in the example app.
- Updated Android configuration to compileSdk 37, minSdk 24, targetSdk 36,
  desugar_jdk_libs 2.1.5, Gradle 8.13, AGP 8.12.0, and Kotlin 2.3.21.

## [3.0.1]
- Fixed Future Track tag callbacks on Android to resolve React Native promises on the UI queue.
- Fixed Android Future Track tag calls to preserve nullable `source` values and safely handle empty tag lists.
- Added concurrency guards for pending Android Future Track tag operations.
- Added optional `source` parameter to `removeFutureTrackTag` for API compatibility across platforms.
- Fixed iOS Future Track tag add/remove calls to pass nullable `source` through to the native SDK.

## [3.0.0]
- Added support Telematics iOS SDK v7.1.0.
- Added support Telematics Android SDK v4.0.0.
- Added support React Native New Architecture (TurboModule).
- Migrated native Telematics iOS SDK from CocoaPods to Swift Package Manager.

## [2.0.1]
### Android updates
- Motion detection algorithms update 
- Implemented continuation of track recording after SDK reboot 
- Added database protection against corruption 
- Enhance SDK Logging 
- All Bluetooth-related permissions will be removed from the SDK:
  android.permission.BLUETOOTH_CONNECT
  android.permission.BLUETOOTH_SCAN
  android.permission.BLUETOOTH
  android.permission.BLUETOOTH_ADMIN
  android.permission.FOREGROUND_SERVICE_CONNECTED_DEVICE 
- All health-related permissions will be removed from the SDK:
  android.permission.FOREGROUND_SERVICE_HEALTH
  So you don't need to remove anything else from your app-level manifest.
  And all our Foreground services will run with only one type: location 
- Other changes related to improving reliability and stability
### iOS updates
- Support Xcode 26.4 (fix ftm library issue)

## [2.0.0]
- Added all public APIs from native SDKs. Sync APIs naming.

## [1.1.0]
### Added
- iOS: Launch screen now shows a centered Image View bound to the `DamoovLogo` asset.
- Android: Native splash via `@drawable/splash` with centered `@drawable/damoov_logo`.

### Changed
- Example app UI moved to a blue/teal palette:
  - primary: `#007AFF`, secondary: `#5AC8FA`, danger/success use `#007AFF`.
- Input styling updated to a lighter blue background and border.
- Android build updated to satisfy `androidx.work:2.10.0` AAR requirements:
  - `compileSdkVersion` → 36 (example app).
  - Android Gradle Plugin → `8.6.1` (Gradle wrapper already `8.8`).

### Migration
- Migrated from Raxel+ integrations to the new Telematics SDK wrapper on both platforms:
  - iOS: Reworked Swift bridge (`ios/TelematicsSdk.swift`) to use `TelematicsSDK.RPEntry` API
    - Methods exposed: `initialize`, `requestPermissions`, `enable`, `getStatus`, `getDeviceToken`, `disable`, tags API, `startPersistentTracking`, `startTracking`, `stopTracking`.
    - Removed legacy Swift files no longer needed by the new SDK (e.g., old Promise/Tags delegates).
  - Android: Aligned example app configuration and Gradle with the new SDK; ensured compatibility with WorkManager 2.10.0 via `compileSdkVersion 35`.
