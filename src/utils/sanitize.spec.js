import { describe, it, expect } from 'vitest';
import {
  sanitize,
  sanitizeText,
  sanitizeUserInput,
  escapeHtml,
  sanitizeUrl
} from './sanitize';

describe('sanitize', () => {
  it('allows safe HTML tags', () => {
    const input = '<p>Hello <strong>World</strong></p>';
    const result = sanitize(input);
    expect(result).toBe('<p>Hello <strong>World</strong></p>');
  });

  it('removes dangerous script tags', () => {
    const input = '<p>Hello</p><script>alert("XSS")</script>';
    const result = sanitize(input);
    expect(result).not.toContain('<script>');
    expect(result).toContain('<p>Hello</p>');
  });

  it('removes inline event handlers', () => {
    const input = '<div onclick="alert(\'XSS\')">Click me</div>';
    const result = sanitize(input);
    expect(result).not.toContain('onclick');
  });

  it('sanitizes dangerous href attributes', () => {
    const input = '<a href="javascript:alert(\'XSS\')">Click</a>';
    const result = sanitize(input);
    expect(result).not.toContain('javascript:');
  });

  it('allows safe links', () => {
    const input = '<a href="https://example.com">Link</a>';
    const result = sanitize(input);
    expect(result).toContain('href="https://example.com"');
  });
});

describe('sanitizeText', () => {
  it('removes all HTML tags', () => {
    const input = '<p>Hello <strong>World</strong></p>';
    const result = sanitizeText(input);
    expect(result).toBe('Hello World');
  });

  it('removes script tags and content', () => {
    const input = '<script>alert("XSS")</script>Hello';
    const result = sanitizeText(input);
    expect(result).not.toContain('script');
    expect(result).toBe('Hello');
  });

  it('handles empty input', () => {
    const result = sanitizeText('');
    expect(result).toBe('');
  });
});

describe('sanitizeUserInput', () => {
  it('allows basic formatting tags', () => {
    const input = 'Hello <b>World</b>';
    const result = sanitizeUserInput(input);
    expect(result).toBe('Hello <b>World</b>');
  });

  it('removes dangerous tags', () => {
    const input = 'Hello <script>alert("XSS")</script>';
    const result = sanitizeUserInput(input);
    expect(result).toBe('Hello ');
  });

  it('removes control characters', () => {
    const input = 'Hello\x00\x01World';
    const result = sanitizeUserInput(input);
    expect(result).toBe('HelloWorld');
  });

  it('returns empty string for non-string input', () => {
    expect(sanitizeUserInput(null)).toBe('');
    expect(sanitizeUserInput(undefined)).toBe('');
    expect(sanitizeUserInput(123)).toBe('');
  });
});

describe('escapeHtml', () => {
  it('escapes HTML special characters', () => {
    const input = '<script>alert("XSS")</script>';
    const result = escapeHtml(input);
    expect(result).toBe('&lt;script&gt;alert("XSS")&lt;/script&gt;');
  });

  it('escapes quotes', () => {
    const input = 'Hello "World"';
    const result = escapeHtml(input);
    expect(result).toBe('Hello "World"');
  });

  it('handles ampersands', () => {
    const input = 'A & B';
    const result = escapeHtml(input);
    expect(result).toBe('A &amp; B');
  });
});

describe('sanitizeUrl', () => {
  it('allows http URLs', () => {
    const input = 'http://example.com';
    const result = sanitizeUrl(input);
    expect(result).toBe('http://example.com');
  });

  it('allows https URLs', () => {
    const input = 'https://example.com';
    const result = sanitizeUrl(input);
    expect(result).toBe('https://example.com');
  });

  it('blocks javascript: protocol', () => {
    const input = 'javascript:alert("XSS")';
    const result = sanitizeUrl(input);
    expect(result).toBe('');
  });

  it('blocks data: protocol', () => {
    const input = 'data:text/html,<script>alert("XSS")</script>';
    const result = sanitizeUrl(input);
    expect(result).toBe('');
  });

  it('blocks vbscript: protocol', () => {
    const input = 'vbscript:msgbox("XSS")';
    const result = sanitizeUrl(input);
    expect(result).toBe('');
  });

  it('prepends https:// to URLs without protocol', () => {
    const input = 'example.com';
    const result = sanitizeUrl(input);
    expect(result).toBe('https://example.com');
  });

  it('allows relative URLs', () => {
    const input = '/path/to/page';
    const result = sanitizeUrl(input);
    expect(result).toBe('/path/to/page');
  });

  it('allows anchor links', () => {
    const input = '#section';
    const result = sanitizeUrl(input);
    expect(result).toBe('#section');
  });

  it('allows mailto: protocol', () => {
    const input = 'mailto:user@example.com';
    const result = sanitizeUrl(input);
    expect(result).toBe('mailto:user@example.com');
  });

  it('returns empty string for non-string input', () => {
    expect(sanitizeUrl(null)).toBe('');
    expect(sanitizeUrl(undefined)).toBe('');
    expect(sanitizeUrl(123)).toBe('');
  });

  it('trims whitespace', () => {
    const input = '  https://example.com  ';
    const result = sanitizeUrl(input);
    expect(result).toBe('https://example.com');
  });
});
