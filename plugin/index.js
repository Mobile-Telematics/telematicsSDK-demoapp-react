const { createRunOncePlugin } = require('@expo/config-plugins');

const withTelematicsAppDelegate = require('./ios/withAppDelegate');
const withTelematicsSceneDelegate = require('./ios/withSceneDelegate');
const withTelematicsInfoPlist = require('./ios/withInfoPlist');
const withTelematicsPodfile = require('./ios/withPodfile');
const withTelematicsGradleProperties = require('./android/withGradleProperties');
const withTelematicsProjectBuildGradle = require('./android/withProjectBuildGradle');
const withTelematicsAppBuildGradle = require('./android/withAppBuildGradle');

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
 *  - Podfile: `use_frameworks! :linkage => :dynamic`.
 *
 * Android:
 *  - gradle.properties: `android.suppressUnsupportedCompileSdk=37.0`.
 *  - root build.gradle: compileSdk >= 37, and an `allprojects` block that
 *    makes every Kotlin compile task skip its metadata-version check (needed
 *    because the SDK brings a newer Kotlin stdlib than the Kotlin compiler
 *    Expo pins for its own modules; see plugin/android/withProjectBuildGradle.js).
 *  - app/build.gradle: the Telematics Maven repository, core library
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

  config = withTelematicsGradleProperties(config);
  config = withTelematicsProjectBuildGradle(config);
  config = withTelematicsAppBuildGradle(config);

  return config;
}

module.exports = createRunOncePlugin(withTelematicsSDK, pkg.name, pkg.version);
