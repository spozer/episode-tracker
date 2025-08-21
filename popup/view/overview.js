import { Component } from "./component.js";
import { FilterType } from "../model/filter.js";
import { SortType } from "../model/sort.js";
import { HASHES } from "../index.js";
import { CurrentSeriesList } from "../model/currentSeriesList.js";

export class Overview extends Component {
    scrollBefore = null;

    constructor() {
        super();
        this.currentSeriesList = new CurrentSeriesList();
    }

    mount() {
        if (this.mounted) {
            return;
        }

        this.seriesCardTemplate = document.getElementById("series-card-template");
        this.seriesCardsContainer = document.getElementById("series-cards-container");
        this.searchInput = document.getElementById("search");
        this.addButton = document.getElementById("add-button");
        this.settingsButton = document.getElementById("settings-button");
        this.filterButton = document.getElementById("filter-button");
        this.sortButton = document.getElementById("sort-button");
        this.filterDropdown = document.getElementById("filter-dropdown");
        this.sortDropdown = document.getElementById("sort-dropdown");
        this.filterAll = document.getElementById("filter-all");
        this.filterCompleted = document.getElementById("filter-completed");
        this.filterWatching = document.getElementById("filter-watching");
        this.sortTitle = document.getElementById("sort-title");
        this.sortDateModified = document.getElementById("sort-date-modified");
        this.sortDateCreated = document.getElementById("sort-date-created");

        this.handleWindowUnload = this.saveScrollPosAndSearchText.bind(this);
        window.addEventListener("unload", this.handleWindowUnload);

        this.searchInput.oninput = (e) => {
            this.seriesCardsContainer.scrollTo(0, 0);
            this.search(e.target.value);
        }
        this.addButton.onclick = () => this.switchToEditForm();
        this.settingsButton.onclick = () => this.switchToSettings();

        this.filterButton.onclick = () => this.filterDropdown.classList.toggle("hide");
        this.sortButton.onclick = () => this.sortDropdown.classList.toggle("hide");
        this.filterDropdown.onmouseleave = () => this.filterDropdown.classList.toggle("hide", true);
        this.sortDropdown.onmouseleave = () => this.sortDropdown.classList.toggle("hide", true);

        this.seriesCardsContainer.onscroll = () => {
            const scrolled = this.seriesCardsContainer.scrollTop;

            if (this.scrollBefore == null) {
                this.scrollBefore = scrolled;

                if (scrolled > 0 &&
                    Math.abs(this.seriesCardsContainer.scrollHeight - this.seriesCardsContainer.clientHeight - this.seriesCardsContainer.scrollTop) <= 1) {
                    this.addButton.classList.toggle('hide-floating-button', true);
                }
                return;
            }

            if (this.scrollBefore > scrolled) {
                // scrolled up
                this.scrollBefore = scrolled;
                this.addButton.classList.toggle('hide-floating-button', false);
            } else if (this.scrollBefore < scrolled) {
                // scrolled down
                this.scrollBefore = scrolled;
                this.addButton.classList.toggle('hide-floating-button', true);
            }
        }

        this.handleDocumentClick = (e) => {
            // hide dropdown when clicking outside
            if (!this.filterDropdown.parentElement.contains(e.target)) {
                this.filterDropdown.classList.toggle("hide", true);
            }

            if (!this.sortDropdown.parentElement.contains(e.target)) {
                this.sortDropdown.classList.toggle("hide", true);
            }
        }

        document.addEventListener("click", this.handleDocumentClick);

        this.filterAll.onclick = (e) => this.setFilter(e.target.value);
        this.filterCompleted.onclick = (e) => this.setFilter(e.target.value);
        this.filterWatching.onclick = (e) => this.setFilter(e.target.value);
        this.sortTitle.onclick = (e) => this.setSort(e.target.value, this.sortTitle);
        this.sortDateModified.onclick = (e) => this.setSort(e.target.value, this.sortDateModified);
        this.sortDateCreated.onclick = (e) => this.setSort(e.target.value, this.sortDateCreated);

        this.render();

        const searchText = localStorage.getItem('searchText');
        if (searchText) {
            this.searchInput.value = searchText;
            localStorage.removeItem('searchText');
            this.search(searchText);
        }

        const scrollpos = localStorage.getItem('scrollpos');
        if (scrollpos) {
            this.seriesCardsContainer.scrollTo(0, scrollpos);
            localStorage.removeItem('scrollpos');
        }

        super.mount();
    }

    unmount() {
        if (!this.mounted) {
            return;
        }

        window.removeEventListener("unload", this.handleWindowUnload);
        document.removeEventListener("click", this.handleDocumentClick);

        super.unmount();
    }

    render() {
        this.renderFilter();
        this.renderSort();
        this.renderSeriesCards();
    }

    renderFilter() {
        switch (window.store.filter) {
            case FilterType.All:
                this.filterAll.checked = true;
                break;
            case FilterType.Completed:
                this.filterCompleted.checked = true;
                break;
            case FilterType.Watching:
                this.filterWatching.checked = true;
                break;
        }
    }

    renderSort() {
        switch (window.store.sort) {
            case SortType.Title:
                this.sortTitle.checked = true;
                this.sortTitle.toggleAttribute('reversed', window.store.sortReversed);
                break;
            case SortType.DateModified:
                this.sortDateModified.checked = true;
                this.sortDateModified.toggleAttribute('reversed', window.store.sortReversed);
                break;
            case SortType.DateCreated:
                this.sortDateCreated.checked = true;
                this.sortDateCreated.toggleAttribute('reversed', window.store.sortReversed);
                break;
        }
    }

    renderSeriesCards() {
        // empty container
        while (this.seriesCardsContainer.firstChild) {
            this.seriesCardsContainer.removeChild(this.seriesCardsContainer.firstChild);
        }

        for (const [id, series] of this.currentSeriesList) {
            const card = this.seriesCardTemplate.content.cloneNode(true).children[0];
            const header = card.querySelector("#data-header");
            const seriesInfo = card.querySelector("#series-info");
            const linkButton = card.querySelector("#link-button");

            header.textContent = series.title;

            if (parseInt(series.season) > 0) {
                seriesInfo.textContent += "Season: " + series.season + " \u00B7 ";
            }

            seriesInfo.textContent += "Episode: " + series.episode;

            if (series.completed) {
                card.toggleAttribute('completed', true);
            }

            if (series.link) {
                linkButton.classList.toggle("hide", false);
                linkButton.onclick = (e) => {
                    e.stopPropagation();
                    browser.tabs.create({
                        url: series.link.replace("%s", series.season).replace("%e", series.episode),
                    });
                    window.close();
                }
            }

            card.onclick = () => this.openSeriesEditor(id);

            this.seriesCardsContainer.append(card);
        }
    }

    search(searchText) {
        const value = searchText.toLowerCase();

        this.seriesCardsContainer.childNodes.forEach(seriesCard => {
            const isVisiable = seriesCard.querySelector("#data-header").textContent.toLowerCase().includes(value);
            seriesCard.classList.toggle("hide", !isVisiable);
        });
    }

    setFilter(type) {
        if (window.store.filter === type) {
            return;
        }

        window.store.filter = type;
        this.render();
        this.seriesCardsContainer.scrollTo(0, 0);
    }

    setSort(type, element) {
        if (window.store.sort === type) {
            window.store.sortReversed = !window.store.sortReversed;
        } else {
            window.store.sort = type;
            window.store.sortReversed = false;
        }

        element.toggleAttribute('reversed', window.store.sortReversed);
        this.render();
        this.seriesCardsContainer.scrollTo(0, 0);
    }

    saveScrollPosAndSearchText() {
        localStorage.setItem('scrollpos', this.seriesCardsContainer.scrollTop);
        localStorage.setItem('searchText', this.searchInput.value);
    }

    openSeriesEditor(id) {
        this.saveScrollPosAndSearchText();

        let url = new URL(window.location);
        url.hash = HASHES.edit;
        url.searchParams.set("id", id);
        window.history.pushState(null, '', url);
        window.dispatchEvent(new PopStateEvent('popstate'));
    }

    switchToEditForm() {
        this.saveScrollPosAndSearchText();
        window.location.hash = HASHES.edit;
    }

    switchToSettings() {
        // browser.tabs.create({
        //     url: "./settings.html",
        // });
        // window.close();
        browser.runtime.openOptionsPage().then(() => window.close());
    }
}
