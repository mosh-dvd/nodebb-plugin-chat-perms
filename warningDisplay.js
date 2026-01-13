/**
 * Warning Display Module
 * Displays configurable privacy warnings to users in chat interface
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */
'use strict';

// Load plugin settings from environment
let pluginSettings;
try {
  pluginSettings = JSON.parse(process.env.CHAT_PERMS_PLUGIN_SETTINGS || '{}');
} catch {
  pluginSettings = {};
}

// Default warning configuration
const DEFAULT_WARNING_CONFIG = {
  enabled: false,
  message: 'שים לב: ההנהלה יכולה לצפות בהודעות הצ\'אט',
  displayType: 'banner'
};

// Valid display types
const VALID_DISPLAY_TYPES = ['banner', 'popup', 'inline'];

/**
 * Gets the current warning configuration from plugin settings
 * @returns {{enabled: boolean, message: string, displayType: 'banner' | 'popup' | 'inline'}}
 */
function getWarningConfig() {
  const enabled = pluginSettings.WARNING_ENABLED === true;
  const message = typeof pluginSettings.WARNING_MESSAGE === 'string' && pluginSettings.WARNING_MESSAGE.trim()
    ? pluginSettings.WARNING_MESSAGE
    : DEFAULT_WARNING_CONFIG.message;
  
  let displayType = pluginSettings.WARNING_DISPLAY_TYPE;
  if (!VALID_DISPLAY_TYPES.includes(displayType)) {
    displayType = DEFAULT_WARNING_CONFIG.displayType;
  }

  return {
    enabled,
    message,
    displayType
  };
}

/**
 * Checks if the warning feature is enabled
 * @returns {boolean}
 */
function isWarningEnabled() {
  return getWarningConfig().enabled;
}

/**
 * Injects warning data into chat response
 * @param {Object} data - Chat response data
 * @returns {Object} Data with warning injected (if enabled)
 */
function injectWarning(data) {
  // Handle null/undefined data
  if (data === null || data === undefined) {
    data = {};
  }

  // If data is not an object, wrap it
  if (typeof data !== 'object' || Array.isArray(data)) {
    data = { originalData: data };
  }

  const config = getWarningConfig();

  // Only inject warning if enabled
  if (!config.enabled) {
    return data;
  }

  // Inject warning data
  return {
    ...data,
    chatPermsWarning: {
      message: config.message,
      displayType: config.displayType
    }
  };
}

/**
 * Updates the warning configuration (for testing purposes)
 * @param {Object} newSettings - New settings to apply
 */
function updateSettings(newSettings) {
  if (newSettings && typeof newSettings === 'object') {
    pluginSettings = { ...pluginSettings, ...newSettings };
  }
}

/**
 * Resets settings to defaults (for testing purposes)
 */
function resetSettings() {
  pluginSettings = {};
}

module.exports = {
  getWarningConfig,
  isWarningEnabled,
  injectWarning,
  updateSettings,
  resetSettings,
  VALID_DISPLAY_TYPES,
  DEFAULT_WARNING_CONFIG
};
