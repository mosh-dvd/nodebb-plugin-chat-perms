/**
 * Property-based tests for Compatibility Checker Module
 * Tests Properties 1 and 2 from design document
 */
'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert');
const fc = require('fast-check');

const {
  checkCompatibility,
  parseVersion,
  normalizeHookData,
  SUPPORTED_MAJOR_VERSION
} = require('../compatibilityChecker');

/**
 * **Feature: chat-perms-enhancements, Property 1: Version compatibility detection**
 * 
 * *For any* NodeBB version string, the compatibility checker shall return 
 * true only for versions in the supported range (4.x) and false otherwise.
 * 
 * **Validates: Requirements 1.1, 1.2**
 */
describe('Property 1: Version compatibility detection', () => {
  // Generator for valid semver version strings
  const semverArbitrary = fc.tuple(
    fc.integer({ min: 0, max: 10 }),  // major
    fc.integer({ min: 0, max: 99 }),  // minor
    fc.integer({ min: 0, max: 99 })   // patch
  ).map(([major, minor, patch]) => `${major}.${minor}.${patch}`);

  it('should return true only for 4.x versions', () => {
    fc.assert(
      fc.property(semverArbitrary, (version) => {
        const parsed = parseVersion(version);
        const result = checkCompatibility(version);
        
        // Property: checkCompatibility returns true iff major version is 4
        const expectedResult = parsed !== null && parsed.major === SUPPORTED_MAJOR_VERSION;
        
        assert.strictEqual(
          result,
          expectedResult,
          `Version ${version}: expected ${expectedResult}, got ${result}`
        );
      }),
      { numRuns: 100 }
    );
  });

  it('should return true for all valid 4.x versions', () => {
    // Generator specifically for 4.x versions
    const version4xArbitrary = fc.tuple(
      fc.integer({ min: 0, max: 99 }),  // minor
      fc.integer({ min: 0, max: 99 })   // patch
    ).map(([minor, patch]) => `4.${minor}.${patch}`);

    fc.assert(
      fc.property(version4xArbitrary, (version) => {
        const result = checkCompatibility(version);
        assert.strictEqual(result, true, `4.x version ${version} should be compatible`);
      }),
      { numRuns: 100 }
    );
  });

  it('should return false for all non-4.x versions', () => {
    // Generator for non-4.x versions (major != 4)
    const nonVersion4xArbitrary = fc.tuple(
      fc.integer({ min: 0, max: 10 }).filter(major => major !== 4),  // major != 4
      fc.integer({ min: 0, max: 99 }),  // minor
      fc.integer({ min: 0, max: 99 })   // patch
    ).map(([major, minor, patch]) => `${major}.${minor}.${patch}`);

    fc.assert(
      fc.property(nonVersion4xArbitrary, (version) => {
        const result = checkCompatibility(version);
        assert.strictEqual(result, false, `Non-4.x version ${version} should be incompatible`);
      }),
      { numRuns: 100 }
    );
  });

  it('should handle versions with pre-release tags', () => {
    // Generator for pre-release tags like 'alpha', 'beta.1', 'rc.2'
    const preReleaseTagArbitrary = fc.oneof(
      fc.constant('alpha'),
      fc.constant('beta'),
      fc.constant('rc'),
      fc.integer({ min: 1, max: 10 }).map(n => `beta.${n}`),
      fc.integer({ min: 1, max: 10 }).map(n => `rc.${n}`),
      fc.integer({ min: 1, max: 10 }).map(n => `alpha.${n}`)
    );

    const preReleaseArbitrary = fc.tuple(
      fc.integer({ min: 0, max: 10 }),  // major
      fc.integer({ min: 0, max: 99 }),  // minor
      fc.integer({ min: 0, max: 99 }),  // patch
      preReleaseTagArbitrary
    ).map(([major, minor, patch, tag]) => `${major}.${minor}.${patch}-${tag}`);

    fc.assert(
      fc.property(preReleaseArbitrary, (version) => {
        const parsed = parseVersion(version);
        const result = checkCompatibility(version);
        
        // Pre-release versions should still be evaluated by major version
        const expectedResult = parsed !== null && parsed.major === SUPPORTED_MAJOR_VERSION;
        
        assert.strictEqual(
          result,
          expectedResult,
          `Pre-release version ${version}: expected ${expectedResult}, got ${result}`
        );
      }),
      { numRuns: 100 }
    );
  });
});


/**
 * **Feature: chat-perms-enhancements, Property 2: Data format graceful handling**
 * 
 * *For any* messaging hook data object (old or new format), the plugin shall 
 * process it without throwing uncaught exceptions and return a valid response.
 * 
 * **Validates: Requirements 1.3**
 */
describe('Property 2: Data format graceful handling', () => {
  // Generator for arbitrary JSON-like values (simulating various hook data formats)
  const hookDataArbitrary = fc.oneof(
    fc.constant(null),
    fc.constant(undefined),
    fc.string(),
    fc.integer(),
    fc.boolean(),
    fc.array(fc.anything()),
    fc.object()
  );

  // Generator for default values object
  const defaultsArbitrary = fc.record({
    roomId: fc.option(fc.integer({ min: 1, max: 10000 }), { nil: undefined }),
    uid: fc.option(fc.integer({ min: 1, max: 10000 }), { nil: undefined }),
    content: fc.option(fc.string(), { nil: undefined })
  });

  it('should never throw an exception for any input', () => {
    fc.assert(
      fc.property(hookDataArbitrary, defaultsArbitrary, (data, defaults) => {
        // Property: normalizeHookData should never throw
        let result;
        let didThrow = false;
        
        try {
          result = normalizeHookData(data, defaults);
        } catch (err) {
          didThrow = true;
        }
        
        assert.strictEqual(
          didThrow,
          false,
          `normalizeHookData threw an exception for input: ${JSON.stringify(data)}`
        );
      }),
      { numRuns: 100 }
    );
  });

  it('should always return a valid object', () => {
    fc.assert(
      fc.property(hookDataArbitrary, defaultsArbitrary, (data, defaults) => {
        const result = normalizeHookData(data, defaults);
        
        // Property: result must be a non-null object
        assert.strictEqual(
          typeof result,
          'object',
          `Expected object, got ${typeof result}`
        );
        assert.notStrictEqual(
          result,
          null,
          'Result should not be null'
        );
      }),
      { numRuns: 100 }
    );
  });

  it('should preserve defaults when data is null or undefined', () => {
    const nullishArbitrary = fc.oneof(
      fc.constant(null),
      fc.constant(undefined)
    );

    fc.assert(
      fc.property(nullishArbitrary, defaultsArbitrary, (data, defaults) => {
        const result = normalizeHookData(data, defaults);
        
        // Property: all defined defaults should be present in result
        for (const [key, value] of Object.entries(defaults)) {
          if (value !== undefined) {
            assert.strictEqual(
              result[key],
              value,
              `Default value for '${key}' should be preserved`
            );
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should handle primitive values by wrapping them', () => {
    const primitiveArbitrary = fc.oneof(
      fc.string(),
      fc.integer(),
      fc.boolean()
    );

    fc.assert(
      fc.property(primitiveArbitrary, (data) => {
        const result = normalizeHookData(data);
        
        // Property: primitive values should be wrapped with 'value' key
        assert.strictEqual(
          result.value,
          data,
          `Primitive value should be stored in 'value' property`
        );
      }),
      { numRuns: 100 }
    );
  });

  it('should handle arrays by wrapping them', () => {
    const arrayArbitrary = fc.array(fc.anything(), { minLength: 0, maxLength: 10 });

    fc.assert(
      fc.property(arrayArbitrary, (data) => {
        const result = normalizeHookData(data);
        
        // Property: arrays should be wrapped with 'items' key
        assert.ok(
          Array.isArray(result.items),
          'Array should be stored in "items" property'
        );
        assert.deepStrictEqual(
          result.items,
          data,
          'Array contents should be preserved'
        );
      }),
      { numRuns: 100 }
    );
  });

  it('should merge object data with defaults', () => {
    // Generator for object data where keys may or may not be present
    // Using fc.constantFrom to either include a key or not
    const objectDataArbitrary = fc.record({
      roomId: fc.integer({ min: 1, max: 10000 }),
      uid: fc.integer({ min: 1, max: 10000 }),
      extraField: fc.string()
    }, { requiredKeys: [] }); // All keys are optional - they may not exist at all

    fc.assert(
      fc.property(objectDataArbitrary, defaultsArbitrary, (data, defaults) => {
        const result = normalizeHookData(data, defaults);
        
        // Property: data values should override defaults when key exists in data
        for (const [key, value] of Object.entries(data)) {
          assert.strictEqual(
            result[key],
            value,
            `Data value for '${key}' should override default`
          );
        }
        
        // Property: defaults should fill in values for keys not present in data
        for (const [key, value] of Object.entries(defaults)) {
          if (!(key in data) && value !== undefined) {
            assert.strictEqual(
              result[key],
              value,
              `Default value for '${key}' should be used when key is not in data`
            );
          }
        }
      }),
      { numRuns: 100 }
    );
  });
});
