const { withInfoPlist } = require('@expo/config-plugins');
const {
  BG_TASK_IDENTIFIERS,
  DEFAULT_MOTION_USAGE_DESCRIPTION,
  DEFAULT_LOCATION_WHEN_IN_USE_USAGE_DESCRIPTION,
  DEFAULT_LOCATION_ALWAYS_AND_WHEN_IN_USE_USAGE_DESCRIPTION,
} = require('../constants');

function mergeArray(existing, additions) {
  const result = Array.isArray(existing) ? existing.slice() : [];
  for (const item of additions) {
    if (!result.includes(item)) {
      result.push(item);
    }
  }
  return result;
}

/**
 * Adds the Info.plist keys the SDK needs:
 *  - UIBackgroundModes: fetch, location, remote-notification (merged, not replaced)
 *  - BGTaskSchedulerPermittedIdentifiers: the two Damoov task ids (merged, not replaced)
 *  - NSMotionUsageDescription / NSLocationWhenInUseUsageDescription /
 *    NSLocationAlwaysAndWhenInUseUsageDescription, unless the app already set
 *    one (never clobbered) or `options.skipInfoPlistPermissions` is set.
 */
function withTelematicsInfoPlist(config, options = {}) {
  return withInfoPlist(config, (config) => {
    const infoPlist = config.modResults;

    infoPlist.UIBackgroundModes = mergeArray(infoPlist.UIBackgroundModes, [
      'fetch',
      'location',
      'remote-notification',
    ]);

    infoPlist.BGTaskSchedulerPermittedIdentifiers = mergeArray(
      infoPlist.BGTaskSchedulerPermittedIdentifiers,
      BG_TASK_IDENTIFIERS
    );

    if (!options.skipInfoPlistPermissions) {
      if (!infoPlist.NSMotionUsageDescription) {
        infoPlist.NSMotionUsageDescription =
          options.motionUsageDescription || DEFAULT_MOTION_USAGE_DESCRIPTION;
      }

      if (!infoPlist.NSLocationWhenInUseUsageDescription) {
        infoPlist.NSLocationWhenInUseUsageDescription =
          options.locationWhenInUseUsageDescription ||
          DEFAULT_LOCATION_WHEN_IN_USE_USAGE_DESCRIPTION;
      }

      if (!infoPlist.NSLocationAlwaysAndWhenInUseUsageDescription) {
        infoPlist.NSLocationAlwaysAndWhenInUseUsageDescription =
          options.locationAlwaysAndWhenInUseUsageDescription ||
          DEFAULT_LOCATION_ALWAYS_AND_WHEN_IN_USE_USAGE_DESCRIPTION;
      }
    }

    return config;
  });
}

module.exports = withTelematicsInfoPlist;
