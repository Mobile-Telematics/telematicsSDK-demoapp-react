# Changelog

All notable changes to this repository are documented here.

## [3.0.0]
### Changed
- Migrated the library and example app to React Native New Architecture.
- Switched the JS bridge implementation to TurboModule/codegen-based bindings.

### Breaking changes
- `registerSpeedViolations` now accepts positional arguments:
  `registerSpeedViolations(speedLimitKmH, speedLimitTimeout)`
  instead of
  `registerSpeedViolations({ speedLimitKmH, speedLimitTimeout })`
- `setAndroidAutoStartEnabled` now accepts positional arguments:
  `setAndroidAutoStartEnabled(enable, permanent)`
  instead of
  `setAndroidAutoStartEnabled({ enable, permanent })`

### Migration
- Replace object-style calls for the two methods above with positional arguments.

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
