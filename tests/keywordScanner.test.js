/**
 * Property-based tests for Keyword Scanner Module
 * Tests Properties 5, 7, and 8 from design document
 */
'use strict';

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');
const fc = require('fast-check');
const keywordScanner = require('../keywordScanner');

describe('Keyword Scanner', () => {
  beforeEach(() => {
    keywordScanner.resetSettings();
  });

  /**
   * **Feature: chat-perms-enhancements, Property 5: Keyword scanning correctness**
   * *For any* message content and keyword list, the scanner shall return exactly
   * the keywords that appear in the message (case-insensitive match).
   * **Validates: Requirements 3.1**
   */
  describe('Property 5: Keyword scanning correctness', () => {
    it('should return exactly the keywords that appear in the message (case-insensitive)', () => {
      fc.assert(
        fc.property(
          // Generate a non-empty keyword list with valid keywords (non-empty strings)
          fc.array(fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0), { minLength: 1, maxLength: 10 }),
          // Generate message content
          fc.string({ minLength: 0, maxLength: 500 }),
          (keywords, messageContent) => {
            // Set up the keyword list in settings
            keywordScanner.updateSettings({ KEYWORD_LIST: keywords });
            
            // Get the normalized keyword list (as the scanner normalizes them)
            const normalizedKeywords = keywords
              .filter(k => typeof k === 'string' && k.trim().length > 0)
              .map(k => k.trim().toLowerCase());
            
            // Scan the message
            const result = keywordScanner.scanMessage(messageContent);
            
            // Verify: result should contain exactly the keywords that appear in the message
            const messageLower = messageContent.toLowerCase();
            
            // Check that every returned keyword actually appears in the message
            for (const keyword of result) {
              assert.ok(
                messageLower.includes(keyword),
                `Returned keyword "${keyword}" should appear in message "${messageContent}"`
              );
            }
            
            // Check that every keyword that appears in the message is returned
            for (const keyword of normalizedKeywords) {
              const shouldMatch = messageLower.includes(keyword);
              const isInResult = result.includes(keyword);
              assert.strictEqual(
                isInResult,
                shouldMatch,
                `Keyword "${keyword}" ${shouldMatch ? 'should' : 'should not'} be in result for message "${messageContent}"`
              );
            }
            
            // Verify no duplicates in result
            const uniqueResult = [...new Set(result)];
            assert.strictEqual(
              result.length,
              uniqueResult.length,
              'Result should not contain duplicate keywords'
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should match keywords regardless of case in message', () => {
      fc.assert(
        fc.property(
          // Generate a keyword
          fc.string({ minLength: 2, maxLength: 15 }).filter(s => /^[a-zA-Z]+$/.test(s)),
          // Generate case transformation
          fc.constantFrom('lower', 'upper', 'mixed'),
          (keyword, caseType) => {
            // Set up keyword in lowercase
            keywordScanner.updateSettings({ KEYWORD_LIST: [keyword.toLowerCase()] });
            
            // Transform keyword case in message
            let messageKeyword;
            switch (caseType) {
              case 'lower':
                messageKeyword = keyword.toLowerCase();
                break;
              case 'upper':
                messageKeyword = keyword.toUpperCase();
                break;
              case 'mixed':
                messageKeyword = keyword.split('').map((c, i) => 
                  i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()
                ).join('');
                break;
            }
            
            const message = `This message contains ${messageKeyword} somewhere`;
            const result = keywordScanner.scanMessage(message);
            
            // Should find the keyword regardless of case
            assert.ok(
              result.includes(keyword.toLowerCase()),
              `Should find keyword "${keyword}" in message with ${caseType} case`
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: chat-perms-enhancements, Property 7: Multiple keyword aggregation**
   * *For any* message containing multiple keywords from the list, the scanner shall
   * return all matched keywords in a single result array.
   * **Validates: Requirements 3.2, 3.5**
   */
  describe('Property 7: Multiple keyword aggregation', () => {
    it('should return all matched keywords when message contains multiple keywords', () => {
      fc.assert(
        fc.property(
          // Generate distinct keywords (alphabetic only to avoid substring issues)
          fc.array(
            fc.string({ minLength: 3, maxLength: 10 }).filter(s => /^[a-zA-Z]+$/.test(s)),
            { minLength: 2, maxLength: 5 }
          ).filter(arr => {
            // Ensure all keywords are distinct (case-insensitive)
            const normalized = arr.map(k => k.toLowerCase());
            return new Set(normalized).size === arr.length;
          }).filter(arr => {
            // Ensure no keyword is a substring of another
            const normalized = arr.map(k => k.toLowerCase());
            for (let i = 0; i < normalized.length; i++) {
              for (let j = 0; j < normalized.length; j++) {
                if (i !== j && normalized[j].includes(normalized[i])) {
                  return false;
                }
              }
            }
            return true;
          }),
          // Generate a subset of keywords to include in the message
          fc.integer({ min: 0, max: 100 }),
          (keywords, seed) => {
            // Use seed to deterministically select which keywords to include
            const keywordsToInclude = keywords.filter((_, i) => (seed + i) % 2 === 0);
            
            // Skip if no keywords selected
            if (keywordsToInclude.length === 0) {
              return true;
            }
            
            // Set up the keyword list
            keywordScanner.updateSettings({ KEYWORD_LIST: keywords });
            
            // Build message containing selected keywords
            const message = keywordsToInclude.join(' some text between ');
            
            // Scan the message
            const result = keywordScanner.scanMessage(message);
            
            // Verify all included keywords are in the result
            const normalizedIncluded = keywordsToInclude.map(k => k.toLowerCase());
            for (const keyword of normalizedIncluded) {
              assert.ok(
                result.includes(keyword),
                `Keyword "${keyword}" should be in result for message containing it`
              );
            }
            
            // Verify result is a single array (not multiple calls)
            assert.ok(
              Array.isArray(result),
              'Result should be a single array'
            );
            
            // Verify all matched keywords are aggregated in one result
            assert.ok(
              result.length >= keywordsToInclude.length,
              `Result should contain at least ${keywordsToInclude.length} keywords, got ${result.length}`
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should aggregate all keywords in a single notification-ready array', () => {
      fc.assert(
        fc.property(
          // Generate 2-4 distinct alphabetic keywords
          fc.array(
            fc.string({ minLength: 4, maxLength: 8 }).filter(s => /^[a-zA-Z]+$/.test(s)),
            { minLength: 2, maxLength: 4 }
          ).filter(arr => {
            const normalized = arr.map(k => k.toLowerCase());
            // Ensure distinct and no substrings
            if (new Set(normalized).size !== arr.length) return false;
            for (let i = 0; i < normalized.length; i++) {
              for (let j = 0; j < normalized.length; j++) {
                if (i !== j && normalized[j].includes(normalized[i])) {
                  return false;
                }
              }
            }
            return true;
          }),
          (keywords) => {
            // Set up all keywords
            keywordScanner.updateSettings({ KEYWORD_LIST: keywords });
            
            // Create message with ALL keywords
            const message = `Message with ${keywords.join(' and ')} in it`;
            
            // Scan should return all keywords in one array
            const result = keywordScanner.scanMessage(message);
            
            // Verify it's a single array containing all keywords
            const normalizedKeywords = keywords.map(k => k.toLowerCase());
            
            assert.strictEqual(
              result.length,
              normalizedKeywords.length,
              `Should return exactly ${normalizedKeywords.length} keywords, got ${result.length}`
            );
            
            // All keywords should be present
            for (const keyword of normalizedKeywords) {
              assert.ok(
                result.includes(keyword),
                `Result should include "${keyword}"`
              );
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: chat-perms-enhancements, Property 8: Empty keyword list optimization**
   * *For any* empty keyword list, the scanMessage function shall return an empty array
   * without performing string matching operations.
   * **Validates: Requirements 3.6**
   */
  describe('Property 8: Empty keyword list optimization', () => {
    it('should return empty array immediately for any message when keyword list is empty', () => {
      fc.assert(
        fc.property(
          // Generate any message content (including complex strings)
          fc.string({ minLength: 0, maxLength: 1000 }),
          (messageContent) => {
            // Set up empty keyword list
            keywordScanner.updateSettings({ KEYWORD_LIST: [] });
            
            // Scan the message
            const result = keywordScanner.scanMessage(messageContent);
            
            // Should always return empty array
            assert.ok(
              Array.isArray(result),
              'Result should be an array'
            );
            assert.strictEqual(
              result.length,
              0,
              `Should return empty array for empty keyword list, got ${result.length} items`
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return empty array for various empty-like keyword list configurations', () => {
      fc.assert(
        fc.property(
          // Generate message content
          fc.string({ minLength: 1, maxLength: 200 }),
          // Generate empty-like keyword lists (empty array, array with only whitespace, etc.)
          fc.oneof(
            fc.constant([]),
            fc.array(fc.constant(''), { minLength: 0, maxLength: 5 }),
            fc.array(fc.constant('   '), { minLength: 0, maxLength: 5 }),
            fc.array(fc.constant('\t\n'), { minLength: 0, maxLength: 3 })
          ),
          (messageContent, emptyLikeKeywords) => {
            // Set up the empty-like keyword list
            keywordScanner.updateSettings({ KEYWORD_LIST: emptyLikeKeywords });
            
            // Scan the message
            const result = keywordScanner.scanMessage(messageContent);
            
            // Should return empty array since no valid keywords exist
            assert.ok(
              Array.isArray(result),
              'Result should be an array'
            );
            assert.strictEqual(
              result.length,
              0,
              `Should return empty array for empty/whitespace-only keyword list, got ${result.length} items`
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
