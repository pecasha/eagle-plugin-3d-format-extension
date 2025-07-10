import type Base from "./base";

export default class {
    #base: Base;

    constructor(base: Base) {
        this.#base = base;
    }

    public async get(key: string) {
        await this.#base.pluginInitialization();
        return i18next.t(key);
    }
}
