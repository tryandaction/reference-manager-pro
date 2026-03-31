import * as vscode from 'vscode';
import { parseBibFile, BibEntry } from './bibParser';
import { EntryValidationResult, ValidationIssue, validateEntries } from './metadataValidator';
import { ExtensionConfig } from './configurationModel';

function findIssueRange(
    document: vscode.TextDocument,
    entry: BibEntry,
    issue: ValidationIssue
): vscode.Range {
    if (issue.field && issue.field !== 'key') {
        const fieldPattern = new RegExp(`^\\s*${issue.field}\\s*=`, 'im');
        const match = fieldPattern.exec(entry.rawText);
        if (match && typeof match.index === 'number') {
            const start = document.positionAt(entry.startIndex + match.index);
            const end = document.lineAt(start.line).range.end;
            return new vscode.Range(start, end);
        }
    }

    const start = document.positionAt(entry.startIndex);
    const end = document.lineAt(start.line).range.end;
    return new vscode.Range(start, end);
}

function buildDecorationOptions(
    document: vscode.TextDocument,
    entries: BibEntry[],
    results: EntryValidationResult[],
    severity: 'error' | 'warn'
): vscode.DecorationOptions[] {
    const entryMap = new Map(entries.map(entry => [entry.key, entry]));
    const options: vscode.DecorationOptions[] = [];

    for (const result of results) {
        const entry = entryMap.get(result.key);
        if (!entry) {
            continue;
        }

        for (const issue of result.issues.filter(item => item.severity === severity)) {
            options.push({
                range: findIssueRange(document, entry, issue),
                hoverMessage: new vscode.MarkdownString(`**${issue.code}**\n\n${issue.message}`),
            });
        }
    }

    return options;
}

export class ValidationDecorationsController implements vscode.Disposable {
    private readonly errorDecoration = vscode.window.createTextEditorDecorationType({
        overviewRulerColor: new vscode.ThemeColor('editorError.foreground'),
        overviewRulerLane: vscode.OverviewRulerLane.Right,
        borderWidth: '0 0 1px 0',
        borderStyle: 'solid',
        borderColor: new vscode.ThemeColor('editorError.foreground'),
    });

    private readonly warningDecoration = vscode.window.createTextEditorDecorationType({
        overviewRulerColor: new vscode.ThemeColor('editorWarning.foreground'),
        overviewRulerLane: vscode.OverviewRulerLane.Right,
        borderWidth: '0 0 1px 0',
        borderStyle: 'dashed',
        borderColor: new vscode.ThemeColor('editorWarning.foreground'),
    });

    private refreshTimer: NodeJS.Timeout | null = null;

    update(editor: vscode.TextEditor | undefined, config: ExtensionConfig): void {
        if (!editor || editor.document.languageId !== 'bibtex') {
            this.clear(editor);
            return;
        }

        if (!config.validation.enabled || !config.quality.showInlineDecorations) {
            this.clear(editor);
            return;
        }

        const parsed = parseBibFile(editor.document.getText());
        const results = validateEntries(parsed.entries, config.validation.strictness);

        editor.setDecorations(
            this.errorDecoration,
            buildDecorationOptions(editor.document, parsed.entries, results, 'error')
        );
        editor.setDecorations(
            this.warningDecoration,
            buildDecorationOptions(editor.document, parsed.entries, results, 'warn')
        );
    }

    schedule(editor: vscode.TextEditor | undefined, config: ExtensionConfig, delayMs: number = 200): void {
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
        }
        this.refreshTimer = setTimeout(() => this.update(editor, config), delayMs);
    }

    clear(editor: vscode.TextEditor | undefined): void {
        if (!editor) {
            return;
        }
        editor.setDecorations(this.errorDecoration, []);
        editor.setDecorations(this.warningDecoration, []);
    }

    dispose(): void {
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
        }
        this.errorDecoration.dispose();
        this.warningDecoration.dispose();
    }
}
