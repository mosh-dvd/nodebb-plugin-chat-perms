/**
 * Property-based tests for Alert Builder
 * Tests Property 6 from design document
 * 
 * **Feature: chat-perms-enhancements, Property 6: Alert completeness**
 */
'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert');
const fc = require('fast-check');
const { buildAlertData } = require('../keywordScanner');

describe('Alert Builder', () => {
  /**
   * **Feature: chat-perms-enhancements, Property 6: Alert completeness**
   * **Validates: Requirements 3.4**
   * 
   * *For any* generated alert, the alert object shall contain all required fields:
   * messageContent, senderUsername, roomId, timestamp, and matchedKeywords array.
   */
  it('Property 6: Alert completeness - all alerts contain required fields', () => {
    fc.assert(
      fc.property(
        fc.record({
          messageContent: fc.string(),
          senderUid: fc.integer({ min: 0 }),
          senderUsername: fc.string(),
          roomId: fc.integer({ min: 0 }),
          matchedKeywords: fc.array(fc.string())
        }),
        (input) => {
          const alert = buildAlertData(input);
          
          // Verify all required fields exist
          assert.ok('messageContent' in alert, 'Alert must have messageContent field');
          assert.ok('senderUsername' in alert, 'Alert must have senderUsername field');
          assert.ok('roomId' in alert, 'Alert must have roomId field');
          assert.ok('timestamp' in alert, 'Alert must have timestamp field');
          assert.ok('matchedKeywords' in alert, 'Alert must have matchedKeywords field');
          
          // Verify field types
          assert.strictEqual(typeof alert.messageContent, 'string', 'messageContent must be a string');
          assert.strictEqual(typeof alert.senderUsername, 'string', 'senderUsername must be a string');
          assert.strictEqual(typeof alert.roomId, 'number', 'roomId must be a number');
          assert.strictEqual(typeof alert.timestamp, 'number', 'timestamp must be a number');
          assert.ok(Array.isArray(alert.matchedKeywords), 'matchedKeywords must be an array');
          
          // Verify timestamp is a valid timestamp (positive number)
          assert.ok(alert.timestamp > 0, 'timestamp must be a positive number');
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: chat-perms-enhancements, Property 6: Alert completeness**
   * **Validates: Requirements 3.4**
   * 
   * Edge case: Even with invalid/missing input, buildAlertData should return
   * a complete alert object with default values.
   */
  it('Property 6: Alert completeness - handles missing/invalid inputs gracefully', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(undefined),
          fc.constant(null),
          fc.constant({}),
          fc.record({
            messageContent: fc.oneof(fc.string(), fc.constant(undefined), fc.constant(null), fc.integer()),
            senderUid: fc.oneof(fc.integer(), fc.constant(undefined), fc.constant(null), fc.string()),
            senderUsername: fc.oneof(fc.string(), fc.constant(undefined), fc.constant(null), fc.integer()),
            roomId: fc.oneof(fc.integer(), fc.constant(undefined), fc.constant(null), fc.string()),
            matchedKeywords: fc.oneof(fc.array(fc.string()), fc.constant(undefined), fc.constant(null), fc.string())
          })
        ),
        (input) => {
          // buildAlertData should handle any input without throwing
          const alert = buildAlertData(input || {});
          
          // All required fields must still exist
          assert.ok('messageContent' in alert, 'Alert must have messageContent field');
          assert.ok('senderUsername' in alert, 'Alert must have senderUsername field');
          assert.ok('roomId' in alert, 'Alert must have roomId field');
          assert.ok('timestamp' in alert, 'Alert must have timestamp field');
          assert.ok('matchedKeywords' in alert, 'Alert must have matchedKeywords field');
          
          // Types must be correct even with invalid input
          assert.strictEqual(typeof alert.messageContent, 'string', 'messageContent must be a string');
          assert.strictEqual(typeof alert.senderUsername, 'string', 'senderUsername must be a string');
          assert.strictEqual(typeof alert.roomId, 'number', 'roomId must be a number');
          assert.strictEqual(typeof alert.timestamp, 'number', 'timestamp must be a number');
          assert.ok(Array.isArray(alert.matchedKeywords), 'matchedKeywords must be an array');
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
