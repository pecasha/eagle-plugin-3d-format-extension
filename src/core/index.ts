import PreviewCore, { Options as PreviewCoreOptions } from "@pecasha/3d-preview-core";
import Base from "./modules/base";

export default class extends Base {
    #previewCore = {} as PreviewCore;

    get preview() {
        return this.#previewCore;
    }

    constructor(options: Partial<PreviewCoreOptions>) {
        super();
        this.#previewCore = new PreviewCore(options);
    }
}
