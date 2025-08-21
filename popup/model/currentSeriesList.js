import { FilterContext } from "./filter.js";
import { SortContext } from "./sort.js";

export class CurrentSeriesList {

    constructor() {
        this.filterContext = new FilterContext();
        this.sortContext = new SortContext();
    }

    *[Symbol.iterator]() {
        this.filterContext.set(window.store.filter);
        this.sortContext.set(window.store.sort);

        let currentList = this.filterContext.filter([...window.seriesMap.keys()]);
        this.sortContext.sort(currentList, window.store.sortReversed);

        for (const id of currentList) {
            yield [id, window.seriesMap.get(id)];
        }
    }
}
