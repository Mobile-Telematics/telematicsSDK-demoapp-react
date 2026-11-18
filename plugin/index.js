const { createRunOncePlugin } = require('@expo/config-plugins');

const withTelematicsAppDelegate = require('./ios/withAppDelegate');
const withTelematicsSceneDelegate = require('./ios/withSceneDelegate');
const withTelematicsInfoPlist = require('./ios/withInfoPlist');
const withTelematicsPodfile = require('./ios/withPodfile');
const withTelematicsPodfileSpmCleanup = require('./ios/withPodfileSpmCleanup');
// TEMPORARY (pre-release 3.2.0): TelematicsSDK 7.3.0-rc10 ships vendored in
// ios/Frameworks, and CocoaPods embeds it like any other pod framework, so the
// SPM app-target fix must NOT run: it would attach the remote 7.2.0 package to
// the app target and the bundle would end up with two TelematicsSDK copies.
// Restore this require and the call below once the podspec is back on
// spm_dependency with the released 7.3.0.
// const withTelematicsPodfileSpmAppTarget = require('./ios/withPodfileSpmAppTarget');
const withTelematicsGradleProperties = require('./android/withGradleProperties');
const withTelematicsProjectBuildGradle = require('./android/withProjectBuildGradle');
const withTelematicsAppBuildGradle = require('./android/withAppBuildGradle');
const withTelematicsMainApplication = require('./android/withMainApplication');

const pkg = require('../package.json');

/**
 * Expo config plugin for react-native-telematics.
 *
 * Wires up everything the README's "Getting started" / "Lifecycle handlers"
 * sections otherwise ask integrators to hand-edit into native projects, so it
 * survives `expo prebuild` / `expo prebuild --clean`:
 *
 * iOS:
 *  - AppDelegate: `import TelematicsSDK`, SDK init in
 *    `application(_:didFinishLaunchingWithOptions:)`, and the
 *    application-level lifecycle forwards.
 *  - SceneDelegate (scene-based projects only): the three scene lifecycle
 *    forwards, in place of the AppDelegate-level ones.
 *  - Info.plist: UIBackgroundModes, BGTaskSchedulerPermittedIdentifiers, and
 *    (unless skipped) the three usage description strings.
 *  - Podfile: `use_frameworks! :linkage => :dynamic`. (With the SPM build of
 *    the SDK there is also a `post_install` hook that attaches the
 *    TelematicsSDK Swift package product to the app target, see
 *    plugin/ios/withPodfileSpmAppTarget.js; it is switched off while the
 *    pre-release ships the SDK as a vendored xcframework, and
 *    ./ios/withPodfileSpmCleanup.js removes it from projects prebuilt by
 *    3.1.x without --clean.)
 *
 * Android:
 *  - MainApplication: `TelematicsSdkInitializer.initialize(this)` right after
 *    `super.onCreate()`, so the SDK is initialized on every process start,
 *    including ones where the system starts the tracking service with no JS.
 *  - gradle.properties: `android.experimental.disableCompileSdkChecks=true`
 *    and compileSdk >= 36 (`android.suppressUnsupportedCompileSdk=37.0` only
 *    for apps already on 37); see plugin/android/withGradleProperties.js.
 *  - root build.gradle: an `allprojects` block that
 *    makes every Kotlin compile task skip its metadata-version check (needed
 *    because the SDK brings a newer Kotlin stdlib than the Kotlin compiler
 *    Expo pins for its own modules; see plugin/android/withProjectBuildGradle.js).
 *  - app/build.gradle: the Telematics Maven repository (the local one in
 *    android/maven during the 3.2.0 pre-release), core library
 *    desugaring, and the netty packaging excludes.
 *
 * Every mod is idempotent (guarded by checking for its own marker before
 * writing) and non-destructive (existing user values are merged into, never
 * replaced). See plugin/README references inline in each mod for the
 * specific guard used.
 *
 * @param {import('@expo/config-plugins').ExpoConfig} config
 * @param {object} [options]
 * @param {string} [options.motionUsageDescription] Overrides NSMotionUsageDescription.
 * @param {string} [options.locationWhenInUseUsageDescription] Overrides NSLocationWhenInUseUsageDescription.
 * @param {string} [options.locationAlwaysAndWhenInUseUsageDescription] Overrides NSLocationAlwaysAndWhenInUseUsageDescription.
 * @param {boolean} [options.skipInfoPlistPermissions] Set true to skip adding the three usage
 *   description keys above, for apps that already manage Info.plist permission strings elsewhere.
 *   UIBackgroundModes and BGTaskSchedulerPermittedIdentifiers are still added either way, since
 *   those are not user-facing permission strings.
 */
function withTelematicsSDK(config, options = {}) {
  config = withTelematicsAppDelegate(config);
  config = withTelematicsSceneDelegate(config);
  config = withTelematicsInfoPlist(config, options);
  config = withTelematicsPodfile(config);
  // config = withTelematicsPodfileSpmAppTarget(config); // TEMPORARY, see require above
  // TEMPORARY: undo the 3.1.x SPM fix on projects prebuilt without --clean.
  config = withTelematicsPodfileSpmCleanup(config);

  config = withTelematicsGradleProperties(config);
  config = withTelematicsProjectBuildGradle(config);
  config = withTelematicsAppBuildGradle(config);
  config = withTelematicsMainApplication(config);

  return config;
}

module.exports = createRunOncePlugin(withTelematicsSDK, pkg.name, pkg.version);
