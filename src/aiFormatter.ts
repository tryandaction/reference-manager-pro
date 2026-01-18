/**
 * aiFormatter.ts - AI API 封装模块
 *
 * 职责：封装 AI API 调用，支持 Anthropic Claude 和 Groq
 *
 * 关键特性：
 * - 多提供商支持（Anthropic、Groq）
 * - 重试机制（指数退避）
 * - 超时控制
 * - 详细错误信息
 * - 批量处理支持
 */

import Anthropic from '@anthropic-ai/sdk';
import { ExtensionConfig } from './config';

/**
 * 重复检测结果接口
 */
export interface DuplicateCheckResult {
    /** 是否为重复条目 */
    isDuplicate: boolean;
    /** 建议保留哪个条目 ('entry1' 或 'entry2') */
    keepEntry: 'entry1' | 'entry2';
    /** AI给出的理由 */
    reason: string;
}

/**
 * API调用错误类型
 */
export enum AIErrorType {
    /** API Key无效或未配置 */
    INVALID_API_KEY = 'INVALID_API_KEY',
    /** 网络连接失败 */
    NETWORK_ERROR = 'NETWORK_ERROR',
    /** 请求超时 */
    TIMEOUT = 'TIMEOUT',
    /** API返回错误 */
    API_ERROR = 'API_ERROR',
    /** 响应解析失败 */
    PARSE_ERROR = 'PARSE_ERROR',
    /** 速率限制 */
    RATE_LIMIT = 'RATE_LIMIT',
    /** 未知错误 */
    UNKNOWN = 'UNKNOWN',
}

/**
 * 自定义AI错误类
 */
export class AIError extends Error {
    constructor(
        public readonly type: AIErrorType,
        message: string,
        public readonly suggestion: string,
        public readonly originalError?: unknown
    ) {
        super(message);
        this.name = 'AIError';
    }

    getUserMessage(): string {
        return `${this.message}\n💡 建议: ${this.suggestion}`;
    }
}

/**
 * 格式化BibTeX条目的Prompt模板
 */
const FORMAT_PROMPT = `规范化以下BibTeX条目，要求：
1. 期刊名使用标准缩写（如Physical Review Letters → Phys. Rev. Lett.，Nature Communications → Nat. Commun.）
2. 如果能根据标题和作者推断DOI，请补全（格式：10.xxxx/xxxxx）
3. 作者格式统一为"Last, First and Last, First"格式
4. 删除多余空格和换行，保持格式整洁
5. 年份使用4位数字格式
6. 页码使用连字符（如123--456）

原始条目：
{ENTRY}

只输出规范化后的BibTeX条目，不要任何解释或额外文字。`;

/**
 * 检测重复条目的Prompt模板
 */
const DUPLICATE_CHECK_PROMPT = `判断以下两个BibTeX条目是否指向同一篇文献（可能是arXiv预印本和正式发表版本，或格式不同的同一文献）。

条目1:
{ENTRY1}

条目2:
{ENTRY2}

请分析并返回JSON格式结果（只返回JSON，不要其他文字）：
{
  "is_duplicate": true或false,
  "keep": "entry1"或"entry2"（如果是重复，推荐保留更权威的版本，优先正式发表版）,
  "reason": "简短说明判断理由"
}`;

/**
 * Groq API 响应接口
 */
interface GroqResponse {
    choices: Array<{
        message: {
            content: string;
        };
    }>;
}

/**
 * AI格式化器类
 * 封装所有与 AI API 的交互
 */
export class AIFormatter {
    private anthropicClient: Anthropic | null = null;
    private config: ExtensionConfig;

    constructor(config: ExtensionConfig) {
        this.config = config;
        this.initClients();
    }

    private initClients(): void {
        if (this.config.aiProvider === 'anthropic' && this.config.apiKey) {
            this.anthropicClient = new Anthropic({
                apiKey: this.config.apiKey,
            });
        }
    }

    updateConfig(config: ExtensionConfig): void {
        this.config = config;
        this.initClients();
    }

    async formatBibEntry(rawEntry: string): Promise<string> {
        const prompt = FORMAT_PROMPT.replace('{ENTRY}', rawEntry);
        const response = await this.callAPI(prompt);
        return this.cleanBibResponse(response);
    }

    async formatBibEntries(
        entries: string[],
        onProgress?: (current: number, total: number) => void
    ): Promise<string[]> {
        const results: string[] = [];

        for (let i = 0; i < entries.length; i++) {
            if (onProgress) {
                onProgress(i + 1, entries.length);
            }

            const entry = entries[i]!;
            try {
                const formatted = await this.formatBibEntry(entry);
                results.push(formatted);
            } catch (error) {
                console.error(`格式化条目 ${i + 1} 失败:`, error);
                results.push(entry);
            }
        }

        return results;
    }

    async checkDuplicate(entry1: string, entry2: string): Promise<DuplicateCheckResult> {
        const prompt = DUPLICATE_CHECK_PROMPT
            .replace('{ENTRY1}', entry1)
            .replace('{ENTRY2}', entry2);

        const response = await this.callAPI(prompt);

        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('响应中未找到JSON');
            }

            const parsed = JSON.parse(jsonMatch[0]) as {
                is_duplicate: boolean;
                keep: string;
                reason: string;
            };

            return {
                isDuplicate: parsed.is_duplicate,
                keepEntry: parsed.keep === 'entry1' ? 'entry1' : 'entry2',
                reason: parsed.reason || '未提供理由',
            };
        } catch (parseError) {
            throw new AIError(
                AIErrorType.PARSE_ERROR,
                '无法解析AI响应',
                '请重试，如果问题持续请检查条目格式',
                parseError
            );
        }
    }

    private async callAPI(prompt: string): Promise<string> {
        if (this.config.aiProvider === 'groq') {
            return this.callGroqAPI(prompt);
        } else {
            return this.callAnthropicAPI(prompt);
        }
    }

    /**
     * 调用 Groq API
     */
    private async callGroqAPI(prompt: string): Promise<string> {
        let lastError: unknown;

        for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => {
                    controller.abort();
                }, this.config.timeout);

                try {
                    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${this.config.groqApiKey}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            model: this.config.groqModel,
                            messages: [
                                {
                                    role: 'user',
                                    content: prompt,
                                },
                            ],
                            max_tokens: 2048,
                            temperature: 0.1,
                        }),
                        signal: controller.signal,
                    });

                    clearTimeout(timeoutId);

                    if (!response.ok) {
                        const errorText = await response.text();
                        
                        if (response.status === 401) {
                            throw new AIError(
                                AIErrorType.INVALID_API_KEY,
                                'Groq API Key 无效',
                                '请检查您的 Groq API Key 是否正确',
                                errorText
                            );
                        }
                        
                        if (response.status === 429) {
                            throw new AIError(
                                AIErrorType.RATE_LIMIT,
                                'Groq API 请求过于频繁',
                                '请稍后再试',
                                errorText
                            );
                        }

                        throw new AIError(
                            AIErrorType.API_ERROR,
                            `Groq API 错误: ${response.status}`,
                            '请稍后重试',
                            errorText
                        );
                    }

                    const data = await response.json() as GroqResponse;
                    const content = data.choices?.[0]?.message?.content;

                    if (!content) {
                        throw new AIError(
                            AIErrorType.PARSE_ERROR,
                            'Groq 响应格式异常',
                            '请重试',
                            data
                        );
                    }

                    return content;
                } finally {
                    clearTimeout(timeoutId);
                }
            } catch (error) {
                lastError = error;

                if (error instanceof AIError) {
                    if (error.type === AIErrorType.INVALID_API_KEY || 
                        error.type === AIErrorType.RATE_LIMIT) {
                        throw error;
                    }
                }

                if (attempt < this.config.maxRetries) {
                    const delay = Math.pow(2, attempt) * 1000;
                    await this.sleep(delay);
                }
            }
        }

        throw this.classifyError(lastError);
    }

    /**
     * 调用 Anthropic API
     */
    private async callAnthropicAPI(prompt: string): Promise<string> {
        if (!this.anthropicClient) {
            throw new AIError(
                AIErrorType.INVALID_API_KEY,
                'Anthropic 客户端未初始化',
                '请配置有效的 Anthropic API Key',
                null
            );
        }

        let lastError: unknown;

        for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => {
                    controller.abort();
                }, this.config.timeout);

                try {
                    const response = await this.anthropicClient.messages.create({
                        model: this.config.model,
                        max_tokens: 2048,
                        messages: [
                            {
                                role: 'user',
                                content: prompt,
                            },
                        ],
                    });

                    clearTimeout(timeoutId);

                    const textContent = response.content.find(c => c.type === 'text');
                    if (!textContent || textContent.type !== 'text') {
                        throw new AIError(
                            AIErrorType.PARSE_ERROR,
                            'AI响应格式异常',
                            '请重试',
                            response
                        );
                    }

                    return textContent.text;
                } finally {
                    clearTimeout(timeoutId);
                }
            } catch (error) {
                lastError = error;

                const aiError = this.classifyError(error);

                if (aiError.type === AIErrorType.INVALID_API_KEY ||
                    aiError.type === AIErrorType.RATE_LIMIT) {
                    throw aiError;
                }

                if (attempt < this.config.maxRetries) {
                    const delay = Math.pow(2, attempt) * 1000;
                    await this.sleep(delay);
                }
            }
        }

        throw this.classifyError(lastError);
    }

    private classifyError(error: unknown): AIError {
        if (error instanceof Anthropic.APIError) {
            const status = error.status;

            if (status === 401) {
                return new AIError(
                    AIErrorType.INVALID_API_KEY,
                    'API Key无效或已过期',
                    '请在设置中检查并更新您的API Key',
                    error
                );
            }

            if (status === 429) {
                return new AIError(
                    AIErrorType.RATE_LIMIT,
                    'API请求过于频繁',
                    '请稍后再试',
                    error
                );
            }

            if (status !== undefined && status >= 500) {
                return new AIError(
                    AIErrorType.API_ERROR,
                    '服务暂时不可用',
                    '请稍后重试',
                    error
                );
            }

            return new AIError(
                AIErrorType.API_ERROR,
                `API错误: ${error.message}`,
                '请检查请求参数或稍后重试',
                error
            );
        }

        if (error instanceof Error && error.name === 'AbortError') {
            return new AIError(
                AIErrorType.TIMEOUT,
                '请求超时',
                '请检查网络连接，或在设置中增加超时时间',
                error
            );
        }

        if (error instanceof Error && error.message.includes('fetch')) {
            return new AIError(
                AIErrorType.NETWORK_ERROR,
                '网络连接失败',
                '请检查网络连接和代理设置',
                error
            );
        }

        if (error instanceof AIError) {
            return error;
        }

        return new AIError(
            AIErrorType.UNKNOWN,
            error instanceof Error ? error.message : '发生未知错误',
            '请查看开发者工具获取详细信息',
            error
        );
    }

    private cleanBibResponse(response: string): string {
        let cleaned = response.trim();

        if (cleaned.startsWith('```bibtex')) {
            cleaned = cleaned.substring(9);
        } else if (cleaned.startsWith('```')) {
            cleaned = cleaned.substring(3);
        }

        if (cleaned.endsWith('```')) {
            cleaned = cleaned.substring(0, cleaned.length - 3);
        }

        return cleaned.trim();
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
