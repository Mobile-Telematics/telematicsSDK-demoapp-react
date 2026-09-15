# Telematics SDK

A React Native wrapper for tracking the person's driving behavior such as speeding, turning, braking and several other things on iOS and Android.

## Version 3.1.1 compatibility

---

| React Native | Expo SDK |
| --- | --- |
| `0.83.10` | 55 |
| `0.85.3` | 56 |
| `0.86.3` | 57 |

The example app is built and validated on React Native `0.86.3`. All three
rows above were verified building and running on both an Android emulator and
an iOS simulator for this release.

- iOS native SDK: `7.2.0`; iOS deployment target: `15.1`
- Android native SDK: `4.1.0`; `compileSdk 37`, `minSdk 24`, and `targetSdk 36`
- The example app uses the React Native 0.86 Android toolchain (Gradle `9.3.1`
  and Android Gradle Plugin `8.12.0`). Android Gradle Plugin 8.12 warns for
  `compileSdk 37`; the example validates this required combination.
- `com.telematicssdk:tracking:4.1.0` brings in `kotlin-stdlib` 2.3.x, which
  requires a Kotlin toolchain change in the host app. The required settings
  differ depending on whether the host app is bare React Native or Expo, and
  the two paths are **not interchangeable**: see the Kotlin toolchain step of
  the checklist under [Getting started > Android](#android) for the exact
  settings and the error messages you get if you use the wrong ones.

The Android permission-wizard activity is supplied by the plugin manifest and is
merged automatically by React Native autolinking. Do not declare it in the host
app manually.

The Android wizard notification and UI strings, images, colours, and dimensions
can be overridden with standard Android app resources. See [Android app
resources](https://docs.damoov.com/docs/android-app-resources).

Here you can find short video guides, how to add React Native Telematics SDK to your iOS and Android apps:

[Watch the video](https://youtu.be/qHAaAw_-IXI)

[Watch the video](https://youtu.be/kZecA6hQi0Q)

## Choose your integration path

---

react-native-telematics supports two integration paths, depending on how your
app manages its native `ios`/`android` projects. Pick the one that matches
your project before following any instructions below: the two paths are **not
interchangeable**, and following the bare React Native Android Kotlin
instructions on an Expo project breaks the build (see the Kotlin toolchain
step under [Getting started > Android](#android)).

- **Expo (CNG / `expo prebuild`)**: your `ios`/`android` folders are generated
  by `expo prebuild` and are not meant to be edited by hand; they are wiped
  and regenerated every time you run it. Use the [Expo config
  plugin](#expo-config-plugin) to apply the native changes automatically. Do
  not hand-edit `ios/` or `android/` on this path. Start with the [Expo
  quickstart](#expo-quickstart) below.
- **Bare React Native**: your `ios/` and `android/` folders live in your repo
  and you edit them directly; there is no prebuild step. Start with the [Bare
  React Native quickstart](#bare-react-native-quickstart) below.

If you are not sure which path applies: a project with an `"expo"` key in
`app.json`/`app.config.js` that you build with `expo prebuild` or EAS Build is
on the Expo path. A project created with `npx react-native init` (or
permanently ejected from Expo), where `ios`/`android` are committed to git and
edited directly, is on the bare React Native path.

### Expo quickstart

1. Install the package:

   ```sh
   yarn add react-native-telematics
   ```

2. Add the config plugin to `app.json` / `app.config.js`. See the [Expo config
   plugin](#expo-config-plugin) section below for the full options table:

   ```json
   {
     "expo": {
       "plugins": ["react-native-telematics"]
     }
   }
   ```

3. Generate the native projects:

   ```sh
   npx expo prebuild
   ```

   Use `npx expo prebuild --clean` to regenerate `ios`/`android` from scratch,
   for example after upgrading the package or changing plugin options.

4. Run the app on each platform:

   ```sh
   npx expo run:android
   npx expo run:ios
   ```

5. Confirm the native module is wired up:

   ```js
   const initialized = await TelematicsSdk.isInitializedSdk();
   // initialized === true
   ```

   If this resolves to `false`, see [SDK initializing](#sdk-initializing) and
   [Lifecycle handlers](#lifecycle-handlers).

6. Complete the runtime sequence so the SDK actually records trips: see
   [Making the SDK record trips](#making-the-sdk-record-trips) below. Steps 1
   to 5 only wire the native module in; on their own they record nothing.

### Bare React Native quickstart

1. Install the package:

   ```sh
   yarn add react-native-telematics
   ```

2. Install iOS pods:

   ```sh
   cd ios && pod install
   ```

3. Apply the Android host settings: the Maven repository, `compileSdk`,
   Kotlin toolchain, desugaring, and packaging excludes. Follow the
   consolidated checklist in [Getting started > Android](#android).

4. Apply the iOS `Info.plist` keys and add the lifecycle handlers to your
   AppDelegate (and SceneDelegate, if your app uses one). Follow [Getting
   started > iOS](#ios) and [Lifecycle handlers](#lifecycle-handlers).
   `RPEntry.initializeSDK()` must be the first SDK call your app makes;
   skipping it crashes the app at launch, see the warning in [Lifecycle
   handlers](#lifecycle-handlers).

5. Run the app on each platform:

   ```sh
   npx react-native run-android
   npx react-native run-ios
   ```

6. Confirm the native module is wired up:

   ```js
   const initialized = await TelematicsSdk.isInitializedSdk();
   // initialized === true
   ```

   If this resolves to `false`, see [SDK initializing](#sdk-initializing) and
   [Lifecycle handlers](#lifecycle-handlers).

7. Complete the runtime sequence so the SDK actually records trips: see
   [Making the SDK record trips](#making-the-sdk-record-trips) below. Steps 1
   to 6 only wire the native module in; on their own they record nothing.

### Making the SDK record trips

Both paths above end at the same place: the native module is linked and
initialized, and nothing is being recorded yet. A working integration needs
four more things, in this order. This sequence is the same for Expo and bare
React Native.

1. **Get a device token.** The SDK identifies a driver by a device token
   (also called a virtual device ID), which you create through the Damoov API
   using the InstanceId and InstanceKey from your DataHub workspace. See
   [Initial app setup & credentials](#initial-app-setup--credentials). The
   token is a GUID; an arbitrary string is rejected by the native SDK.

2. **Register the token with the SDK**, once per user, and confirm it was
   accepted:

   ```js
   await TelematicsSdk.setDeviceId('00000000-0000-0000-0000-000000000000');

   const deviceId = await TelematicsSdk.getDeviceId();
   const state = await TelematicsSdk.getDeviceIdRegistrationState();
   console.log(deviceId, state.status, state.checkedAtMillis);
   ```

3. **Get the permissions granted.** Nothing is recorded until every required
   permission and sensor is available. Show the wizard, then check the result
   rather than assuming it succeeded:

   ```js
   let granted = await TelematicsSdk.isAllRequiredPermissionsAndSensorsGranted();

   if (!granted) {
     await TelematicsSdk.showPermissionWizard();
     granted = await TelematicsSdk.isAllRequiredPermissionsAndSensorsGranted();
   }
   ```

   On Android this covers precise location, background location on Android
   10+, activity recognition, and battery-optimization exclusion. See
   [Permissions & Sensors](#permissions--sensors) for wizard customization,
   and [iOS permissions UI configuration](#ios-permissions-ui-configuration)
   for the iOS wizard.

4. **Enable the SDK**, only once permissions are granted:

   ```js
   if (granted) {
     await TelematicsSdk.setEnableSdk(true);
   }
   ```

   See [Enabling and disabling SDK](#enabling-and-disabling-sdk) and
   [Tracking](#tracking) for manual and persistent tracking modes.

Once that is done, the integration is live. Confirm it:

```js
console.log(await TelematicsSdk.isInitializedSdk());                     // true
console.log(await TelematicsSdk.isAllRequiredPermissionsAndSensorsGranted()); // true
console.log(await TelematicsSdk.isSdkEnabled());                         // true
console.log(await TelematicsSdk.isTracking());                           // true
```

With automatic tracking the SDK starts and stops trips on its own once the
device starts moving; recorded trips appear in your DataHub workspace after
they are uploaded. If trips are recorded but never arrive, the usual cause on
iOS is missing lifecycle forwarding, since the background upload completes in
`handleEventsForBackgroundURLSession`: see [Lifecycle
handlers](#lifecycle-handlers).

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

Version 3.1.1 brings the Android SDK transitively through the React Native
plugin; do not add a separate `com.telematicssdk:tracking` dependency to the
host app. Complete the following checklist in the host app's Gradle files.
None of these settings are inherited from the SDK's own module, so every
consuming app has to add them itself -- except where noted, the [Expo config
plugin](#expo-config-plugin) adds each of them automatically during
`expo prebuild`, so Expo apps that use the plugin can skip doing this by hand.

1. **`compileSdk 37` or higher.** The plugin stops the build with a clear
   error if `TelematicsSdk_compileSdkVersion` is set lower. Keep `minSdk` at
   24 or higher; `targetSdk 36` is the version used by the example and can be
   raised independently. The Expo config plugin sets `compileSdk` for you.

2. **Telematics Maven repository**, in `android/app/build.gradle`:

   ```groovy
   repositories {
     maven { url "https://s3.us-east-2.amazonaws.com/android.telematics.sdk.production/" }
   }
   ```

   If the host uses `RepositoriesMode.PREFER_SETTINGS` in
   `android/settings.gradle`, add the same Maven repository to
   `dependencyResolutionManagement.repositories` instead. The Expo config
   plugin adds this repository for you.

3. **Kotlin toolchain.** `com.telematicssdk:tracking:4.1.0` brings in
   `kotlin-stdlib` 2.3.x. What to do about it depends on whether the host app
   is bare React Native or Expo -- these two paths are **not
   interchangeable**:

   - **Bare (non-Expo) React Native apps**: set `kotlin-gradle-plugin` to
     `2.3.21` on the root buildscript classpath, and add
     `kotlin-bom:2.3.21` to the app module -- the BOM is required, not
     optional: without it, the Kotlin stdlib and reflect artifacts can resolve
     to a version older than the compiler and cause `Class 'X' was compiled
     with an incompatible version of Kotlin` errors. The example app uses the
     matching Kotlin Gradle Plugin and Kotlin BOM.
   - **Expo apps**: do **not** raise the Kotlin Gradle Plugin or
     `android.kotlinVersion`. Expo pins its own Kotlin compiler (well below
     2.3.x) to build Expo's own modules, independent of whatever version the
     host project declares. Raising the compiler version instead breaks
     Expo's own modules -- verified with real builds:
     - Expo SDK 55 fails at configuration time with: `Failed to apply plugin
       'expo-root-project'. Can't find KSP version for Kotlin version
       '2.3.21'. Supported versions are: 2.2.21, 2.3.1, 2.3.0, 2.2.20, ...`
     - Expo SDK 56 gets further, then fails compiling Expo's own module with:
       `Execution failed for task ':expo-modules-core:compileDebugKotlin' ...
       Internal compiler error`, `Unresolved reference 'map'`, and `Module was
       compiled with an incompatible version of Kotlin. The binary version of
       its metadata is 2.3.0, expected version is 2.1.0.`

     The fix instead is to let Expo's pinned compiler read the newer
     metadata, by adding `-Xskip-metadata-version-check` to the Kotlin compile
     tasks in the root `android/build.gradle`:

     ```groovy
     allprojects {
         tasks.withType(org.jetbrains.kotlin.gradle.tasks.KotlinCompile).configureEach {
             compilerOptions {
                 freeCompilerArgs.add("-Xskip-metadata-version-check")
             }
         }
     }
     ```

     The [Expo config plugin](#expo-config-plugin) adds this automatically
     during `expo prebuild`; nothing to do by hand for Expo apps that use it.

4. **Core library desugaring**, or the build fails with:

   ```
   Dependency 'com.telematicssdk:tracking:4.1.0' requires core library desugaring to be enabled for :app.
   ```

   ```groovy
   android {
       compileOptions {
           coreLibraryDesugaringEnabled true
       }
   }
   dependencies {
       coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:2.1.5")
   }
   ```

   The Expo config plugin enables this for you.

5. **Packaging excludes for netty `META-INF` entries**, or the build fails
   with duplicate `META-INF` entries from the netty jars the SDK depends on
   (`io.netty:netty-codec`, `netty-transport`, `netty-buffer`,
   `netty-resolver`, etc.):

   ```groovy
   android {
       packaging {
           resources {
               excludes += [
                   'META-INF/INDEX.LIST',
                   'META-INF/io.netty.versions.properties',
                   'META-INF/versions/9/OSGI-INF/MANIFEST.MF'
               ]
           }
       }
   }
   ```

   The Expo config plugin adds these excludes for you.

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

> **`RPEntry.initializeSDK()` must be the first SDK call, before any
> forward.** Omitting it does not degrade quietly: it crashes the app at
> launch. Verified twice on a simulator, `EXC_BREAKPOINT (SIGTRAP)` on the
> main thread, with this stack:
>
> ```
> libswiftCore.dylib  _assertionFailure(_:_:file:line:flags:)
> TelematicsSDK       static RPEntry.instance.getter + 100 (RPEntry.swift:48)
> ```
>
> Once from `AppDelegate.application(_:didFinishLaunchingWithOptions:)` and
> once from `SceneDelegate.sceneWillEnterForeground(_:)` -- any access to
> `RPEntry.instance` before `RPEntry.initializeSDK()` has run hits the same
> trap. Call `RPEntry.initializeSDK()` in
> `application(_:didFinishLaunchingWithOptions:)` before forwarding, exactly
> as shown below, and guard every other forward with
> `RPEntry.isInitialized()` as shown, so a forward that can run before launch
> finishes (or on a path that skipped initialization) returns instead of
> crashing.

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
    guard RPEntry.isInitialized() else { return }
    RPEntry.instance.application(application, handleEventsForBackgroundURLSession: identifier, completionHandler: completionHandler)
}

func applicationDidReceiveMemoryWarning(_ application: UIApplication) {
    guard RPEntry.isInitialized() else { return }
    RPEntry.instance.applicationDidReceiveMemoryWarning(application)
}

func applicationWillTerminate(_ application: UIApplication) {
    guard RPEntry.isInitialized() else { return }
    RPEntry.instance.applicationWillTerminate(application)
}

func application(_ application: UIApplication, performFetchWithCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void) {
    guard RPEntry.isInitialized() else { return }
    RPEntry.instance.application(application) {
        completionHandler(.newData)
    }
}
```

If you use AppDelegate, then you have to implement next methods:

```swift
func applicationDidEnterBackground(_ application: UIApplication) {
    guard RPEntry.isInitialized() else { return }
    RPEntry.instance.applicationDidEnterBackground(application)
}

func applicationWillEnterForeground(_ application: UIApplication) {
    guard RPEntry.isInitialized() else { return }
    RPEntry.instance.applicationWillEnterForeground(application)
}

func applicationDidBecomeActive(_ application: UIApplication) {
    guard RPEntry.isInitialized() else { return }
    RPEntry.instance.applicationDidBecomeActive(application)
}
```

If you use SceneDelegate, then you have to implement next methods:

```swift
func sceneDidBecomeActive(_ scene: UIScene) {
    guard RPEntry.isInitialized() else { return }
    RPEntry.instance.sceneDidBecomeActive(scene)
}

func sceneWillEnterForeground(_ scene: UIScene) {
    guard RPEntry.isInitialized() else { return }
    RPEntry.instance.sceneWillEnterForeground(scene)
}

func sceneDidEnterBackground(_ scene: UIScene) {
    guard RPEntry.isInitialized() else { return }
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

On Android, `initializeSdk()` performs the actual SDK initialization; call it
before any other API.

On iOS, the authoritative initialization is native:
`RPEntry.initializeSDK()` in your AppDelegate's
`application(_:didFinishLaunchingWithOptions:)`, see [Lifecycle
handlers](#lifecycle-handlers). Calling `initializeSdk()` from JS also
initializes the SDK, as a safety net if that native call has not already
happened, but it does not remove the need for the AppDelegate call: the
lifecycle forwards run at launch, before any JS executes, so an app that
relies on the JS call alone still crashes at launch (see the warning in
[Lifecycle handlers](#lifecycle-handlers)).

```js
// Safety-net initialization on iOS; the authoritative call is
// RPEntry.initializeSDK() in AppDelegate. Performs real initialization on
// Android. Call it before any other API.
await TelematicsSdk.initializeSdk();
```

Every other bridge method rejects with error code `SDK_NOT_INITIALIZED` when
the SDK has not been initialized. Use `isInitializedSdk()` to check first:

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

## Expo config plugin

Version 3.1.1 ships a config plugin so Expo projects using [Continuous Native
Generation](https://docs.expo.dev/workflow/continuous-native-generation/)
(`expo prebuild`) get a working integration without hand-editing the
generated `ios`/`android` directories. It automates everything described
above under "Getting started" and "Lifecycle handlers": every edit below
survives `expo prebuild` and `expo prebuild --clean`.

Add it to `app.json` / `app.config.js`:

```json
{
  "expo": {
    "plugins": [
      [
        "react-native-telematics",
        {
          "motionUsageDescription": "This app uses motion data to automatically detect trips.",
          "locationWhenInUseUsageDescription": "This app uses your location to detect and record trips.",
          "locationAlwaysAndWhenInUseUsageDescription": "This app uses your location in the background to detect and record trips, even when the app is closed.",
          "skipInfoPlistPermissions": false
        }
      ]
    ]
  }
}
```

All options are optional; the values above are the plugin's own defaults.

| Option | Type | Default | Purpose |
|---|---|---|---|
| `motionUsageDescription` | `string` | see above | `NSMotionUsageDescription` |
| `locationWhenInUseUsageDescription` | `string` | see above | `NSLocationWhenInUseUsageDescription` |
| `locationAlwaysAndWhenInUseUsageDescription` | `string` | see above | `NSLocationAlwaysAndWhenInUseUsageDescription` |
| `skipInfoPlistPermissions` | `boolean` | `false` | Skips adding the three usage description keys above, for apps that already manage Info.plist permission strings elsewhere (for example via another config plugin). `UIBackgroundModes` and `BGTaskSchedulerPermittedIdentifiers` are still added either way, since those aren't user-facing permission strings. |

The plugin requires `@expo/config-plugins`, which every Expo project already
has as a transitive dependency of `expo` itself; nothing extra to install in
the common case.

### What it does

**iOS**

- **AppDelegate**: adds `import TelematicsSDK`, calls `RPEntry.initializeSDK()`
  and forwards to `RPEntry.instance` inside
  `application(_:didFinishLaunchingWithOptions:)`, and adds the
  `handleEventsForBackgroundURLSession` / `applicationDidReceiveMemoryWarning`
  / `applicationWillTerminate` / `performFetchWithCompletionHandler` forwards.
- **Scene vs. app-level lifecycle**: `applicationDidBecomeActive` /
  `applicationWillEnterForeground` / `applicationDidEnterBackground` are not
  called by iOS on scene-based apps. The plugin detects whether the project
  has a `SceneDelegate.swift` (or declares `UIApplicationSceneManifest` in
  Info.plist) and adds exactly one of the two forward sets: the three scene
  methods on `SceneDelegate` for scene-based projects, or the three app-level
  methods on `AppDelegate` otherwise. It never adds both.
- **Info.plist**: merges `UIBackgroundModes` (`fetch`, `location`,
  `remote-notification`) and `BGTaskSchedulerPermittedIdentifiers`
  (`sdk.damoov.apprefreshtaskid`, `sdk.damoov.appprocessingtaskid`) into
  whatever arrays are already there, and adds the three usage description
  keys unless one is already set or `skipInfoPlistPermissions` is true.
  Existing values are never overwritten.
- **Podfile**: ensures dynamic linkage (`use_frameworks! :linkage =>
  :dynamic`), required because TelematicsSDK is a dynamic framework pulled in
  via SPM (see "iOS dependency manager notes" above). On the modern Expo
  Podfile template this is done through `ios.useFrameworks` in
  `Podfile.properties.json` rather than editing the Podfile itself, so it
  can't conflict with another plugin's edits to that file.

**Android**

- `android/gradle.properties`: sets `android.suppressUnsupportedCompileSdk=37.0`,
  and `android.compileSdkVersion` (raised to `37` if lower, left alone if
  already higher). On current Expo prebuild templates this flows straight
  into the Gradle version catalog the root project reads its `compileSdk`
  from.

  Deliberately does **not** set `android.kotlinVersion` or otherwise raise the
  Kotlin Gradle Plugin version -- see "Android" under "Getting started" above
  for why that breaks Expo apps.
- `android/build.gradle`: on older/bare templates that declare
  `compileSdkVersion` as a literal `ext {}` value instead (rather than
  through the version catalog above), raises it the same way. Also adds an
  `allprojects { tasks.withType(KotlinCompile) { ... } }` block (guarded by
  the marker comment `// react-native-telematics: skip metadata version
  check`) that adds `-Xskip-metadata-version-check` to every Kotlin compile
  task -- this is what actually fixes the Expo build; see "Android" under
  "Getting started" above for the failure messages it avoids.
- `android/app/build.gradle`: adds the Telematics Maven repository, core
  library desugaring (`compileOptions { coreLibraryDesugaringEnabled true }`
  plus the `coreLibraryDesugaring` dependency), and the netty `META-INF`
  packaging excludes -- see "Android" under "Getting started" above for why
  each of these is required.

### Notes and limitations

- Every edit is idempotent and non-destructive: re-running `expo prebuild` (with
  or without `--clean`) does not duplicate imports, methods, or array
  entries, and existing user values are merged into, never replaced.
- The plugin only understands the standard Swift AppDelegate/SceneDelegate
  template and Groovy `build.gradle` files that current Expo/React Native
  projects generate. If your project's AppDelegate, SceneDelegate, or
  `build.gradle`/`build.gradle.kts` has an unrecognized shape (for example a
  Kotlin DSL Gradle file, or an Objective-C AppDelegate), the plugin throws a
  descriptive error naming the file and what it expected, instead of silently
  producing a broken project -- follow the manual steps in "Getting started"
  and "Lifecycle handlers" above for that file.
