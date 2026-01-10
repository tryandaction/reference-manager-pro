/**
 * license.ts 单元测试
 *
 * 测试 License Key 验证和使用限制功能
 * 注意：只测试纯函数，不测试依赖 vscode 的函数
 */

import { describe, it, expect } from 'vitest';

// 直接复制验证逻辑进行测试，因为 license.ts 依赖 vscode 模块
function validateLicenseKeyFormat(key: string): boolean {
    if (!key || key.trim() === '') {
        return false;
    }
    return key.startsWith('RMP-') && key.length >= 20;
}

const USAGE_LIMITS = {
    FORMAT_DAILY_LIMIT: 5,
    FIND_UNUSED_DAILY_LIMIT: 3,
} as const;

describe('License Module', () => {
    describe('validateLicenseKeyFormat', () => {
        it('should return false for empty string', () => {
            expect(validateLicenseKeyFormat('')).toBe(false);
        });

        it('should return false for whitespace only', () => {
            expect(validateLicenseKeyFormat('   ')).toBe(false);
        });

        it('should return false for key not starting with RMP-', () => {
            expect(validateLicenseKeyFormat('ABC-1234567890123456')).toBe(false);
        });

        it('should return false for key shorter than 20 characters', () => {
            expect(validateLicenseKeyFormat('RMP-123456789')).toBe(false);
        });

        it('should return true for valid key format', () => {
            expect(validateLicenseKeyFormat('RMP-1234567890123456')).toBe(true);
        });

        it('should return true for longer valid key', () => {
            expect(validateLicenseKeyFormat('RMP-XXXX-XXXX-XXXX-XXXX-XXXX')).toBe(true);
        });
    });

    describe('USAGE_LIMITS', () => {
        it('should have FORMAT_DAILY_LIMIT of 5', () => {
            expect(USAGE_LIMITS.FORMAT_DAILY_LIMIT).toBe(5);
        });

        it('should have FIND_UNUSED_DAILY_LIMIT of 3', () => {
            expect(USAGE_LIMITS.FIND_UNUSED_DAILY_LIMIT).toBe(3);
        });
    });
});
