const { withProjectBuildGradle } = require('@expo/config-plugins');
const { MIN_COMPILE_SDK, KOTLIN_METADATA_VERSION_CHECK_MARKER } = require('../constants');

const COMPILE_SDK_REGEX = /(compileSdkVersion|compileSdk)(\s*=\s*)(\d+)/;
// Modern Expo prebuild templates apply this plugin instead of declaring a
// literal `ext {}` block; it seeds compileSdk from a version catalog that is
// itself overridden via gradle.properties (see ./withGradleProperties.js), so
// there is no build.gradle text to patch for compileSdk on these templates.
const EXPO_ROOT_PROJECT_PLUGIN_REGEX = /apply\s+plugin:\s*["']expo-root-project["']/;

function ensureCompileSdk(contents) {
  const match = COMPILE_SDK_REGEX.exec(contents);
  if (!match) {
    throw new Error(
      '[react-native-telematics] Could not find "compileSdkVersion" (or "compileSdk") in the root ' +
        'android/build.gradle ext block. react-native-telematics requires compileSdk ' +
        `${MIN_COMPILE_SDK} or higher (com.telematicssdk:tracking:4.1.0 requires Android API ` +
        `${MIN_COMPILE_SDK}). Set it manually (see README).`
    );
  }

  const current = parseInt(match[3], 10);
  if (current >= MIN_COMPILE_SDK) {
    return contents;
  }

  return contents.replace(COMPILE_SDK_REGEX, `$1$2${MIN_COMPILE_SDK}`);
}

/**
 * Appends an `allprojects { tasks.withType(KotlinCompile) { ... } }` block to
 * the root android/build.gradle that tells every Kotlin compile task to skip
 * its metadata-version check.
 *
 * Why this instead of raising the Kotlin Gradle Plugin (KGP) version: Expo
 * pins its OWN Kotlin compiler version (well below 2.3.x, e.g. 2.1.20 on
 * current Expo SDKs) to build Expo's own modules, independent of whatever
 * this project sets. com.telematicssdk:tracking:4.1.0 brings in kotlin-stdlib
 * 2.3.x. Raising `android.kotlinVersion`/`kotlinVersion` only changes the
 * stdlib/reflect artifacts on the classpath -- it does NOT change the
 * compiler Expo uses for its own modules, so those modules end up compiled
 * against 2.3.x metadata that Expo's pinned 2.1.20 compiler refuses to read,
 * which fails with errors like:
 *   "Module was compiled with an incompatible version of Kotlin. The binary
 *   version of its metadata is 2.3.0, expected version is 2.1.0."
 * Passing `-Xskip-metadata-version-check` tells the pinned compiler to read
 * the newer metadata anyway, which is verified to produce a working build,
 * instead of forcing a compiler bump that breaks Expo's own modules.
 */
function ensureSkipMetadataVersionCheck(contents) {
  if (contents.includes(KOTLIN_METADATA_VERSION_CHECK_MARKER)) {
    return contents;
  }

  const block =
    `\n${KOTLIN_METADATA_VERSION_CHECK_MARKER}\n` +
    '// com.telematicssdk:tracking:4.1.0 brings kotlin-stdlib 2.3.x, but Expo pins its own\n' +
    '// Kotlin compiler to build Expo\'s own modules. Raising the Kotlin Gradle Plugin version\n' +
    '// changes the stdlib on the classpath but not that pinned compiler, so Expo\'s modules end\n' +
    '// up compiled against metadata their compiler can\'t read. Skipping the metadata version\n' +
    '// check lets the pinned compiler accept it instead.\n' +
    'allprojects {\n' +
    '    tasks.withType(org.jetbrains.kotlin.gradle.tasks.KotlinCompile).configureEach {\n' +
    '        compilerOptions {\n' +
    '            freeCompilerArgs.add("-Xskip-metadata-version-check")\n' +
    '        }\n' +
    '    }\n' +
    '}\n';

  return `${contents.replace(/\s*$/, '')}\n${block}`;
}

/**
 * Ensures the root android/build.gradle:
 *  - declares compileSdkVersion/compileSdk >= 37
 *  - has an `allprojects` block making every Kotlin compile task skip its
 *    metadata-version check (see ensureSkipMetadataVersionCheck above)
 *
 * See ISSUES-3.1.0.md issues 6/7/8 for why compileSdk 37 is required.
 * Only supports the Groovy build.gradle Expo/RN templates generate; throws a
 * clear error naming the file for Kotlin DSL (build.gradle.kts) projects
 * rather than silently doing nothing.
 */
function withTelematicsProjectBuildGradle(config) {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language !== 'groovy') {
      throw new Error(
        '[react-native-telematics] Expected the root android/build.gradle to be Groovy, but found ' +
          `"${config.modResults.language}". This config plugin does not yet support Kotlin DSL ` +
          '(build.gradle.kts) project files. Apply the compileSdk change and the ' +
          '"-Xskip-metadata-version-check" Kotlin compiler option manually (see README).'
      );
    }

    let contents = config.modResults.contents;

    if (!EXPO_ROOT_PROJECT_PLUGIN_REGEX.test(contents)) {
      // On modern Expo prebuild templates (`apply plugin: "expo-root-project"`),
      // compileSdk is handled entirely by ./withGradleProperties.js
      // (android.compileSdkVersion), which this template reads through its
      // version catalog. Older/bare templates declare it as a literal value
      // here instead.
      contents = ensureCompileSdk(contents);
    }

    contents = ensureSkipMetadataVersionCheck(contents);
    config.modResults.contents = contents;

    return config;
  });
}

module.exports = withTelematicsProjectBuildGradle;
// Exposed for unit testing the pure string transforms directly, without
// going through the Expo mod pipeline. withTelematicsProjectBuildGradle
// itself remains the default export and callable exactly as before.
module.exports.ensureCompileSdk = ensureCompileSdk;
module.exports.ensureSkipMetadataVersionCheck = ensureSkipMetadataVersionCheck;
