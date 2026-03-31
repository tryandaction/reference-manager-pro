import { KeyHandlingConfig, KeyHandlingMode } from './configurationModel';

export interface KeyHandlingDecision {
    finalKey: string;
    useOfficialKey: boolean;
    reason?: string;
    commentType: 'none' | 'old' | 'official';
}

export interface ResolveKeyHandlingOptions {
    existingKeys?: Set<string>;
    usedKeys?: Set<string>;
}

function replaceEntryKeyRaw(entryText: string, newKey: string): string {
    const entryStart = /^(\s*@\w+\s*\{)\s*[^,\s]+(\s*,)/m;
    if (!entryStart.test(entryText)) {
        return entryText;
    }
    return entryText.replace(entryStart, `$1${newKey}$2`);
}

function appendInlineComment(entryText: string, value: string, prefix: string): string {
    const lines = entryText.split('\n');
    const firstLine = lines[0];
    if (!firstLine) {
        return entryText;
    }
    if (firstLine.includes(prefix)) {
        return entryText;
    }
    lines[0] = `${firstLine} ${prefix} ${value}`;
    return lines.join('\n');
}

function modeUsesOfficialSafely(mode: KeyHandlingMode): boolean {
    return mode === 'replace-safe' || mode === 'replace-safe-and-comment-old';
}

function modeUsesOfficialAlways(mode: KeyHandlingMode): boolean {
    return mode === 'replace-always' || mode === 'replace-always-and-comment-old';
}

export function keyHandlingNeedsWorkspaceScan(mode: KeyHandlingMode): boolean {
    return modeUsesOfficialSafely(mode);
}

export function resolveKeyHandlingDecision(
    keyHandling: KeyHandlingConfig,
    originalKey: string,
    officialKey: string,
    options: ResolveKeyHandlingOptions = {}
): KeyHandlingDecision {
    if (!originalKey || !officialKey || originalKey === officialKey) {
        return {
            finalKey: originalKey || officialKey,
            useOfficialKey: false,
            commentType: 'none',
        };
    }

    const { mode } = keyHandling;
    const existingKeys = options.existingKeys;
    const usedKeys = options.usedKeys;
    const hasCollision = Boolean(existingKeys?.has(officialKey) && officialKey !== originalKey);

    if (hasCollision) {
        return {
            finalKey: originalKey,
            useOfficialKey: false,
            reason: '官方 key 与现有条目冲突',
            commentType: mode === 'preserve-and-comment-official' ? 'official' : 'none',
        };
    }

    if (mode === 'preserve' || mode === 'preserve-and-comment-official') {
        return {
            finalKey: originalKey,
            useOfficialKey: false,
            reason: '保持原引用 key',
            commentType: mode === 'preserve-and-comment-official' ? 'official' : 'none',
        };
    }

    if (modeUsesOfficialSafely(mode)) {
        if (!usedKeys) {
            return {
                finalKey: originalKey,
                useOfficialKey: false,
                reason: '未检测到工作区，安全模式下保留原 key',
                commentType: 'none',
            };
        }

        if (usedKeys.has(originalKey)) {
            return {
                finalKey: originalKey,
                useOfficialKey: false,
                reason: '原 key 已在 .tex 中使用',
                commentType: 'none',
            };
        }
    }

    if (modeUsesOfficialAlways(mode) || modeUsesOfficialSafely(mode)) {
        return {
            finalKey: officialKey,
            useOfficialKey: true,
            commentType: mode.endsWith('comment-old') ? 'old' : 'none',
        };
    }

    return {
        finalKey: originalKey,
        useOfficialKey: false,
        commentType: 'none',
    };
}

export function applyKeyHandlingToEntry(
    entryText: string,
    keyHandling: KeyHandlingConfig,
    originalKey: string,
    officialKey: string,
    decision: KeyHandlingDecision
): string {
    let nextText = entryText;

    if (decision.finalKey && decision.finalKey !== originalKey) {
        nextText = replaceEntryKeyRaw(nextText, decision.finalKey);
    }

    if (decision.commentType === 'old') {
        return appendInlineComment(nextText, originalKey, keyHandling.commentPrefix);
    }

    if (decision.commentType === 'official') {
        return appendInlineComment(nextText, officialKey, keyHandling.commentPrefix);
    }

    return nextText;
}
