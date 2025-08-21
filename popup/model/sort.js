
export const SortType = {
    Title: 'title',
    DateModified: 'date-modified',
    DateCreated: 'date-created'
};

export class SortContext {
    set(type) {
        switch (type) {
            case SortType.Title:
                this.strategy = new TitleSortImplementation();
                break;
            case SortType.DateModified:
                this.strategy = new DateModifiedSortImplementation();
                break;
            case SortType.DateCreated:
                this.strategy = new DateCreatedSortImplementation();
        }
    }

    sort(ids, reverse) {
        this.strategy.apply(ids, reverse);
    }
}


// interface
class SortImplementation {
    apply(ids, reverse) { }
}

class TitleSortImplementation extends SortImplementation {
    apply(ids, reverse) {
        ids.sort((idA, idB) => {
            const titleA = window.seriesMap.get(idA).title.toLowerCase();
            const titleB = window.seriesMap.get(idB).title.toLowerCase();
            return titleA > titleB ^ reverse;
        });
    }
}

class DateModifiedSortImplementation extends SortImplementation {
    apply(ids, reverse) {
        ids.sort((idA, idB) => {
            const dateA = window.seriesMap.get(idA).dateModified
            const dateB = window.seriesMap.get(idB).dateModified
            return dateA < dateB ^ reverse;
        });
    }
}

class DateCreatedSortImplementation extends SortImplementation {
    apply(ids, reverse) {
        ids.sort((idA, idB) => {
            const dateA = window.seriesMap.get(idA).DateCreated
            const dateB = window.seriesMap.get(idB).DateCreated
            return dateA < dateB ^ reverse;
        });
    }
}
