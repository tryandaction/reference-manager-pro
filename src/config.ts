/**
 * config.ts - 配置管理模块
 *
 * 职责：统一管理VS Code设置项的读取和验证
 * 所有配置相关的操作都通过这个模块进行，便于维护和测试
 */

import * as vscode from 'vscode';
import { DEFAULT_JOURNAL_ABBREVIATIONS } from './localFormatter';

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
    /** 本地格式化配置 */
    localFormat: LocalFormatConfig;
    /** 校验配置 */
    validation: ValidationConfig;
    /** 官方元数据配置 */
    officialMetadata: OfficialMetadataConfig;
}

export interface LocalFormatConfig {
    /** 是否将作者从 "First Last" 规范为 "Last, First" */
    normalizeAuthors: boolean;
    /** 标题中需要保护大小写的专有名词/缩写词（将用 {} 包裹） */
    protectTitleWords: string[];
    /** 期刊/会议全称到缩写的映射（本地规则） */
    journalAbbreviations: Record<string, string>;
}

export type ValidationStrictness = 'loose' | 'normal' | 'strict';

export interface ValidationConfig {
    enabled: boolean;
    strictness: ValidationStrictness;
}

export interface OfficialMetadataConfig {
    enabled: boolean;
    timeout: number;
    keyPolicy: OfficialKeyPolicy;
}

export type OfficialKeyPolicy = 'preserve' | 'officialWhenUnused' | 'officialAlways';

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
    /** 本地格式化 - 作者规范化 */
    LOCAL_FORMAT_NORMALIZE_AUTHORS: 'localFormat.normalizeAuthors',
    /** 本地格式化 - 标题保护词 */
    LOCAL_FORMAT_PROTECT_TITLE_WORDS: 'localFormat.protectTitleWords',
    /** 本地格式化 - 期刊缩写映射 */
    LOCAL_FORMAT_JOURNAL_ABBREVIATIONS: 'localFormat.journalAbbreviations',
    /** 校验 - 启用 */
    VALIDATION_ENABLED: 'validation.enabled',
    /** 校验 - 严格度 */
    VALIDATION_STRICTNESS: 'validation.strictness',
    /** 官方元数据 - 启用 */
    OFFICIAL_METADATA_ENABLED: 'officialMetadata.enabled',
    /** 官方元数据 - 超时 */
    OFFICIAL_METADATA_TIMEOUT: 'officialMetadata.timeout',
    /** 官方元数据 - key 策略 */
    OFFICIAL_METADATA_KEY_POLICY: 'officialMetadata.keyPolicy',
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
    localFormat: {
        normalizeAuthors: true,
        protectTitleWords: ['LaTeX', 'BibTeX', 'arXiv', 'GitHub', 'OpenAI', 'GPU', 'CPU', 'AI', 'DOI', 'NOON', 'Hong-Ou-Mandel', 'Rydberg', 'CP', 'PT'],
        journalAbbreviations: DEFAULT_JOURNAL_ABBREVIATIONS,
    },
    validation: {
        enabled: true,
        strictness: 'normal',
    },
    officialMetadata: {
        enabled: true,
        timeout: 8000,
        keyPolicy: 'officialAlways',
    },
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
        localFormat: {
            normalizeAuthors: config.get<boolean>(
                CONFIG_KEYS.LOCAL_FORMAT_NORMALIZE_AUTHORS,
                DEFAULT_CONFIG.localFormat.normalizeAuthors
            ),
            protectTitleWords: config.get<string[]>(
                CONFIG_KEYS.LOCAL_FORMAT_PROTECT_TITLE_WORDS,
                DEFAULT_CONFIG.localFormat.protectTitleWords
            ),
            journalAbbreviations: config.get<Record<string, string>>(
                CONFIG_KEYS.LOCAL_FORMAT_JOURNAL_ABBREVIATIONS,
                DEFAULT_CONFIG.localFormat.journalAbbreviations
            ),
        },
        validation: {
            enabled: config.get<boolean>(
                CONFIG_KEYS.VALIDATION_ENABLED,
                DEFAULT_CONFIG.validation.enabled
            ),
            strictness: config.get<ValidationStrictness>(
                CONFIG_KEYS.VALIDATION_STRICTNESS,
                DEFAULT_CONFIG.validation.strictness
            ),
        },
        officialMetadata: {
            enabled: config.get<boolean>(
                CONFIG_KEYS.OFFICIAL_METADATA_ENABLED,
                DEFAULT_CONFIG.officialMetadata.enabled
            ),
            timeout: config.get<number>(
                CONFIG_KEYS.OFFICIAL_METADATA_TIMEOUT,
                DEFAULT_CONFIG.officialMetadata.timeout
            ),
            keyPolicy: config.get<OfficialKeyPolicy>(
                CONFIG_KEYS.OFFICIAL_METADATA_KEY_POLICY,
                DEFAULT_CONFIG.officialMetadata.keyPolicy
            ),
        },
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
