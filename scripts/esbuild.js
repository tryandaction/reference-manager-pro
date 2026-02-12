const esbuild = require('esbuild');

const isWatch = process.argv.includes('--watch');

const buildOptions = {
    entryPoints: ['src/extension.ts'],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node16',
    outfile: 'out/extension.js',
    sourcemap: true,
    external: ['vscode'],
    logLevel: 'info',
    tsconfig: 'tsconfig.json',
};

async function run() {
    if (isWatch) {
        const ctx = await esbuild.context(buildOptions);
        await ctx.watch();
        return;
    }

    await esbuild.build(buildOptions);
}

run().catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
});
