# Telematics SDK

A React Native wrapper for tracking the person's driving behavior such as speeding, turning, braking and several other things on iOS and Android.

Disclaimer: This project uses Telematics SDK which belongs to DATA MOTION PTE. LTD. When using Telematics SDK refer to these [terms of use](https://docs.telematicssdk.com/license)

Here you can find short video guides, how to add React Native Telematics SDK to your iOS and Android apps:

[![Watch the video](https://github.com/Mobile-Telematics/telematicsSDK-demoapp-react/blob/main/iOS%20React%20Native%20Telematics%20SDK.png)](https://youtu.be/qHAaAw_-IXI)

[![Watch the video](https://github.com/Mobile-Telematics/telematicsSDK-demoapp-react/blob/main/iOS%20React%20Native%20Telematics%20SDK.png)](https://youtu.be/kZecA6hQi0Q)

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

## Getting started

---

### Initial app setup & credentials

---

For commercial use, you need create a developer workspace in [DataHub](https://userdatahub.com/user/registration) and get InstanceId and InstanceKey auth keys to work with our API.

### Android

---

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

Add repository into (module)/gradle.build

```groovy
dependencies {
    //...
    implementation "com.telematicssdk:tracking: x.x.x"
}
```

### iOS

---

Add permissions in your project's ios/Runner/Info.plist:

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
  addOnLowPowerModeListener,
  addOnLocationChangedListener,
  addOnTrackingStateChangedListener,
  addOnWrongAccuracyAuthorizationListener,
  addOnRtldColectedData,
  addOnSpeedViolationListener,
} from "react-native-telematics";
```

### SDK initializing
```js
// Must be called before any other API
await TelematicsSdk.initialize();
```

```js
// Returns whether the native SDK is initialized
const initialized = await TelematicsSdk.isInitialized();
```

### Device Id (virtual token)
```js
// Get current device id/token
const deviceId = await TelematicsSdk.getDeviceId();
```

```js
// Set device id/token
await TelematicsSdk.setDeviceId("YOUR_DEVICE_ID");
```

### Logout
```js
// Performs a full logout and disable SDK
await TelematicsSdk.logout();
```

### Permissions & Sensors
```js
// Checks whether all required permissions and sensors are granted/available
const allGranted = await TelematicsSdk.isAllRequiredPermissionsAndSensorsGranted();
```

```js
// Shows the native permissions wizard UI
// Returns `true` when all required permissions are granted after the wizard
const isGranted = await TelematicsSdk.showPermissionWizard(false, false);
```

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
// Start persistent tracking (continues across background/app restarts)
await TelematicsSdk.startManualPersistentTracking();
```

```js
// Stop tracking
await TelematicsSdk.stopManualTracking();
```

```js
// Check tracking state
const tracking = await TelematicsSdk.isTracking();
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
await TelematicsSdk.sendCustomHeartbeats("RN_HEARTBEAT_TEST");
```

### Future Tags API
```js
// Add future tag
const addResult = await TelematicsSdk.addFutureTrackTag("future_tag_name", "future_tag_source");
```

```js
// Get all future tags
const tagsResult = await TelematicsSdk.getFutureTrackTags();
```

```js
// Remove single future tag
const removeResult = await TelematicsSdk.removeFutureTrackTag("future_tag_name");
```

```js
// Remove all future tags
const clearResult = await TelematicsSdk.removeAllFutureTrackTags();
```

### Accident detection
```js
// Enable or disable accident detection
await TelematicsSdk.enableAccidents(true);
await TelematicsSdk.enableAccidents(false);
```

```js
// Check accident detection status
const accidentsEnabled = await TelematicsSdk.isEnabledAccidents();
```

```js
// Set accident detection sensitivity
await TelematicsSdk.setAccidentDetectionSensitivity(AccidentDetectionSensitivity.Normal);
await TelematicsSdk.setAccidentDetectionSensitivity(AccidentDetectionSensitivity.Sensitive);
await TelematicsSdk.setAccidentDetectionSensitivity(AccidentDetectionSensitivity.Tough);
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
  console.log("Low power mode:", enabled);
});

// Don't forget to remove listener
lowPowerSub.remove();
```

### Location changed (cross-platform)

```js
const locationSub = addOnLocationChangedListener(({ latitude, longitude }) => {
  console.log("Location:", latitude, longitude);
});

// Don't forget to remove listener
locationSub.remove();
```

### Tracking state changed (cross-platform)

```js
const trackingSub = addOnTrackingStateChangedListener((state) => {
  console.log("Tracking state:", state);
});

// Don't forget to remove listener
trackingSub.remove();
```

### Speed violation (cross-platform)

```js
const speedSub = addOnSpeedViolationListener((event) => {
  console.log("Speed violation:", event);
});

// Don't forget to remove listener
speedSub.remove();
```

### Wrong accuracy authorization (iOS only)

```js
const wrongAccuracySub = addOnWrongAccuracyAuthorizationListener(() => {
  console.log("Wrong accuracy authorization (iOS)");
});

// Don't forget to remove listener
wrongAccuracySub.remove();
```

### RTLD data collected (iOS only)

```js
const rtldCollectedSub = addOnRtldColectedData(() => {
  console.log("RTLD data collected (iOS)");
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
const aggressive = await TelematicsSdk.isAggressiveHeartbeat();
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
await TelematicsSdk.setAndroidAutoStartEnabled({ enable: true, permanent: true });
const autoStartEnabled = await TelematicsSdk.isAndroidAutoStartEnabled();
```