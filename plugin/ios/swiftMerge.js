const { findMatchingBrace } = require('../utils/braceMatch');

/**
 * Insert `import <moduleName>` after the last top-level `import ...` line,
 * or at the top of the file if none exists. No-op if already present.
 */
function ensureImport(contents, moduleName) {
  const importLine = `import ${moduleName}`;
  if (contents.includes(importLine)) {
    return contents;
  }

  const importRegex = /^import .+$/gm;
  let lastMatch = null;
  let match;
  while ((match = importRegex.exec(contents)) !== null) {
    lastMatch = match;
  }

  if (lastMatch) {
    const insertPos = lastMatch.index + lastMatch[0].length;
    return `${contents.slice(0, insertPos)}\n${importLine}${contents.slice(insertPos)}`;
  }

  return `${importLine}\n${contents}`;
}

/**
 * Find `methodRegex` (which must end by matching the method's opening `{`)
 * and insert `snippet` immediately after that brace.
 *
 * Throws a descriptive error, naming the file and the method that was
 * expected, if the method cannot be found -- per this plugin's "fail loudly
 * on ambiguity" contract, rather than silently producing a broken project.
 */
function insertAfterMethodOpeningBrace(contents, methodRegex, snippet, fileLabel, methodLabel) {
  const match = methodRegex.exec(contents);
  if (!match) {
    throw new Error(
      `[react-native-telematics] Could not find ${methodLabel} in ${fileLabel}. ` +
        'The Telematics SDK config plugin only supports the standard Expo/React Native Swift ' +
        'AppDelegate template. If this file was heavily customized, add the SDK lifecycle calls ' +
        'manually instead (see README "Lifecycle handlers").'
    );
  }

  const insertPos = match.index + match[0].length; // right after the opening brace
  return contents.slice(0, insertPos) + snippet + contents.slice(insertPos);
}

/**
 * Insert `snippet` immediately before the closing brace of `class <className>`.
 *
 * Throws a descriptive error if the class or its matching closing brace
 * cannot be located.
 */
function insertBeforeClassClosingBrace(contents, className, snippet) {
  const classRegex = new RegExp(`class\\s+${className}\\b[^{]*\\{`);
  const match = classRegex.exec(contents);
  if (!match) {
    throw new Error(
      `[react-native-telematics] Could not find "class ${className}" declaration. ` +
        'The Telematics SDK config plugin only supports the standard Expo/React Native Swift template. ' +
        'Add the SDK lifecycle calls manually instead (see README "Lifecycle handlers").'
    );
  }

  const openBraceIndex = match.index + match[0].length - 1;
  const closeBraceIndex = findMatchingBrace(contents, openBraceIndex);
  if (closeBraceIndex === -1) {
    throw new Error(
      `[react-native-telematics] Could not find the matching closing brace for "class ${className}". ` +
        'The file may be malformed or use an unsupported structure. Add the SDK lifecycle calls manually ' +
        'instead (see README "Lifecycle handlers").'
    );
  }

  return contents.slice(0, closeBraceIndex) + snippet + contents.slice(closeBraceIndex);
}

// Base classes that only bring `UIResponder`/`NSObject` into the inheritance
// chain -- i.e. the lifecycle methods below are protocol requirements the
// class itself must implement, not inherited implementations to override.
// This is the bare React Native template shape: `class AppDelegate:
// UIResponder, UIApplicationDelegate`.
const NON_DELEGATE_BASE_CLASSES = new Set(['UIResponder', 'NSObject']);

/**
 * Inspect `class <className>: <Base>, <Protocol>, ... {` and determine
 * whether `<Base>` (the first entry in the inheritance clause) is a real
 * delegate base class that already provides implementations of the
 * lifecycle methods this plugin injects (e.g. `ExpoAppDelegate`,
 * `RCTAppDelegate`, `EXAppDelegateWrapper`), as opposed to the bare
 * `UIResponder`/`NSObject` template shape where those methods are only
 * protocol requirements.
 *
 * This matters because injecting a plain `func` over an inherited `open
 * func` is a compile error ("overriding declaration requires an 'override'
 * keyword"), while adding `override` where there is nothing to override is
 * a compile error the other way. See plugin/ios/withAppDelegate.js and
 * plugin/ios/withSceneDelegate.js.
 *
 * Returns `null` if the class declaration cannot be found at all, leaving
 * the resulting "could not find class" error to the caller that actually
 * needs to locate the class (e.g. `insertBeforeClassClosingBrace`).
 */
function detectInheritedBaseClass(contents, className) {
  const classRegex = new RegExp(`class\\s+${className}\\b(?:\\s*:\\s*([^{]+))?\\{`);
  const match = classRegex.exec(contents);
  if (!match) {
    return null;
  }

  const inheritanceClause = match[1];
  if (!inheritanceClause) {
    return { baseClass: null, inheritsImplementations: false };
  }

  const inheritanceList = inheritanceClause
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

  const firstBase = inheritanceList[0] || null;
  const inheritsImplementations = firstBase !== null && !NON_DELEGATE_BASE_CLASSES.has(firstBase);

  return { baseClass: firstBase, inheritsImplementations };
}

/**
 * Build a lifecycle method that guards on `RPEntry.isInitialized()` and
 * forwards a single argument-less-return call to `RPEntry.instance`.
 *
 * When `inherits` is true (the base class provides a real implementation),
 * emits `override func` and calls `super.<superCall>` first, so other
 * subscribers of that base class (e.g. other Expo modules via
 * `ExpoAppDelegateSubscriberManager`) keep receiving the event. When false,
 * emits a plain `func` with no `super` call, matching the bare
 * `UIResponder`/`UIApplicationDelegate` template where there is no
 * implementation to call.
 */
function buildForwardMethod(inherits, signature, superCall, sdkCall) {
  const keyword = inherits ? 'override func' : 'func';
  const superLine = inherits ? `    super.${superCall}\n` : '';
  return `
  ${keyword} ${signature} {
${superLine}    guard RPEntry.isInitialized() else { return }
    RPEntry.instance.${sdkCall}
  }
`;
}

module.exports = {
  ensureImport,
  insertAfterMethodOpeningBrace,
  insertBeforeClassClosingBrace,
  detectInheritedBaseClass,
  buildForwardMethod,
};
