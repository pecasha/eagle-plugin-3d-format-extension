import PreviewCore, { Options as PreviewCoreOptions } from "@pecasha/3d-preview-core";
import Base from "./modules/base";
import path from "path";
import { Jimp } from "jimp";
export { timestampToCountdown } from "@pomerun/util";
export { machineId } from "machine-id2";

export class Core extends Base {
    #previewCore = {} as PreviewCore;

    get preview() {
        return this.#previewCore;
    }

    constructor(options: Partial<PreviewCoreOptions>) {
        super();
        this.#previewCore = new PreviewCore(options);
    }

    public async screenshot() {
        const blob = await this.#previewCore.screenshot();
        const image = await Jimp.read(Buffer.from(await blob.arrayBuffer()));
        const filePath = path.join(__dirname, "screenshot.png");
        await image.autocrop({
            leaveBorder: 20
        }).write(filePath as any);
        return filePath;
    }
}
