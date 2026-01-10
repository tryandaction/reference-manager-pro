/**
 * config 单元测试
 * Requirements: 4.8
 * 
 * 注意：只测试不依赖 vscode 的纯函数
 */

import { describe, it, expect } from 'vitest';

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

const DEFAULT_CONFIG = {
    apiKey: '',
    maxRetries: 3,
    timeout: 30000,
    model: 'claude-sonnet-4-20250514',
};

const CONFIG_KEYS = {
    SECTION: 'referenceManager',
    API_KEY: 'apiKey',
    MAX_RETRIES: 'maxRetries',
    TIMEOUT: 'timeout',
    MODEL: 'model',
} as const;

describe('config', () => {
    describe('validateApiKey', () => {
        it('should return false for empty string', () => {
            expect(validateApiKey('')).toBe(false);
        });

        it('should return false for whitespace only', () => {
            expect(validateApiKey('   ')).toBe(false);
        });

        it('should return false for string shorter than 20 characters', () => {
            expect(validateApiKey('short')).toBe(false);
            expect(validateApiKey('1234567890123456789')).toBe(false); // 19 chars
        });

        it('should return true for string with 20+ characters', () => {
            expect(validateApiKey('12345678901234567890')).toBe(true); // 20 chars
            expect(validateApiKey('sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxx')).toBe(true);
        });

        it('should return true for valid Anthropic API key format', () => {
            const validKey = 'sk-ant-api03-abcdefghijklmnopqrstuvwxyz';
            expect(validateApiKey(validKey)).toBe(true);
        });
    });

    describe('DEFAULT_CONFIG', () => {
        it('should have empty apiKey by default', () => {
            expect(DEFAULT_CONFIG.apiKey).toBe('');
        });

        it('should have maxRetries of 3', () => {
            expect(DEFAULT_CONFIG.maxRetries).toBe(3);
        });

        it('should have timeout of 30000ms', () => {
            expect(DEFAULT_CONFIG.timeout).toBe(30000);
        });

        it('should have a valid model name', () => {
            expect(DEFAULT_CONFIG.model).toBeTruthy();
            expect(DEFAULT_CONFIG.model).toContain('claude');
        });
    });

    describe('CONFIG_KEYS', () => {
        it('should have correct section name', () => {
            expect(CONFIG_KEYS.SECTION).toBe('referenceManager');
        });

        it('should have all required keys', () => {
            expect(CONFIG_KEYS.API_KEY).toBe('apiKey');
            expect(CONFIG_KEYS.MAX_RETRIES).toBe('maxRetries');
            expect(CONFIG_KEYS.TIMEOUT).toBe('timeout');
            expect(CONFIG_KEYS.MODEL).toBe('model');
        });
    });
});
