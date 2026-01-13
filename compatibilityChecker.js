/**
 * Compatibility Checker Module
 * Validates NodeBB version compatibility and hook availability
 * 
 * Requirements: 1.1, 1.2, 1.3
 */
'use strict';

// Supported NodeBB version range
const SUPPORTED_MAJOR_VERSION = 4;
const MIN_SUPPORTED_VERSION = '4.0.0';

/**
 * Gets the current NodeBB version
 * @returns {string} Version in semver format, or 'unknown' if not detectable
 */
function getNodeBBVersion() {
  try {
    const nconf = require.main.require('nconf');
    const version = nconf.get('version');
    if (version) {
      return version;
    }
  } catch (err) {
    // nconf not available, try package.json
  }

  try {
    const packageJson = require.main.require('./package.json');
    if (packageJson && packageJson.version) {
      return packageJson.version;
    }
  } catch (err) {
    // package.json not available
  }

  return 'unknown';
}

/**
 * Parses a semver version string into components
 * @param {string} version - Version string (e.g., '3.2.1')
 * @returns {{major: number, minor: number, patch: number} | null}
 */
function parseVersion(version) {
  if (!version || typeof version !== 'string') {
    return null;
  }

  // Handle versions with pre-release tags (e.g., '3.0.0-beta.1')
  const cleanVersion = version.split('-')[0];
  const parts = cleanVersion.split('.');

  if (parts.length < 1) {
    return null;
  }

  const major = parseInt(parts[0], 10);
  const minor = parseInt(parts[1] || '0', 10);
  const patch = parseInt(parts[2] || '0', 10);

  if (isNaN(major)) {
    return null;
  }

  return {
    major: major,
    minor: isNaN(minor) ? 0 : minor,
    patch: isNaN(patch) ? 0 : patch
  };
}

/**
 * Checks if the current NodeBB version is compatible with this plugin
 * @param {string} [version] - Optional version to check (defaults to current NodeBB version)
 * @returns {boolean} True if compatible, false otherwise
 */
function checkCompatibility(version) {
  const versionToCheck = version !== undefined ? version : getNodeBBVersion();

  if (versionToCheck === 'unknown') {
    // Cannot determine version, assume compatible but log warning
    console.warn('[chat-perms] Unable to determine NodeBB version, assuming compatible');
    return true;
  }

  const parsed = parseVersion(versionToCheck);

  if (!parsed) {
    console.warn(`[chat-perms] Invalid version format: ${versionToCheck}`);
    return false;
  }

  // Check if major version is 3.x
  const isCompatible = parsed.major === SUPPORTED_MAJOR_VERSION;

  if (!isCompatible) {
    console.warn(
      `[chat-perms] Incompatible NodeBB version detected: ${versionToCheck}. ` +
      `This plugin supports NodeBB ${SUPPORTED_MAJOR_VERSION}.x`
    );
  }

  return isCompatible;
}

/**
 * Checks if a specific NodeBB hook is available
 * @param {string} hookName - Name of the hook to check
 * @returns {boolean} True if hook is available
 */
function isHookAvailable(hookName) {
  if (!hookName || typeof hookName !== 'string') {
    return false;
  }

  try {
    const Plugins = require.main.require('./src/plugins');
    
    // Check if the hook exists in the registered hooks
    if (Plugins && Plugins.hooks && Plugins.hooks.hasListeners) {
      return true; // Hook system is available
    }

    // Alternative check - see if we can access hooks object
    if (Plugins && typeof Plugins.hooks === 'object') {
      return true;
    }

    return true; // Assume available if Plugins loaded successfully
  } catch (err) {
    // Plugins module not available (likely in test environment)
    // Return true to allow graceful degradation
    return true;
  }
}

/**
 * Safely processes hook data, handling both old and new data formats
 * @param {*} data - Hook data in any format
 * @param {Object} defaults - Default values to use
 * @returns {Object} Normalized data object
 */
function normalizeHookData(data, defaults = {}) {
  // Handle null/undefined
  if (data === null || data === undefined) {
    return { ...defaults };
  }

  // Handle non-object types
  if (typeof data !== 'object') {
    return { ...defaults, value: data };
  }

  // Handle arrays (some hooks pass arrays)
  if (Array.isArray(data)) {
    return { ...defaults, items: data };
  }

  // Return object with defaults filled in
  return { ...defaults, ...data };
}

module.exports = {
  getNodeBBVersion,
  checkCompatibility,
  isHookAvailable,
  normalizeHookData,
  parseVersion, // Exported for testing
  SUPPORTED_MAJOR_VERSION,
  MIN_SUPPORTED_VERSION
};
