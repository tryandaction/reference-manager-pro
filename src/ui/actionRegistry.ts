import {
    ContextMenuPin,
    ExperimentalConfig,
    UIConfig,
} from '../configurationModel';

export type CommandCenterGroup =
    | '我的常用'
    | '更多修复方式'
    | '更多清理与检查'
    | '历史与恢复'
    | '实验功能';

export type CommandCenterActionId =
    | 'entryMoreModes'
    | 'fileMoreModes'
    | 'officialReport'
    | 'removeDuplicates'
    | 'history'
    | 'experimentalWorkflows';

export interface ActionRegistryContext {
    isBibtexEditor: boolean;
    hasWorkspace: boolean;
    hasHistory: boolean;
    isPro: boolean;
    ui: UIConfig;
    experimental: ExperimentalConfig;
}

export interface CommandCenterAction {
    id: CommandCenterActionId;
    label: string;
    description: string;
    group: CommandCenterGroup;
    pinnedKey?: ContextMenuPin;
    proOnly?: boolean;
}

export const COMMAND_CENTER_GROUP_ORDER: CommandCenterGroup[] = [
    '我的常用',
    '更多修复方式',
    '更多清理与检查',
    '历史与恢复',
    '实验功能',
];

const ACTION_DEFINITIONS: CommandCenterAction[] = [
    {
        id: 'entryMoreModes',
        label: '更多单条处理方式',
        description: '官方原始、本地整理、AI 整理',
        group: '更多修复方式',
    },
    {
        id: 'fileMoreModes',
        label: '更多整份文件处理方式',
        description: '官方原始批量、本地批量、AI 批量',
        group: '更多修复方式',
    },
    {
        id: 'officialReport',
        label: '官方数据检查',
        description: '检查 DOI 官方元数据是否可用',
        group: '更多清理与检查',
        pinnedKey: 'officialReport',
    },
    {
        id: 'removeDuplicates',
        label: '清理重复条目',
        description: '检测并移除重复 key/DOI 的条目',
        group: '更多清理与检查',
        pinnedKey: 'removeDuplicates',
        proOnly: true,
    },
    {
        id: 'history',
        label: '查看历史与回滚',
        description: '查看变更记录并恢复',
        group: '历史与恢复',
        pinnedKey: 'history',
    },
    {
        id: 'experimentalWorkflows',
        label: '实验工作流',
        description: '运行或管理实验性质的多步骤工作流',
        group: '实验功能',
    },
];

function isActionAvailable(action: CommandCenterAction, context: ActionRegistryContext): boolean {
    if (action.id === 'history') {
        return context.hasHistory;
    }

    if (action.id === 'experimentalWorkflows') {
        return context.experimental.workflows.length > 0;
    }

    if (action.group === '更多修复方式' || action.group === '更多清理与检查') {
        return context.isBibtexEditor;
    }

    return true;
}

export function getContextMenuPinVisibility(
    pins: readonly ContextMenuPin[]
): Record<ContextMenuPin, boolean> {
    return {
        history: pins.includes('history'),
        removeDuplicates: pins.includes('removeDuplicates'),
        officialReport: pins.includes('officialReport'),
    };
}

export function getCommandCenterActions(
    context: ActionRegistryContext
): CommandCenterAction[] {
    const visible = ACTION_DEFINITIONS.filter(action => isActionAvailable(action, context));
    const pinnedSet = new Set(context.ui.contextMenuPins);
    const pinnedActions = visible.filter(action => action.pinnedKey && pinnedSet.has(action.pinnedKey));
    const unpinnedActions = visible.filter(action => !action.pinnedKey || !pinnedSet.has(action.pinnedKey));

    return [...pinnedActions, ...unpinnedActions];
}

export function groupCommandCenterActions(
    context: ActionRegistryContext
): Map<CommandCenterGroup, CommandCenterAction[]> {
    const grouped = new Map<CommandCenterGroup, CommandCenterAction[]>();
    for (const group of COMMAND_CENTER_GROUP_ORDER) {
        grouped.set(group, []);
    }

    for (const action of getCommandCenterActions(context)) {
        const effectiveGroup: CommandCenterGroup =
            action.pinnedKey && context.ui.contextMenuPins.includes(action.pinnedKey)
                ? '我的常用'
                : action.group;

        grouped.get(effectiveGroup)?.push(action);
    }

    return grouped;
}
