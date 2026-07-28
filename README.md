# Telematics SDK

A React Native wrapper for tracking the person's driving behavior such as speeding, turning, braking and several other things on iOS and Android.

## Version 3.1.0 compatibility

---

- React Native: `0.86.0`
- iOS native SDK: `7.2.0`; iOS deployment target: `15.1`
- Android native SDK: `4.1.0`; `compileSdk 37`, `minSdk 24`, and `targetSdk 36`
- The example app uses the standard React Native 0.86 Android toolchain (Gradle
  `8.13` and Android Gradle Plugin `8.12.0`) without local Gradle patches.

The Android permission-wizard activity is supplied by the plugin manifest and is
merged automatically by React Native autolinking. Do not declare it in the host
app manually.

The Android wizard notification and UI strings, images, colours, and dimensions
can be overridden with standard Android app resources. See [Android app
resources](https://docs.damoov.com/docs/android-app-resources).

Here you can find short video guides, how to add React Native Telematics SDK to your iOS and Android apps:

[Watch the video](https://youtu.be/qHAaAw_-IXI)

[Watch the video](https://youtu.be/kZecA6hQi0Q)

## AI agent integration skill

**We provide an AI agent skill that helps integrate Damoov TelematicsSDK into RN applications.** The skill can guide coding agents such as Claude Code, OpenAI Codex, and other AI coding tools through verified TelematicsSDK integration patterns, including dependency setup, lifecycle forwarding, tracking flows, tags, and migration away from deprecated APIs.

Skill repository: [Mobile-Telematics/telematics-sdk-skills](https://github.com/Mobile-Telematics/telematics-sdk-skills).

## Example app

---

To run a TelematicsSdkExample application make sure that you have Node.js LTS version installed or install it from the official Node.js [site](https://nodejs.org/uk/). Also, make sure that you correctly configured the development environment according to [React Native site](https://reactnative.dev/docs/environment-setup) instructions.

TelematicsSdkExample application is located in example directory

### Inside the project folder install dependencies

```sh
yarn
```

### To run an Android example

```sh
yarn example android

     -- or --

cd example
npx react-native run-android
```

### To run an iOS example

```sh
yarn example ios

     -- or --

cd example
npx react-native run-ios
```

## Installation

---

```sh
yarn add react-native-telematics
```

or:

```sh
npm install react-native-telematics
```

For iOS, install pods after adding the package:

```sh
cd ios
pod install
```

For Android, React Native autolinking connects the native module automatically. Rebuild the app after installing the package:

```sh
npx react-native run-android
```

If Metro was already running, restart it with cache reset:

```sh
npx react-native start --reset-cache
```

## Importing the library into your app

---

Import the default SDK instance from `react-native-telematics`. Named exports provide enums and event listener helpers:

```js
import { useEffect } from 'react';
import { Platform } from 'react-native';
import TelematicsSdk, {
  TrackingMode,
  addOnLocationChangedListener,
  addOnLowPowerModeListener,
  addOnRtldColectedData,
  addOnSpeedViolationListener,
  addOnTrackingStateChangedListener,
  addOnWrongAccuracyAuthorizationListener,
} from 'react-native-telematics';
```

Initialize the SDK once when your app starts, then set the virtual device id/token that you received from your backend or DataHub flow:

```js
export function App() {
  useEffect(() => {
    const subscriptions: Array<{ remove: () => void }> = [];

    const initTelematics = async () => {
      await TelematicsSdk.initializeSdk();

      const initialized = await TelematicsSdk.isInitializedSdk();
      if (!initialized) {
        return;
      }

      await TelematicsSdk.setDeviceId('YOUR_DEVICE_ID');

      const permissionsGranted = await TelematicsSdk.showPermissionWizard();

      if (permissionsGranted) {
        await TelematicsSdk.setEnableSdk(true);
        await TelematicsSdk.startManualTracking();
      }
    };

    initTelematics().catch(console.error);

    subscriptions.push(
      addOnLocationChangedListener(({ latitude, longitude }) => {
        console.log('Location changed:', latitude, longitude);
      })
    );

    subscriptions.push(
      addOnTrackingStateChangedListener((isTracking) => {
        console.log('Tracking state changed:', isTracking);
      })
    );

    subscriptions.push(
      addOnSpeedViolationListener((event) => {
        console.log('Speed violation:', event);
      })
    );

    if (Platform.OS === 'ios') {
      subscriptions.push(
        addOnLowPowerModeListener(({ enabled }) => {
          console.log('Low power mode:', enabled);
        })
      );

      subscriptions.push(
        addOnWrongAccuracyAuthorizationListener(() => {
          console.log('Wrong location accuracy authorization');
        })
      );

      subscriptions.push(
        addOnRtldColectedData(() => {
          console.log('RTLD data collected');
        })
      );
    }

    return () => {
      subscriptions.forEach((subscription) => subscription.remove());
    };
  }, []);

  return null;
}
```

Platform-specific listeners must only be registered on the matching platform. For example, `addOnLowPowerModeListener`, `addOnWrongAccuracyAuthorizationListener`, and `addOnRtldColectedData` are iOS-only.

## Getting started

---

### Initial app setup & credentials

---

For commercial use, you need create a developer workspace in [DataHub](https://userdatahub.com/user/registration) and get InstanceId and InstanceKey auth keys to work with our API.

### Android

---

The Android SDK keeps a foreground notification to comply with Android background execution requirements. You can customize the notification text and icons from your app resources.

Follow this way to configure it: [
Assets for Android apps](https://docs.damoov.com/docs/android-sdk-integration)

Add permissions in your project's AndroidManifest.xml:

```xml
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
```

Remove from your app AndroidManifest.xml line:

```xml
    android:allowBackup="true"
```

Version 3.1.0 brings the Android SDK transitively through the React Native
plugin; do not add a separate `com.telematicssdk:tracking` dependency to the
host app. If the host application overrides Android SDK versions, keep them at
or above `compileSdk 37`, `minSdk 24`, and `targetSdk 36`.

### iOS

---

Add permissions in your app's `ios/<App>/Info.plist`:

```xml
<key>UIBackgroundModes</key>
<array>
    <string>fetch</string>
    <string>location</string>
    <string>remote-notification</string>
</array>
<key>NSMotionUsageDescription</key>
<string>Please, provide permissions for this Demo</string>
<key>NSLocationWhenInUseUsageDescription</key>
<string>Please, provide permissions for this Demo</string>
<key>NSLocationAlwaysUsageDescription</key>
<string>Please, provide permissions for this Demo</string>
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>Please, provide permissions for this Demo</string>
```

In iOS 13 and later, adding a BGTaskSchedulerPermittedIdentifiers key to the Info.plist disables the application:performFetchWithCompletionHandler: and setMinimumBackgroundFetchInterval: methods.

```xml
<key>BGTaskSchedulerPermittedIdentifiers</key>
		<array>
    	<string>sdk.damoov.apprefreshtaskid</string>
    	<string>sdk.damoov.appprocessingtaskid</string>
		</array>
```

And run in your project ios folder:

```sh
pod install
```

#### iOS dependency manager notes (CocoaPods + Swift Package Manager)

This React Native wrapper uses **CocoaPods** for React Native iOS integration, but the native **TelematicsSDK** itself is pulled via **Swift Package Manager** (SPM) using React Native's `spm_dependency` support.

Because TelematicsSDK is a **dynamic framework**, and many apps call TelematicsSDK from both:

- the **React Native module** (this package), and
- the app's **AppDelegate / SceneDelegate** (native project code),

we recommend the following integration.

##### Option 1 (recommended): add TelematicsSDK via SPM to your app target

1. In your app `ios/Podfile`, enable dynamic frameworks:

- `use_frameworks! :linkage => :dynamic`

2. In Xcode, add the TelematicsSDK SPM package to your **app target**:

- Open your `.xcworkspace`
- Select the **app project** → **Package Dependencies** → **+**
- Add package URL: `https://github.com/Mobile-Telematics/telematicsSDK-iOS-new-SPM.git`
- Select product **TelematicsSDK**
- Set dependency rule to **Exact Version** and use version **7.2.0**
- Ensure it’s added to your **app target** (not only to Pods targets)

3. Verify TelematicsSDK is embedded:

- Target → **General** → **Frameworks, Libraries, and Embedded Content**
- `TelematicsSDK.framework` should be present and set to **Embed & Sign**

### Lifecycle handlers

Proper application lifecycle handling is extremely important for the TelematicsSdk. In order to use SDK you need to add lifecycle handlers to your application AppDelegate and Scene Delegate:

##### App and Scene delegate methods

```swift
import TelematicsSDK


//AppDelegate
func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
    RPEntry.initializeSDK()
    RPEntry.instance.application(application, didFinishLaunchingWithOptions: launchOptions)
    return true
}

func application(_ application: UIApplication, handleEventsForBackgroundURLSession identifier: String, completionHandler: @escaping () -> Void) {
    RPEntry.instance.application(application, handleEventsForBackgroundURLSession: identifier, completionHandler: completionHandler)
}

func applicationDidReceiveMemoryWarning(_ application: UIApplication) {
    RPEntry.instance.applicationDidReceiveMemoryWarning(application)
}

func applicationWillTerminate(_ application: UIApplication) {
    RPEntry.instance.applicationWillTerminate(application)
}

func application(_ application: UIApplication, performFetchWithCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void) {
    RPEntry.instance.application(application) {
        completionHandler(.newData)
    }
}
```

If you use AppDelegate, then you have to implement next methods:

```swift
func applicationDidEnterBackground(_ application: UIApplication) {
    RPEntry.instance.applicationDidEnterBackground(application)
}

func applicationWillEnterForeground(_ application: UIApplication) {
    RPEntry.instance.applicationWillEnterForeground(application)
}

func applicationDidBecomeActive(_ application: UIApplication) {
    RPEntry.instance.applicationDidBecomeActive(application)
}
```

If you use SceneDelegate, then you have to implement next methods:

```swift
func sceneDidBecomeActive(_ scene: UIScene) {
    RPEntry.instance.sceneDidBecomeActive(scene)
}

func sceneWillEnterForeground(_ scene: UIScene) {
    RPEntry.instance.sceneWillEnterForeground(scene)
}

func sceneDidEnterBackground(_ scene: UIScene) {
    RPEntry.instance.sceneDidEnterBackground(scene)
}
```

## React Native wrapper usage

```js
import TelematicsSdk, {
  AccidentDetectionSensitivity,
  ApiLanguage,
  TrackingMode,
  addOnLowPowerModeListener,
  addOnLocationChangedListener,
  addOnTrackingStateChangedListener,
  addOnWrongAccuracyAuthorizationListener,
  addOnRtldColectedData,
  addOnSpeedViolationListener,
} from 'react-native-telematics';
```

### SDK initializing

```js
// Must be called before any other API
await TelematicsSdk.initializeSdk();
```

```js
// Returns whether the native SDK is initialized
const initialized = await TelematicsSdk.isInitializedSdk();
```

### Device Id (virtual token)

```js
// Get current device id/token
const deviceId = await TelematicsSdk.getDeviceId();
```

```js
// Get the latest device id registration state and the time it was checked
const deviceIdRegistrationState =
  await TelematicsSdk.getDeviceIdRegistrationState();
console.log(
  deviceIdRegistrationState.status,
  deviceIdRegistrationState.checkedAtMillis
);
```

```js
// Set device id/token
await TelematicsSdk.setDeviceId('YOUR_DEVICE_ID');
```

### Logout

```js
// Performs a full logout and disable SDK
await TelematicsSdk.logout();
```

### Permissions & Sensors

```js
// Checks whether all required permissions and sensors are granted/available
const allGranted =
  await TelematicsSdk.isAllRequiredPermissionsAndSensorsGranted();
```

```js
// Shows the native permissions wizard with native default appearance and behaviour.
const isGranted = await TelematicsSdk.showPermissionWizard();
```

The wizard explains why the SDK needs permissions. Do not enable tracking until
`isAllRequiredPermissionsAndSensorsGranted()` returns `true`.

`showPermissionWizard()` resolves `true` only when all required permissions and
sensors are available. On Android, it requests precise location, background
location on Android 10+, activity recognition, and battery-optimization
exclusion. Check the final merged manifest if your application overrides
permissions; the plugin contributes the wizard activity and required SDK
declarations automatically.

To customize Android, pass options to `showPermissionWizard`. `themeMode`
controls the visual appearance; `blockEarlyExit` prevents dismissing the wizard
before completion, and `skipWizardPages` omits informational pages. Both
booleans default to `false`; `themeMode` defaults to `system`. Enable
`blockEarlyExit` only when the product must keep the user in the wizard. See the
[Android SDK integration guide](https://docs.damoov.com/docs/android-sdk-integration)
for Android integration and customization details.

```js
const isGranted = await TelematicsSdk.showPermissionWizard({
  themeMode: 'system',
  blockEarlyExit: false,
  skipWizardPages: false,
});
```

On iOS, keep `showPermissionWizard()` parameterless (or use the same
cross-platform call) and customize the wizard with
`configureIosPermissionWizard`. Configure the missing-permissions alert with
`configureIosMissingPermissionsAlert` and
`setIosMissingPermissionsAlertEnabled`.

> Migration note: the two-boolean permission-wizard API from releases before
> 3.1.0 was removed. Pass an options object instead.

### Trip metadata

Use trip metadata to associate trips with business entities, such as an order,
driver, vehicle, or shift.

#### Properties

Properties are a persistent flat key-value dictionary attached to trips.

Setting Properties replaces the whole dictionary. When tracking is active,
changing the dictionary ends the current trip and starts a new trip with the
updated Properties. Passing the same dictionary does not restart tracking.

Properties remain active for subsequent trips until they are replaced or
cleared. They are cleared automatically on logout or when the device ID changes.

**Set Properties**

Sets the whole Properties dictionary. If tracking is active and the dictionary
differs from the current one, the SDK completes the current trip and starts a
new trip with the updated Properties.

```js
await TelematicsSdk.setProperties({ policy: 'standard' });
```

**Get Properties**

Returns the current Properties dictionary. Use it to inspect the active metadata
or to update one entry before setting the complete replacement dictionary.

```js
const properties = await TelematicsSdk.getProperties();
```

**Clear Properties**

Removes all Properties. If tracking is active and Properties are not already
empty, the SDK completes the current trip and starts a new trip without
Properties.

```js
await TelematicsSdk.clearProperties();
```

Properties must contain from 1 to 20 entries. Keys and values must not be empty
and must not exceed 255 characters. Use `clearProperties()` to remove all
Properties.

#### Sub-units

Sub-units are a persistent flat key-value dictionary for analytical trip
classification, for example a driver, vehicle, or session.

Setting or clearing Sub-units does not restart active tracking. Changes made
while a trip is active are applied to the next trip. Sub-units remain active
until they are replaced or cleared, and are cleared automatically on logout or
when the device ID changes.

**Set Sub-units**

Sets the whole Sub-units dictionary. This method does not restart tracking.

```js
await TelematicsSdk.setSubUnits({ vehicle: 'fleet-42' });
```

**Get Sub-units**

Returns the current Sub-units dictionary. Use it to inspect the active metadata
or to update one entry before setting the complete replacement dictionary.

```js
const subUnits = await TelematicsSdk.getSubUnits();
```

**Clear Sub-units**

Removes all Sub-units. This method does not restart tracking.

```js
await TelematicsSdk.clearSubUnits();
```

Sub-units must contain from 1 to 5 entries. Keys and values must not be empty
and must not exceed 255 characters. Use `clearSubUnits()` to remove all
Sub-units.

### Activity log

Use Activity Log to attach business events to the current active trip without
stopping or splitting it, for example a delivery, checkpoint, or depot arrival.

Activity Log entries can be added only while tracking is active. Each trip
supports up to 100 entries. The `text` parameter is required and limited to
1,000 characters. The `data` dictionary is optional; pass an empty dictionary
when no additional metadata is needed.

**Add Activity Log**

```js
await TelematicsSdk.addActivityLog('Trip started manually', {
  tripId: '42',
});
```

When Properties change during tracking, the current trip is completed. Its
existing Activity Log entries remain attached to that completed trip; the new
trip starts with an empty Activity Log.

### iOS permissions UI configuration

The following iOS-only APIs configure the permissions UI introduced in native
SDK 7.2. The wizard guides the user through *Location While Using*, *Location
Always*, and *Motion & Fitness*. Always location, precise location, and Motion
& Fitness are required for reliable automatic trip detection.

Call the configuration methods before showing the wizard or starting a tracking
flow. Each configuration is partial: omitted fields retain native defaults.

```ts
import { Platform } from 'react-native';

if (Platform.OS === 'ios') {
  await TelematicsSdk.configureIosPermissionWizard({
    locationAlways: {
      title: 'Allow location access',
      body: 'Location access lets us record your trips.',
      primaryButtonTitle: 'Continue',
    },
    lightTheme: {
      primaryElementColor: '#0066CC',
      buttonTextColor: '#FFFFFF',
    },
  });

  await TelematicsSdk.configureIosMissingPermissionsAlert({
    title: 'Permissions needed',
    body: 'Enable Location and Motion & Fitness in Settings.',
    fixInSettingsButtonTitle: 'Open Settings',
    isBlocking: false,
  });
  await TelematicsSdk.setIosMissingPermissionsAlertEnabled(true);
}
```

`IosPermissionWizardPageConfiguration` customizes the `locationWhenInUse`,
`locationAlways`, and `motion` pages. `IosPermissionWizardStatusConfiguration`
customizes the status page, including the permission-state labels and Settings
action. `IosPermissionWizardTheme` accepts all colour fields in `#RRGGBB` or
`#AARRGGBB` format for `lightTheme` and `darkTheme`. For the full native visual
customization reference, see [iOS permission
wizard](https://docs.damoov.com/docs/new-permission-wizard-in-ios).

Use the missing-permissions alert when permissions are incomplete or later
revoked. Set `isBlocking` only when the user must resolve permissions before
continuing; otherwise they can dismiss it with the configured skip action.
Disable this alert when the app provides its own permission-remediation flow.

### Enabling and disabling SDK

```js
// Enable or disable SDK globally
await TelematicsSdk.setEnableSdk(true);
await TelematicsSdk.setEnableSdk(false);
```

```js
// Check SDK enabled status
const isEnabled = await TelematicsSdk.isSdkEnabled();
```

### Tracking

```js
// Start tracking
await TelematicsSdk.startManualTracking();
```

```js
// Start one persistent manual tracking session
// Configure the 5..600 minute interval before starting it.
await TelematicsSdk.setMaxPersistentTrackingInterval(120);
await TelematicsSdk.startTrackAsPersistent();
```

```js
// Stop tracking
await TelematicsSdk.stopManualTracking();
```

```js
// Check tracking state
const tracking = await TelematicsSdk.isTracking();
```

```js
// Set and get the maximum persistent tracking session duration, in minutes
await TelematicsSdk.setMaxPersistentTrackingInterval(120);
const maxPersistentInterval =
  await TelematicsSdk.getMaxPersistentTrackingInterval();
```

```js
// Use standard or persistent mode for SDK-started and manually-started tracking
await TelematicsSdk.setTrackingMode(TrackingMode.Persistent);
const trackingMode = await TelematicsSdk.getTrackingMode();
```

```js
// Get automatic and manual tracking availability states
const trackingState = await TelematicsSdk.getTrackingState();
console.log(
  trackingState.automaticTrackingStatus,
  trackingState.manualTrackingStatus
);
```

### Trips

```js
// Upload locally stored, unsent trips
await TelematicsSdk.uploadUnsentTrips();
```

```js
// Get number of unsent trips stored locally
const unsentTripCount = await TelematicsSdk.getUnsentTripCount();
```

### Heartbeats

```js
// Send custom heartbeat with an app-defined reason
await TelematicsSdk.sendCustomHeartbeats('RN_HEARTBEAT_TEST');
```

### Future Tags API (deprecated)

> Future Tags are deprecated on iOS and Android. They remain available for
> backwards compatibility; migrate new integrations to Properties APIs.

```js
// Add future tag
const addResult = await TelematicsSdk.addFutureTrackTag(
  'future_tag_name',
  'future_tag_source'
);
```

```js
// Get all future tags
const tagsResult = await TelematicsSdk.getFutureTrackTags();
```

```js
// Remove single future tag
const removeResult = await TelematicsSdk.removeFutureTrackTag(
  'future_tag_name',
  'future_tag_source'
);
```

```js
// Remove all future tags
const clearResult = await TelematicsSdk.removeAllFutureTrackTags();
```

### Accident detection

```js
// Enable or disable accident detection
await TelematicsSdk.setAccidentDetectionEnabled(true);
await TelematicsSdk.setAccidentDetectionEnabled(false);
```

```js
// Check accident detection status
const accidentsEnabled = await TelematicsSdk.isAccidentDetectionEnabled();
```

```js
// Set accident detection sensitivity
await TelematicsSdk.setAccidentDetectionSensitivity(
  AccidentDetectionSensitivity.Normal
);
await TelematicsSdk.setAccidentDetectionSensitivity(
  AccidentDetectionSensitivity.Sensitive
);
await TelematicsSdk.setAccidentDetectionSensitivity(
  AccidentDetectionSensitivity.Tough
);
```

### RTLD (Real-Time tracking)

```js
// Check whether RTLD (real-time data logging) is enabled
const rtldEnabled = await TelematicsSdk.isRTLDEnabled();
```

### Speed violations

```js
// Configure speed limit monitoring
await TelematicsSdk.registerSpeedViolations({
  speedLimitKmH: 80,
  speedLimitTimeout: 10, // seconds
});
```

## Events (listeners)

> All listeners return a subscription with `.remove()`.

### Low Power Mode (iOS only)

```js
const lowPowerSub = addOnLowPowerModeListener(({ enabled }) => {
  console.log('Low power mode:', enabled);
});

// Don't forget to remove listener
lowPowerSub.remove();
```

### Location changed (cross-platform)

```js
const locationSub = addOnLocationChangedListener(({ latitude, longitude }) => {
  console.log('Location:', latitude, longitude);
});

// Don't forget to remove listener
locationSub.remove();
```

### Tracking state changed (cross-platform)

```js
const trackingSub = addOnTrackingStateChangedListener((state) => {
  console.log('Tracking state:', state);
});

// Don't forget to remove listener
trackingSub.remove();
```

### Speed violation (cross-platform)

```js
const speedSub = addOnSpeedViolationListener((event) => {
  console.log('Speed violation:', event);
});

// Don't forget to remove listener
speedSub.remove();
```

### Wrong accuracy authorization (iOS only)

```js
const wrongAccuracySub = addOnWrongAccuracyAuthorizationListener(() => {
  console.log('Wrong accuracy authorization (iOS)');
});

// Don't forget to remove listener
wrongAccuracySub.remove();
```

### RTLD data collected (iOS only)

```js
const rtldCollectedSub = addOnRtldColectedData(() => {
  console.log('RTLD data collected (iOS)');
});

// Don't forget to remove listener
rtldCollectedSub.remove();
```

## Platform specific

### iOS specific

```js
// Get / set API language (iOS only)
const apiLanguage = await TelematicsSdk.getApiLanguage();
await TelematicsSdk.setApiLanguage(ApiLanguage.english);
```

```js
// Aggressive heartbeat mode (iOS only)
const aggressive = await TelematicsSdk.isAggressiveHeartbeats();
await TelematicsSdk.setAggressiveHeartbeats(true);
await TelematicsSdk.setAggressiveHeartbeats(false);
```

```js
// Disable user-initiated tracking (iOS only)
await TelematicsSdk.setDisableTracking(true);
const isDisabled = await TelematicsSdk.isDisableTracking();
```

```js
// Wrong accuracy state (iOS only)
const wrongAccuracyState = await TelematicsSdk.isWrongAccuracyState();
```

```js
// Request iOS permissions (iOS only)
await TelematicsSdk.requestIOSLocationAlwaysPermission();
await TelematicsSdk.requestIOSMotionPermission();
```

### Android specific

```js
// Configure SDK autostart (Android only)
await TelematicsSdk.setAndroidAutoStartEnabled({
  enable: true,
  permanent: true,
});
const autoStartEnabled = await TelematicsSdk.isAndroidAutoStartEnabled();
```
