# iOS Migration Guide to SDK 3.0.0+

This guide outlines the migration steps for iOS Telematics SDK similar to the [Android Migration Guide](https://docs.damoov.com/docs/android-migration-guide).

## Overview

The iOS SDK migration involves updating from old RaxelPulse SDK classes to the new TelematicsSDK API. The main changes are in how the SDK is initialized and accessed.

## Migration Steps

### 1. Update AppDelegate.mm

The SDK initialization has changed. Update your `AppDelegate.mm` file:

**Old initialization (deprecated):**
```obj-c
#import <RaxelPulse/RaxelPulse.h>

[RPEntry initializeWithRequestingPermissions:NO];
[RPEntry application:application didFinishLaunchingWithOptions:launchOptions];
```

**New initialization (SDK 3.0.0+):**
```obj-c
#import <TelematicsSDK/TelematicsSDK-Swift.h>

[RPEntry initializeSDK];
[[RPEntry instance] application:application didFinishLaunchingWithOptions:launchOptions];
```

### 2. Update Podfile (if needed)

Ensure you're using the latest TelematicsSDK pod:

```ruby
pod 'TelematicsSDK', '~> 3.0'
```

Then run:
```sh
cd ios && pod install
```

### 3. Lifecycle Handlers

The lifecycle handlers remain the same but ensure you're using the instance methods:

```obj-c
- (void)application:(UIApplication *)application handleEventsForBackgroundURLSession:(nonnull NSString *)identifier completionHandler:(nonnull void (^)(void))completionHandler {
    [[RPEntry instance] application:application handleEventsForBackgroundURLSession:identifier completionHandler:completionHandler];
}

- (void)applicationDidReceiveMemoryWarning:(UIApplication *)application {
    [[RPEntry instance] applicationDidReceiveMemoryWarning:application];
}

- (void)applicationWillTerminate:(UIApplication *)application {
    [[RPEntry instance] applicationWillTerminate:application];
}

- (void)applicationDidEnterBackground:(UIApplication *)application {
    [[RPEntry instance] applicationDidEnterBackground:application];
}

- (void)applicationDidBecomeActive:(UIApplication *)application {
    [[RPEntry instance] applicationDidBecomeActive:application];
}

- (void)application:(UIApplication *)application performFetchWithCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler {
    [[RPEntry instance] application:application performFetchWithCompletionHandler:^{
        completionHandler(UIBackgroundFetchResultNewData);
    }];
}
```

### 4. Swift Code (TelematicsSdk.swift)

The Swift wrapper code continues to use `RPEntry.instance` API which is compatible with SDK 3.0.0+. No changes needed in the React Native bridge code if you're already using:

- `RPEntry.instance`
- `RPPermissionsWizard`
- `RPFutureTag`
- `RPTagStatus`

These classes are still available in SDK 3.0.0+.

### 5. Info.plist Configuration

Ensure your `Info.plist` has the required background modes and permissions:

```xml
<key>UIBackgroundModes</key>
<array>
    <string>fetch</string>
    <string>location</string>
    <string>remote-notification</string>
</array>
<key>BGTaskSchedulerPermittedIdentifiers</key>
<array>
    <string>sdk.damoov.apprefreshtaskid</string>
    <string>sdk.damoov.appprocessingtaskid</string>
</array>
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>We need location access to track your driving behavior.</string>
<key>NSLocationAlwaysUsageDescription</key>
<string>We need location access to track your driving behavior.</string>
<key>NSLocationWhenInUseUsageDescription</key>
<string>We need location access to track your driving behavior.</string>
<key>NSMotionUsageDescription</key>
<string>We need motion access to analyze your driving style.</string>
```

### 6. Testing

After migration:

1. Clean build folder: Product → Clean Build Folder (Shift+Cmd+K)
2. Delete DerivedData
3. Run `pod install` in the ios folder
4. Rebuild the project

## Key Differences from Android Migration

- **Android**: Package path changed from `com.raxeltelematics.v2.sdk` to `com.telematicssdk.tracking`
- **iOS**: Import path stays the same (`TelematicsSDK/TelematicsSDK-Swift.h`), but initialization method changed
- **iOS**: No packaging options needed (that's Android-specific)
- **iOS**: RPEntry API remains largely the same, just initialization pattern changed

## Resources

- [iOS SDK Documentation](https://docs.damoov.com/docs/sdk-for-ios-app)
- [Android Migration Guide](https://docs.damoov.com/docs/android-migration-guide)
- [Damoov Developer Hub](https://docs.damoov.com/)

