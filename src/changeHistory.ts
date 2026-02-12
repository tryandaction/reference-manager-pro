/**
 * changeHistory.ts - 变更记录与回滚
 *
 * 职责：记录用户发起的自动修改，并支持回滚
 */

import * as vscode from 'vscode';

export interface ChangeRecord {
    id: string;
    label: string;
    timestamp: string;
    uri: string;
    before: string;
    after: string;
    source?: 'local' | 'ai' | 'official' | 'system';
    confidence?: number | null;
}

const HISTORY_KEY = 'referenceManager.changeHistory';
const MAX_RECORDS = 20;

export class ChangeHistory {
    private records: ChangeRecord[] = [];

    constructor(private readonly context: vscode.ExtensionContext) {
        this.records = this.context.globalState.get<ChangeRecord[]>(HISTORY_KEY, []);
    }

    list(): ChangeRecord[] {
        return [...this.records];
    }

    add(record: ChangeRecord): void {
        this.records.unshift(record);
        if (this.records.length > MAX_RECORDS) {
            this.records = this.records.slice(0, MAX_RECORDS);
        }
        void this.context.globalState.update(HISTORY_KEY, this.records);
    }

    async restore(record: ChangeRecord): Promise<void> {
        const uri = vscode.Uri.parse(record.uri);
        const document = await vscode.workspace.openTextDocument(uri);
        const edit = new vscode.WorkspaceEdit();
        const fullRange = new vscode.Range(0, 0, document.lineCount, 0);
        edit.replace(uri, fullRange, record.before);
        await vscode.workspace.applyEdit(edit);
    }
}
