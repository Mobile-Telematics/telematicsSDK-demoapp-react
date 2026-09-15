# Issue list for react-native-telematics 3.1.0

Derived from a code read of the `develop` branch at `dc3b201`. Each item is written to be pasted into GitHub as a standalone issue.

Priority order below reflects cost to the integrator multiplied by how often it hits: 1, 2, 3, then 4 through 8. Issue numbering is stable regardless of priority.

---

## 1. iOS: SDK can be left uninitialized with no error from any API

**Labels:** `bug`, `ios`, `priority: high`, `dx`

### Problem

`initializeSdk()` is a no-op on iOS:

```swift
// ios/TelematicsSdk.swift:48
@objc(initializeSdk:reject:)
public func initializeSdk(
  _ resolve: @escaping RCTPromiseResolveBlock,
  reject: @escaping RCTPromiseRejectBlock
) {
  resolve(nil)
}
```

Real initialization happens only if the integrator adds `RPEntry.initializeSDK()` to their own `application(_:didFinishLaunchingWithOptions:)`.

Android behaves differently. The same JS method does the actual work there:

```java
// android/src/main/java/com/reactnativetelematicssdk/TelematicsSdkModule.java:133
public void initializeSdk(Promise promise) {
  if (!api.isInitialized()) {
    api.initialize(this.getReactApplicationContext(), setTelematicsSettings());
    ...
```

On top of that, no method in the Swift bridge checks `RPEntry.isInitialized()` before calling into the SDK. `startTracking`, `stopTracking`, `setEnableSdk`, `setDeviceID`, `setTrackingMode` and the rest all resolve normally against an uninitialized SDK.

### Impact

An integrator who misses the AppDelegate section of the README gets:

- a project that builds
- an app that runs
- every JS call resolving successfully
- zero trips recorded, with no error anywhere

The only signal is `isInitializedSdk()` returning `false`, and nothing prompts the integrator to call it, since the README presents `initializeSdk()` as the initialization step ("Must be called before any other API").

This is silent data loss, and it typically surfaces weeks later when someone asks why DataHub is empty.

### Proposed fix

Minimum: reject every iOS method with a dedicated code when the SDK is not initialized.

```swift
private func requireInitialized(_ reject: RCTPromiseRejectBlock) -> Bool {
  guard RPEntry.isInitialized() else {
    reject("SDK_NOT_INITIALIZED",
           "TelematicsSDK is not initialized. Call RPEntry.initializeSDK() in application(_:didFinishLaunchingWithOptions:). See README, Lifecycle handlers.",
           nil)
    return false
  }
  return true
}
```

Better: make `initializeSdk()` on iOS actually initialize, calling `RPEntry.initializeSDK()` on the main queue (the module already dispatches to main for other calls), so AppDelegate keeps only the lifecycle forwarding. That makes the JS API behave the same on both platforms.

Either way `isInitializedSdk()` should be mentioned in the README right next to `initializeSdk()` as the way to verify.

---

## 2. No Expo config plugin

**Labels:** `enhancement`, `ios`, `android`, `priority: high`, `expo`

### Problem

The package ships no `app.plugin.js` and no `expo-module.config.json`. Integration currently requires:

- editing `AppDelegate` (init plus five lifecycle forwards)
- editing `SceneDelegate` (three scene forwards)
- adding the TelematicsSDK SPM package to the app target in Xcode, set to Embed & Sign
- setting `use_frameworks! :linkage => :dynamic` in the Podfile
- Android: `compileSdk 37`, Kotlin 2.3.21 on the root buildscript, `kotlin-bom`, `android.suppressUnsupportedCompileSdk`

Under Expo CNG every one of those is wiped on the next `prebuild`.

### Impact

Expo users have two options today: write their own config plugin, or commit `ios/` and `android/` and leave the managed workflow. Both are real cost, and neither is documented.

### Proposed fix

Ship a config plugin covering the AppDelegate and SceneDelegate forwards, the Podfile `use_frameworks!` setting, the SPM package reference on the app target, and the Android Gradle properties. Add an Expo section to the README.

If a full plugin is out of scope for now, a documented copy-paste plugin in the README would remove most of the pain.

---

## 3. iOS integration needs three manual steps that are easy to get wrong

**Labels:** `enhancement`, `ios`, `priority: high`, `dx`

### Problem

TelematicsSDK arrives through SPM inside a CocoaPods project. Making that work requires the integrator to:

1. set `use_frameworks! :linkage => :dynamic` in the Podfile
2. add the SPM package to the **app** target in Xcode by hand, not just to the Pods target
3. confirm `TelematicsSDK.framework` is set to Embed & Sign

Step 2 is the fragile one. `example/ios/Podfile` contains a commented-out `post_install` block that automates it, with this note:

> Without this, the app may link against a dynamic TelematicsSDK.framework (via a pod target) but not embed it into the final .app, causing a dyld crash.

So the failure mode is known, the automation was written, and it is currently disabled. The cost sits with the integrator, and the symptom is a dyld crash at launch rather than a build error.

Requiring `use_frameworks! :linkage => :dynamic` is also a constraint on the rest of the integrator's dependency graph, since parts of the RN ecosystem still misbehave under it.

### Proposed fix

Either finish and enable the `post_install` automation, or document the manual steps with the dyld symptom spelled out so people can recognize it. Ideally both.

---

## 4. Podspec declares iOS 13.0 while the SDK needs 15.1

**Labels:** `bug`, `ios`, `priority: medium`

### Problem

```ruby
# react-native-telematics-sdk.podspec:13
s.platforms = { :ios => "13.0" }
```

The README states iOS deployment target 15.1, and the example app is built with `IPHONEOS_DEPLOYMENT_TARGET = 15.1`.

### Impact

A project with a deployment target of 13 or 14 passes `pod install` cleanly and then fails at link time or crashes at runtime, instead of being rejected during dependency resolution with a clear message.

### Proposed fix

```ruby
s.platforms = { :ios => "15.1" }
```

---

## 5. Podspec calls `spm_dependency` unconditionally

**Labels:** `bug`, `ios`, `priority: medium`, `dx`

### Problem

`react-native-telematics-sdk.podspec:20` calls `spm_dependency`, a helper defined in `react-native/scripts/react_native_pods.rb`. On a React Native version that predates the helper, `pod install` fails with a `NoMethodError` naming a Ruby script inside `node_modules`.

### Impact

The error gives no hint that the real cause is an unsupported React Native version, so it lands in support instead of being self-diagnosed.

### Proposed fix

Guard the call and raise a readable message:

```ruby
unless respond_to?(:spm_dependency)
  raise "react-native-telematics requires React Native >= 0.86, which provides spm_dependency."
end
```

---

## 6. `peerDependencies` at `>=0.86.0` restricts the package to the newest Expo SDK

**Labels:** `enhancement`, `priority: medium`, `compatibility`

### Problem

```json
"peerDependencies": {
  "react": "*",
  "react-native": ">=0.86.0"
}
```

Against the Expo release line:

| Expo SDK | React Native | Satisfies `>=0.86.0` |
|---|---|---|
| 57 (current, June 2026) | 0.86 | yes |
| 56 | 0.85 | no |
| 55 | 0.83.2 | no |

So 3.1.0 is installable only on the newest Expo SDK. Anyone who has not yet moved to 57 stays on 3.0.1 and receives no further fixes.

### The question to answer: can we support Expo 56, or even 55?

Is `>=0.86.0` an actual requirement, or just the version 3.1.0 happened to be built on?

Nothing found in the source points to a hard dependency on 0.86:

- the Android implementation is plain Java, six files, with no reference to React Native internals
- the Android module depends on `com.facebook.react:react-android` with no version pin
- the iOS side uses `RCTEventEmitter`, stable well before 0.86
- the TurboModule spec shape has been stable since 0.76
- the commit that added "React Native 0.86+ support" (`f83e486`) changed only Android toolchain concerns: `compileSdk 37`, the Kotlin requirement, repository declaration, and the `safeExtGet` fallback. None of those are specific to 0.86

That reading suggests the real constraint comes from the native Android SDK, not from React Native. If so, the peer range is stricter than it needs to be.

### What has to be verified before answering

The open questions are all on the Android toolchain, not the JS or native module code:

1. Do the AGP versions shipped with RN 0.85 and RN 0.83 accept `compileSdk 37`? AGP 8.12 warns and needs `android.suppressUnsupportedCompileSdk`. An older AGP may reject it outright, which would be a hard blocker.
2. Does KGP 2.3.21 work against the Gradle and AGP versions in those templates? The override has to hold there as well, since the metadata problem from issue 8 does not go away on older React Native.
3. Is `spm_dependency` present in the `react_native_pods.rb` shipped with 0.83 and 0.85? If not, iOS integration fails at `pod install` and the answer for that version is no. See issue 5.
4. On Expo specifically, check the interaction with `expo-gradle-plugin`, which is compiled with Kotlin 2.1.20 and has a known history of constraining Gradle and AGP upgrades. Worth confirming that the 2.3.21 override does not conflict with it.

### Proposed fix

Build and smoke-test the example on 0.85 first, since that is Expo 56 and the smaller step. If it passes, lower the peer range to `>=0.85` and ship that. Then try 0.83 for Expo 55 and lower again if it holds.

List the tested versions in the README either way, so the range stops being guesswork for integrators.

Worth deciding explicitly, because the answer also sets how long 3.0.1 has to be maintained. If 3.1.0 can reach Expo 55, 3.0.1 can be retired.

---

## 7. `compileSdk 37` error message omits the second half of the fix

**Labels:** `enhancement`, `android`, `priority: medium`, `dx`

### Problem

```groovy
// android/build.gradle:71
throw new GradleException(
    "react-native-telematics requires compileSdk 37 or higher because " +
    "com.telematicssdk:tracking:4.1.0 requires Android API 37. " +
    "Set TelematicsSdk_compileSdkVersion (or the app compileSdk) to 37 or higher."
)
```

Following this instruction gets the integrator to the next problem: AGP 8.12 does not officially support `compileSdk 37` and warns about it. The workaround, `android.suppressUnsupportedCompileSdk=37.0`, exists only in `example/android/gradle.properties` and is not mentioned in the exception.

### Proposed fix

Add it to the message:

```
Set TelematicsSdk_compileSdkVersion (or the app compileSdk) to 37 or higher,
and add android.suppressUnsupportedCompileSdk=37.0 to gradle.properties,
since AGP 8.12 warns for compileSdk 37.
```

---

## 8. Kotlin 2.3.21 requirement is documented but never checked

**Labels:** `enhancement`, `android`, `priority: medium`, `dx`

### Problem

`com.telematicssdk:tracking:4.1.0` ships Kotlin metadata `mv=[2,3,0]`. React Native pins the Kotlin Gradle plugin at 2.1.20 on 0.83, 0.85 and 0.86, and 2.2.0 on 0.87. Integrators must override KGP at the application root, which the README documents and the example app implements, but nothing in the build verifies it.

The failure, when it comes, is `Class 'X' was compiled with an incompatible version of Kotlin`, pointing at a class inside the Telematics AAR. It only appears once some Kotlin source in the consumer build references an SDK class, so it can show up long after integration, in a build that used to work.

### Proposed fix

Check the Kotlin plugin version during configuration and fail with a message that names the required version and the fix:

```groovy
def kgp = project.plugins.findPlugin("org.jetbrains.kotlin.android")?.pluginVersion
if (kgp && VersionNumber.parse(kgp) < VersionNumber.parse("2.3.0")) {
    throw new GradleException(
        "com.telematicssdk:tracking:4.1.0 ships Kotlin metadata 2.3.0. " +
        "Kotlin Gradle Plugin ${kgp} cannot read it. " +
        "Set kotlin-gradle-plugin to 2.3.21 on the root buildscript classpath " +
        "and add kotlin-bom:2.3.21 to the app module. See README."
    )
}
```

Also worth adding to the README: the `kotlin-bom` line is the part integrators most often miss, and without it stdlib and reflect can stay behind the compiler.

---

## Effort notes

| Issue | Rough effort |
|---|---|
| 4, 5, 7 | a few lines each |
| 8 | under an hour |
| 1 | half a day for the guard, a day for the full fix |
| 6 | build validation on two RN versions, then one line in package.json |
| 3 | depends on whether the `post_install` automation can be made reliable |
| 2 | the largest, a proper config plugin |

---

# Research list

Open questions that have to be answered before the issues above can be scoped or closed. Each one is a question, not a task: the outcome decides what the fix looks like, and in a few cases whether a fix is possible at all.

## R1. Can `RPEntry.initializeSDK()` be called from JS instead of AppDelegate?

**Blocks:** issue 1 (full fix), issue 2

Does the native iOS SDK require initialization strictly inside `application(_:didFinishLaunchingWithOptions:)`, or does it tolerate initialization later, from a React Native module on the main queue?

If later initialization is safe, `initializeSdk()` can do real work on iOS and the JS API becomes symmetric across platforms. If the SDK depends on being present when the app launches, for example to receive the launch options of a background relaunch, then the AppDelegate call stays mandatory and issue 1 is limited to the rejection guard.

This is the single question that decides how much of the iOS integration burden can be removed.

## R2. Which lifecycle forwards are mandatory and which are optimizations?

**Blocks:** issue 1, issue 2

The README lists eleven methods across AppDelegate and SceneDelegate without saying what each one costs when skipped. Our own example app comments out three of them, which suggests the list is not uniformly required.

Needed: a per-method statement of what degrades when it is absent. That determines what the config plugin has to inject, what the README should mark as mandatory, and what support can tell an integrator to check first.

## R3. Do RN 0.85 and RN 0.83 toolchains accept `compileSdk 37`?

**Blocks:** issue 6

AGP 8.12 warns and needs `android.suppressUnsupportedCompileSdk`. Older AGP versions may reject `compileSdk 37` outright, which would make Expo 56 and 55 support impossible without changing the native SDK requirement.

Determine the AGP and Gradle versions in the RN 0.85 and 0.83 templates, then try a build.

## R4. Does KGP 2.3.21 hold on those toolchains?

**Blocks:** issue 6, issue 8

The Kotlin metadata problem does not disappear on older React Native, so the 2.3.21 override has to work there too. Verify KGP 2.3.21 against the Gradle and AGP versions from R3.

## R5. Interaction between the Kotlin override and `expo-gradle-plugin`

**Blocks:** issue 6, issue 8

`expo-gradle-plugin` is compiled with Kotlin 2.1.20 and has a documented history of constraining Gradle and AGP upgrades (expo/expo#49550). Confirm that forcing KGP 2.3.21 at the application root does not conflict with it, on Expo 57 first and then on any older SDK we decide to support.

## R6. When was `spm_dependency` introduced in `react_native_pods.rb`?

**Blocks:** issue 5, issue 6

It is present in 0.86. If it is absent in 0.83 or 0.85, iOS integration fails at `pod install` on those versions and the answer for them is no regardless of what the Android side shows. This also gives the exact React Native floor to name in the guard from issue 5.

## R7. Why was the `post_install` SPM automation disabled?

**Blocks:** issue 3

`example/ios/Podfile` contains a complete, commented-out block that adds the SPM package to the app target, with a note about a dyld crash. Recover what actually broke: whether the automation itself was unreliable, or whether it was written as a workaround for a problem that was later solved a different way.

Without that history the issue cannot be scoped, since re-enabling the block may reintroduce whatever caused it to be disabled.

## R8. What is the real minimum iOS deployment target of TelematicsSDK 7.2.0?

**Blocks:** issue 4

The README says 15.1 and the example builds at 15.1, but the podspec still declares 13.0. Check what the SPM package itself declares, so the podspec is corrected to the true floor rather than to the version the example happens to use.

## R9. When does the host app actually need to declare the Telematics Maven repository?

**Blocks:** README accuracy

The library declares the S3 repository in its own `android/build.gradle`, and the README additionally tells the host app to declare it, with a separate instruction for `RepositoriesMode.PREFER_SETTINGS`.

Establish which configurations genuinely need the host-side declaration and which do not, so the instructions stop asking every integrator for a step most of them may not need. `FAIL_ON_PROJECT_REPOS` should be covered explicitly, since it is the configuration most likely to break resolution.

## R10. How to read the Kotlin plugin version reliably at configuration time

**Blocks:** issue 8

The proposed guard reads `pluginVersion` off the Kotlin Android plugin. Confirm this works on the Gradle and AGP combination we target, and that it does not break configuration cache. A version check that itself fails is worse than no check.
