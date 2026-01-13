const User = require.main.require('./src/user');
const Groups = require.main.require('./src/groups');
const moment = require('moment');

// Import new modules
const compatibilityChecker = require('./compatibilityChecker');
const warningDisplay = require('./warningDisplay');
const keywordScanner = require('./keywordScanner');

// Settings storage
let pluginSettings = null;
let meta = null;

/**
 * Loads settings from NodeBB meta.settings with env override
 * @returns {Promise<Object>} Settings object
 */
async function loadSettings() {
    const defaults = {
        adminUids: [1],
        allowChatGroup: 'allowChat',
        denyChatGroup: 'denyChat',
        minReputation: 10,
        minPosts: 5,
        chatNotYetAllowedMessage: 'עליך לצבור וותק לפני שתוכל להשתמש בצ\'אט',
        chatDeniedMessage: 'הגישה שלך לצ\'אט נחסמה',
        warningEnabled: false,
        warningMessage: 'שים לב: ההנהלה יכולה לצפות בהודעות הצ\'אט',
        warningDisplayType: 'banner',
        keywordAlertsEnabled: false,
        keywordList: [],
        alertRecipientUids: []
    };

    // Try to load from meta.settings (ACP)
    let savedSettings = {};
    if (meta && meta.settings) {
        try {
            savedSettings = await meta.settings.get('chat-perms');
            console.log('[chat-perms] Loaded from DB:', savedSettings);
        } catch (err) {
            console.warn('[chat-perms] Could not load settings from database:', err.message);
        }
    }

    // Environment variable override
    let envSettings = {};
    try {
        envSettings = JSON.parse(process.env.CHAT_PERMS_PLUGIN_SETTINGS || '{}');
    } catch {
        // Invalid JSON, ignore
    }

    // Merge: defaults < saved < env
    const settings = { ...defaults };
    
    // Apply saved settings (don't skip empty strings for booleans)
    for (const [key, value] of Object.entries(savedSettings)) {
        if (value !== undefined && value !== null) {
            // For boolean fields, we need to keep 'false' values
            if (key === 'warningEnabled' || key === 'keywordAlertsEnabled') {
                settings[key] = value;
            } else if (value !== '') {
                settings[key] = value;
            }
        }
    }
    
    // Apply env overrides (convert old format to new)
    const envKeyMap = {
        ADMIN_UIDS: 'adminUids',
        ALLOW_CHAT_GROUP: 'allowChatGroup',
        DENY_CHAT_GROUP: 'denyChatGroup',
        MIN_REPUTATION: 'minReputation',
        MIN_POSTS: 'minPosts',
        CHAT_NOT_YET_ALLOWED_MESSAGE: 'chatNotYetAllowedMessage',
        CHAT_DENIED_MESSAGE: 'chatDeniedMessage',
        WARNING_ENABLED: 'warningEnabled',
        WARNING_MESSAGE: 'warningMessage',
        WARNING_DISPLAY_TYPE: 'warningDisplayType',
        KEYWORD_ALERTS_ENABLED: 'keywordAlertsEnabled',
        KEYWORD_LIST: 'keywordList',
        ALERT_RECIPIENT_UIDS: 'alertRecipientUids'
    };
    
    for (const [envKey, settingKey] of Object.entries(envKeyMap)) {
        if (envSettings[envKey] !== undefined) {
            settings[settingKey] = envSettings[envKey];
        }
    }

    // Ensure arrays
    if (!Array.isArray(settings.adminUids)) {
        if (typeof settings.adminUids === 'string') {
            try {
                settings.adminUids = JSON.parse(settings.adminUids);
            } catch {
                settings.adminUids = settings.adminUids.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
            }
        } else {
            settings.adminUids = [1];
        }
    }
    if (!Array.isArray(settings.keywordList)) {
        if (typeof settings.keywordList === 'string') {
            try {
                settings.keywordList = JSON.parse(settings.keywordList);
            } catch {
                settings.keywordList = settings.keywordList.split('\n').map(s => s.trim()).filter(s => s);
            }
        } else {
            settings.keywordList = [];
        }
    }
    if (!Array.isArray(settings.alertRecipientUids)) {
        if (typeof settings.alertRecipientUids === 'string') {
            try {
                settings.alertRecipientUids = JSON.parse(settings.alertRecipientUids);
            } catch {
                settings.alertRecipientUids = settings.alertRecipientUids.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
            }
        } else {
            settings.alertRecipientUids = [];
        }
    }

    // Ensure numbers
    settings.minReputation = parseInt(settings.minReputation, 10) || 10;
    settings.minPosts = parseInt(settings.minPosts, 10) || 5;

    // Ensure booleans
    settings.warningEnabled = settings.warningEnabled === true || settings.warningEnabled === 'on' || settings.warningEnabled === 'true';
    settings.keywordAlertsEnabled = settings.keywordAlertsEnabled === true || settings.keywordAlertsEnabled === 'on' || settings.keywordAlertsEnabled === 'true';

    return settings;
}

/**
 * Gets current settings (cached)
 */
function getSettings() {
    return pluginSettings || {
        adminUids: [1],
        allowChatGroup: 'allowChat',
        denyChatGroup: 'denyChat',
        minReputation: 10,
        minPosts: 5,
        chatNotYetAllowedMessage: 'עליך לצבור וותק לפני שתוכל להשתמש בצ\'אט',
        chatDeniedMessage: 'הגישה שלך לצ\'אט נחסמה',
        warningEnabled: false,
        warningMessage: 'שים לב: ההנהלה יכולה לצפות בהודעות הצ\'אט',
        warningDisplayType: 'banner',
        keywordAlertsEnabled: false,
        keywordList: [],
        alertRecipientUids: []
    };
}

module.exports = {
  /**
   * Hook: static:app.load
   * Initializes the plugin and loads settings
   */
  async init(params) {
    const { router, middleware } = params;
    
    // Load meta module
    meta = require.main.require('./src/meta');
    
    // Load settings
    pluginSettings = await loadSettings();
    
    // Initialize sub-modules with settings
    warningDisplay.updateSettings({
        WARNING_ENABLED: pluginSettings.warningEnabled,
        WARNING_MESSAGE: pluginSettings.warningMessage,
        WARNING_DISPLAY_TYPE: pluginSettings.warningDisplayType
    });
    keywordScanner.updateSettings({
        KEYWORD_ALERTS_ENABLED: pluginSettings.keywordAlertsEnabled,
        KEYWORD_LIST: pluginSettings.keywordList,
        ALERT_RECIPIENT_UIDS: pluginSettings.alertRecipientUids
    });
    
    // Check compatibility
    const isCompatible = compatibilityChecker.checkCompatibility();
    if (!isCompatible) {
        console.warn('[chat-perms] Plugin may not function correctly with this NodeBB version');
    }
    
    // Setup ACP routes
    router.get('/admin/plugins/chat-perms', middleware.admin.buildHeader, renderAdmin);
    router.get('/api/admin/plugins/chat-perms', renderAdmin);
    
    // Settings API routes
    router.get('/api/admin/plugins/chat-perms/settings', async (req, res) => {
        try {
            console.log('[chat-perms] GET settings request');
            const settings = await loadSettings();
            console.log('[chat-perms] Returning settings:', JSON.stringify(settings));
            res.json(settings);
        } catch (err) {
            console.error('[chat-perms] Error loading settings:', err);
            res.status(500).json({ error: err.message });
        }
    });
    
    router.put('/api/admin/plugins/chat-perms/settings', async (req, res) => {
        try {
            const newSettings = req.body;
            
            // Convert arrays to JSON strings for storage
            const settingsToSave = {};
            for (const [key, value] of Object.entries(newSettings)) {
                if (Array.isArray(value)) {
                    settingsToSave[key] = JSON.stringify(value);
                } else if (typeof value === 'boolean') {
                    settingsToSave[key] = value ? 'true' : 'false';
                } else {
                    settingsToSave[key] = String(value);
                }
            }
            
            console.log('[chat-perms] Saving settings:', settingsToSave);
            await meta.settings.set('chat-perms', settingsToSave);
            
            // Reload settings
            pluginSettings = await loadSettings();
            console.log('[chat-perms] Reloaded settings:', pluginSettings);
            
            // Update sub-modules
            warningDisplay.updateSettings({
                WARNING_ENABLED: pluginSettings.warningEnabled,
                WARNING_MESSAGE: pluginSettings.warningMessage,
                WARNING_DISPLAY_TYPE: pluginSettings.warningDisplayType
            });
            keywordScanner.updateSettings({
                KEYWORD_ALERTS_ENABLED: pluginSettings.keywordAlertsEnabled,
                KEYWORD_LIST: pluginSettings.keywordList,
                ALERT_RECIPIENT_UIDS: pluginSettings.alertRecipientUids
            });
            
            res.json({ success: true });
        } catch (err) {
            console.error('[chat-perms] Error saving settings:', err);
            res.status(500).json({ error: err.message });
        }
    });
    
    console.log('[chat-perms] Plugin initialized');
  },
  
  /**
   * Hook: filter:admin.header.build
   * Adds plugin to admin navigation
   */
  async addAdminNavigation(header) {
    header.plugins.push({
        route: '/plugins/chat-perms',
        icon: 'fa-comments',
        name: 'הרשאות צ\'אט'
    });
    return header;
  },

  /**
   * Hook: canGetMessages
   * Validates user permissions and injects warning if enabled
   * Requirements: 1.1, 2.1
   */
  async canGetMessages (data) {
    const settings = getSettings();
    
    // Normalize hook data for compatibility (Requirements: 1.3)
    data = compatibilityChecker.normalizeHookData(data, { canGet: true });
    data.canGet = true;
    
    const userData = await User.getUserData(data.callerUid);
    const userGroups = await Groups.getUserGroupsFromSet('groups:createtime', [data.callerUid]);
    if (
      (userData.reputation < settings.minReputation || userData.postcount < settings.minPosts || moment(userData.joindate).isAfter(moment())) &&
      !userGroups[0].find(group => [
        'administrators',
        'Global Moderators',
        settings.allowChatGroup
      ].includes(group.name))
    ) {
      throw new Error(settings.chatNotYetAllowedMessage);
    }
    if (userGroups[0].find(group => group.name === settings.denyChatGroup)) {
      throw new Error(settings.chatDeniedMessage);
    }
    if (data.callerUid !== data.uid && !settings.adminUids.includes(data.callerUid)) throw new Error('אין גישה!');
    
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
    const settings = getSettings();
    
    const userData = await User.getUserData(data.uid);
    const userGroups = await Groups.getUserGroupsFromSet('groups:createtime', [data.uid]);
    if (
      (userData.reputation < settings.minReputation || userData.postcount < settings.minPosts || moment(userData.joindate).isAfter(moment())) &&
      !userGroups[0].find(group => [
        'administrators',
        'Global Moderators',
        settings.allowChatGroup
      ].includes(group.name))
    ) {
      throw new Error(settings.chatNotYetAllowedMessage);
    }
    if (userGroups[0].find(group => group.name === settings.denyChatGroup)) {
      throw new Error(settings.chatDeniedMessage);
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
    const settings = getSettings();
    if (settings.adminUids.includes(data.uid)) { data.inRoom = true; }
    return data;
  },
  
  // Export for testing
  loadSettings,
  getSettings
};

/**
 * Renders the admin page
 */
async function renderAdmin(_req, res) {
    res.render('admin/plugins/chat-perms', {});
}
