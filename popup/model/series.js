import { StorageFactory, StorageType } from "../utils/storage.js";
import { generateSimpleId } from "../utils/helpers.js";

// per key, according https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage/sync#storage_quotas_for_sync_data
const MAX_BYTES = 8100;
// can't be more then floor(102400 / 8100) = 12 keys
const SERIES_SYNC_KEYS = [
    "series_sync_1",
    "series_sync_2",
    "series_sync_3",
    "series_sync_4",
    "series_sync_5",
    "series_sync_6",
    "series_sync_7",
    "series_sync_8",
    "series_sync_9",
    "series_sync_10"
];

const SERIES_KEY = "series";
export const LAST_SERIES_CHANGE = "lastSeriesChange";

export class SeriesStorageManager {
    constructor(useCloud) {
        this.storage = StorageFactory.create(useCloud ? StorageType.Sync : StorageType.Local);
        this.seriesMap = new SeriesMap(this);
    }

    setSeriesMap(seriesMap) {
        seriesMap.setStorageManager(this);
        this.seriesMap = seriesMap;
        return this.save();
    }

    setUseCloud(useCloud) {
        const type = useCloud ? StorageType.Sync : StorageType.Local;

        if (type === this.storage.type) {
            return;
        }

        if (useCloud) {
            // clear local storage
            this.storage.remove(SERIES_KEY);
        }

        this.storage = StorageFactory.create(type);
        return this.save();
    }

    fetch() {
        return this.storage.get((this.storage.type === StorageType.Local) ? SERIES_KEY : SERIES_SYNC_KEYS).then(data => {
            for (const key of Object.keys(data)) {
                if (Array.isArray(data)) {
                    // old structure with [ series ]
                    this.loadFromArray(data[key]);
                    this.save();
                } else if (data) {
                    // new structure with { id : series }
                    this.loadFromObject(data[key]);
                }
            }
        })
    }

    loadFromArray(data) {
        // convert to new structure
        for (const object of data) {
            const series = Series.from(object);
            series.dateCreated = series.dateModified;
            this.seriesMap.add(series);
        }
    }

    loadFromObject(data) {
        for (const [id, object] of Object.entries(data)) {
            this.seriesMap.set(id, Series.from(object));
        }
    }

    save() {
        const jsonSeriesMap = this.seriesMap.toJsonObject();

        if (this.storage.type === StorageType.Local) {
            return this.storage.set({
                [SERIES_KEY]: Object.fromEntries(jsonSeriesMap),
                [LAST_SERIES_CHANGE]: new Date().getTime()
            });
        }

        let bytesMap = new Map(jsonSeriesMap.entries().map(entry => {
            const bytes = new TextEncoder().encode(JSON.stringify(entry)).length;
            const [key,] = entry;
            return [key, bytes];
        }));

        let parts = {};
        for (const partKey of SERIES_SYNC_KEYS) {
            parts[partKey] = {};
        }

        let currentBytes = 0;
        let i = 0;
        for (const [key, value] of bytesMap.entries()) {
            if (currentBytes + value > MAX_BYTES) {
                if (++i >= SERIES_SYNC_KEYS.length) {
                    throw new Error("Too many series. Can't fit all in sync storage!");
                }
                currentBytes = 0;
            }
            parts[SERIES_SYNC_KEYS[i]][key] = jsonSeriesMap.get(key);
            currentBytes += value;
        }

        return this.storage.set({
            ...parts,
            [LAST_SERIES_CHANGE]: new Date().getTime()
        });
    }

    get() {
        return this.seriesMap;
    }
}

export class Series {
    title = "";
    season = 0;
    episode = 0;
    completed = false;
    link = "";
    dateModified = new Date();
    dateCreated = new Date();

    static from(object) {
        const series = Object.assign(new Series(), object);
        series.dateModified = new Date(series.dateModified);
        series.dateCreated = new Date(series.dateCreated);
        return series;
    }

    toJsonObject() {
        return {
            ...this,
            dateModified: this.dateModified.getTime(),
            dateCreated: this.dateCreated.getTime()
        };
    }

    isEqualTo(series) {
        return (
            this.title === series.title
            && this.season === series.season
            && this.episode === series.episode
            && this.completed === series.completed
            && this.link === series.link
        );
    }
}

export class SeriesMap extends Map {
    constructor(storageManager) {
        super();
        this.storageManager = storageManager;
    }

    setStorageManager(storageManager) {
        this.storageManager = storageManager;
    }

    add(series) {
        let id;

        do {
            id = generateSimpleId(6); // gives us enough entropy for more than 1000 series
        } while (this.has(id));

        this.set(id, series);
    }

    save() {
        return this.storageManager.save();
    }

    toJsonObject() {
        return new Map(this.entries().map(([key, value]) => {
            return [key, value.toJsonObject()];
        }));
    }
}
