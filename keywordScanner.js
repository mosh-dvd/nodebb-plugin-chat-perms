/**
 * Keyword Scanner Module
 * Scans chat messages for sensitive keywords and generates alerts
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 */
'use strict';

// Load plugin settings from environment
let pluginSettings;
try {
  pluginSettings = JSON.parse(process.env.CHAT_PERMS_PLUGIN_SETTINGS || '{}');
} catch {
  pluginSettings = {};
}

// Default configuration
const DEFAULT_CONFIG = {
  enabled: false,
  keywords: [],
  alertRecipientUids: []
};

/**
 * Gets the configured keyword list
 * @returns {string[]} Array of keywords to scan for
 */
function getKeywordList() {
  const keywords = pluginSettings.KEYWORD_LIST;
  
  if (!Array.isArray(keywords)) {
    return DEFAULT_CONFIG.keywords;
  }
  
  // Filter out non-string and empty values, trim whitespace
  return keywords
    .filter(k => typeof k === 'string' && k.trim().length > 0)
    .map(k => k.trim().toLowerCase());
}

/**
 * Checks if keyword alerts are enabled
 * @returns {boolean}
 */
function isKeywordAlertsEnabled() {
  return pluginSettings.KEYWORD_ALERTS_ENABLED === true;
}

/**
 * Gets the UIDs of alert recipients
 * @returns {number[]}
 */
function getAlertRecipientUids() {
  const uids = pluginSettings.ALERT_RECIPIENT_UIDS;
  
  if (!Array.isArray(uids)) {
    return DEFAULT_CONFIG.alertRecipientUids;
  }
  
  return uids.filter(uid => typeof uid === 'number' && uid > 0);
}

/**
 * Scans a message for keywords from the configured list
 * Case-insensitive matching
 * 
 * @param {string} messageContent - The message content to scan
 * @returns {string[]} Array of matched keywords (original case from keyword list)
 */
function scanMessage(messageContent) {
  const keywords = getKeywordList();
  
  // Requirement 3.6: Skip scanning if keyword list is empty
  if (keywords.length === 0) {
    return [];
  }
  
  // Handle invalid message content
  if (typeof messageContent !== 'string' || messageContent.trim().length === 0) {
    return [];
  }
  
  const messageLower = messageContent.toLowerCase();
  const matchedKeywords = [];
  
  // Requirement 3.1: Scan message against keyword list (case-insensitive)
  // Requirement 3.2, 3.5: Collect all matched keywords
  for (const keyword of keywords) {
    if (messageLower.includes(keyword)) {
      matchedKeywords.push(keyword);
    }
  }
  
  return matchedKeywords;
}

/**
 * Builds an alert data object with all required fields
 * 
 * @param {Object} params - Alert parameters
 * @param {string} params.messageContent - The message content
 * @param {number} params.senderUid - Sender's user ID
 * @param {string} params.senderUsername - Sender's username
 * @param {number} params.roomId - Chat room ID
 * @param {string[]} params.matchedKeywords - Array of matched keywords
 * @returns {Object} Alert data object
 */
function buildAlertData({ messageContent, senderUid, senderUsername, roomId, matchedKeywords }) {
  // Requirement 3.4: Include all required fields
  return {
    messageContent: typeof messageContent === 'string' ? messageContent : '',
    senderUid: typeof senderUid === 'number' ? senderUid : 0,
    senderUsername: typeof senderUsername === 'string' ? senderUsername : 'unknown',
    roomId: typeof roomId === 'number' ? roomId : 0,
    timestamp: Date.now(),
    matchedKeywords: Array.isArray(matchedKeywords) ? matchedKeywords : []
  };
}

/**
 * Sends an alert notification to configured administrators
 * 
 * @param {Object} alertData - Alert data from buildAlertData
 * @returns {Promise<boolean>} True if alert was sent successfully
 */
async function sendAlert(alertData) {
  // Validate alert data has required fields
  if (!alertData || typeof alertData !== 'object') {
    console.warn('[chat-perms] Invalid alert data provided');
    return false;
  }
  
  const recipientUids = getAlertRecipientUids();
  
  if (recipientUids.length === 0) {
    console.warn('[chat-perms] No alert recipients configured');
    return false;
  }
  
  try {
    // Try to use NodeBB's notification system
    const Notifications = require.main.require('./src/notifications');
    const User = require.main.require('./src/user');
    
    const notification = await Notifications.create({
      type: 'chat-perms-keyword-alert',
      bodyShort: `התראת מילים רגישות: ${alertData.matchedKeywords.join(', ')}`,
      bodyLong: `משתמש ${alertData.senderUsername} שלח הודעה בחדר ${alertData.roomId} עם מילים רגישות: ${alertData.matchedKeywords.join(', ')}\n\nתוכן ההודעה: ${alertData.messageContent}`,
      nid: `chat-perms:keyword-alert:${alertData.roomId}:${alertData.timestamp}`,
      from: alertData.senderUid,
      path: `/chats/${alertData.roomId}`
    });
    
    if (notification) {
      await Notifications.push(notification, recipientUids);
    }
    
    return true;
  } catch (err) {
    // Log error but don't block message sending (as per error handling strategy)
    console.error('[chat-perms] Failed to send keyword alert:', err.message);
    return false;
  }
}

/**
 * Main function to process a message for keyword alerts
 * Combines scanning and alert sending
 * 
 * @param {Object} messageData - Message data from hook
 * @param {string} messageData.content - Message content
 * @param {number} messageData.uid - Sender UID
 * @param {number} messageData.roomId - Room ID
 * @returns {Promise<{matched: boolean, keywords: string[]}>}
 */
async function processMessage(messageData) {
  // Check if feature is enabled
  if (!isKeywordAlertsEnabled()) {
    return { matched: false, keywords: [] };
  }
  
  const content = messageData?.content || '';
  const matchedKeywords = scanMessage(content);
  
  if (matchedKeywords.length === 0) {
    return { matched: false, keywords: [] };
  }
  
  // Get sender username for alert
  let senderUsername = 'unknown';
  try {
    const User = require.main.require('./src/user');
    const userData = await User.getUserData(messageData.uid);
    senderUsername = userData?.username || 'unknown';
  } catch {
    // Use default if user lookup fails
  }
  
  const alertData = buildAlertData({
    messageContent: content,
    senderUid: messageData.uid || 0,
    senderUsername,
    roomId: messageData.roomId || 0,
    matchedKeywords
  });
  
  // Send alert (don't await to avoid blocking message)
  sendAlert(alertData).catch(err => {
    console.error('[chat-perms] Alert send error:', err.message);
  });
  
  return { matched: true, keywords: matchedKeywords };
}

/**
 * Updates the plugin settings (for testing purposes)
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
  scanMessage,
  sendAlert,
  getKeywordList,
  buildAlertData,
  processMessage,
  isKeywordAlertsEnabled,
  getAlertRecipientUids,
  updateSettings,
  resetSettings,
  DEFAULT_CONFIG
};
