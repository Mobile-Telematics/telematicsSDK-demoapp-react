const { withAppBuildGradle } = require('@expo/config-plugins');
const { MAVEN_URL, DESUGAR_JDK_LIBS, PACKAGING_EXCLUDES } = require('../constants');

const DEPENDENCIES_REGEX = /dependencies\s*\{/;
const TOP_LEVEL_DEPENDENCIES_REGEX = /\n\s*dependencies\s*\{/;
const ANDROID_BLOCK_REGEX = /(^|\n)[ \t]*android\s*\{/;
const COMPILE_OPTIONS_REGEX = /(^|\n)[ \t]*compileOptions\s*\{/;
const DESUGARING_FLAG_REGEX = /coreLibraryDesugaringEnabled\s*=?\s*(true|false)/;
const PACKAGING_BLOCK_REGEX = /(^|\n)[ \t]*packaging\s*\{/;
const PACKAGING_OPTIONS_BLOCK_REGEX = /(^|\n)[ \t]*packagingOptions\s*\{/;
const RESOURCES_BLOCK_REGEX = /(^|\n)[ \t]*resources\s*\{/;
const EXCLUDES_ARRAY_HEADER_REGEX = /excludes\s*\+?=\s*\[/;

/**
 * Finds a delimited region ("{...}" or "[...]") whose opening delimiter is
 * the last character matched by `headerRegex` within contents.slice(rangeStart,
 * rangeEnd). Returns absolute offsets into `contents` (not the slice), with
 * the matching close found via depth counting so nested delimiters of the
 * same kind don't confuse the search.
 */
function findDelimited(contents, headerRegex, rangeStart, rangeEnd, openChar, closeChar) {
  const slice = contents.slice(rangeStart, rangeEnd);
  const match = headerRegex.exec(slice);
  if (!match) {
    return null;
  }

  const openPos = rangeStart + match.index + match[0].length - 1;
  if (contents[openPos] !== openChar) {
    return null;
  }

  let depth = 1;
  let i = openPos + 1;
  for (; i < contents.length && depth > 0; i++) {
    if (contents[i] === openChar) {
      depth++;
    } else if (contents[i] === closeChar) {
      depth--;
    }
  }
  if (depth !== 0) {
    return null;
  }

  const closePos = i - 1;
  return { openPos, closePos, inner: contents.slice(openPos + 1, closePos) };
}

function findBlock(contents, headerRegex, rangeStart = 0, rangeEnd = contents.length) {
  return findDelimited(contents, headerRegex, rangeStart, rangeEnd, '{', '}');
}

function ensureMavenRepository(contents) {
  if (contents.includes(MAVEN_URL)) {
    return contents;
  }

  const repoBlock = `\nrepositories {\n    maven {\n        url "${MAVEN_URL}"\n    }\n}\n`;

  // Insert right before the top-level "dependencies { ... }" block, matching
  // the layout the README documents for android/app/build.gradle.
  const depsMatch = TOP_LEVEL_DEPENDENCIES_REGEX.exec(contents);
  if (depsMatch) {
    return contents.slice(0, depsMatch.index) + repoBlock + contents.slice(depsMatch.index);
  }

  return contents + repoBlock;
}

function noAndroidBlockError(whatToAddManually) {
  return new Error(
    '[react-native-telematics] Could not find an "android { ... }" block in android/app/build.gradle ' +
      `to ${whatToAddManually}. Add it manually (see README).`
  );
}

/**
 * Ensures android/app/build.gradle enables core library desugaring:
 *  - android { compileOptions { coreLibraryDesugaringEnabled true } }
 *  - dependencies { coreLibraryDesugaring("<DESUGAR_JDK_LIBS>") }
 *
 * com.telematicssdk:tracking:4.1.0 requires this in the HOST app; it is not
 * inherited from the library module. Without it the build fails with:
 *   "Dependency 'com.telematicssdk:tracking:4.1.0' requires core library
 *   desugaring to be enabled for :app."
 */
function ensureCoreLibraryDesugaring(contents) {
  contents = ensureDesugaringEnabledFlag(contents);
  contents = ensureDesugaringDependency(contents);
  return contents;
}

function ensureDesugaringEnabledFlag(contents) {
  const flagMatch = DESUGARING_FLAG_REGEX.exec(contents);
  if (flagMatch) {
    if (flagMatch[1] === 'false') {
      // The SDK requires desugaring; flip an explicit "false" to "true"
      // rather than leaving a value that is known to break the build.
      const fixed = flagMatch[0].replace(/false/, 'true');
      return contents.slice(0, flagMatch.index) + fixed + contents.slice(flagMatch.index + flagMatch[0].length);
    }
    return contents;
  }

  const androidBlock = findBlock(contents, ANDROID_BLOCK_REGEX);
  if (!androidBlock) {
    throw noAndroidBlockError(
      'enable core library desugaring ("compileOptions { coreLibraryDesugaringEnabled true }")'
    );
  }

  const compileOptionsBlock = findBlock(
    contents,
    COMPILE_OPTIONS_REGEX,
    androidBlock.openPos + 1,
    androidBlock.closePos
  );

  if (compileOptionsBlock) {
    const insertPos = compileOptionsBlock.openPos + 1;
    return (
      contents.slice(0, insertPos) +
      '\n        coreLibraryDesugaringEnabled true' +
      contents.slice(insertPos)
    );
  }

  const insertPos = androidBlock.openPos + 1;
  return (
    contents.slice(0, insertPos) +
    '\n    compileOptions {\n        coreLibraryDesugaringEnabled true\n    }' +
    contents.slice(insertPos)
  );
}

function ensureDesugaringDependency(contents) {
  if (contents.includes('coreLibraryDesugaring(')) {
    return contents;
  }

  const depsMatch = DEPENDENCIES_REGEX.exec(contents);
  if (!depsMatch) {
    throw new Error(
      '[react-native-telematics] Could not find a "dependencies { ... }" block in android/app/build.gradle ' +
        `to add core library desugaring. Add "coreLibraryDesugaring(\"${DESUGAR_JDK_LIBS}\")" manually (see README).`
    );
  }

  const insertPos = depsMatch.index + depsMatch[0].length;
  return (
    `${contents.slice(0, insertPos)}\n    coreLibraryDesugaring("${DESUGAR_JDK_LIBS}")` +
    contents.slice(insertPos)
  );
}

function indentedExcludeEntries() {
  return PACKAGING_EXCLUDES.map((entry) => `                '${entry}'`).join(',\n');
}

function excludesArrayText() {
  return `\n            excludes += [\n${indentedExcludeEntries()},\n            ]\n        `;
}

function resourcesBlockText() {
  return `\n        resources {\n            excludes += [\n${indentedExcludeEntries()},\n            ]\n        }`;
}

function packagingBlockText() {
  return `\n    packaging {\n        resources {\n            excludes += [\n${indentedExcludeEntries()},\n            ]\n        }\n    }`;
}

function insertMissingExcludes(contents, excludesArray, missing) {
  if (missing.length === 0) {
    return contents;
  }

  const trimmedInner = excludesArray.inner.trim();
  const needsLeadingComma = trimmedInner.length > 0 && !trimmedInner.endsWith(',');
  const newEntries = missing.map((entry) => `                '${entry}'`).join(',\n');

  // Insert right after the existing entries (before their trailing
  // whitespace/indentation) so the closing "]" formatting is preserved
  // instead of pushed onto its own dangling-comma line.
  const trailingWhitespaceLength = (excludesArray.inner.match(/\s*$/) || [''])[0].length;
  const insertPos = excludesArray.closePos - trailingWhitespaceLength;
  const insertion = `${needsLeadingComma ? ',' : ''}\n${newEntries},`;

  return contents.slice(0, insertPos) + insertion + contents.slice(insertPos);
}

/**
 * Ensures android/app/build.gradle excludes the netty META-INF entries that
 * collide during packaging in the HOST app:
 *  - android { packaging { resources { excludes += [...] } } }
 *
 * Same story as desugaring above: the library module's own packaging block
 * does not apply to the app. Without this the build fails with duplicate
 * META-INF entries from io.netty:netty-codec, netty-transport, netty-buffer,
 * netty-resolver, etc.
 *
 * Merges into an existing `packaging` or the older `packagingOptions` block
 * (and an existing `resources`/`excludes` inside either) rather than adding
 * a second block, and only adds entries from PACKAGING_EXCLUDES that are
 * missing.
 */
function ensurePackagingExcludes(contents) {
  const androidBlock = findBlock(contents, ANDROID_BLOCK_REGEX);
  if (!androidBlock) {
    throw noAndroidBlockError('add the required packaging excludes ("packaging { resources { excludes += [...] } }")');
  }

  let packagingBlock = findBlock(contents, PACKAGING_BLOCK_REGEX, androidBlock.openPos + 1, androidBlock.closePos);
  if (!packagingBlock) {
    packagingBlock = findBlock(
      contents,
      PACKAGING_OPTIONS_BLOCK_REGEX,
      androidBlock.openPos + 1,
      androidBlock.closePos
    );
  }

  if (!packagingBlock) {
    const insertPos = androidBlock.openPos + 1;
    return contents.slice(0, insertPos) + packagingBlockText() + contents.slice(insertPos);
  }

  const excludesArray = findDelimited(
    contents,
    EXCLUDES_ARRAY_HEADER_REGEX,
    packagingBlock.openPos + 1,
    packagingBlock.closePos,
    '[',
    ']'
  );
  if (excludesArray) {
    const missing = PACKAGING_EXCLUDES.filter((entry) => !excludesArray.inner.includes(entry));
    return insertMissingExcludes(contents, excludesArray, missing);
  }

  const resourcesBlock = findBlock(
    contents,
    RESOURCES_BLOCK_REGEX,
    packagingBlock.openPos + 1,
    packagingBlock.closePos
  );
  if (resourcesBlock) {
    const insertPos = resourcesBlock.openPos + 1;
    return contents.slice(0, insertPos) + excludesArrayText() + contents.slice(insertPos);
  }

  const insertPos = packagingBlock.openPos + 1;
  return contents.slice(0, insertPos) + resourcesBlockText() + contents.slice(insertPos);
}

/**
 * Ensures android/app/build.gradle:
 *  - declares the Telematics Maven repository
 *  - enables core library desugaring, required by com.telematicssdk:tracking:4.1.0
 *  - excludes the netty META-INF entries that collide during packaging
 *
 * Deliberately does NOT add a kotlin-bom platform dependency: this plugin no
 * longer forces a Kotlin version (see ./withProjectBuildGradle.js), so there
 * is no compiler/stdlib mismatch for a BOM to paper over.
 *
 * See ISSUES-3.1.0.md issue 8 and README "Getting started > Android".
 * Only supports the Groovy build.gradle Expo/RN templates generate; throws a
 * clear error for Kotlin DSL (build.gradle.kts) app files.
 */
function withTelematicsAppBuildGradle(config) {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language !== 'groovy') {
      throw new Error(
        '[react-native-telematics] Expected android/app/build.gradle to be Groovy, but found ' +
          `"${config.modResults.language}". This config plugin does not yet support Kotlin DSL ` +
          '(build.gradle.kts) app build files. Add the Telematics Maven repository, core library ' +
          'desugaring, and packaging excludes manually (see README).'
      );
    }

    let contents = config.modResults.contents;
    contents = ensureMavenRepository(contents);
    contents = ensureCoreLibraryDesugaring(contents);
    contents = ensurePackagingExcludes(contents);
    config.modResults.contents = contents;

    return config;
  });
}

module.exports = withTelematicsAppBuildGradle;
// Exposed for unit testing the pure string transforms directly, without
// going through the Expo mod pipeline. withTelematicsAppBuildGradle itself
// remains the default export and callable exactly as before.
module.exports.ensureMavenRepository = ensureMavenRepository;
module.exports.ensureCoreLibraryDesugaring = ensureCoreLibraryDesugaring;
module.exports.ensurePackagingExcludes = ensurePackagingExcludes;
