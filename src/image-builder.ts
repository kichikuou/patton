/// <reference types="../assets/assets.d.ts" />
import { IDBFSModule } from '@irori/idbfs';
import * as FatFs from 'js-fatfs';
import config_sys from '../assets/CONFIG.SYS';
import autoexec_bat from '../assets/AUTOEXEC.BAT';

class HDImage implements FatFs.DiskIO {
	private partInfo: PARTINFO;
	private volumeStart: number;

	constructor(
        public image: ArrayBuffer,
        private headerSize: number,
        private sectorSize: number,
        private sectors: number,
        private surfaces: number,
        private cylinders: number)
    {
        // TODO: check the IPL signature
    
        // Read the partition table entry
        this.partInfo = new PARTINFO(image, this.sectorOffset(1));
        this.volumeStart = this.chsToLba(this.partInfo.vostac, this.partInfo.vostah, this.partInfo.vostas);
    }

    initialize(ff: FatFs.FatFs, pdrv: number) {
        return 0;
    }

    status(ff: FatFs.FatFs, pdrv: number) {
        return 0;
    }

    read(ff: FatFs.FatFs, pdrv: number, buff: number, sector: number, count: number) {
        const offset = this.sectorOffset(this.volumeStart + sector);
        const data = new Uint8Array(this.image, offset, this.sectorSize * count);
        ff.HEAPU8.set(data, buff);
    
        if (sector === 0 && count === 1) {
            // Pretend to be a MBR
            ff.HEAPU8[buff + 510] = 0x55;
            ff.HEAPU8[buff + 511] = 0xAA;
        }
        return FatFs.RES_OK;
    }

    write(ff: FatFs.FatFs, pdrv: number, buff: number, sector: number, count: number) {
        const data = new Uint8Array(ff.HEAPU8.buffer, buff, this.sectorSize * count);
        const offset = this.sectorOffset(this.volumeStart + sector);
        new Uint8Array(this.image).set(data, offset);
        return FatFs.RES_OK;
    }

    ioctl(ff: FatFs.FatFs, pdrv: number, cmd: number, buff: number) {
        switch (cmd) {
        case FatFs.CTRL_SYNC:
            return FatFs.RES_OK;
        case FatFs.GET_SECTOR_COUNT:
            const volumeEnd = this.chsToLba(this.partInfo.voendc, this.partInfo.voendh, this.partInfo.voends);
            ff.setValue(buff, volumeEnd - this.volumeStart, 'i32');
            return FatFs.RES_OK;
        case FatFs.GET_SECTOR_SIZE:
            ff.setValue(buff, this.sectorSize, 'i16');
            return FatFs.RES_OK;
        case FatFs.GET_BLOCK_SIZE:
            ff.setValue(buff, 1, 'i32');
            return FatFs.RES_OK;
        default:
            return FatFs.RES_PARERR;
        }
    }

    private chsToLba(c: number, h: number, s: number): number {
		return (c * this.surfaces + h) * this.sectors + s;
	}
	private sectorOffset(sector: number): number {
		return this.headerSize + this.sectorSize * sector;
	}
    private sectorView(sector: number): DataView {
        return new DataView(this.image, this.sectorOffset(sector), this.sectorSize);
    }
}

class PARTINFO {
    private view: DataView;
    constructor(buffer: ArrayBuffer, offset: number) {
        this.view = new DataView(buffer, offset, 32);
    }
    get boot() { return this.view.getUint8(0); }
    get syss() { return this.view.getUint8(1); }
    get sysy() { return this.view.getUint16(2, true); }
    get IPLs() { return this.view.getUint8(4); }
    get IPLh() { return this.view.getUint8(5); }
    get IPLc() { return this.view.getUint16(6, true); }
    get vostas() { return this.view.getUint8(8); }
    get vostah() { return this.view.getUint8(9); }
    get vostac() { return this.view.getUint16(10, true); }
    get voends() { return this.view.getUint8(12); }
    get voendh() { return this.view.getUint8(13); }
    get voendc() { return this.view.getUint16(14, true); }
    // char sysm[16];
};

// T98-Next NHD format

/*
typedef struct {
	char sig[16];
	char comment[0x100];
	DWORD headersize;
	DWORD cylinders;
	WORD surfaces;
	WORD sectors;
	WORD sectorsize;
} __attribute__((packed)) NHDHDR;
*/

class NHD extends HDImage {
    constructor(image: ArrayBuffer) {
        const header = new DataView(image, 16 + 0x100);

        const headersize = header.getUint32(0, true);
        const cylinders = header.getUint32(4, true);
        const surfaces = header.getUint16(8, true);
        const sectors = header.getUint16(10, true);
        const sectorsize = header.getUint16(12, true);
        if (sectorsize < 256 || (sectorsize & sectorsize-1)) {
            throw new Error(`invalid sector size ${sectorsize}`);
        }
        super(image, headersize, sectorsize, sectors, surfaces, cylinders);
    }
}

function check_result(r: number) {
    if (r !== FatFs.FR_OK) throw new Error(`FatFs error: ${r}`);
}

function writeFile(ff: FatFs.FatFs, path: string, contents: Uint8Array) {
	const fp = ff.malloc(FatFs.sizeof_FIL);
	check_result(ff.f_open(fp, path, FatFs.FA_WRITE | FatFs.FA_CREATE_ALWAYS));
    const buf = ff.malloc(contents.byteLength);
    ff.HEAPU8.set(contents, buf);
    const bw = ff.malloc(4);
    check_result(ff.f_write(fp, buf, contents.byteLength, bw));
    if (ff.getValue(bw, 'i32') !== contents.byteLength) {
        throw new Error(`f_read: unexpected write size (${contents.byteLength} expected, got ${ff.getValue(bw, 'i32')})`);
    }
    ff.free(bw);
    ff.free(buf);
	check_result(ff.f_close(fp));
	ff.free(fp);
}

export async function buildHDImage(idbfs: IDBFSModule) {
    const baseImage = await fetch('12mb.nhd');
    const nhd = new NHD(await baseImage.arrayBuffer());
    const ff = await FatFs.create({ diskio: nhd });
    check_result(ff.f_setcp(932));
    check_result(ff.f_mount(ff.malloc(FatFs.sizeof_FATFS), '', 1));

    for (const fname of idbfs.FS.readdir('/patton') as string[]) {
        const path = '/patton/' + fname;
        if (idbfs.FS.isDir(idbfs.FS.stat(path).mode)) {
            continue;
        }
        writeFile(ff, fname, idbfs.FS.readFile(path));
        idbfs.FS.unlink(path);
    }
    writeFile(ff, 'CONFIG.SYS', config_sys);
    writeFile(ff, 'AUTOEXEC.BAT', autoexec_bat);
    check_result(ff.f_unmount(''));
    return nhd.image;
}
