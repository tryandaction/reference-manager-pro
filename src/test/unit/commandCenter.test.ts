import { describe, expect, it, vi } from 'vitest';

vi.mock('vscode', () => ({
    QuickPickItemKind: {
        Separator: -1,
    },
    window: {},
}));

import { buildCommandCenterItems, buildSecondaryChoices } from '../../ui/commandCenter';

describe('commandCenter', () => {
    it('builds more entry mode variants', () => {
        const choices = buildSecondaryChoices('entryMoreModes', { workflows: [] });
        expect(choices.map(choice => choice.commandId)).toEqual([
            'referenceManager.internal.smartFixEntryRaw',
            'referenceManager.formatEntryLocal',
            'referenceManager.formatEntry',
        ]);
    });

    it('builds grouped quick pick items with separators', () => {
        const items = buildCommandCenterItems({
            isBibtexEditor: true,
            hasWorkspace: true,
            hasHistory: true,
            isPro: false,
            ui: {
                preset: 'review',
                contextMenuPins: ['history'],
                showCommandCenterInContextMenu: true,
            },
            experimental: {
                workflows: [],
            },
        });

        expect(items.some(item => item.label === '我的常用')).toBe(true);
        expect(items.some(item => item.label === '更多单条处理方式')).toBe(true);
    });
});
