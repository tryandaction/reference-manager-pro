/**
 * aiFormatter 单元测试
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */

import { describe, it, expect } from 'vitest';
import { AIError, AIErrorType } from '../../aiFormatter';

describe('aiFormatter', () => {
    describe('AIError', () => {
        it('should create error with correct type', () => {
            const error = new AIError(
                AIErrorType.INVALID_API_KEY,
                'API Key无效',
                '请检查设置'
            );

            expect(error.type).toBe(AIErrorType.INVALID_API_KEY);
            expect(error.message).toBe('API Key无效');
            expect(error.suggestion).toBe('请检查设置');
        });

        it('should generate user-friendly message', () => {
            const error = new AIError(
                AIErrorType.NETWORK_ERROR,
                '网络连接失败',
                '请检查网络连接'
            );

            const userMessage = error.getUserMessage();

            expect(userMessage).toContain('网络连接失败');
            expect(userMessage).toContain('请检查网络连接');
        });

        it('should preserve original error', () => {
            const originalError = new Error('Original');
            const error = new AIError(
                AIErrorType.UNKNOWN,
                'Wrapped error',
                'Try again',
                originalError
            );

            expect(error.originalError).toBe(originalError);
        });
    });

    describe('AIErrorType', () => {
        it('should have INVALID_API_KEY type', () => {
            expect(AIErrorType.INVALID_API_KEY).toBe('INVALID_API_KEY');
        });

        it('should have NETWORK_ERROR type', () => {
            expect(AIErrorType.NETWORK_ERROR).toBe('NETWORK_ERROR');
        });

        it('should have TIMEOUT type', () => {
            expect(AIErrorType.TIMEOUT).toBe('TIMEOUT');
        });

        it('should have RATE_LIMIT type', () => {
            expect(AIErrorType.RATE_LIMIT).toBe('RATE_LIMIT');
        });

        it('should have API_ERROR type', () => {
            expect(AIErrorType.API_ERROR).toBe('API_ERROR');
        });

        it('should have PARSE_ERROR type', () => {
            expect(AIErrorType.PARSE_ERROR).toBe('PARSE_ERROR');
        });

        it('should have UNKNOWN type', () => {
            expect(AIErrorType.UNKNOWN).toBe('UNKNOWN');
        });
    });

    describe('Error messages for different types', () => {
        // Req 6.1: API Key无效
        it('should provide correct message for invalid API key', () => {
            const error = new AIError(
                AIErrorType.INVALID_API_KEY,
                'API Key无效或已过期',
                '请在设置中检查并更新您的Anthropic API Key'
            );

            expect(error.getUserMessage()).toContain('API Key无效或已过期');
            expect(error.getUserMessage()).toContain('设置');
        });

        // Req 6.2: 网络连接失败
        it('should provide correct message for network error', () => {
            const error = new AIError(
                AIErrorType.NETWORK_ERROR,
                '网络连接失败',
                '请检查网络连接和代理设置'
            );

            expect(error.getUserMessage()).toContain('网络连接失败');
            expect(error.getUserMessage()).toContain('网络连接');
        });

        // Req 6.3: 请求超时
        it('should provide correct message for timeout', () => {
            const error = new AIError(
                AIErrorType.TIMEOUT,
                '请求超时',
                '请检查网络连接，或在设置中增加超时时间'
            );

            expect(error.getUserMessage()).toContain('请求超时');
            expect(error.getUserMessage()).toContain('超时时间');
        });

        // Req 6.4: API请求过于频繁
        it('should provide correct message for rate limit', () => {
            const error = new AIError(
                AIErrorType.RATE_LIMIT,
                'API请求过于频繁',
                '请稍后再试，或升级您的API配额'
            );

            expect(error.getUserMessage()).toContain('API请求过于频繁');
            expect(error.getUserMessage()).toContain('稍后再试');
        });
    });
});
