const importButton = document.getElementById("import-button")
const exportButton = document.getElementById("export-button")
const fileInput = document.getElementById("file-input")
const importIoChecker = document.getElementById("import-io-checker")
const exportIoChecker = document.getElementById("export-io-checker")

function init() {
  importButton.onclick = () => fileInput.click()
  exportButton.onclick = exportSeries
  fileInput.onchange = event => importSeries(event)
}

function setIoCheckerStatus(element, status) {
  element.className = "";
  element.classList.add("io-" + status)
}

function exportSeries() {
  setIoCheckerStatus(exportIoChecker, "loading")
  browser.storage.local.get("series").then(
    data => {
      const blob = new Blob([JSON.stringify(data, null, 4)])
      const link = document.createElement("a")
      link.href = window.URL.createObjectURL(blob)
      link.download = `episode-tracker_${new Date().toLocaleDateString()}.json`

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      setIoCheckerStatus(exportIoChecker, "success")
    },
    () => setIoCheckerStatus(exportIoChecker, "error")
  )
}

function importSeries(event) {
  let reader = new FileReader()
  reader.onload = (e) => {
    try {
      let data = JSON.parse(e.target.result)
      browser.storage.local.clear()
      browser.storage.local.set(data)
      .then(() => setIoCheckerStatus(importIoChecker, "success"),
            () => setIoCheckerStatus(importIoChecker, "error"))
    } catch (error) {
      setIoCheckerStatus(importIoChecker, "error")
    }
  }
  reader.onerror = () => setIoCheckerStatus(importIoChecker, "error")
  setIoCheckerStatus(importIoChecker, "loading")
  reader.readAsText(event.target.files[0])
}

init()