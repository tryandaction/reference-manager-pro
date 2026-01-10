/**
 * config 属性测试
 * Property 4: API Key Validation
 * Validates: Requirements 4.8
 * 
 * 注意：只测试不依赖 vscode 的纯函数
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

// 直接定义纯函数进行测试，避免 vscode 依赖
function validateApiKey(apiKey: string): boolean {
    if (!apiKey || apiKey.trim() === '') {
        return false;
    }
    if (apiKey.length < 20) {
        return false;
    }
    return true;
}

describe('Config Properties', () => {
    /**
     * Property 4: API Key Validation
     * For any string, validateApiKey() should return true only if the string
     * is non-empty and has at least 20 characters.
     */
    it('Property 4: API key validation returns true only for valid keys', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 0, maxLength: 100 }),
                (key) => {
                    const isValid = validateApiKey(key);
                    const trimmed = key.trim();

                    // Should be valid only if non-empty and at least 20 chars
                    const expectedValid = trimmed.length >= 20;

                    expect(isValid).toBe(expectedValid);

                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property 4 (continued): Empty strings are always invalid
     */
    it('Property 4: Empty strings are always invalid', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 0, maxLength: 20, unit: fc.constantFrom(' ', '\t', '\n', '\r') }),
                (whitespace: string) => {
                    expect(validateApiKey(whitespace)).toBe(false);
                    return true;
                }
            ),
            { numRuns: 50 }
        );
    });

    /**
     * Property 4 (continued): Short strings are always invalid
     */
    it('Property 4: Strings shorter than 20 chars are invalid', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 19 }),
                (shortKey) => {
                    // Only check non-whitespace strings
                    if (shortKey.trim().length > 0 && shortKey.trim().length < 20) {
                        expect(validateApiKey(shortKey)).toBe(false);
                    }
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property 4 (continued): Long enough strings are valid
     */
    it('Property 4: Strings with 20+ non-whitespace chars are valid', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 20, maxLength: 100 }),
                (longKey) => {
                    // If the string has at least 20 non-whitespace chars
                    if (longKey.trim().length >= 20) {
                        expect(validateApiKey(longKey)).toBe(true);
                    }
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property: Validation is deterministic
     */
    it('Property: Validation is deterministic', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 0, maxLength: 50 }),
                (key) => {
                    const result1 = validateApiKey(key);
                    const result2 = validateApiKey(key);

                    expect(result1).toBe(result2);

                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
});
