import { HASHES } from "./index.js";
import { Settings } from "./model/settings.js";
import { Store } from "./model/store.js";
import { SeriesStorageManager } from "./model/series.js";
import { Overview } from "./view/overview.js";
import { EditForm } from "./view/edit-form.js";

export const VIEWS = {
    overview: "overview",
    editForm: "edit-form"
}

export class Popup {
    constructor() {
        console.log("App started!");

        this.currentView = null;
        this.viewOverview = new Overview();
        this.viewEditForm = new EditForm();

        let settings = new Settings();
        let store = new Store();

        Promise.all([settings.fetch(), store.fetch()]).then(() => {
            window.settings = settings;
            window.store = store;

            let seriesStorageManager = new SeriesStorageManager(settings.useCloud);
            seriesStorageManager.fetch().then(() => {
                window.seriesMap = seriesStorageManager.get();
                window.location.hash = HASHES.overview;
            });
        });
    }

    navigate(view) {
        switch (view) {
            case VIEWS.overview:
                this.currentView?.unmount();
                this.viewOverview.mount();
                this.currentView = this.viewOverview;
                break;
            case VIEWS.editForm:
                this.currentView?.unmount();
                this.viewEditForm.mount();
                this.currentView = this.viewEditForm;
                break;
        };
    }
}
