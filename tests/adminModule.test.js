/**
 * Unit tests for AMD Admin Module Structure
 * Tests Property 1 from design document
 * **Feature: chat-perms-enhancements, Property 1: AMD Module Structure**
 */
'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

describe('AMD Admin Module Structure', () => {
  /**
   * **Feature: chat-perms-enhancements, Property 1: AMD Module Structure**
   * **Validates: Requirements 1.2, 1.3**
   * 
   * For any valid admin.js file, the file content SHALL start with a 
   * `define('admin/plugins/chat-perms'` call and export an object with an `init` function.
   */
  
  const adminJsPath = path.join(__dirname, '..', 'static', 'lib', 'admin.js');
  
  it('Property 1: admin.js file exists', () => {
    assert.ok(fs.existsSync(adminJsPath), 'static/lib/admin.js should exist');
  });

  it('Property 1: admin.js starts with correct define() call', () => {
    const content = fs.readFileSync(adminJsPath, 'utf8');
    
    // Check that file contains AMD define with correct module name
    const definePattern = /define\s*\(\s*['"]admin\/plugins\/chat-perms['"]/;
    assert.ok(
      definePattern.test(content),
      'admin.js should contain define(\'admin/plugins/chat-perms\', ...)'
    );
  });

  it('Property 1: admin.js exports an object with init function', () => {
    const content = fs.readFileSync(adminJsPath, 'utf8');
    
    // Check that module defines ACP.init function
    const initPattern = /ACP\.init\s*=\s*function/;
    assert.ok(
      initPattern.test(content),
      'admin.js should define ACP.init function'
    );
    
    // Check that module returns ACP object
    const returnPattern = /return\s+ACP\s*;/;
    assert.ok(
      returnPattern.test(content),
      'admin.js should return ACP object'
    );
  });

  it('Property 1: AMD module has correct structure (define wrapper)', () => {
    const content = fs.readFileSync(adminJsPath, 'utf8');
    
    // Verify the complete AMD structure:
    // define('admin/plugins/chat-perms', [], function() { ... return ACP; });
    const amdStructurePattern = /define\s*\(\s*['"]admin\/plugins\/chat-perms['"][\s\S]*function\s*\(\s*\)[\s\S]*return\s+ACP\s*;[\s\S]*\}\s*\)\s*;/;
    assert.ok(
      amdStructurePattern.test(content),
      'admin.js should have complete AMD module structure'
    );
  });
});
