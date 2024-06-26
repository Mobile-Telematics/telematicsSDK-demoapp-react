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

### lifecycle handlers

---

Proper application lifecycle handling is extremely important for the TelematicsSdk. In order to use SDK you need to add lifecycle handlers to your application AppDelegate.mm:

```obj-c
// AppDelegate.mm

#import <RaxelPulse/RaxelPulse.h>

// ....

- (void)application:(UIApplication *)application handleEventsForBackgroundURLSession:(nonnull NSString *)identifier completionHandler:(nonnull void (^)(void))completionHandler {
    [RPEntry application:application handleEventsForBackgroundURLSession:identifier completionHandler:completionHandler];
}

- (void)applicationDidReceiveMemoryWarning:(UIApplication *)application {
    [RPEntry applicationDidReceiveMemoryWarning:application];
}

- (void)applicationWillTerminate:(UIApplication *)application {
    [RPEntry applicationWillTerminate:application];
}

- (void)applicationDidEnterBackground:(UIApplication *)application {
    [RPEntry applicationDidEnterBackground:application];
}

- (void)applicationDidBecomeActive:(UIApplication *)application {
    [RPEntry applicationDidBecomeActive:application];
}

- (void)application:(UIApplication *)application performFetchWithCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler {
    [RPEntry application:application performFetchWithCompletionHandler:^{
        completionHandler(UIBackgroundFetchResultNewData);
    }];
}
```

Also add the SDK initialization before React Native bridge initialization

```obj-c

  [RPEntry initializeWithRequestingPermissions:NO];
  [RPEntry application:application didFinishLaunchingWithOptions:launchOptions];

  // before this line
  // RCTBridge *bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:launchOptions];

```

## React Native wrapper usage

---

```js
import TelematicsSdk from "react-native-telematics";

// SDK initializing
TelematicsSdk.initialize()

// Requesting permissions
const isGranted = await TelematicsSdk.requestPermissions()
if(isGranted) {
  // All required permissions granted
} else {
  // Required permissions not granted
}

// Enabling and disabling SDK
const enabled = await TelematicsSdk.enable('Your device token goes here')
if(enabled) {
  // SDK is enabled successfully
} else {
  // SDK is not enabled
}
await TelematicsSdk.disable();

// SDK Status
const isEnabled = await TelematicsSdk.getStatus();
if(isEnabled) {
  // SDK is enabled
} else {
  // SDK is not enabled
}

// Future Tags API
// Add future tag
const result = await TelematicsSdk.addFutureTrackTag('Future tag name', 'Future tag source');
// Result object will contain SDK tag status and the tag you are adding
{
  status: string;
  tag: {
    tag: string;
    source?: string;
  }
}

// Get all future tags
const result = await TelematicsSdk.getFutureTrackTags();
// Result object will contain SDK tag status and all future tags
{
  status: string;
  tags: [
      tag: {
        tag: string;
        source?: string;
      }
  ]
}

// Remove all future tags
const result = await TelematicsSdk.removeAllFutureTrackTags();
// Result object will contain SDK tag status
{
  status: string;
}

// Remove single future tag
const result = await TelematicsSdk.removeFutureTrackTag('Future tag name');
// Result object will contain SDK tag status and the tag you are removing
{
  status: string;
  tag: {
    tag: string;
    source?: string;
  }
}

// iOS specific:
// Get an event for low power mode enabled
const eventEmitter = new NativeEventEmitter(TelematicsSdk);
const emitter = eventEmitter.addListener('onLowPowerModeEnabled', () => {
  console.log('Low power enabled');
});
// Don't forget to remove listener
emitter.remove();

```
