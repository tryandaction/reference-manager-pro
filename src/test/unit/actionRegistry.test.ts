import { describe, expect, it } from 'vitest';
import { groupCommandCenterActions } from '../../ui/actionRegistry';

describe('actionRegistry', () => {
    it('promotes pinned actions into the pinned group', () => {
        const grouped = groupCommandCenterActions({
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

        expect(grouped.get('我的常用')?.map(item => item.id)).toEqual(['history']);
        expect(grouped.get('更多修复方式')?.map(item => item.id)).toEqual(['entryMoreModes', 'fileMoreModes']);
    });

    it('hides history and experimental groups when unavailable', () => {
        const grouped = groupCommandCenterActions({
            isBibtexEditor: true,
            hasWorkspace: false,
            hasHistory: false,
            isPro: false,
            ui: {
                preset: 'minimal',
                contextMenuPins: [],
                showCommandCenterInContextMenu: false,
            },
            experimental: {
                workflows: [],
            },
        });

        expect(grouped.get('历史与恢复')).toEqual([]);
        expect(grouped.get('实验功能')).toEqual([]);
    });
});
