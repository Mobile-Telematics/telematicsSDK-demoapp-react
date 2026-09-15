const { withGradleProperties } = require('@expo/config-plugins');
const { COMPILE_SDK_SUPPRESS_VALUE, MIN_COMPILE_SDK } = require('../constants');

const SUPPRESS_KEY = 'android.suppressUnsupportedCompileSdk';

// Modern Expo prebuild templates (`apply plugin: "expo-root-project"` in the
// root build.gradle) resolve compileSdk from a Gradle version catalog seeded
// in settings.gradle, which reads this exact gradle.properties key as an
// override (see expo-modules-autolinking's
// ExpoAutolinkingSettingsExtension.useExpoVersionCatalog). Setting it here is
// the non-destructive, template-friendly way to raise it.
//
// A harmless no-op on older/bare templates that declare compileSdk as a
// literal `ext {}` value instead -- that's handled textually by
// ./withProjectBuildGradle.js.
//
// Note: this deliberately does NOT set `android.kotlinVersion`. Doing so
// raises the Kotlin stdlib/reflect on the classpath but not the Kotlin
// compiler Expo pins to build its own modules, which breaks Expo apps (see
// ./withProjectBuildGradle.js's ensureSkipMetadataVersionCheck for the fix
// that actually works).
const COMPILE_SDK_KEY = 'android.compileSdkVersion';

function getProperty(modResults, key) {
  return modResults.find((item) => item.type === 'property' && item.key === key);
}

function setProperty(modResults, key, value) {
  const existing = getProperty(modResults, key);
  if (existing) {
    existing.value = value;
  } else {
    modResults.push({ type: 'property', key, value });
  }
}

function parseVersionParts(value) {
  const match = /^(\d+)(?:\.(\d+))?(?:\.(\d+))?/.exec(String(value).trim());
  if (!match) {
    return null;
  }
  return [Number(match[1]), Number(match[2] || 0), Number(match[3] || 0)];
}

function isAtLeast(value, minParts) {
  const parts = parseVersionParts(value);
  if (!parts) {
    return false;
  }
  for (let i = 0; i < minParts.length; i++) {
    if (parts[i] > minParts[i]) return true;
    if (parts[i] < minParts[i]) return false;
  }
  return true;
}

/**
 * Ensures android/gradle.properties has:
 *  - `android.suppressUnsupportedCompileSdk=37.0`, since AGP 8.12 does not
 *    officially support compileSdk 37 (which com.telematicssdk:tracking:4.1.0
 *    requires) and warns without it -- see ISSUES-3.1.0.md issue 7.
 *  - `android.compileSdkVersion` at least 37, the gradle.properties override
 *    modern Expo prebuild templates read into their version catalog (see
 *    comment above). An existing value that already satisfies the minimum is
 *    left alone.
 */
function withTelematicsGradleProperties(config) {
  return withGradleProperties(config, (config) => {
    setProperty(config.modResults, SUPPRESS_KEY, COMPILE_SDK_SUPPRESS_VALUE);

    const compileSdkProp = getProperty(config.modResults, COMPILE_SDK_KEY);
    if (!compileSdkProp || !isAtLeast(compileSdkProp.value, [MIN_COMPILE_SDK])) {
      setProperty(config.modResults, COMPILE_SDK_KEY, String(MIN_COMPILE_SDK));
    }

    return config;
  });
}

module.exports = withTelematicsGradleProperties;
