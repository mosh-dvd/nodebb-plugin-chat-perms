/**
 * Unit tests for Template Purity
 * Tests Property 3 from design document
 * **Feature: chat-perms-enhancements, Property 3: Template Purity**
 */
'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

describe('Template Purity', () => {
  /**
   * **Feature: chat-perms-enhancements, Property 3: Template Purity**
   * **Validates: Requirements 3.1**
   * 
   * For any valid chat-perms.tpl file, the template content SHALL NOT 
   * contain any `<script>` tags.
   */
  
  const templatePath = path.join(__dirname, '..', 'static', 'templates', 'admin', 'plugins', 'chat-perms.tpl');
  
  it('Property 3: template file exists', () => {
    assert.ok(fs.existsSync(templatePath), 'chat-perms.tpl should exist');
  });

  it('Property 3: template contains no <script> tags', () => {
    const content = fs.readFileSync(templatePath, 'utf8');
    
    // Check for opening script tags (case-insensitive)
    const scriptTagPattern = /<script[\s>]/i;
    assert.ok(
      !scriptTagPattern.test(content),
      'chat-perms.tpl should not contain any <script> tags'
    );
  });

  it('Property 3: template contains only HTML markup', () => {
    const content = fs.readFileSync(templatePath, 'utf8');
    
    // Verify no closing script tags either
    const closingScriptPattern = /<\/script>/i;
    assert.ok(
      !closingScriptPattern.test(content),
      'chat-perms.tpl should not contain any </script> closing tags'
    );
  });
});
