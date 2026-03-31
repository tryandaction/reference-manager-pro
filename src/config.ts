/**
 * config.ts - VS Code 配置读取层
 *
 * 职责：从 VS Code settings 中读取配置，并在必要时将旧配置映射到新的交互模型。
 * 纯类型、默认值和迁移逻辑位于 configurationModel.ts，便于单元测试。
 */

import * as vscode from 'vscode';
import {
    AIProvider,
    ContextMenuPin,
    CustomizationConfig,
    DEFAULT_CONFIG,
    ExtensionConfig,
    OfficialKeyPolicy,
    UIPreset,
    ValidationStrictness,
    WorkflowDefinition,
    migrateLegacyConfig,
    resolveUiConfig,
    sanitizeContextMenuPins,
} from './configurationModel';

export type {
    AIProvider,
    CleanupConfig,
    ContextMenuPin,
    CustomizationConfig,
    DuplicateKeepStrategy,
    ExtensionConfig,
    ExperimentalConfig,
    FeatureVisibilityConfig,
    KeyHandlingConfig,
    KeyHandlingMode,
    KeyReplacementBehavior,
    LegacyConfigInput,
    LocalFormatConfig,
    OfficialFormatMode,
    OfficialKeyPolicy,
    QualityConfig,
    SmartFixBehavior,
    UIPreset,
    UIConfig,
    ValidationBehavior,
    ValidationConfig,
    ValidationStrictness,
    WorkflowDefinition,
    WorkflowStep,
} from './configurationModel';

type ConfigInspect<T> = {
    globalValue?: T;
    workspaceValue?: T;
    workspaceFolderValue?: T;
};

function hasUserOverride<T>(inspect: ConfigInspect<T> | undefined): boolean {
    if (!inspect) {
        return false;
    }

    return (
        inspect.globalValue !== undefined ||
        inspect.workspaceValue !== undefined ||
        inspect.workspaceFolderValue !== undefined
    );
}

export const CONFIG_KEYS = {
    SECTION: 'referenceManager',
    AI_PROVIDER: 'aiProvider',
    API_KEY: 'apiKey',
    GROQ_API_KEY: 'groqApiKey',
    MAX_RETRIES: 'maxRetries',
    TIMEOUT: 'timeout',
    MODEL: 'model',
    GROQ_MODEL: 'groqModel',
    LOCAL_FORMAT_NORMALIZE_AUTHORS: 'localFormat.normalizeAuthors',
    LOCAL_FORMAT_PROTECT_TITLE_WORDS: 'localFormat.protectTitleWords',
    LOCAL_FORMAT_JOURNAL_ABBREVIATIONS: 'localFormat.journalAbbreviations',
    VALIDATION_ENABLED: 'validation.enabled',
    VALIDATION_STRICTNESS: 'validation.strictness',
    OFFICIAL_METADATA_ENABLED: 'officialMetadata.enabled',
    OFFICIAL_METADATA_TIMEOUT: 'officialMetadata.timeout',
    OFFICIAL_METADATA_FORMAT_MODE: 'officialMetadata.formatMode',
    UI_PRESET: 'ui.preset',
    UI_CONTEXT_MENU_PINS: 'ui.contextMenuPins',
    UI_SHOW_COMMAND_CENTER_IN_CONTEXT_MENU: 'ui.showCommandCenterInContextMenu',
    KEY_HANDLING_MODE: 'keyHandling.mode',
    KEY_HANDLING_COMMENT_PREFIX: 'keyHandling.commentPrefix',
    QUALITY_VALIDATE_ON_SAVE: 'quality.validateOnSave',
    QUALITY_SHOW_INLINE_DECORATIONS: 'quality.showInlineDecorations',
    CLEANUP_DUPLICATE_KEEP_STRATEGY: 'cleanup.duplicateKeepStrategy',
    EXPERIMENTAL_WORKFLOWS: 'experimental.workflows',
    LEGACY_CUSTOMIZATION: 'customization',
    LEGACY_OFFICIAL_METADATA_KEY_POLICY: 'officialMetadata.keyPolicy',
} as const;

export { DEFAULT_CONFIG };

function getNewValueOrFallback<T>(
    config: vscode.WorkspaceConfiguration,
    key: string,
    fallback: T
): T {
    return config.get<T>(key, fallback);
}

function getUserOrMigratedValue<T>(
    config: vscode.WorkspaceConfiguration,
    key: string,
    defaultValue: T,
    migratedValue: T
): T {
    const inspect = config.inspect<T>(key);
    if (hasUserOverride(inspect)) {
        return config.get<T>(key, defaultValue);
    }
    return migratedValue;
}

export function getConfig(): ExtensionConfig {
    const config = vscode.workspace.getConfiguration(CONFIG_KEYS.SECTION);
    const legacyCustomization = config.get<Partial<CustomizationConfig>>(CONFIG_KEYS.LEGACY_CUSTOMIZATION);
    const legacyPolicy = config.get<OfficialKeyPolicy | undefined>(CONFIG_KEYS.LEGACY_OFFICIAL_METADATA_KEY_POLICY);
    const migrated = migrateLegacyConfig({
        officialKeyPolicy: legacyPolicy,
        customization: legacyCustomization,
    });

    const presetInspect = config.inspect<UIPreset>(CONFIG_KEYS.UI_PRESET);
    const preset = getUserOrMigratedValue(
        config,
        CONFIG_KEYS.UI_PRESET,
        DEFAULT_CONFIG.ui.preset,
        migrated.ui.preset
    );
    const pins = hasUserOverride(config.inspect<ContextMenuPin[]>(CONFIG_KEYS.UI_CONTEXT_MENU_PINS))
        ? sanitizeContextMenuPins(config.get<string[]>(CONFIG_KEYS.UI_CONTEXT_MENU_PINS, DEFAULT_CONFIG.ui.contextMenuPins))
        : hasUserOverride(presetInspect)
            ? undefined
            : migrated.ui.contextMenuPins;
    const showCommandCenter = hasUserOverride(
        config.inspect<boolean>(CONFIG_KEYS.UI_SHOW_COMMAND_CENTER_IN_CONTEXT_MENU)
    )
        ? config.get<boolean>(
            CONFIG_KEYS.UI_SHOW_COMMAND_CENTER_IN_CONTEXT_MENU,
            DEFAULT_CONFIG.ui.showCommandCenterInContextMenu
        )
        : hasUserOverride(presetInspect)
            ? undefined
            : migrated.ui.showCommandCenterInContextMenu;

    return {
        aiProvider: getNewValueOrFallback(config, CONFIG_KEYS.AI_PROVIDER, DEFAULT_CONFIG.aiProvider),
        apiKey: getNewValueOrFallback(config, CONFIG_KEYS.API_KEY, DEFAULT_CONFIG.apiKey),
        groqApiKey: getNewValueOrFallback(config, CONFIG_KEYS.GROQ_API_KEY, DEFAULT_CONFIG.groqApiKey),
        maxRetries: getNewValueOrFallback(config, CONFIG_KEYS.MAX_RETRIES, DEFAULT_CONFIG.maxRetries),
        timeout: getNewValueOrFallback(config, CONFIG_KEYS.TIMEOUT, DEFAULT_CONFIG.timeout),
        model: getNewValueOrFallback(config, CONFIG_KEYS.MODEL, DEFAULT_CONFIG.model),
        groqModel: getNewValueOrFallback(config, CONFIG_KEYS.GROQ_MODEL, DEFAULT_CONFIG.groqModel),
        localFormat: {
            normalizeAuthors: getNewValueOrFallback(
                config,
                CONFIG_KEYS.LOCAL_FORMAT_NORMALIZE_AUTHORS,
                DEFAULT_CONFIG.localFormat.normalizeAuthors
            ),
            protectTitleWords: getNewValueOrFallback(
                config,
                CONFIG_KEYS.LOCAL_FORMAT_PROTECT_TITLE_WORDS,
                DEFAULT_CONFIG.localFormat.protectTitleWords
            ),
            journalAbbreviations: getNewValueOrFallback(
                config,
                CONFIG_KEYS.LOCAL_FORMAT_JOURNAL_ABBREVIATIONS,
                DEFAULT_CONFIG.localFormat.journalAbbreviations
            ),
        },
        validation: {
            enabled: getNewValueOrFallback(
                config,
                CONFIG_KEYS.VALIDATION_ENABLED,
                DEFAULT_CONFIG.validation.enabled
            ),
            strictness: getNewValueOrFallback<ValidationStrictness>(
                config,
                CONFIG_KEYS.VALIDATION_STRICTNESS,
                DEFAULT_CONFIG.validation.strictness
            ),
        },
        officialMetadata: {
            enabled: getNewValueOrFallback(
                config,
                CONFIG_KEYS.OFFICIAL_METADATA_ENABLED,
                DEFAULT_CONFIG.officialMetadata.enabled
            ),
            timeout: getNewValueOrFallback(
                config,
                CONFIG_KEYS.OFFICIAL_METADATA_TIMEOUT,
                DEFAULT_CONFIG.officialMetadata.timeout
            ),
            formatMode: getNewValueOrFallback(
                config,
                CONFIG_KEYS.OFFICIAL_METADATA_FORMAT_MODE,
                DEFAULT_CONFIG.officialMetadata.formatMode
            ),
        },
        ui: resolveUiConfig({
            preset,
            contextMenuPins: pins,
            showCommandCenterInContextMenu: showCommandCenter,
        }),
        keyHandling: {
            mode: getUserOrMigratedValue(
                config,
                CONFIG_KEYS.KEY_HANDLING_MODE,
                DEFAULT_CONFIG.keyHandling.mode,
                migrated.keyHandling.mode
            ),
            commentPrefix: getUserOrMigratedValue(
                config,
                CONFIG_KEYS.KEY_HANDLING_COMMENT_PREFIX,
                DEFAULT_CONFIG.keyHandling.commentPrefix,
                migrated.keyHandling.commentPrefix
            ),
        },
        quality: {
            validateOnSave: getUserOrMigratedValue(
                config,
                CONFIG_KEYS.QUALITY_VALIDATE_ON_SAVE,
                DEFAULT_CONFIG.quality.validateOnSave,
                migrated.quality.validateOnSave
            ),
            showInlineDecorations: getUserOrMigratedValue(
                config,
                CONFIG_KEYS.QUALITY_SHOW_INLINE_DECORATIONS,
                DEFAULT_CONFIG.quality.showInlineDecorations,
                migrated.quality.showInlineDecorations
            ),
        },
        cleanup: {
            duplicateKeepStrategy: getUserOrMigratedValue(
                config,
                CONFIG_KEYS.CLEANUP_DUPLICATE_KEEP_STRATEGY,
                DEFAULT_CONFIG.cleanup.duplicateKeepStrategy,
                migrated.cleanup.duplicateKeepStrategy
            ),
        },
        experimental: {
            workflows: getUserOrMigratedValue<WorkflowDefinition[]>(
                config,
                CONFIG_KEYS.EXPERIMENTAL_WORKFLOWS,
                DEFAULT_CONFIG.experimental.workflows,
                migrated.experimental.workflows
            ),
        },
    };
}

export function validateApiKey(apiKey: string, _provider?: AIProvider): boolean {
    if (!apiKey || apiKey.trim() === '') {
        return false;
    }

    return apiKey.length >= 20;
}

export async function ensureConfigured(): Promise<boolean> {
    const config = getConfig();

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
    } else if (!validateApiKey(config.apiKey, 'anthropic')) {
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

    return true;
}

export function onConfigChange(
    callback: (config: ExtensionConfig) => void
): vscode.Disposable {
    return vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration(CONFIG_KEYS.SECTION)) {
            callback(getConfig());
        }
    });
}

export function needsConfigMigration(): boolean {
    const config = vscode.workspace.getConfiguration(CONFIG_KEYS.SECTION);
    const hasLegacyCustomization = hasUserOverride(
        config.inspect<CustomizationConfig>(CONFIG_KEYS.LEGACY_CUSTOMIZATION)
    );
    const hasNewUi = hasUserOverride(config.inspect<UIPreset>(CONFIG_KEYS.UI_PRESET));
    return hasLegacyCustomization && !hasNewUi;
}

export async function promptConfigMigration(): Promise<boolean> {
    const choice = await vscode.window.showInformationMessage(
        'Reference Manager Pro 已升级为更简洁的交互模型。是否将旧设置迁移到新配置？',
        '立即迁移',
        '稍后',
        '了解变化'
    );

    if (choice === '了解变化') {
        vscode.window.showInformationMessage(
            '新版本默认直接提供 5 个高频动作，并将其余低频能力收敛到 More Tools。'
        );
        return false;
    }

    return choice === '立即迁移';
}

export async function migrateUserConfig(): Promise<void> {
    const config = vscode.workspace.getConfiguration(CONFIG_KEYS.SECTION);
    const migrated = migrateLegacyConfig({
        officialKeyPolicy: config.get<OfficialKeyPolicy | undefined>(CONFIG_KEYS.LEGACY_OFFICIAL_METADATA_KEY_POLICY),
        customization: config.get<Partial<CustomizationConfig>>(CONFIG_KEYS.LEGACY_CUSTOMIZATION),
    });

    await config.update(CONFIG_KEYS.UI_PRESET, migrated.ui.preset, vscode.ConfigurationTarget.Global);
    await config.update(CONFIG_KEYS.UI_CONTEXT_MENU_PINS, migrated.ui.contextMenuPins, vscode.ConfigurationTarget.Global);
    await config.update(
        CONFIG_KEYS.UI_SHOW_COMMAND_CENTER_IN_CONTEXT_MENU,
        migrated.ui.showCommandCenterInContextMenu,
        vscode.ConfigurationTarget.Global
    );
    await config.update(CONFIG_KEYS.KEY_HANDLING_MODE, migrated.keyHandling.mode, vscode.ConfigurationTarget.Global);
    await config.update(
        CONFIG_KEYS.KEY_HANDLING_COMMENT_PREFIX,
        migrated.keyHandling.commentPrefix,
        vscode.ConfigurationTarget.Global
    );
    await config.update(
        CONFIG_KEYS.QUALITY_VALIDATE_ON_SAVE,
        migrated.quality.validateOnSave,
        vscode.ConfigurationTarget.Global
    );
    await config.update(
        CONFIG_KEYS.QUALITY_SHOW_INLINE_DECORATIONS,
        migrated.quality.showInlineDecorations,
        vscode.ConfigurationTarget.Global
    );
    await config.update(
        CONFIG_KEYS.CLEANUP_DUPLICATE_KEEP_STRATEGY,
        migrated.cleanup.duplicateKeepStrategy,
        vscode.ConfigurationTarget.Global
    );
    await config.update(
        CONFIG_KEYS.EXPERIMENTAL_WORKFLOWS,
        migrated.experimental.workflows,
        vscode.ConfigurationTarget.Global
    );

    vscode.window.showInformationMessage(
        '✅ 已完成新交互模型迁移。你可以在 Reference Manager 的新设置项中继续微调。'
    );
}
