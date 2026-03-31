import { describe, expect, it } from 'vitest';
import {
    migrateLegacyConfig,
    migrateLegacyKeyHandling,
    sanitizeContextMenuPins,
} from '../../configurationModel';

describe('configurationModel', () => {
    it('limits context menu pins to 2 valid unique advanced values', () => {
        expect(
            sanitizeContextMenuPins(['validate', 'history', 'removeDuplicates', 'history'])
        ).toEqual(['history', 'removeDuplicates']);
    });

    it('maps legacy feature visibility to preset and pins', () => {
        const migrated = migrateLegacyConfig({
            customization: {
                featureVisibility: {
                    smartFix: true,
                    validate: true,
                    history: false,
                    advancedMenu: false,
                    advanced: {
                        smartFixAll: true,
                        smartFixAllOfficialRaw: false,
                        officialReport: false,
                        removeDuplicates: false,
                        findUnusedCitations: false,
                        formatEntryLocal: false,
                        formatEntryAI: false,
                        smartFixOfficialRaw: false,
                        formatAllEntriesLocal: false,
                        formatAllEntriesAI: false,
                    },
                },
            },
        });

        expect(migrated.ui.preset).toBe('minimal');
        expect(migrated.ui.contextMenuPins).toEqual([]);
    });

    it('maps legacy key policy and key replacement to the unified keyHandling mode', () => {
        expect(
            migrateLegacyKeyHandling('officialWhenUnused', {
                mode: 'replace-and-comment-old',
                commentPrefix: '% oldkey:',
            })
        ).toEqual({
            mode: 'replace-safe-and-comment-old',
            commentPrefix: '% oldkey:',
        });
    });

    it('moves legacy workflows into experimental configuration', () => {
        const migrated = migrateLegacyConfig({
            customization: {
                workflows: [
                    {
                        id: 'optimize-all',
                        name: 'Optimize All',
                        description: 'desc',
                        steps: [],
                        scope: 'file',
                        showInMenu: true,
                    },
                ],
            },
        });

        expect(migrated.experimental.workflows).toHaveLength(1);
        expect(migrated.experimental.workflows[0]?.id).toBe('optimize-all');
    });
});
