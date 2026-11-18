# Permissions Wizard

The Permissions Wizard is a built-in SwiftUI flow for guiding users through the permissions required by TelematicsSDK:

* Location When In Use
* Location Always
* Precise Location
* Motion & Fitness

The wizard is presented over the currently visible screen. You do not need to pass a view controller.

## Enable Capabilities

Add the required privacy descriptions to the application `Info.plist`.

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>Your app uses location to detect trips while the user is driving.</string>
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>Your app uses background location to automatically detect trip start and end events.</string>
<key>NSLocationAlwaysUsageDescription</key>
<string>Your app uses background location to automatically detect trip start and end events.</string>
<key>NSMotionUsageDescription</key>
<string>Your app uses motion activity to improve driving detection and telematics scoring.</string>
```

Enable background location if your application uses automatic trip detection.

```xml
<key>UIBackgroundModes</key>
<array>
    <string>location</string>
</array>
```

## SDK Import

```swift
import TelematicsSDK
```
```objectivec
#import <TelematicsSDK/TelematicsSDK.h>
```

## Basic Usage

Configure and launch the wizard after the application UI is ready, for example after the first screen appears or before enabling tracking.

```swift
let wizard = RPPermissionsWizard.instance
wizard.setAppName("Your App")

if !RPEntry.instance.isAllRequiredPermissionsAndSensorsGranted() {
    wizard.launch { granted in
        if granted {
            // Continue with SDK tracking setup.
        } else {
            // Continue without all permissions or show your own follow-up UI.
        }
    }
}
```
```objectivec
RPPermissionsWizard *wizard = [RPPermissionsWizard instance];
[wizard setAppName:@"Your App"];

if (![[RPEntry instance] isAllRequiredPermissionsAndSensorsGranted]) {
    [wizard launchWithCompletion:^(BOOL granted) {
        if (granted) {
            // Continue with SDK tracking setup.
        } else {
            // Continue without all permissions or show your own follow-up UI.
        }
    }];
}
```

## Wizard Behavior

The wizard opens the instructional pages in this order:

1. Location When In Use
2. Location Always
3. Motion & Fitness

If a permission prompt was already shown earlier, iOS will not show that prompt again. In that case, tapping `Continue` advances to the next wizard page instead of blocking the user.

After the Motion & Fitness page:

* If Location Always, Precise Location, and Motion & Fitness are all granted, the wizard closes and returns `true`.
* If any required permission is missing or Location is reduced accuracy, the wizard shows the final status page.
* On the status page, both `Fix in Settings` and `Skip for now` close the wizard and return the current permission result.
* `Fix in Settings` also opens the app Settings page after the wizard dismisses.

If the user denies Location When In Use during the first prompt, the wizard skips Location Always and opens Motion & Fitness. If the user selects `Allow Once`, the Location Always prompt may not appear; the wizard continues to Motion & Fitness instead of blocking the user.

The wizard does not present UI in these cases:

* The wizard is already displayed.
* There is no currently visible view controller available for presentation.

## Missing Permissions Alert

Enable the independent missing permissions alert when the host app should keep warning users after the wizard flow has already requested Location and Motion permissions.

```swift
let wizard = RPPermissionsWizard.instance
wizard.setMissingPermissionsAlertEnabled(true)
```
```objectivec
RPPermissionsWizard *wizard = [RPPermissionsWizard instance];
[wizard setMissingPermissionsAlertEnabled:YES];
```

When enabled, the SDK checks permissions every time the app enters foreground. The alert is shown only when Location and Motion permissions were both requested before, and at least one required permission is missing. It is not shown while both permissions are still not determined.

The alert is centered and can be configured as blocking or non-blocking. Blocking alerts show only `Fix in Settings`. Non-blocking alerts also show a configurable skip action. If all required permissions are granted while the user is in Settings, the alert is dismissed automatically the next time the app enters foreground.

Use `configureMissingPermissionsAlert(_:)` to customize the alert independently from the guided wizard flow.

```swift
let lightTheme = RPPermissionsWizardTheme(
    backgroundColor: UIColor(red: 0.929, green: 0.961, blue: 0.992, alpha: 1.0),
    gradientStartColor: UIColor(red: 0.835, green: 0.910, blue: 0.980, alpha: 1.0),
    gradientEndColor: UIColor(red: 0.980, green: 0.988, blue: 1.000, alpha: 1.0),
    titleTextColor: UIColor(red: 0.110, green: 0.106, blue: 0.271, alpha: 1.0),
    bodyTextColor: UIColor(red: 0.361, green: 0.396, blue: 0.451, alpha: 1.0),
    primaryElementColor: UIColor(red: 0.129, green: 0.114, blue: 0.310, alpha: 1.0),
    secondaryElementColor: UIColor(red: 0.902, green: 0.918, blue: 0.945, alpha: 1.0),
    buttonTextColor: UIColor.white,
    cardBackgroundColor: UIColor.white,
    successElementColor: UIColor(red: 0.184, green: 0.749, blue: 0.306, alpha: 1.0),
    warningElementColor: UIColor(red: 1.000, green: 0.624, blue: 0.039, alpha: 1.0),
    secondaryButtonTextColor: UIColor(red: 0.541, green: 0.561, blue: 0.600, alpha: 1.0),
    secondaryButtonBackgroundColor: UIColor.clear,
    statusIndicatorTextColor: UIColor.white,
    modalScrimColor: UIColor.black.withAlphaComponent(0.6)
)

let darkTheme = RPPermissionsWizardTheme(
    backgroundColor: UIColor(red: 0.082, green: 0.090, blue: 0.267, alpha: 1.0),
    gradientStartColor: UIColor(red: 0.078, green: 0.082, blue: 0.165, alpha: 1.0),
    gradientEndColor: UIColor(red: 0.035, green: 0.039, blue: 0.090, alpha: 1.0),
    titleTextColor: UIColor.white,
    bodyTextColor: UIColor(red: 0.875, green: 0.875, blue: 0.875, alpha: 1.0),
    primaryElementColor: UIColor.white,
    secondaryElementColor: UIColor(red: 0.180, green: 0.190, blue: 0.290, alpha: 1.0),
    buttonTextColor: UIColor(red: 0.082, green: 0.090, blue: 0.267, alpha: 1.0),
    cardBackgroundColor: UIColor(red: 0.145, green: 0.153, blue: 0.231, alpha: 1.0),
    successElementColor: UIColor(red: 0.290, green: 0.820, blue: 0.420, alpha: 1.0),
    warningElementColor: UIColor(red: 1.000, green: 0.682, blue: 0.180, alpha: 1.0),
    secondaryButtonTextColor: UIColor(red: 0.780, green: 0.800, blue: 0.840, alpha: 1.0),
    secondaryButtonBackgroundColor: UIColor.clear,
    statusIndicatorTextColor: UIColor.white,
    modalScrimColor: UIColor.black.withAlphaComponent(0.6)
)

let alertConfiguration = RPPermissionsWizardMissingPermissionsAlertConfiguration(
    title: "Permissions needed",
    body: "Turn these permissions on to keep trip tracking accurate.",
    locationTitle: "Location",
    motionTitle: "Motion & Fitness",
    locationEnabledText: "Enabled - Always, Precise",
    locationAlwaysRequiredText: "Set access to Always",
    locationPreciseRequiredText: "Turn Precise Location on",
    locationActionNeededText: "Action needed",
    motionEnabledText: "Enabled",
    motionActionNeededText: "Action needed",
    fixInSettingsButtonTitle: "Fix in Settings",
    isBlocking: false,
    skipButtonTitle: "Skip for now",
    lightTheme: lightTheme,
    darkTheme: darkTheme
)

wizard.configureMissingPermissionsAlert(alertConfiguration)
```

## Default Configuration

Use the default configuration when the built-in texts and colors fit your application. Do not call `configure(_:)`. Call `setAppName(_:)` before `launch(completion:)` to apply your app name to the default texts.

```swift
let wizard = RPPermissionsWizard.instance
wizard.setAppName("Your App")
wizard.launch()
```
```objectivec
RPPermissionsWizard *wizard = [RPPermissionsWizard instance];
[wizard setAppName:@"Your App"];
[wizard launchWithCompletion:nil];
```

## Custom Configuration

Use a custom configuration when you need to customize page texts, status texts, button titles, permission hints, or colors. Create custom page, status, and theme objects, then pass them to `RPPermissionsWizardConfiguration`.

```swift
let locationWhenInUse = RPPermissionsWizardPageConfiguration(
    title: "Allow location access",
    body: "Location helps Your App detect when a trip starts.",
    primaryButtonTitle: "Continue",
    hintLead: "ON THE NEXT SCREEN, TAP:",
    permissionHint: "Allow While Using App"
)

let locationAlways = RPPermissionsWizardPageConfiguration(
    title: "Keep location enabled",
    body: "Always access helps Your App detect trips in the background.",
    primaryButtonTitle: "Continue",
    hintLead: "ON THE NEXT SCREEN, TAP:",
    permissionHint: "Change to Always Allow"
)

let motion = RPPermissionsWizardPageConfiguration(
    title: "Allow Motion & Fitness",
    body: "Motion activity improves trip detection and driving score accuracy.",
    primaryButtonTitle: "Continue",
    hintLead: "ON THE NEXT SCREEN, TAP:",
    permissionHint: "Allow"
)

let status = RPPermissionsWizardStatusConfiguration(
    title: "You're almost there",
    body: "Some permissions still need to be enabled so Your App can track trips accurately.",
    locationTitle: "Enable GPS always",
    motionTitle: "Enable Motions",
    locationEnabledText: "Enabled - Always, Precise",
    locationAlwaysRequiredText: "Set access to Always",
    locationPreciseRequiredText: "Turn Precise Location on",
    locationActionNeededText: "Action needed",
    motionEnabledText: "Enabled",
    motionActionNeededText: "Action needed",
    fixInSettingsButtonTitle: "Fix in Settings",
    skipButtonTitle: "Skip for now"
)

let lightTheme = RPPermissionsWizardTheme(
    backgroundColor: UIColor(red: 0.929, green: 0.961, blue: 0.992, alpha: 1.0),
    gradientStartColor: UIColor(red: 0.835, green: 0.910, blue: 0.980, alpha: 1.0),
    gradientEndColor: UIColor(red: 0.980, green: 0.988, blue: 1.000, alpha: 1.0),
    titleTextColor: UIColor(red: 0.110, green: 0.106, blue: 0.271, alpha: 1.0),
    bodyTextColor: UIColor(red: 0.361, green: 0.396, blue: 0.451, alpha: 1.0),
    primaryElementColor: UIColor(red: 0.129, green: 0.114, blue: 0.310, alpha: 1.0),
    secondaryElementColor: UIColor(red: 0.902, green: 0.918, blue: 0.945, alpha: 1.0),
    buttonTextColor: UIColor.white,
    cardBackgroundColor: UIColor.white,
    successElementColor: UIColor(red: 0.184, green: 0.749, blue: 0.306, alpha: 1.0),
    warningElementColor: UIColor(red: 1.000, green: 0.624, blue: 0.039, alpha: 1.0),
    secondaryButtonTextColor: UIColor(red: 0.541, green: 0.561, blue: 0.600, alpha: 1.0),
    secondaryButtonBackgroundColor: UIColor.clear,
    statusIndicatorTextColor: UIColor.white,
    modalScrimColor: UIColor.black.withAlphaComponent(0.6)
)

let darkTheme = RPPermissionsWizardTheme(
    backgroundColor: UIColor(red: 0.082, green: 0.090, blue: 0.267, alpha: 1.0),
    gradientStartColor: UIColor(red: 0.078, green: 0.082, blue: 0.165, alpha: 1.0),
    gradientEndColor: UIColor(red: 0.035, green: 0.039, blue: 0.090, alpha: 1.0),
    titleTextColor: UIColor.white,
    bodyTextColor: UIColor(red: 0.875, green: 0.875, blue: 0.875, alpha: 1.0),
    primaryElementColor: UIColor.white,
    secondaryElementColor: UIColor(red: 0.180, green: 0.190, blue: 0.290, alpha: 1.0),
    buttonTextColor: UIColor(red: 0.082, green: 0.090, blue: 0.267, alpha: 1.0),
    cardBackgroundColor: UIColor(red: 0.145, green: 0.153, blue: 0.231, alpha: 1.0),
    successElementColor: UIColor(red: 0.290, green: 0.820, blue: 0.420, alpha: 1.0),
    warningElementColor: UIColor(red: 1.000, green: 0.682, blue: 0.180, alpha: 1.0),
    secondaryButtonTextColor: UIColor(red: 0.780, green: 0.800, blue: 0.840, alpha: 1.0),
    secondaryButtonBackgroundColor: UIColor.clear,
    statusIndicatorTextColor: UIColor.white,
    modalScrimColor: UIColor.black.withAlphaComponent(0.6)
)

let configuration = RPPermissionsWizardConfiguration(
    locationWhenInUse: locationWhenInUse,
    locationAlways: locationAlways,
    motion: motion,
    status: status,
    lightTheme: lightTheme,
    darkTheme: darkTheme
)

RPPermissionsWizard.instance.configure(configuration)
RPPermissionsWizard.instance.launch()
```
```objectivec
RPPermissionsWizardPageConfiguration *locationWhenInUse = [[RPPermissionsWizardPageConfiguration alloc]
    initWithTitle:@"Allow location access"
    body:@"Location helps Your App detect when a trip starts."
    primaryButtonTitle:@"Continue"
    hintLead:@"ON THE NEXT SCREEN, TAP:"
    permissionHint:@"Allow While Using App"];

RPPermissionsWizardPageConfiguration *locationAlways = [[RPPermissionsWizardPageConfiguration alloc]
    initWithTitle:@"Keep location enabled"
    body:@"Always access helps Your App detect trips in the background."
    primaryButtonTitle:@"Continue"
    hintLead:@"ON THE NEXT SCREEN, TAP:"
    permissionHint:@"Change to Always Allow"];

RPPermissionsWizardPageConfiguration *motion = [[RPPermissionsWizardPageConfiguration alloc]
    initWithTitle:@"Allow Motion & Fitness"
    body:@"Motion activity improves trip detection and driving score accuracy."
    primaryButtonTitle:@"Continue"
    hintLead:@"ON THE NEXT SCREEN, TAP:"
    permissionHint:@"Allow"];

RPPermissionsWizardStatusConfiguration *status = [[RPPermissionsWizardStatusConfiguration alloc]
    initWithTitle:@"You're almost there"
    body:@"Some permissions still need to be enabled so Your App can track trips accurately."
    locationTitle:@"Enable GPS always"
    motionTitle:@"Enable Motions"
    locationEnabledText:@"Enabled - Always, Precise"
    locationAlwaysRequiredText:@"Set access to Always"
    locationPreciseRequiredText:@"Turn Precise Location on"
    locationActionNeededText:@"Action needed"
    motionEnabledText:@"Enabled"
    motionActionNeededText:@"Action needed"
    fixInSettingsButtonTitle:@"Fix in Settings"
    skipButtonTitle:@"Skip for now"];

RPPermissionsWizardTheme *lightTheme = [[RPPermissionsWizardTheme alloc]
    initWithBackgroundColor:[UIColor colorWithRed:0.929 green:0.961 blue:0.992 alpha:1.0]
    gradientStartColor:[UIColor colorWithRed:0.835 green:0.910 blue:0.980 alpha:1.0]
    gradientEndColor:[UIColor colorWithRed:0.980 green:0.988 blue:1.000 alpha:1.0]
    titleTextColor:[UIColor colorWithRed:0.110 green:0.106 blue:0.271 alpha:1.0]
    bodyTextColor:[UIColor colorWithRed:0.361 green:0.396 blue:0.451 alpha:1.0]
    primaryElementColor:[UIColor colorWithRed:0.129 green:0.114 blue:0.310 alpha:1.0]
    secondaryElementColor:[UIColor colorWithRed:0.902 green:0.918 blue:0.945 alpha:1.0]
    buttonTextColor:UIColor.whiteColor
    cardBackgroundColor:UIColor.whiteColor
    successElementColor:[UIColor colorWithRed:0.184 green:0.749 blue:0.306 alpha:1.0]
    warningElementColor:[UIColor colorWithRed:1.000 green:0.624 blue:0.039 alpha:1.0]
    secondaryButtonTextColor:[UIColor colorWithRed:0.541 green:0.561 blue:0.600 alpha:1.0]
    secondaryButtonBackgroundColor:UIColor.clearColor
    statusIndicatorTextColor:UIColor.whiteColor
    modalScrimColor:[UIColor.blackColor colorWithAlphaComponent:0.6]];

RPPermissionsWizardTheme *darkTheme = [[RPPermissionsWizardTheme alloc]
    initWithBackgroundColor:[UIColor colorWithRed:0.082 green:0.090 blue:0.267 alpha:1.0]
    gradientStartColor:[UIColor colorWithRed:0.078 green:0.082 blue:0.165 alpha:1.0]
    gradientEndColor:[UIColor colorWithRed:0.035 green:0.039 blue:0.090 alpha:1.0]
    titleTextColor:UIColor.whiteColor
    bodyTextColor:[UIColor colorWithRed:0.875 green:0.875 blue:0.875 alpha:1.0]
    primaryElementColor:UIColor.whiteColor
    secondaryElementColor:[UIColor colorWithRed:0.180 green:0.190 blue:0.290 alpha:1.0]
    buttonTextColor:[UIColor colorWithRed:0.082 green:0.090 blue:0.267 alpha:1.0]
    cardBackgroundColor:[UIColor colorWithRed:0.145 green:0.153 blue:0.231 alpha:1.0]
    successElementColor:[UIColor colorWithRed:0.290 green:0.820 blue:0.420 alpha:1.0]
    warningElementColor:[UIColor colorWithRed:1.000 green:0.682 blue:0.180 alpha:1.0]
    secondaryButtonTextColor:[UIColor colorWithRed:0.780 green:0.800 blue:0.840 alpha:1.0]
    secondaryButtonBackgroundColor:UIColor.clearColor
    statusIndicatorTextColor:UIColor.whiteColor
    modalScrimColor:[UIColor.blackColor colorWithAlphaComponent:0.6]];

RPPermissionsWizardConfiguration *configuration = [[RPPermissionsWizardConfiguration alloc]
    initWithLocationWhenInUse:locationWhenInUse
    locationAlways:locationAlways
    motion:motion
    status:status
    lightTheme:lightTheme
    darkTheme:darkTheme];

[[RPPermissionsWizard instance] configure:configuration];
[[RPPermissionsWizard instance] launchWithCompletion:nil];
```

## Public API

### `RPPermissionsWizard`

| Method | Description |
| --- | --- |
| `RPPermissionsWizard.instance` | Returns the shared singleton wizard instance. |
| `setAppName(_:)` | Sets the app name used by the default wizard texts. Call before `launch(completion:)`. |
| `configure(_:)` | Applies custom page texts, status texts, and light or dark theme colors. |
| `configureMissingPermissionsAlert(_:)` | Applies custom texts and themes for the independent missing permissions alert. |
| `setMissingPermissionsAlertEnabled(_:)` | Enables or disables foreground checks for the independent missing permissions alert. |
| `launch(completion:)` | Presents the wizard over the currently visible screen. The completion returns the current required permission state. |

### `RPPermissionsWizardConfiguration`

| Property or method | Description |
| --- | --- |
| `defaultConfiguration()` | Creates a configuration with built-in texts and default light or dark themes. |
| `init(locationWhenInUse:locationAlways:motion:status:lightTheme:darkTheme:)` | Creates a custom configuration from page, status, and theme configurations. |
| `locationWhenInUse` | Text configuration for the Location When In Use page. |
| `locationAlways` | Text configuration for the Location Always page. |
| `motion` | Text configuration for the Motion & Fitness page. |
| `status` | Text configuration for the final permission status page. |
| `lightTheme` | Theme used when the current interface style is light. |
| `darkTheme` | Theme used when the current interface style is dark. |

### `RPPermissionsWizardPageConfiguration`

| Property | Description |
| --- | --- |
| `title` | The page title. |
| `body` | The page description. |
| `primaryButtonTitle` | The primary action button title. |
| `hintLead` | The callout lead text shown above the expected system permission action. |
| `permissionHint` | The expected system permission action shown in the callout. |

### `RPPermissionsWizardStatusConfiguration`

| Property | Description |
| --- | --- |
| `title` | Status page title. |
| `body` | Status page body. |
| `locationTitle` | Location status row title. |
| `motionTitle` | Motion status row title. |
| `locationEnabledText` | Location status text when Always and Precise are enabled. |
| `locationAlwaysRequiredText` | Location status text when Always access is required. |
| `locationPreciseRequiredText` | Location status text when Precise Location is required. |
| `locationActionNeededText` | Location status text when user action is required. |
| `motionEnabledText` | Motion status text when Motion & Fitness is enabled. |
| `motionActionNeededText` | Motion status text when user action is required. |
| `fixInSettingsButtonTitle` | Primary status action title. |
| `skipButtonTitle` | Secondary status action title. |

### `RPPermissionsWizardMissingPermissionsAlertConfiguration`

| Property or method | Description |
| --- | --- |
| `defaultConfiguration()` | Creates an alert configuration with built-in texts and default light or dark themes. |
| `title` | Alert title. |
| `body` | Alert body. |
| `locationTitle` | Location status row title. |
| `motionTitle` | Motion status row title. |
| `locationEnabledText` | Location status text when Always and Precise are enabled. |
| `locationAlwaysRequiredText` | Location status text when Always access is required. |
| `locationPreciseRequiredText` | Location status text when Precise Location is required. |
| `locationActionNeededText` | Location status text when user action is required. |
| `motionEnabledText` | Motion status text when Motion & Fitness is enabled. |
| `motionActionNeededText` | Motion status text when user action is required. |
| `fixInSettingsButtonTitle` | Alert action title. |
| `isBlocking` | Indicates whether the alert hides the skip action and blocks dismissal until permissions are fixed. |
| `skipButtonTitle` | Skip action title shown only for non-blocking alerts. |
| `lightTheme` | Theme used when the current interface style is light. |
| `darkTheme` | Theme used when the current interface style is dark. |

### `RPPermissionsWizardTheme`

| Property | Description |
| --- | --- |
| `backgroundColor` | Fallback background color. |
| `gradientStartColor` | Top color of the vertical background gradient. |
| `gradientEndColor` | Bottom color of the vertical background gradient. |
| `titleTextColor` | Page and status title color. |
| `bodyTextColor` | Body text color and source color for inactive progress dots. |
| `primaryElementColor` | Primary button, active progress dot, icon, and accent color. |
| `secondaryElementColor` | Supporting decorative element color. |
| `buttonTextColor` | Primary button title color. |
| `cardBackgroundColor` | Callout and status row background color. |
| `successElementColor` | Granted status indicator color. |
| `warningElementColor` | Missing permission status indicator color. |
| `secondaryButtonTextColor` | Secondary action text color and callout lead text color. |
| `secondaryButtonBackgroundColor` | Secondary action background color. |
| `statusIndicatorTextColor` | Icon/text color inside status indicator circles. |
| `modalScrimColor` | Dimming color behind modal permission alerts. |

## Required Permission Result

`launch(completion:)` returns `true` only when all required permissions are currently valid:

* Location authorization is `Always`.
* Precise Location is enabled.
* Motion & Fitness is authorized, except on Simulator where Motion is treated as granted.

The same result is returned by `RPEntry.instance.isAllRequiredPermissionsAndSensorsGranted()`.

## Recommended Integration Point

Launch the wizard after SDK initialization and after the app has a visible screen.

```swift
func sceneDidBecomeActive(_ scene: UIScene) {
    let wizard = RPPermissionsWizard.instance
    wizard.setAppName("Your App")
    wizard.launch()
}
```
```objectivec
- (void)sceneDidBecomeActive:(UIScene *)scene {
    RPPermissionsWizard *wizard = [RPPermissionsWizard instance];
    [wizard setAppName:@"Your App"];
    [wizard launchWithCompletion:nil];
}
```

## Troubleshooting

If the wizard is not displayed, verify that:

* The wizard is not already displayed.
* The app has a visible view controller when `launch(completion:)` is called.
* `launch(completion:)` is called on an app flow where modal presentation is allowed.

If a system permission prompt does not appear, the permission may have already been requested. The wizard still shows its instructional pages; tapping `Continue` advances to the next page.

If the status page reports Location as incomplete while Location is set to Always, check that Precise Location is enabled in iOS Settings.
