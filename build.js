import * as fsPromises from 'node:fs/promises';
import * as process from 'node:process';
import * as esbuild from 'esbuild';

const logLevel = 'info';
const outdir = 'dist';

// An esbuild plugin that rewrites module specifiers for the external modules.
const resolveExternalModules = {
    name: 'resolveExternalModules',
    setup(build) {
        build.onResolve({ filter: /^[^.]/ }, async (args) => {
            switch (args.path) {
                case 'np2-wasm': return { path: './lib/np2-wasm.js', external: true };
                case 'js-fatfs': return { path: './lib/fatfs.js', external: true };
                case '@irori/idbfs': return { path: './lib/idbfs.js', external: true };
            }
        })
    },
}

async function installExternalModules() {
    await fsPromises.mkdir('dist/lib', { recursive: true });
    return Promise.all([
        fsPromises.copyFile('node_modules/np2-wasm/dist/np2-wasm.js', 'dist/lib/np2-wasm.js'),
        fsPromises.copyFile('node_modules/np2-wasm/dist/np2.js', 'dist/lib/np2.js'),
        fsPromises.copyFile('node_modules/np2-wasm/dist/np2.wasm', 'dist/lib/np2.wasm'),
        fsPromises.copyFile('node_modules/np2-wasm/dist/font.bmp', 'dist/lib/font.bmp'),
        fsPromises.copyFile('node_modules/js-fatfs/dist/fatfs.js', 'dist/lib/fatfs.js'),
        fsPromises.copyFile('node_modules/js-fatfs/dist/fatfs.wasm', 'dist/lib/fatfs.wasm'),
        fsPromises.copyFile('node_modules/@irori/idbfs/idbfs.js', 'dist/lib/idbfs.js'),
        // Add .bmp extension to enable content-encoding:gzip in GitHub pages.
        fsPromises.copyFile('assets/12mb.nhd', 'dist/12mb.nhd.bmp'),
    ]);
}

const configs = [
    {
        entryPoints: ['src/patton.ts'],
        plugins: [resolveExternalModules],
        loader: {
            '.BAT': 'binary',
            '.SYS': 'binary',
        },
        bundle: true,
        minify: true,
        format: 'esm',
        target: ['es2017'],
        outdir,
        sourcemap: true,
        logLevel,
    },
];

for (const config of configs) {
    if (process.argv[2] === '--watch') {
        (await esbuild.context(config)).watch();
    } else {
        esbuild.build(config);
    }
}

await installExternalModules();
