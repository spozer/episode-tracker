import { Component } from "./component.js";
import { Series } from "../model/series.js";

export class EditForm extends Component {
    DELETE_TIMEOUT = 1510; //ms
    deleteTimeoutId = null;

    constructor(seriesMap) {
        super();
    }

    mount() {
        if (this.mounted) {
            return;
        }

        this.editForm = document.getElementById("edit-form");
        this.backButton = document.getElementById("back-button");
        this.deleteButton = document.getElementById("delete-button");
        this.applyButton = document.getElementById("apply-button");

        this.seasonDecButton = document.getElementById("season-dec-button");
        this.seasonIncButton = document.getElementById("season-inc-button");
        this.episodeDecButton = document.getElementById("episode-dec-button");
        this.episodeIncButton = document.getElementById("episode-inc-button");

        this.titleInput = document.getElementById("title-input");
        this.seasonInput = document.getElementById("season-input");
        this.episodeInput = document.getElementById("episode-input");
        this.completedSwitch = document.getElementById("completed-switch");
        this.completedInputYes = document.getElementById("completed-yes");
        this.completedInputNo = document.getElementById("completed-no");
        this.linkInput = document.getElementById("link-input");

        this.seriesId = new URLSearchParams(window.location.search).get("id");

        this.editForm.onsubmit = (e) => {
            e.preventDefault();
            this.saveInput();
        };
        this.backButton.onclick = () => this.goBack();
        this.deleteButton.onmousedown = () => {
            this.deleteTimeoutId = setTimeout(() => this.deleteSeries(), this.DELETE_TIMEOUT);
            this.deleteButton.classList.add("active");
        };
        this.deleteButton.onmouseup = this.deleteButton.onmouseleave = () => {
            clearTimeout(this.deleteTimeoutId);
            this.deleteButton.classList.remove("active");
        };
        this.seasonDecButton.onclick = () => this.seasonInput.value--;
        this.seasonIncButton.onclick = () => this.seasonInput.value++;
        this.episodeDecButton.onclick = () => this.episodeInput.value--;
        this.episodeIncButton.onclick = () => this.episodeInput.value++;

        // disable scroll wheel for number input
        this.seasonInput.onwheel = () => false;
        this.episodeInput.onwheel = () => false;

        this.completedInputYes.onclick = () => {
            this.completedSwitch.classList.remove("switch-right");
            this.completedSwitch.classList.add("switch-left");
        };

        this.completedInputNo.onclick = () => {
            this.completedSwitch.classList.remove("switch-left");
            this.completedSwitch.classList.add("switch-right");
        };

        this.render();

        super.mount();
    }

    unmount() {
        if (!this.mounted) {
            return;
        }

        super.unmount();
    }

    render() {
        if (this.seriesId) {
            this.deleteButton.classList.toggle("hide", false);

            const series = window.seriesMap.get(this.seriesId);

            // disable switch transitions before setting its state
            this.completedSwitch.classList.add("no-transition");

            this.titleInput.value = series.title;
            this.seasonInput.value = series.season;
            this.episodeInput.value = series.episode;
            this.completedSwitch.classList.toggle("switch-left", series.completed);
            this.completedSwitch.classList.toggle("switch-right", !series.completed);
            this.completedInputYes.checked = series.completed;
            this.completedInputNo.checked = !series.completed;
            this.linkInput.value = series.link;

            // enable switch transitions, but wait for its initialization
            setTimeout(() => this.completedSwitch.classList.remove("no-transition"), 50);
        } else {
            // default for new series: not completed
            this.completedSwitch.classList.add("switch-right");
            this.completedInputNo.checked = true;
        }
    }

    goBack() {
        window.history.back();
    }

    deleteSeries() {
        if (this.seriesId) {
            window.seriesMap.delete(this.seriesId);
            // reset scroll postion of series list
            localStorage.removeItem('scrollpos');
            window.seriesMap.save().then(this.goBack);
        }
    }

    saveInput() {
        let series = new Series();
        series.title = this.titleInput.value;
        series.season = parseInt(this.seasonInput.value) || 0;
        series.episode = parseInt(this.episodeInput.value) || 0;
        series.completed = this.completedInputYes.checked;
        series.link = this.linkInput.value;
        series.dateModified = new Date();

        if (this.seriesId) {
            window.seriesMap.set(this.seriesId, series);
        } else {
            series.dateCreated = new Date();
            window.seriesMap.add(series);
            // reset scroll postion of series list
            localStorage.removeItem('scrollpos');
        }

        window.seriesMap.save().then(this.goBack);

        return false;
    }
}
