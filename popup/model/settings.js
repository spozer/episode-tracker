
const SETTINGS_KEY = "settings";

export class Settings {
    useCloud = false;

    fetch() {
        return browser.storage.sync.get(SETTINGS_KEY).then(data => Object.assign(this, data.settings));
    }

    save() {
        return browser.storage.sync.set({ [SETTINGS_KEY]: this });
    }
}