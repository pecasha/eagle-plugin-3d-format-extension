import { EventEmitter } from "node:events";
import { setTimeout } from "node:timers/promises";

export default class extends EventEmitter {
    constructor() {
        super();
    }

    #pluginInitialized = false;
    public async pluginInitialization(): Promise<boolean> {
        if(this.#pluginInitialized) {
            return true;
        }
        await setTimeout(50);
        if(i18next.t("manifest.app.name")) {
            this.#pluginInitialized = true;
            return true;
        }
        return await this.pluginInitialization();
    }
}
