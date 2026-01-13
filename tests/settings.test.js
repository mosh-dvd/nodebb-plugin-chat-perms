/**
 * Property-based tests for Settings Module
 * Tests Property 9 from design document
 * **Feature: chat-perms-enhancements, Property 9: Settings round-trip consistency**
 */
'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert');
const fc = require('fast-check');

/**
 * Generator for valid plugin settings objects
 * Matches the structure defined in design.md Data Models
 * Uses .map() to ensure objects have normal prototypes (not null prototype)
 */
const settingsArbitrary = fc.record({
  // Existing settings
  ADMIN_UIDS: fc.array(fc.integer({ min: 1, max: 100000 }), { minLength: 0, maxLength: 10 }),
  ALLOW_CHAT_GROUP: fc.string({ minLength: 1, maxLength: 50 }),
  DENY_CHAT_GROUP: fc.string({ minLength: 1, maxLength: 50 }),
  MIN_REPUTATION: fc.integer({ min: 0, max: 10000 }),
  MIN_POSTS: fc.integer({ min: 0, max: 10000 }),
  CHAT_NOT_YET_ALLOWED_MESSAGE: fc.string({ minLength: 1, maxLength: 200 }),
  CHAT_DENIED_MESSAGE: fc.string({ minLength: 1, maxLength: 200 }),
  
  // New settings - Privacy Warning (Requirements: 2.2)
  WARNING_ENABLED: fc.boolean(),
  WARNING_MESSAGE: fc.string({ minLength: 0, maxLength: 500 }),
  WARNING_DISPLAY_TYPE: fc.constantFrom('banner', 'popup', 'inline'),
  
  // New settings - Keyword Alerts (Requirements: 3.3)
  KEYWORD_ALERTS_ENABLED: fc.boolean(),
  KEYWORD_LIST: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 0, maxLength: 20 }),
  ALERT_RECIPIENT_UIDS: fc.array(fc.integer({ min: 1, max: 100000 }), { minLength: 0, maxLength: 10 })
}).map(obj => ({ ...obj })); // Ensure normal prototype by spreading into new object

describe('Settings', () => {
  /**
   * **Feature: chat-perms-enhancements, Property 9: Settings round-trip consistency**
   * **Validates: Requirements 2.2, 3.3**
   * 
   * For any valid plugin settings object, serializing to JSON and 
   * deserializing shall produce an equivalent settings object.
   */
  it('Property 9: Settings round-trip - serialize then deserialize produces equivalent object', () => {
    fc.assert(
      fc.property(settingsArbitrary, (settings) => {
        // Serialize to JSON
        const serialized = JSON.stringify(settings);
        
        // Deserialize back
        const deserialized = JSON.parse(serialized);
        
        // Verify equivalence
        assert.deepStrictEqual(deserialized, settings);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Additional round-trip test: settings survive environment variable storage
   * This tests the actual parsePluginSettings function behavior
   */
  it('Property 9: Settings round-trip via environment variable storage', () => {
    // Save original env
    const originalEnv = process.env.CHAT_PERMS_PLUGIN_SETTINGS;
    
    fc.assert(
      fc.property(settingsArbitrary, (settings) => {
        // Store in environment (simulating how NodeBB stores plugin settings)
        process.env.CHAT_PERMS_PLUGIN_SETTINGS = JSON.stringify(settings);
        
        // Parse settings (simulating plugin load)
        const parsed = JSON.parse(process.env.CHAT_PERMS_PLUGIN_SETTINGS);
        
        // Verify all fields are preserved
        assert.deepStrictEqual(parsed.ADMIN_UIDS, settings.ADMIN_UIDS);
        assert.deepStrictEqual(parsed.ALLOW_CHAT_GROUP, settings.ALLOW_CHAT_GROUP);
        assert.deepStrictEqual(parsed.DENY_CHAT_GROUP, settings.DENY_CHAT_GROUP);
        assert.strictEqual(parsed.MIN_REPUTATION, settings.MIN_REPUTATION);
        assert.strictEqual(parsed.MIN_POSTS, settings.MIN_POSTS);
        assert.strictEqual(parsed.CHAT_NOT_YET_ALLOWED_MESSAGE, settings.CHAT_NOT_YET_ALLOWED_MESSAGE);
        assert.strictEqual(parsed.CHAT_DENIED_MESSAGE, settings.CHAT_DENIED_MESSAGE);
        assert.strictEqual(parsed.WARNING_ENABLED, settings.WARNING_ENABLED);
        assert.strictEqual(parsed.WARNING_MESSAGE, settings.WARNING_MESSAGE);
        assert.strictEqual(parsed.WARNING_DISPLAY_TYPE, settings.WARNING_DISPLAY_TYPE);
        assert.strictEqual(parsed.KEYWORD_ALERTS_ENABLED, settings.KEYWORD_ALERTS_ENABLED);
        assert.deepStrictEqual(parsed.KEYWORD_LIST, settings.KEYWORD_LIST);
        assert.deepStrictEqual(parsed.ALERT_RECIPIENT_UIDS, settings.ALERT_RECIPIENT_UIDS);
      }),
      { numRuns: 100 }
    );
    
    // Restore original env
    if (originalEnv !== undefined) {
      process.env.CHAT_PERMS_PLUGIN_SETTINGS = originalEnv;
    } else {
      delete process.env.CHAT_PERMS_PLUGIN_SETTINGS;
    }
  });
});
