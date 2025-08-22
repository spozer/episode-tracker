import { Settings } from "../model/settings.js";
import { mergeSeries } from "../utils/helpers.js"
import { SeriesStorageManager, LAST_SERIES_CHANGE } from "../model/series.js";
import { showMergePopup } from "./merge-popup.js";

const IO_STATUS = {
	loading: "loading",
	success: "success",
	error: "error"
}

const MAX_SYNC_STORAGE = 8192; // bytes
const LAST_SYNC_KEY = "lastSync";

const importButton = document.getElementById("import-button");
const exportButton = document.getElementById("export-button");
const fileInput = document.getElementById("file-input");
const importIoChecker = document.getElementById("import-io-checker");
const exportIoChecker = document.getElementById("export-io-checker");
const syncStorageInput = document.getElementById("sync-storage");
const storageIndicator = document.getElementById("storage-indicator");
const storageProgress = document.getElementById("storage-progress");
const storageProgressLabel = document.getElementById("storage-progress-label");

let settings;

function init() {
	importButton.onclick = () => fileInput.click();
	exportButton.onclick = () => exportSeries();
	fileInput.onchange = (e) => importSeries(e);
	syncStorageInput.onclick = (e) => setCloudStorage(e.target.checked);
	settings = new Settings();
	settings.fetch().then(() => {
		syncStorageInput.checked = settings.useCloud;
		syncStorageInput.dispatchEvent(new Event('change'));
		render();
	});
}

function render() {
	storageIndicator.classList.toggle("hide", !settings.useCloud);

	if (settings.useCloud) {
		browser.storage.sync.getBytesInUse().then(bytes => {
			console.log("Bytes: " + bytes);
			storageProgress.value = bytes / MAX_SYNC_STORAGE;
			storageProgressLabel.innerText = Math.round((bytes / MAX_SYNC_STORAGE) * 100) + "%";
		});
	}
}

function setIoCheckerStatus(element, status) {
	element.className = "";
	element.classList.add("io-" + status);
}

function exportSeries() {
	setIoCheckerStatus(exportIoChecker, IO_STATUS.loading);
	let seriesStorageManager = new SeriesStorageManager(settings.useCloud);
	seriesStorageManager.fetch().then(
		() => {
			const jsonSeriesMap = seriesStorageManager.get().toJsonObject();
			const blob = new Blob([JSON.stringify([...jsonSeriesMap.values()], null, 4)]);
			const link = document.createElement("a");
			link.href = window.URL.createObjectURL(blob);
			link.download = `episode-tracker_${new Date().toLocaleDateString()}.json`;

			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			setIoCheckerStatus(exportIoChecker, IO_STATUS.success);
		},
		(error) => {
			setIoCheckerStatus(exportIoChecker, IO_STATUS.error);
			alert(error);
		}
	);
}

function importSeries(e) {
	let reader = new FileReader();
	reader.onload = (e) => {
		try {
			let data = JSON.parse(e.target.result)

			if (data.series) data = data.series; // convert old export structure to new one
			console.log("Series count: " + Object.assign([], data).length);

			let seriesStorageManager = new SeriesStorageManager(settings.useCloud);
			seriesStorageManager.loadFromArray(data, true);

			seriesStorageManager.save().then(
				() => {
					setIoCheckerStatus(importIoChecker, IO_STATUS.success);
					render();
				},
				(error) => {
					setIoCheckerStatus(importIoChecker, IO_STATUS.error);
					alert(error);
				}
			);
		} catch (error) {
			setIoCheckerStatus(importIoChecker, IO_STATUS.error);
			alert(error);
		}
	}
	reader.onerror = (error) => {
		setIoCheckerStatus(importIoChecker, IO_STATUS.error);
		alert(error);
	}
	setIoCheckerStatus(importIoChecker, IO_STATUS.loading);
	reader.readAsText(e.target.files[0]);
}

async function setCloudStorage(useCloud) {
	if (settings.useCloud === useCloud) {
		return;
	}

	if (!useCloud) {
		// sync turned off
		let seriesStorageManager = new SeriesStorageManager(true);
		await seriesStorageManager.fetch();
		seriesStorageManager.setUseCloud(false);

		browser.storage.local.set({
			[LAST_SYNC_KEY]: new Date().getTime()
		});
	} else {
		// sync turned on

		/*
		-----------------------
		last sync

			sync last change            problem

		local last change
		-----------------------
		last sync

		local last change               problem

			sync last change
		-----------------------
			sync last change

		last sync                       apply local

		local last change
		-----------------------
			sync last change

		local last change               ignore (no new changes)

		last sync
		-----------------------
		local last change
			
			sync last change            ignore (no new changes)

		last sync
		-----------------------
		local last change

		last sync                       apply sync

			sync last change
		-----------------------
		*/

		const localLastChange = new Date((await browser.storage.local.get(LAST_SERIES_CHANGE))[LAST_SERIES_CHANGE] || 0);
		const syncLastChange = new Date((await browser.storage.sync.get(LAST_SERIES_CHANGE))[LAST_SERIES_CHANGE] || 0);
		const lastSync = new Date((await browser.storage.local.get(LAST_SYNC_KEY))[LAST_SYNC_KEY] || 0);

		let localSeriesStorageManager = new SeriesStorageManager(false);
		let syncSeriesStorageManager = new SeriesStorageManager(true);

		await localSeriesStorageManager.fetch();
		await syncSeriesStorageManager.fetch();

		if (lastSync < localLastChange && lastSync < syncLastChange) {
			let [mergedSeries, mergeConflicts] = mergeSeries(syncSeriesStorageManager.get(), localSeriesStorageManager.get(), lastSync);

			const saveMergedSeries = async (mergedSeries) => {
				try {
					await syncSeriesStorageManager.setSeriesMap(mergedSeries);
				} catch (error) {
					syncStorageInput.checked = false;
					syncStorageInput.dispatchEvent(new Event('change'));
					alert(error);
					return;
				}
			};

			if (mergeConflicts != null) {
				showMergePopup(mergeConflicts, (resolvedConflicts) => {
					for (const key of resolvedConflicts.keys()) {
						mergedSeries.set(key, resolvedConflicts.get(key));
					}
					saveMergedSeries();
				}, () => {
					syncStorageInput.checked = false;
					syncStorageInput.dispatchEvent(new Event('change'));
				});
			} else {
				saveMergedSeries(mergedSeries);
			}
		} else if (localLastChange <= lastSync) {
			// use sync
			// aka do nothing
		} else if (syncLastChange <= lastSync) {
			// use local
			localSeriesStorageManager.setUseCloud(true);
		}
	}

	settings.useCloud = useCloud;
	settings.save();
	render();
}

init()