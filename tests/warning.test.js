/**
 * Property-based tests for Warning Display Module
 * Tests Properties 3 and 4 from design document
 */
'use strict';

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');
const fc = require('fast-check');

const {
  injectWarning,
  updateSettings,
  resetSettings,
  VALID_DISPLAY_TYPES
} = require('../warningDisplay');

describe('Warning Display', () => {
  beforeEach(() => {
    resetSettings();
  });

  /**
   * **Feature: chat-perms-enhancements, Property 3: Warning injection when enabled**
   * **Validates: Requirements 2.1, 2.2**
   * 
   * *For any* chat response data and enabled warning configuration, 
   * the injected warning shall contain the configured message text and display type.
   */
  it('Property 3: Warning injection when enabled - injected warning contains configured message and display type', () => {
    // Arbitrary for non-empty warning message strings
    const warningMessageArb = fc.string({ minLength: 1 }).filter(s => s.trim().length > 0);
    
    // Arbitrary for valid display types
    const displayTypeArb = fc.constantFrom(...VALID_DISPLAY_TYPES);
    
    // Arbitrary for chat response data (various object shapes)
    const chatDataArb = fc.oneof(
      fc.record({ roomId: fc.integer(), messages: fc.array(fc.string()) }),
      fc.record({ userId: fc.integer(), content: fc.string() }),
      fc.dictionary(fc.string(), fc.jsonValue()),
      fc.constant({})
    );

    fc.assert(
      fc.property(
        warningMessageArb,
        displayTypeArb,
        chatDataArb,
        (message, displayType, chatData) => {
          // Setup: Enable warning with the generated configuration
          updateSettings({
            WARNING_ENABLED: true,
            WARNING_MESSAGE: message,
            WARNING_DISPLAY_TYPE: displayType
          });

          // Act: Inject warning into chat data
          const result = injectWarning(chatData);

          // Assert: Result contains chatPermsWarning with correct message and displayType
          assert.ok(
            result.chatPermsWarning !== undefined,
            'Result should contain chatPermsWarning when enabled'
          );
          assert.strictEqual(
            result.chatPermsWarning.message,
            message,
            'Warning message should match configured message'
          );
          assert.strictEqual(
            result.chatPermsWarning.displayType,
            displayType,
            'Warning displayType should match configured displayType'
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: chat-perms-enhancements, Property 4: Warning suppression when disabled**
   * **Validates: Requirements 2.4**
   * 
   * *For any* chat response data with warning disabled, 
   * the response shall not contain any warning data.
   */
  it('Property 4: Warning suppression when disabled - response contains no warning data', () => {
    // Arbitrary for chat response data (various object shapes)
    const chatDataArb = fc.oneof(
      fc.record({ roomId: fc.integer(), messages: fc.array(fc.string()) }),
      fc.record({ userId: fc.integer(), content: fc.string() }),
      fc.dictionary(fc.string(), fc.jsonValue()),
      fc.constant({})
    );

    // Arbitrary for any warning message (even if configured, should not appear)
    const warningMessageArb = fc.string();
    
    // Arbitrary for any display type
    const displayTypeArb = fc.constantFrom(...VALID_DISPLAY_TYPES);

    fc.assert(
      fc.property(
        chatDataArb,
        warningMessageArb,
        displayTypeArb,
        (chatData, message, displayType) => {
          // Setup: Disable warning (even with message and displayType configured)
          updateSettings({
            WARNING_ENABLED: false,
            WARNING_MESSAGE: message,
            WARNING_DISPLAY_TYPE: displayType
          });

          // Act: Inject warning into chat data
          const result = injectWarning(chatData);

          // Assert: Result should NOT contain chatPermsWarning
          assert.strictEqual(
            result.chatPermsWarning,
            undefined,
            'Result should not contain chatPermsWarning when disabled'
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});
