# Changelog

All notable changes to this repository are documented here.

## [Unreleased]
- TBD

## [1.1.0] - 2025-10-31
### Added
- iOS: Launch screen now shows a centered Image View bound to the `DamoovLogo` asset.
- Android: Native splash via `@drawable/splash` with centered `@drawable/damoov_logo`.

### Changed
- Example app UI moved to a blue/teal palette:
  - primary: `#007AFF`, secondary: `#5AC8FA`, danger/success use `#007AFF`.
- Input styling updated to a lighter blue background and border.
- Android build updated to satisfy `androidx.work:2.10.0` AAR requirements:
  - `compileSdkVersion` → 35 (example app).
  - Android Gradle Plugin → `8.6.1` (Gradle wrapper already `8.8`).

### Migration
- Migrated from Raxel+ integrations to the new Telematics SDK wrapper on both platforms:
  - iOS: Reworked Swift bridge (`ios/TelematicsSdk.swift`) to use `TelematicsSDK.RPEntry` API
    - Methods exposed: `initialize`, `requestPermissions`, `enable`, `getStatus`, `getDeviceToken`, `disable`, tags API, `startPersistentTracking`.
    - Removed legacy Swift files no longer needed by the new SDK (e.g., old Promise/Tags delegates).
  - Android: Aligned example app configuration and Gradle with the new SDK; ensured compatibility with WorkManager 2.10.0 via `compileSdkVersion 35`.
