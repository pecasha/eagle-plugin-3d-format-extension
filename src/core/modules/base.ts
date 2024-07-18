import Observer from "./observer";
import I18n from "./i18n";

export default class extends Observer {
    public i18n: I18n;

    constructor() {
        super();
        this.i18n = new I18n(this);
    }
}
