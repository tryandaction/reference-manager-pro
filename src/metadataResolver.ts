/**
 * metadataResolver.ts - 官方元数据解析（基于 DOI）
 *
 * 职责：通过 DOI 获取官方 BibTeX（无依赖、轻量实现）
 */

import { parseSingleEntry } from './bibParser';
import { ensureFetchSupport } from './fetchPolyfill';

ensureFetchSupport();

export interface OfficialBibtexResult {
    bibtex: string;
    doi: string;
}

function normalizeDoi(raw: string): string {
    return raw
        .trim()
        .replace(/^doi:\s*/i, '')
        .replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')
        .trim();
}

function extractDoiFromUrl(url: string): string | null {
    const match = url.match(/doi\.org\/(.+)$/i);
    if (!match) {
        return null;
    }
    return normalizeDoi(match[1]!);
}

export function extractDoiFromEntryText(entryText: string): string | null {
    const entry = parseSingleEntry(entryText);
    if (!entry) {
        return null;
    }
    if (entry.fields.doi) {
        return normalizeDoi(entry.fields.doi);
    }
    if (entry.fields.url) {
        return extractDoiFromUrl(entry.fields.url);
    }
    return null;
}

async function fetchBibtexFromDoi(doi: string, timeoutMs: number): Promise<string | null> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(`https://doi.org/${encodeURIComponent(doi)}`, {
            headers: {
                'Accept': 'application/x-bibtex; charset=utf-8',
            },
            signal: controller.signal,
        });

        if (!response.ok) {
            return null;
        }

        const text = (await response.text()).trim();
        if (!text.startsWith('@')) {
            return null;
        }
        return text;
    } catch {
        return null;
    } finally {
        clearTimeout(timeoutId);
    }
}

export async function resolveOfficialBibtexFromEntry(
    entryText: string,
    timeoutMs: number
): Promise<OfficialBibtexResult | null> {
    const doi = extractDoiFromEntryText(entryText);
    if (!doi) {
        return null;
    }

    const bibtex = await fetchBibtexFromDoi(doi, timeoutMs);
    if (!bibtex) {
        return null;
    }

    return { bibtex, doi };
}
