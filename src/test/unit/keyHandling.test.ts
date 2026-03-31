import { describe, expect, it } from 'vitest';
import {
    applyKeyHandlingToEntry,
    resolveKeyHandlingDecision,
} from '../../keyHandling';

describe('keyHandling', () => {
    it('keeps original key in safe mode when the key is already used in tex', () => {
        const decision = resolveKeyHandlingDecision(
            {
                mode: 'replace-safe-and-comment-old',
                commentPrefix: '% oldkey:',
            },
            'oldKey',
            'newKey',
            { usedKeys: new Set(['oldKey']) }
        );

        expect(decision.useOfficialKey).toBe(false);
        expect(decision.finalKey).toBe('oldKey');
    });

    it('replaces key and appends old key comment when safe mode allows it', () => {
        const decision = resolveKeyHandlingDecision(
            {
                mode: 'replace-safe-and-comment-old',
                commentPrefix: '% oldkey:',
            },
            'oldKey',
            'newKey',
            { usedKeys: new Set() }
        );

        const next = applyKeyHandlingToEntry(
            '@article{oldKey,\n  title = {Demo}\n}',
            {
                mode: 'replace-safe-and-comment-old',
                commentPrefix: '% oldkey:',
            },
            'oldKey',
            'newKey',
            decision
        );

        expect(next).toContain('@article{newKey, % oldkey: oldKey');
    });

    it('preserves original key and comments official key when configured', () => {
        const decision = resolveKeyHandlingDecision(
            {
                mode: 'preserve-and-comment-official',
                commentPrefix: '% official_key:',
            },
            'oldKey',
            'newKey'
        );

        const next = applyKeyHandlingToEntry(
            '@article{oldKey,\n  title = {Demo}\n}',
            {
                mode: 'preserve-and-comment-official',
                commentPrefix: '% official_key:',
            },
            'oldKey',
            'newKey',
            decision
        );

        expect(next).toContain('@article{oldKey, % official_key: newKey');
    });
});
