import { FilterType } from "./filter.js";
import { SortType } from "./sort.js";

const STATE_KEY = "store";

export class Store {
    filter = FilterType.All;
    sort = SortType.Title;
    sortReversed = false;

    constructor() {
        return new Proxy(this, {
            set(target, prop, value, receiver) {
                if (target[prop] !== value) {
                    target[prop] = value;
                    receiver.save();
                }
                return true;
            },
        })
    }

    fetch() {
        return browser.storage.local.get(STATE_KEY).then(data => Object.assign(this, data[STATE_KEY]));
    }

    save() {
        return browser.storage.local.set({
            [STATE_KEY]: { ...this }
        });
    }
}
