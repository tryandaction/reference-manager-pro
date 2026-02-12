import * as cp from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

function findCodeCliPath(): string {
    const candidates = process.platform === 'win32' ? ['code.cmd', 'code'] : ['code'];
    for (const candidate of candidates) {
        const res = cp.spawnSync(process.platform === 'win32' ? 'where' : 'which', [candidate], { encoding: 'utf8', shell: true });
        const first = (res.stdout ?? '').split(/\r?\n/).map(l => l.trim()).filter(Boolean)[0];
        if (res.status === 0 && first) {
            return first;
        }
    }
    return process.platform === 'win32' ? 'code.cmd' : 'code';
}

// 参考 VS Code 官方文档：api/working-with-extensions/testing-extension.md
async function main(): Promise<void> {
    try {
        // out/test/integration -> out/test -> out -> (repo root)
        const extensionDevelopmentPath = path.resolve(__dirname, '../../../');
        const extensionTestsPath = path.resolve(__dirname, './suite/index');

        // 使用本机的 `code` CLI 跑集成测试（避免某些环境下 test-electron 在 Windows 的 shell 引号/空格问题）
        const testRoot = path.join(extensionDevelopmentPath, '.vscode-test');
        const userDataDir = path.join(testRoot, 'user-data');
        const extensionsDir = path.join(testRoot, 'extensions');
        fs.mkdirSync(userDataDir, { recursive: true });
        fs.mkdirSync(extensionsDir, { recursive: true });

        const args = [
            '--extensionDevelopmentPath', extensionDevelopmentPath,
            '--extensionTestsPath', extensionTestsPath,
            '--user-data-dir', userDataDir,
            '--extensions-dir', extensionsDir,
            '--disable-workspace-trust',
            '--skip-welcome',
            '--skip-release-notes',
        ];

        await new Promise<void>((resolve, reject) => {
            const codeCliPath = findCodeCliPath();

            // Windows: 通过 PowerShell 执行，避免 cmd.exe 对带空格路径的解析陷阱
            if (process.platform === 'win32') {
                const psEsc = (s: string) => s.replace(/`/g, '``').replace(/"/g, '`"');
                const quotedArgs = args.map(a => `"${psEsc(a)}"`).join(' ');
                const command = `& "${psEsc(codeCliPath)}" ${quotedArgs}`;

                const proc = cp.spawn('powershell.exe', ['-NoProfile', '-Command', command], { stdio: 'inherit', shell: false });
                proc.on('error', reject);
                proc.on('exit', (code) => {
                    if (code === 0) {
                        resolve();
                    } else {
                        reject(new Error(`VS Code test run failed with exit code ${code}`));
                    }
                });
                return;
            }

            const proc = cp.spawn(codeCliPath, args, { stdio: 'inherit', shell: false });
            proc.on('error', reject);
            proc.on('exit', (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`VS Code test run failed with exit code ${code}`));
                }
            });
        });
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error(err);
        // eslint-disable-next-line no-console
        console.error('Failed to run integration tests');
        process.exit(1);
    }
}

void main();
