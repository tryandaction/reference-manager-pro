import * as vscode from 'vscode';
import { ExperimentalConfig } from '../configurationModel';
import {
    ActionRegistryContext,
    CommandCenterActionId,
    COMMAND_CENTER_GROUP_ORDER,
    groupCommandCenterActions,
} from './actionRegistry';

export interface CommandCenterDependencies {
    executeCommand(commandId: string): Thenable<unknown>;
}

interface QuickPickActionItem extends vscode.QuickPickItem {
    actionId: CommandCenterActionId;
}

interface SecondaryCommandChoice {
    label: string;
    description: string;
    commandId: string;
}

export function buildSecondaryChoices(
    actionId: CommandCenterActionId,
    experimental: ExperimentalConfig
): SecondaryCommandChoice[] {
    if (actionId === 'entryMoreModes') {
        return [
            {
                label: '官方原始模式',
                description: '保留官方 BibTeX 原始排版',
                commandId: 'referenceManager.internal.smartFixEntryRaw',
            },
            {
                label: '本地单条整理',
                description: '完全离线的单条处理',
                commandId: 'referenceManager.formatEntryLocal',
            },
            {
                label: 'AI 单条整理',
                description: '强制使用 AI 处理当前条目',
                commandId: 'referenceManager.formatEntry',
            },
        ];
    }

    if (actionId === 'fileMoreModes') {
        return [
            {
                label: '官方原始批量',
                description: '批量保留官方原始格式',
                commandId: 'referenceManager.internal.smartFixFileRaw',
            },
            {
                label: '本地批量整理',
                description: '完全离线的整文件处理',
                commandId: 'referenceManager.formatAllEntriesLocal',
            },
            {
                label: 'AI 批量整理',
                description: 'Pro 批量 AI 处理',
                commandId: 'referenceManager.formatAllEntries',
            },
        ];
    }

    if (actionId === 'experimentalWorkflows' && experimental.workflows.length > 0) {
        return [
            {
                label: '打开实验工作流',
                description: '运行或管理实验工作流',
                commandId: 'referenceManager.manageWorkflows',
            },
        ];
    }

    return [];
}

function getDirectCommandId(actionId: CommandCenterActionId): string | null {
    switch (actionId) {
        case 'history':
            return 'referenceManager.showHistory';
        case 'removeDuplicates':
            return 'referenceManager.removeDuplicates';
        case 'officialReport':
            return 'referenceManager.officialReport';
        default:
            return null;
    }
}

export function buildCommandCenterItems(
    context: ActionRegistryContext
): Array<vscode.QuickPickItem | QuickPickActionItem> {
    const items: Array<vscode.QuickPickItem | QuickPickActionItem> = [];
    const grouped = groupCommandCenterActions(context);

    for (const group of COMMAND_CENTER_GROUP_ORDER) {
        const actions = grouped.get(group) ?? [];
        if (actions.length === 0) {
            continue;
        }

        items.push({
            label: group,
            kind: vscode.QuickPickItemKind.Separator,
        });

        for (const action of actions) {
            items.push({
                label: action.label,
                description: action.proOnly && !context.isPro ? 'Pro' : action.description,
                detail: action.proOnly && !context.isPro
                    ? `${action.description} · 当前为免费版，按现有逻辑可能触发升级提示`
                    : undefined,
                actionId: action.id,
            });
        }
    }

    return items;
}

export async function openCommandCenter(
    context: ActionRegistryContext,
    dependencies: CommandCenterDependencies
): Promise<void> {
    const selected = await vscode.window.showQuickPick(buildCommandCenterItems(context), {
        placeHolder: '更多工具',
        matchOnDescription: true,
        matchOnDetail: true,
    });

    if (!selected || !('actionId' in selected)) {
        return;
    }

    const directCommandId = getDirectCommandId(selected.actionId);
    if (directCommandId) {
        await dependencies.executeCommand(directCommandId);
        return;
    }

    const variants = buildSecondaryChoices(selected.actionId, context.experimental);
    if (variants.length === 0) {
        return;
    }

    if (variants.length === 1) {
        await dependencies.executeCommand(variants[0]!.commandId);
        return;
    }

    const variant = await vscode.window.showQuickPick(
        variants.map(choice => ({
            label: choice.label,
            description: choice.description,
            commandId: choice.commandId,
        })),
        {
            placeHolder: `选择 ${selected.label} 的执行模式`,
            matchOnDescription: true,
        }
    );

    if (!variant) {
        return;
    }

    await dependencies.executeCommand(variant.commandId);
}
