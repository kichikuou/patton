import { NP2 } from 'np2-wasm';
import createFsModule, { IDBFSModule } from '@irori/idbfs';
import { buildHDImage } from './image-builder.js';
import * as zoom from './zoom.js';

const $: (selector: string) => HTMLElement = document.querySelector.bind(document);
const canvas = <HTMLCanvasElement>$('#canvas');

const imageName = 'patton.nhd';

class ImageManager {
    private idbfs!: IDBFSModule;

    private syncfs(populate: boolean): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.idbfs.FS.syncfs(populate, (err: any) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    async loadOrBuild(): Promise<Uint8Array> {
        this.idbfs = await createFsModule();
        this.idbfs.FS.mkdir('/patton');
        this.idbfs.FS.mount(this.idbfs.IDBFS, {}, '/patton');
        await this.syncfs(true);

        try {
            return this.idbfs.FS.readFile('/patton/' + imageName);
        } catch (err) {
            this.idbfs.FS.readFile('/patton/ADISK.PAT');  // throws if it doesn't exist
            const image = new Uint8Array(await buildHDImage(this.idbfs));
            this.persist(image);
            return image;
        }
    }

    persist(image: Uint8Array) {
        this.idbfs.FS.writeFile('/patton/' + imageName, image);
        this.syncfs(false).then(() => console.log('saved'));
    }
}

type Config = { zoom?: string, pixelate?: boolean, unloadConfirmation?: boolean };

class App {
    private np2!: NP2;
    private imageMan = new ImageManager();
    private config: Config = {};

    constructor() {
        const json = localStorage.getItem('KichikuouWeb.Config');
        if (json) {
            this.config = JSON.parse(json);
        }
    }

    async main() {
        const imagePromise = this.imageMan.loadOrBuild();
        this.np2 = await NP2.create({
            canvas,
            clk_mult: 8,
            ExMemory: 1,
            Latencys: 120,
            use_menu: false,
            onDiskChange: this.onDiskChange.bind(this),
            onExit: () => {
                window.onbeforeunload = null;
                history.back();
            },
        });
        this.np2.addDiskImage(imageName, await imagePromise);
        this.np2.setHdd(0, imageName);
        this.np2.run();

        $('#loading').classList.add('loaded');
        $('#canvas').classList.remove('loading');
        zoom.initialize(this.config);
        window.onbeforeunload = this.onBeforeUnload.bind(this);

        const GameTitle = 'にせなぐりまくりたわあ';
        gtag('event', 'GameStart', { GameTitle, event_category: 'Game', event_label: GameTitle });
    }

    private idbSyncTimer = 0;
    private onDiskChange(name: string) {
        window.clearTimeout(this.idbSyncTimer);
        this.idbSyncTimer = window.setTimeout(() => {
            this.imageMan.persist(this.np2.getDiskImage(imageName));
        }, 100);
    }

    private onBeforeUnload(e: BeforeUnloadEvent) {
        if (!this.config.unloadConfirmation) return;
        e.returnValue = 'Unsaved data will be lost.';
        // HACK: Suspend the audio by accessing SDL2's internal structure directly
        // because calling SDL_PauseAudio(1) here is too late.
        const audioContext: AudioContext = (this.np2 as any).module.SDL2.audioContext;
        audioContext.suspend();
        setTimeout(() => audioContext.resume(), 0);
    }
}

function gaException(description: any, fatal: boolean = false) {
    let jsonDescription = JSON.stringify(description, (_, value) => {
        if (value instanceof DOMException) {
            return {DOMException: value.name, message: value.message};
        }
        return value;
    });
    gtag('event', 'exception', { description: jsonDescription, fatal });
}

window.onerror = (message, url, line, column, error) => {
    gaException({type: 'onerror', message, url, line, column}, true);
    window.onerror = null;
};
window.addEventListener('unhandledrejection', (evt: any) => {
    const reason = evt.reason;
    console.log(reason);
    if (reason instanceof Error) {
        let {name, message, stack} = reason;
        gaException({type: 'rejection', name, message, stack}, true);
    } else {
        gaException({type: 'rejection', name: reason.constructor.name, reason}, true);
    }
});

new App().main().catch((err) => {
    console.log(err);
    if (err instanceof Error) {
        let {name, message, stack} = err;
        gaException({type: 'rejection', name, message, stack}, true);
    } else {
        gaException({type: 'rejection', name: err.constructor.name, err}, true);
    }
    location.href = '/';
});
