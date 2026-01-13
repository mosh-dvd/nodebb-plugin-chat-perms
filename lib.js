const User = require.main.require('./src/user');
const Groups = require.main.require('./src/groups');
const moment = require('moment');

// Import new modules
const compatibilityChecker = require('./compatibilityChecker');
const warningDisplay = require('./warningDisplay');
const keywordScanner = require('./keywordScanner');

/**
 * Parses plugin settings from environment with defaults
 * Requirements: 2.2, 3.3
 * @returns {Object} Parsed settings with defaults applied
 */
function parsePluginSettings() {
  let rawSettings;
  try {
    rawSettings = JSON.parse(process.env.CHAT_PERMS_PLUGIN_SETTINGS || '{}');
  } catch {
    rawSettings = {};
  }

  // Default values for all settings
  const defaults = {
    // Existing settings
    ADMIN_UIDS: [1],
    ALLOW_CHAT_GROUP: 'allowChat',
    DENY_CHAT_GROUP: 'denyChat',
    MIN_REPUTATION: 10,
    MIN_POSTS: 5,
    CHAT_NOT_YET_ALLOWED_MESSAGE: 'CHAT_NOT_YET_ALLOWED_MESSAGE',
    CHAT_DENIED_MESSAGE: 'CHAT_DENIED_MESSAGE',
    
    // New settings - Privacy Warning (Requirements: 2.2)
    WARNING_ENABLED: false,
    WARNING_MESSAGE: 'שים לב: ההנהלה יכולה לצפות בהודעות הצ\'אט',
    WARNING_DISPLAY_TYPE: 'banner',
    
    // New settings - Keyword Alerts (Requirements: 3.3)
    KEYWORD_ALERTS_ENABLED: false,
    KEYWORD_LIST: [],
    ALERT_RECIPIENT_UIDS: []
  };

  // Merge raw settings with defaults
  const settings = { ...defaults };
  
  for (const key of Object.keys(defaults)) {
    if (rawSettings[key] !== undefined) {
      settings[key] = rawSettings[key];
    }
  }

  // Validate specific fields
  if (!Array.isArray(settings.ADMIN_UIDS)) {
    settings.ADMIN_UIDS = defaults.ADMIN_UIDS;
  }
  if (!Array.isArray(settings.KEYWORD_LIST)) {
    settings.KEYWORD_LIST = defaults.KEYWORD_LIST;
  }
  if (!Array.isArray(settings.ALERT_RECIPIENT_UIDS)) {
    settings.ALERT_RECIPIENT_UIDS = defaults.ALERT_RECIPIENT_UIDS;
  }
  if (!['banner', 'popup', 'inline'].includes(settings.WARNING_DISPLAY_TYPE)) {
    settings.WARNING_DISPLAY_TYPE = defaults.WARNING_DISPLAY_TYPE;
  }

  return settings;
}

// Parse settings once at module load
const pluginSettings = parsePluginSettings();

// Initialize sub-modules with settings
warningDisplay.updateSettings(pluginSettings);
keywordScanner.updateSettings(pluginSettings);

// Check compatibility on load (Requirements: 1.1, 1.2)
const isCompatible = compatibilityChecker.checkCompatibility();
if (!isCompatible) {
  console.warn('[chat-perms] Plugin may not function correctly with this NodeBB version');
}

// Extract settings for use in hooks
const ADMIN_UIDS = pluginSettings.ADMIN_UIDS;
const ALLOW_CHAT_GROUP = pluginSettings.ALLOW_CHAT_GROUP;
const DENY_CHAT_GROUP = pluginSettings.DENY_CHAT_GROUP;
const MIN_REPUTATION = pluginSettings.MIN_REPUTATION;
const MIN_POSTS = pluginSettings.MIN_POSTS;
const CHAT_NOT_YET_ALLOWED_MESSAGE = pluginSettings.CHAT_NOT_YET_ALLOWED_MESSAGE;
const CHAT_DENIED_MESSAGE = pluginSettings.CHAT_DENIED_MESSAGE;

module.exports = {
  /**
   * Hook: canGetMessages
   * Validates user permissions and injects warning if enabled
   * Requirements: 1.1, 2.1
   */
  async canGetMessages (data) {
    // Normalize hook data for compatibility (Requirements: 1.3)
    data = compatibilityChecker.normalizeHookData(data, { canGet: true });
    data.canGet = true;
    
    const userData = await User.getUserData(data.callerUid);
    const userGroups = await Groups.getUserGroupsFromSet('groups:createtime', [data.callerUid]);
    if (
      (userData.reputation < MIN_REPUTATION || userData.postcount < MIN_POSTS || moment(userData.joindate).isAfter(moment() /* .subtract(1, 'month') */)) &&
      !userGroups[0].find(group => [
        'administrators',
        'Global Moderators',
        ALLOW_CHAT_GROUP
      ].includes(group.name))
    ) {
      throw new Error(CHAT_NOT_YET_ALLOWED_MESSAGE);
    }
    if (userGroups[0].find(group => group.name === DENY_CHAT_GROUP)) {
      throw new Error(CHAT_DENIED_MESSAGE);
    }
    if (data.callerUid !== data.uid && !ADMIN_UIDS.includes(data.callerUid)) throw new Error('אין גישה!');
    
    // Inject warning message if enabled (Requirements: 2.1)
    data = warningDisplay.injectWarning(data);
    
    return data;
  },
  
  /**
   * Hook: canReply
   * Validates reply permissions and scans for keywords
   * Requirements: 3.1
   */
  async canReply (data) {
    // Normalize hook data for compatibility (Requirements: 1.3)
    data = compatibilityChecker.normalizeHookData(data);
    
    // Scan message for keywords if content is present (Requirements: 3.1)
    if (data.content) {
      await keywordScanner.processMessage({
        content: data.content,
        uid: data.uid,
        roomId: data.roomId
      });
    }
    
    return data;
  },
  
  /**
   * Hook: canMessageUser
   * Validates user-to-user messaging permissions
   */
  async canMessageUser (data) {
    const userData = await User.getUserData(data.uid);
    const userGroups = await Groups.getUserGroupsFromSet('groups:createtime', [data.uid]);
    if (
      (userData.reputation < MIN_REPUTATION || userData.postcount < MIN_POSTS || moment(userData.joindate).isAfter(moment() /* .subtract(1, 'month') */)) &&
      !userGroups[0].find(group => [
        'administrators',
        'Global Moderators',
        ALLOW_CHAT_GROUP
      ].includes(group.name))
    ) {
      throw new Error(CHAT_NOT_YET_ALLOWED_MESSAGE);
    }
    if (userGroups[0].find(group => group.name === DENY_CHAT_GROUP)) {
      throw new Error(CHAT_DENIED_MESSAGE);
    }
  },
  
  /**
   * Hook: canMessageRoom
   * Validates room messaging permissions and scans for keywords
   * Requirements: 3.1
   */
  async canMessageRoom (data) {
    // Normalize hook data for compatibility (Requirements: 1.3)
    data = compatibilityChecker.normalizeHookData(data);
    
    // Scan message for keywords if content is present (Requirements: 3.1)
    if (data.content) {
      await keywordScanner.processMessage({
        content: data.content,
        uid: data.uid,
        roomId: data.roomId
      });
    }
    
    return data;
  },
  
  /**
   * Hook: isUserInRoom
   * Allows admins to view any chat room
   */
  async isUserInRoom (data) {
    if (ADMIN_UIDS.includes(data.uid)) { data.inRoom = true; }
    return data;
  },
  
  // Export for testing
  parsePluginSettings,
  getPluginSettings: () => pluginSettings
};
