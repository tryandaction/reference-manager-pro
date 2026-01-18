/**
 * config.ts - 配置管理模块
 *
 * 职责：统一管理VS Code设置项的读取和验证
 * 所有配置相关的操作都通过这个模块进行，便于维护和测试
 */

import * as vscode from 'vscode';

/**
 * AI 提供商类型
 */
export type AIProvider = 'anthropic' | 'groq';

/**
 * 插件配置接口
 * 对应 package.json 中 contributes.configuration 定义的设置项
 */
export interface ExtensionConfig {
    /** AI 提供商 */
    aiProvider: AIProvider;
    /** Anthropic API密钥 */
    apiKey: string;
    /** Groq API密钥 */
    groqApiKey: string;
    /** API调用失败时的最大重试次数 */
    maxRetries: number;
    /** API请求超时时间（毫秒） */
    timeout: number;
    /** 使用的Claude模型ID */
    model: string;
    /** Groq 模型 */
    groqModel: string;
}

/**
 * 配置项的键名常量
 * 使用常量避免硬编码字符串，减少拼写错误
 */
export const CONFIG_KEYS = {
    /** 配置节名称 */
    SECTION: 'referenceManager',
    /** AI 提供商 */
    AI_PROVIDER: 'aiProvider',
    /** API密钥 */
    API_KEY: 'apiKey',
    /** Groq API密钥 */
    GROQ_API_KEY: 'groqApiKey',
    /** 最大重试次数 */
    MAX_RETRIES: 'maxRetries',
    /** 超时时间 */
    TIMEOUT: 'timeout',
    /** 模型选择 */
    MODEL: 'model',
    /** Groq 模型 */
    GROQ_MODEL: 'groqModel',
} as const;

/**
 * 默认配置值
 * 当用户未设置时使用这些默认值
 */
export const DEFAULT_CONFIG: ExtensionConfig = {
    aiProvider: 'groq',
    apiKey: '',
    groqApiKey: '',
    maxRetries: 3,
    timeout: 30000,
    model: 'claude-sonnet-4-20250514',
    groqModel: 'llama-3.3-70b-versatile',
};

/**
 * 获取当前插件配置
 *
 * @returns ExtensionConfig 当前的配置对象
 *
 * @example
 * const config = getConfig();
 * if (!config.apiKey) {
 *     vscode.window.showWarningMessage('请先配置API Key');
 * }
 */
export function getConfig(): ExtensionConfig {
    // 获取referenceManager配置节
    const config = vscode.workspace.getConfiguration(CONFIG_KEYS.SECTION);

    return {
        aiProvider: config.get<AIProvider>(CONFIG_KEYS.AI_PROVIDER, DEFAULT_CONFIG.aiProvider),
        apiKey: config.get<string>(CONFIG_KEYS.API_KEY, DEFAULT_CONFIG.apiKey),
        groqApiKey: config.get<string>(CONFIG_KEYS.GROQ_API_KEY, DEFAULT_CONFIG.groqApiKey),
        maxRetries: config.get<number>(CONFIG_KEYS.MAX_RETRIES, DEFAULT_CONFIG.maxRetries),
        timeout: config.get<number>(CONFIG_KEYS.TIMEOUT, DEFAULT_CONFIG.timeout),
        model: config.get<string>(CONFIG_KEYS.MODEL, DEFAULT_CONFIG.model),
        groqModel: config.get<string>(CONFIG_KEYS.GROQ_MODEL, DEFAULT_CONFIG.groqModel),
    };
}

/**
 * 验证API Key格式是否有效
 *
 * @param apiKey 要验证的API Key
 * @param provider AI 提供商
 * @returns boolean 格式是否有效
 */
export function validateApiKey(apiKey: string, _provider?: AIProvider): boolean {
    // 检查是否为空
    if (!apiKey || apiKey.trim() === '') {
        return false;
    }

    // 基本长度检查
    if (apiKey.length < 20) {
        return false;
    }

    return true;
}

/**
 * 检查配置是否完整，如果不完整则提示用户
 *
 * @returns boolean 配置是否完整
 */
export async function ensureConfigured(): Promise<boolean> {
    const config = getConfig();

    // 根据选择的提供商检查对应的 API Key
    if (config.aiProvider === 'groq') {
        if (!validateApiKey(config.groqApiKey, 'groq')) {
            const action = await vscode.window.showWarningMessage(
                'Reference Manager Pro: 请先配置 Groq API Key',
                '打开设置'
            );

            if (action === '打开设置') {
                await vscode.commands.executeCommand(
                    'workbench.action.openSettings',
                    'referenceManager.groqApiKey'
                );
            }

            return false;
        }
    } else {
        if (!validateApiKey(config.apiKey, 'anthropic')) {
            const action = await vscode.window.showWarningMessage(
                'Reference Manager Pro: 请先配置 Anthropic API Key',
                '打开设置'
            );

            if (action === '打开设置') {
                await vscode.commands.executeCommand(
                    'workbench.action.openSettings',
                    'referenceManager.apiKey'
                );
            }

            return false;
        }
    }

    return true;
}

/**
 * 监听配置变化
 *
 * @param callback 配置变化时的回调函数
 * @returns Disposable 用于取消监听
 *
 * @example
 * // 在extension.ts中监听配置变化
 * const disposable = onConfigChange((config) => {
 *     console.log('配置已更新:', config);
 *     // 重新初始化AI客户端等
 * });
 * context.subscriptions.push(disposable);
 */
export function onConfigChange(
    callback: (config: ExtensionConfig) => void
): vscode.Disposable {
    return vscode.workspace.onDidChangeConfiguration((event) => {
        // 检查是否是我们关心的配置变化
        if (event.affectsConfiguration(CONFIG_KEYS.SECTION)) {
            callback(getConfig());
        }
    });
}
