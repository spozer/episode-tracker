
export const FilterType = {
    All: 'all',
    Completed: 'completed',
    Watching: 'watching'
};

export class FilterContext {
    set(type) {
        switch (type) {
            case FilterType.All:
                this.strategy = new AllFilterImplementation();
                break;
            case FilterType.Completed:
                this.strategy = new CompletedFilterImplementation();
                break;
            case FilterType.Watching:
                this.strategy = new WatchingFilterImplementation();
                break;
        }
    }

    filter(ids) {
        return this.strategy.apply(ids);
    }
}

// interface
class FilterImplementation {
    apply(ids) { }
}

class AllFilterImplementation extends FilterImplementation {
    apply(ids) {
        return ids;
    }
}

class CompletedFilterImplementation extends FilterImplementation {
    apply(ids) {
        return ids.filter(id => window.seriesMap.get(id).completed);
    }
}

class WatchingFilterImplementation extends FilterImplementation {
    apply(ids) {
        return ids.filter(id => !window.seriesMap.get(id).completed);
    }
}
