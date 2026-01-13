/**
 * Unit tests for Plugin Configuration
 * Tests Property 2 from design document
 * **Feature: chat-perms-enhancements, Property 2: Plugin Configuration Completeness**
 */
'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

describe('Plugin Configuration Completeness', () => {
  /**
   * **Feature: chat-perms-enhancements, Property 2: Plugin Configuration Completeness**
   * **Validates: Requirements 1.4**
   * 
   * For any valid plugin.json file, the configuration SHALL contain an 
   * `acpScripts` array that includes the path `static/lib/admin.js`.
   */
  
  const pluginJsonPath = path.join(__dirname, '..', 'plugin.json');
  
  it('Property 2: plugin.json file exists', () => {
    assert.ok(fs.existsSync(pluginJsonPath), 'plugin.json should exist');
  });

  it('Property 2: plugin.json contains valid JSON', () => {
    const content = fs.readFileSync(pluginJsonPath, 'utf8');
    let config;
    
    assert.doesNotThrow(() => {
      config = JSON.parse(content);
    }, 'plugin.json should contain valid JSON');
  });

  it('Property 2: plugin.json contains acpScripts array', () => {
    const content = fs.readFileSync(pluginJsonPath, 'utf8');
    const config = JSON.parse(content);
    
    assert.ok(
      Array.isArray(config.acpScripts),
      'plugin.json should contain acpScripts as an array'
    );
  });

  it('Property 2: acpScripts includes static/lib/admin.js path', () => {
    const content = fs.readFileSync(pluginJsonPath, 'utf8');
    const config = JSON.parse(content);
    
    assert.ok(
      config.acpScripts.includes('static/lib/admin.js'),
      'acpScripts should include "static/lib/admin.js"'
    );
  });
});
