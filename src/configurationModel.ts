import { DEFAULT_JOURNAL_ABBREVIATIONS } from './localFormatter';

export type AIProvider = 'anthropic' | 'groq';
export type ValidationStrictness = 'loose' | 'normal' | 'strict';
export type OfficialFormatMode = 'raw' | 'normalized';
export type OfficialKeyPolicy = 'preserve' | 'officialWhenUnused' | 'officialAlways';
export type DuplicateKeepStrategy = 'first' | 'last' | 'most-complete' | 'ask-user';
export type UIPreset = 'minimal' | 'review' | 'power';
export type ContextMenuPin =
    | 'history'
    | 'removeDuplicates'
    | 'officialReport';
export type KeyHandlingMode =
    | 'replace-safe-and-comment-old'
    | 'replace-safe'
    | 'replace-always-and-comment-old'
    | 'replace-always'
    | 'preserve-and-comment-official'
    | 'preserve';
export type LegacyKeyReplacementMode =
    | 'replace-and-comment-old'
    | 'keep-and-comment-official'
    | 'replace-only'
    | 'keep-only';

export interface LocalFormatConfig {
    normalizeAuthors: boolean;
    protectTitleWords: string[];
    journalAbbreviations: Record<string, string>;
}

export interface ValidationConfig {
    enabled: boolean;
    strictness: ValidationStrictness;
}

export interface OfficialMetadataConfig {
    enabled: boolean;
    timeout: number;
    formatMode: OfficialFormatMode;
}

export interface UIConfig {
    preset: UIPreset;
    contextMenuPins: ContextMenuPin[];
    showCommandCenterInContextMenu: boolean;
}

export interface KeyHandlingConfig {
    mode: KeyHandlingMode;
    commentPrefix: string;
}

export interface QualityConfig {
    validateOnSave: boolean;
    showInlineDecorations: boolean;
}

export interface CleanupConfig {
    duplicateKeepStrategy: DuplicateKeepStrategy;
}

export interface WorkflowStep {
    id: string;
    operation: 'smartFix' | 'formatLocal' | 'formatAI' | 'validate' | 'removeDuplicates' | 'findUnused';
    options?: Record<string, unknown>;
    continueOnError: boolean;
    label?: string;
}

export interface WorkflowDefinition {
    id: string;
    name: string;
    description: string;
    steps: WorkflowStep[];
    scope: 'entry' | 'file' | 'workspace';
    showInMenu: boolean;
}

export interface ExperimentalConfig {
    workflows: WorkflowDefinition[];
}

export interface ExtensionConfig {
    aiProvider: AIProvider;
    apiKey: string;
    groqApiKey: string;
    maxRetries: number;
    timeout: number;
    model: string;
    groqModel: string;
    localFormat: LocalFormatConfig;
    validation: ValidationConfig;
    officialMetadata: OfficialMetadataConfig;
    ui: UIConfig;
    keyHandling: KeyHandlingConfig;
    quality: QualityConfig;
    cleanup: CleanupConfig;
    experimental: ExperimentalConfig;
}

export interface FeatureVisibilityConfig {
    smartFix: boolean;
    validate: boolean;
    history: boolean;
    advancedMenu: boolean;
    advanced: {
        smartFixAll: boolean;
        smartFixAllOfficialRaw: boolean;
        officialReport: boolean;
        removeDuplicates: boolean;
        findUnusedCitations: boolean;
        formatEntryLocal: boolean;
        formatEntryAI: boolean;
        smartFixOfficialRaw: boolean;
        formatAllEntriesLocal: boolean;
        formatAllEntriesAI: boolean;
    };
}

export interface KeyReplacementBehavior {
    mode: LegacyKeyReplacementMode;
    commentPrefix: string;
}

export interface SmartFixBehavior {
    operationOrder: Array<'official' | 'ai' | 'local'>;
    enableFallback: boolean;
    showDetailedSummary: boolean;
    autoValidate: boolean;
}

export interface DuplicateRemovalBehavior {
    keepStrategy: DuplicateKeepStrategy;
    maxEntries: number;
}

export interface ValidationBehavior {
    validateOnSave: boolean;
    showInlineDecorations: boolean;
}

export interface MenuOrganizationConfig {
    groupOrder: string[];
    groupLabels: Record<string, string>;
    showIcons: boolean;
}

export interface CustomizationConfig {
    featureVisibility: FeatureVisibilityConfig;
    behaviors: {
        keyReplacement: KeyReplacementBehavior;
        smartFix: SmartFixBehavior;
        duplicateRemoval: DuplicateRemovalBehavior;
        validation: ValidationBehavior;
    };
    workflows: WorkflowDefinition[];
    menuOrganization: MenuOrganizationConfig;
}

export interface LegacyConfigInput {
    officialKeyPolicy?: OfficialKeyPolicy;
    customization?: Partial<CustomizationConfig>;
}

export interface MigratedConfigSlice {
    ui: UIConfig;
    keyHandling: KeyHandlingConfig;
    quality: QualityConfig;
    cleanup: CleanupConfig;
    experimental: ExperimentalConfig;
}

export const PINNABLE_ACTIONS: ContextMenuPin[] = [
    'history',
    'removeDuplicates',
    'officialReport',
];

export const DEFAULT_UI_PRESETS: Record<UIPreset, Omit<UIConfig, 'preset'>> = {
    minimal: {
        contextMenuPins: [],
        showCommandCenterInContextMenu: true,
    },
    review: {
        contextMenuPins: ['history'],
        showCommandCenterInContextMenu: true,
    },
    power: {
        contextMenuPins: ['history', 'officialReport'],
        showCommandCenterInContextMenu: true,
    },
};

export const LEGACY_DEFAULT_CUSTOMIZATION: CustomizationConfig = {
    featureVisibility: {
        smartFix: true,
        validate: true,
        history: true,
        advancedMenu: true,
        advanced: {
            smartFixAll: true,
            smartFixAllOfficialRaw: true,
            officialReport: true,
            removeDuplicates: true,
            findUnusedCitations: true,
            formatEntryLocal: true,
            formatEntryAI: true,
            smartFixOfficialRaw: true,
            formatAllEntriesLocal: true,
            formatAllEntriesAI: true,
        },
    },
    behaviors: {
        keyReplacement: {
            mode: 'replace-and-comment-old',
            commentPrefix: '% oldkey:',
        },
        smartFix: {
            operationOrder: ['official', 'ai', 'local'],
            enableFallback: true,
            showDetailedSummary: true,
            autoValidate: false,
        },
        duplicateRemoval: {
            keepStrategy: 'most-complete',
            maxEntries: 100,
        },
        validation: {
            validateOnSave: false,
            showInlineDecorations: true,
        },
    },
    workflows: [],
    menuOrganization: {
        groupOrder: ['primary', 'validation', 'history', 'workflows', 'advanced'],
        groupLabels: {
            primary: 'Quick Actions',
            validation: 'Quality',
            history: 'History',
            workflows: 'Workflows',
            advanced: 'Advanced',
        },
        showIcons: true,
    },
};

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
        formatMode: 'normalized',
    },
    ui: {
        preset: 'minimal',
        ...DEFAULT_UI_PRESETS.minimal,
    },
    keyHandling: {
        mode: 'replace-safe-and-comment-old',
        commentPrefix: '% oldkey:',
    },
    quality: {
        validateOnSave: false,
        showInlineDecorations: true,
    },
    cleanup: {
        duplicateKeepStrategy: 'most-complete',
    },
    experimental: {
        workflows: [],
    },
};

function mergeLegacyCustomization(
    customization?: Partial<CustomizationConfig>
): CustomizationConfig {
    if (!customization) {
        return LEGACY_DEFAULT_CUSTOMIZATION;
    }

    return {
        featureVisibility: {
            ...LEGACY_DEFAULT_CUSTOMIZATION.featureVisibility,
            ...customization.featureVisibility,
            advanced: {
                ...LEGACY_DEFAULT_CUSTOMIZATION.featureVisibility.advanced,
                ...customization.featureVisibility?.advanced,
            },
        },
        behaviors: {
            keyReplacement: {
                ...LEGACY_DEFAULT_CUSTOMIZATION.behaviors.keyReplacement,
                ...customization.behaviors?.keyReplacement,
            },
            smartFix: {
                ...LEGACY_DEFAULT_CUSTOMIZATION.behaviors.smartFix,
                ...customization.behaviors?.smartFix,
            },
            duplicateRemoval: {
                ...LEGACY_DEFAULT_CUSTOMIZATION.behaviors.duplicateRemoval,
                ...customization.behaviors?.duplicateRemoval,
            },
            validation: {
                ...LEGACY_DEFAULT_CUSTOMIZATION.behaviors.validation,
                ...customization.behaviors?.validation,
            },
        },
        workflows: customization.workflows ?? LEGACY_DEFAULT_CUSTOMIZATION.workflows,
        menuOrganization: {
            ...LEGACY_DEFAULT_CUSTOMIZATION.menuOrganization,
            ...customization.menuOrganization,
            groupLabels: {
                ...LEGACY_DEFAULT_CUSTOMIZATION.menuOrganization.groupLabels,
                ...customization.menuOrganization?.groupLabels,
            },
        },
    };
}

export function sanitizeContextMenuPins(
    pins: readonly string[] | undefined
): ContextMenuPin[] {
    if (!pins || pins.length === 0) {
        return [];
    }

    const deduped = new Set<ContextMenuPin>();
    for (const pin of pins) {
        if (PINNABLE_ACTIONS.includes(pin as ContextMenuPin)) {
            deduped.add(pin as ContextMenuPin);
        }
        if (deduped.size >= 2) {
            break;
        }
    }
    return Array.from(deduped);
}

export function getPresetDefaults(preset: UIPreset): Omit<UIConfig, 'preset'> {
    return DEFAULT_UI_PRESETS[preset];
}

export function resolveUiConfig(input: Partial<UIConfig> | undefined): UIConfig {
    const preset = input?.preset ?? DEFAULT_CONFIG.ui.preset;
    const presetDefaults = getPresetDefaults(preset);

    return {
        preset,
        contextMenuPins: sanitizeContextMenuPins(
            input?.contextMenuPins ?? presetDefaults.contextMenuPins
        ),
        showCommandCenterInContextMenu:
            input?.showCommandCenterInContextMenu ??
            presetDefaults.showCommandCenterInContextMenu,
    };
}

export function migrateLegacyFeatureVisibilityToUi(
    featureVisibility?: Partial<FeatureVisibilityConfig>
): UIConfig {
    const legacy = mergeLegacyCustomization({
        featureVisibility: featureVisibility as FeatureVisibilityConfig | undefined,
    }).featureVisibility;
    const derivedPins: ContextMenuPin[] = [];

    if (legacy.history) {
        derivedPins.push('history');
    }
    if (legacy.advanced.removeDuplicates) {
        derivedPins.push('removeDuplicates');
    }
    if (legacy.advanced.officialReport) {
        derivedPins.push('officialReport');
    }

    const pins = sanitizeContextMenuPins(derivedPins);
    const preset: UIPreset = legacy.advancedMenu || derivedPins.length > 2
        ? 'power'
        : pins.length > 0
            ? 'review'
            : 'minimal';

    return resolveUiConfig({
        preset,
        contextMenuPins: pins,
        showCommandCenterInContextMenu: legacy.advancedMenu,
    });
}

export function migrateLegacyKeyHandling(
    officialKeyPolicy: OfficialKeyPolicy | undefined,
    behavior?: Partial<KeyReplacementBehavior>
): KeyHandlingConfig {
    const resolvedBehavior = {
        ...LEGACY_DEFAULT_CUSTOMIZATION.behaviors.keyReplacement,
        ...behavior,
    };
    const policy = officialKeyPolicy ?? 'officialAlways';

    if (resolvedBehavior.mode === 'keep-and-comment-official') {
        return {
            mode: 'preserve-and-comment-official',
            commentPrefix: resolvedBehavior.commentPrefix || '% official_key:',
        };
    }

    if (resolvedBehavior.mode === 'keep-only') {
        return {
            mode: 'preserve',
            commentPrefix: resolvedBehavior.commentPrefix || DEFAULT_CONFIG.keyHandling.commentPrefix,
        };
    }

    if (policy === 'preserve') {
        return {
            mode: resolvedBehavior.mode === 'replace-and-comment-old'
                ? 'preserve-and-comment-official'
                : 'preserve',
            commentPrefix: resolvedBehavior.mode === 'replace-and-comment-old'
                ? '% official_key:'
                : resolvedBehavior.commentPrefix || DEFAULT_CONFIG.keyHandling.commentPrefix,
        };
    }

    const isCommenting = resolvedBehavior.mode === 'replace-and-comment-old';
    const mode: KeyHandlingMode = policy === 'officialWhenUnused'
        ? (isCommenting ? 'replace-safe-and-comment-old' : 'replace-safe')
        : (isCommenting ? 'replace-always-and-comment-old' : 'replace-always');

    return {
        mode,
        commentPrefix: resolvedBehavior.commentPrefix || DEFAULT_CONFIG.keyHandling.commentPrefix,
    };
}

export function migrateLegacyConfig(input: LegacyConfigInput | undefined): MigratedConfigSlice {
    const customization = mergeLegacyCustomization(input?.customization);

    return {
        ui: migrateLegacyFeatureVisibilityToUi(customization.featureVisibility),
        keyHandling: migrateLegacyKeyHandling(
            input?.officialKeyPolicy,
            customization.behaviors.keyReplacement
        ),
        quality: {
            validateOnSave: customization.behaviors.validation.validateOnSave,
            showInlineDecorations: customization.behaviors.validation.showInlineDecorations,
        },
        cleanup: {
            duplicateKeepStrategy: customization.behaviors.duplicateRemoval.keepStrategy,
        },
        experimental: {
            workflows: customization.workflows ?? [],
        },
    };
}
