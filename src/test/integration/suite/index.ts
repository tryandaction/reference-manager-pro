import Mocha from 'mocha';

export function run(): Promise<void> {
    const mocha = new Mocha({
        ui: 'tdd',
        color: true,
        timeout: 60_000,
    });

    // 注册 suite/test 全局函数，并加载测试文件
    mocha.suite.emit('pre-require', globalThis, 'integration', mocha);
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('./smoke.test');

    return new Promise((resolve, reject) => {
        mocha.run((failures: number) => {
            if (failures > 0) {
                reject(new Error(`${failures} integration test(s) failed.`));
            } else {
                resolve();
            }
        });
    });
}
