/**
 * Shared constants for the react-native-telematics Expo config plugin.
 *
 * These mirror the native SDK versions and required toolchain values documented
 * in the README ("Getting started" / "Lifecycle handlers" sections). They must
 * stay in lockstep with android/build.gradle, ios/TelematicsSdk.swift and
 * react-native-telematics-sdk.podspec, which are owned outside this plugin.
 */
module.exports = {
  // com.telematicssdk:tracking:4.1.0 declares minCompileSdk=37 in its AAR
  // metadata, but nothing in it actually needs API 37: its highest transitive
  // requirement is 36 (androidx.activity 1.13.0), its bytecode references no
  // class added in API 37, and its resources stop at values-v31. The 37 is
  // simply the compileSdk Damoov built the AAR with.
  //
  // This matters because Android SDK Platform 37 is preview-channel only:
  // `sdkmanager --channel=3` can install it on a developer machine, but not on
  // EAS/CI workers, where the build then fails. So target stable compileSdk 36
  // and tell AGP to skip the AAR metadata check (see DISABLE_COMPILE_SDK_CHECKS
  // below) -- verified by building example/ as both debug and release.
  MIN_COMPILE_SDK: 36,

  // AGP option that skips the AAR metadata `minCompileSdk` check. Without it,
  // AGP rejects com.telematicssdk:tracking:4.1.0 on compileSdk 36 with
  // "Dependency ... requires libraries and applications that depend on it to
  // compile against version 37 or later of the Android APIs."
  //
  // Note this relaxes the check for EVERY dependency in the app, not just the
  // Telematics SDK. If another library genuinely needs a higher compileSdk,
  // that will now surface later as a compile/runtime error instead of this
  // check. Raise compileSdk to 37 (see COMPILE_SDK_SUPPRESS_VALUE) if that
  // trade-off is not acceptable.
  DISABLE_COMPILE_SDK_CHECKS: 'android.experimental.disableCompileSdkChecks',

  // AGP 8.12 does not officially support compileSdk 37 and warns unless this
  // gradle.properties flag is set. Only relevant for apps that are on 37
  // already; the plugin never raises compileSdk that far by itself.
  COMPILE_SDK_SUPPRESS_VALUE: '37.0',

  // com.telematicssdk:tracking:4.1.0 fails the build unless the HOST app enables
  // core library desugaring: the requirement is not inherited from the library
  // module, so every consuming app has to opt in itself.
  DESUGAR_JDK_LIBS: 'com.android.tools:desugar_jdk_libs:2.1.5',

  // The Telematics SDK pulls in netty, whose META-INF entries collide during
  // packaging in the host app. Same story as desugaring: the library module's
  // own packaging block does not apply to the app.
  PACKAGING_EXCLUDES: [
    'META-INF/INDEX.LIST',
    'META-INF/io.netty.versions.properties',
    'META-INF/versions/9/OSGI-INF/MANIFEST.MF',
  ],

  // Maven repository that hosts com.telematicssdk:tracking.
  MAVEN_URL: 'https://s3.us-east-2.amazonaws.com/android.telematics.sdk.production/',

  // Marker comment guarding the idempotent insertion of the
  // "-Xskip-metadata-version-check" Kotlin compiler block into the root
  // android/build.gradle. Also doubles as the human-readable explanation of
  // why the block exists, since it's the first thing a reader sees next to it:
  // com.telematicssdk:tracking:4.1.0 drags in kotlin-stdlib 2.3.x, but Expo
  // pins its own Kotlin compiler (well below 2.3.x) to build Expo's own
  // modules. Raising that compiler version breaks Expo's modules, so instead
  // this tells the pinned compiler to accept the newer stdlib metadata rather
  // than reject it.
  KOTLIN_METADATA_VERSION_CHECK_MARKER:
    '// react-native-telematics: skip metadata version check',

  // BGTaskScheduler identifiers required by the iOS SDK for background refresh/processing.
  BG_TASK_IDENTIFIERS: [
    'sdk.damoov.apprefreshtaskid',
    'sdk.damoov.appprocessingtaskid',
  ],

  DEFAULT_MOTION_USAGE_DESCRIPTION:
    'This app uses motion data to automatically detect trips.',
  DEFAULT_LOCATION_WHEN_IN_USE_USAGE_DESCRIPTION:
    'This app uses your location to detect and record trips.',
  DEFAULT_LOCATION_ALWAYS_AND_WHEN_IN_USE_USAGE_DESCRIPTION:
    'This app uses your location in the background to detect and record trips, even when the app is closed.',
};
