# Migration Guide: Raxel+ → Telematics SDK (iOS & Android)

This guide summarizes the migration performed in this repo and how to adapt your app if you used Raxel+ previously.

## Overview
- Replaced legacy Raxel+ usages with the new Telematics SDK wrapper for React Native.
- Unified minimal API surface across iOS and Android.
- Updated Android build to be compatible with `androidx.work:work-runtime(–ktx) 2.10.0`.

## iOS
### What changed
- Swift bridge (`ios/TelematicsSdk.swift`) now calls `TelematicsSDK.RPEntry` directly.
- Exposed methods (Promises/events):
  - `initialize()`
  - `requestPermissions()`
  - `enable(token: string)`
  - `getStatus()`
  - `getDeviceToken()`
  - `disable()`
  - Tags API: `addFutureTrackTag(tag, source?)`, `getFutureTrackTags()`, `removeFutureTrackTag(tag)`, `removeAllFutureTrackTags()`
  - `startPersistentTracking()`
  - `startTracking()`
  - `stopTracking()`
- Low Power event: `onLowPowerModeEnabled` via `RCTEventEmitter`.

### Removed/retired
- Old Promise/Tags delegate Swift files not required by the new SDK.

### Permissions
- `requestPermissions()` launches the SDK wizard and resolves to `true/false`.
- Ensure iOS usage descriptions exist in `Info.plist` (Location, Bluetooth, Motion) — present in the example app.

## Android
### What changed
- Example app uses the same JS/TS API as iOS.
- Build updates to satisfy WorkManager 2.10.0:
  - `compileSdkVersion = 35`
  - Android Gradle Plugin `8.6.1` (Gradle wrapper `8.8`) 

### Notes
- No runtime API differences vs iOS for the exposed surface above.

## JS/TS usage (common)
```ts
import TelematicsSdk from 'react-native-telematics';

await TelematicsSdk.initialize();
const granted = await TelematicsSdk.requestPermissions();
if (granted) {
  await TelematicsSdk.enable('<device_token>');
}
const status = await TelematicsSdk.getStatus();
const token = await TelematicsSdk.getDeviceToken();

await TelematicsSdk.addFutureTrackTag('my-tag', 'source');
const tags = await TelematicsSdk.getFutureTrackTags();
await TelematicsSdk.removeFutureTrackTag('my-tag');
await TelematicsSdk.removeAllFutureTrackTags();

await TelematicsSdk.startPersistentTracking();
```

## Known differences vs legacy
- Some legacy helper classes were removed; equivalents are handled internally by `RPEntry` and `RPAPIEntry`.
- Status snapshot helpers were not included in the final API (can be re-added if needed as a separate bridge method).

## Troubleshooting
- iOS permissions wizard not showing: ensure `initialize()` is called on startup and `Info.plist` usage strings are present.
- Android AAR metadata error (WorkManager 2.10.0): install Android SDK 35 and rebuild (`./gradlew clean`).
- If you customized launch screens, follow `DOCS-SPLASH-SETUP.md`.
