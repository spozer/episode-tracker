
export const StorageType = {
    Local: 'Local',
    Sync: 'Sync'
}

export class StorageFactory {
    static create(type) {
        switch (type) {
            case StorageType.Local:
                return new LocalStorage();
            case StorageType.Sync:
                return new SyncStorage();
            default:
                return null;
        }
    }
}

export class Storage {
    constructor(type) {
        this.type = type;
    }

    get(keys) { }
    set(object) { }
    remove(keys) { }
}

class LocalStorage extends Storage {
    constructor() {
        super(StorageType.Local);
    }

    get(keys) {
        return browser.storage.local.get(keys);
    }

    set(object) {
        return browser.storage.local.set(object);
    }

    remove(keys) {
        browser.storage.local.remove(keys);
    }
}

class SyncStorage extends Storage {
    constructor() {
        super(StorageType.Sync);
    }

    get(keys) {
        return browser.storage.sync.get(keys);
    }

    set(object) {
        return browser.storage.sync.set(object);
    }

    remove(keys) {
        browser.storage.sync.remove(keys);
    }
}