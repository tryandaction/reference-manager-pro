import * as assert from 'assert';
import * as vscode from 'vscode';

async function activateExtension(): Promise<void> {
    const candidates = [
        'ei.reference-manager-pro',
        'EI.reference-manager-pro',
    ];

    for (const id of candidates) {
        const ext = vscode.extensions.getExtension(id);
        if (ext) {
            await ext.activate();
            return;
        }
    }

    throw new Error(`Extension not found. Tried: ${candidates.join(', ')}`);
}

function selectAll(editor: vscode.TextEditor): void {
    const doc = editor.document;
    const start = doc.positionAt(0);
    const end = doc.positionAt(doc.getText().length);
    editor.selection = new vscode.Selection(start, end);
}

suite('Reference Manager Pro (integration smoke)', () => {
    test('formatAllEntriesLocal rewrites the whole bib file', async () => {
        await activateExtension();

        const input = `@article{key2023,
  title={Test Title},
  author={John Doe},
  pages={1-10},
  doi={https://doi.org/10.1234/TEST},
  year={2023}
}

@inproceedings{key2024,
  title={Another Title},
  author={Alice Smith and Bob Jones},
  year={2024}
}`;

        const doc = await vscode.workspace.openTextDocument({ language: 'bibtex', content: input });
        const editor = await vscode.window.showTextDocument(doc);
        // 不选中也能跑全量
        await vscode.commands.executeCommand('referenceManager.formatAllEntriesLocal');

        const out = editor.document.getText();
        assert.ok(out.includes('author = {Doe, John}'));
        assert.ok(out.includes('pages = {1--10}'));
        assert.ok(out.includes('doi = {10.1234/test}'));
        assert.ok(out.includes('author = {Smith, Alice and Jones, Bob}'));
    });

    test('formatEntryLocal rewrites the selected entry', async () => {
        await activateExtension();

        const input = `@article{key2023,
  title={Test Title},
  author={John Doe},
  pages={1-10},
  doi={https://doi.org/10.1234/TEST},
  year={2023}
}`;

        const doc = await vscode.workspace.openTextDocument({ language: 'bibtex', content: input });
        const editor = await vscode.window.showTextDocument(doc);
        selectAll(editor);

        await vscode.commands.executeCommand('referenceManager.formatEntryLocal');

        const out = editor.document.getText();
        assert.ok(out.includes('author = {Doe, John}'));
        assert.ok(out.includes('pages = {1--10}'));
        assert.ok(out.includes('doi = {10.1234/test}'));
        assert.ok(out.includes('year = {2023}'));
    });

    test('formatEntryLocal works without selection when cursor is inside an entry', async () => {
        await activateExtension();

        const input = `@article{key2023,
  title={Test Title},
  author={John Doe},
  year={2023}
}`;

        const doc = await vscode.workspace.openTextDocument({ language: 'bibtex', content: input });
        const editor = await vscode.window.showTextDocument(doc);

        // 光标放在 author 行中间，不选中
        const pos = editor.document.positionAt(editor.document.getText().indexOf('author'));
        editor.selection = new vscode.Selection(pos, pos);

        await vscode.commands.executeCommand('referenceManager.formatEntryLocal');

        const out = editor.document.getText();
        assert.ok(out.includes('author = {Doe, John}'));
    });

    test('formatEntry (AI) works with mocked fetch and produces normalized output', async () => {
        await activateExtension();

        const cfg = vscode.workspace.getConfiguration('referenceManager');
        await cfg.update('aiProvider', 'groq', vscode.ConfigurationTarget.Global);
        await cfg.update('groqApiKey', 'gsk_' + 'x'.repeat(40), vscode.ConfigurationTarget.Global);
        await cfg.update('maxRetries', 1, vscode.ConfigurationTarget.Global);
        await cfg.update('timeout', 5_000, vscode.ConfigurationTarget.Global);

        const originalFetch = globalThis.fetch;
        globalThis.fetch = (async () => {
            return {
                ok: true,
                status: 200,
                text: async () => '',
                json: async () => ({
                    choices: [
                        {
                            message: {
                                // 故意返回“脏”格式，验证 normalizeFormattedEntry 会二次规范
                                content: `@article{key2024,\n title={A Title},\n author={Alice Smith and Bob Jones},\n pages={12-34},\n year={2024}\n}`
                            }
                        }
                    ]
                })
            } as unknown as Response;
        }) as typeof fetch;

        try {
            const doc = await vscode.workspace.openTextDocument({
                language: 'bibtex',
                content: `@article{key2024, title={x}, author={Alice Smith and Bob Jones}, year={2024}}`,
            });
            const editor = await vscode.window.showTextDocument(doc);
            selectAll(editor);

            await vscode.commands.executeCommand('referenceManager.formatEntry');

            const out = editor.document.getText();
            assert.ok(out.includes('@article{key2024,'));
            assert.ok(out.includes('author = {Smith, Alice and Jones, Bob}'));
            assert.ok(out.includes('pages = {12--34}'));
            assert.ok(out.includes('year = {2024}'));
        } finally {
            globalThis.fetch = originalFetch;
        }
    });
});
