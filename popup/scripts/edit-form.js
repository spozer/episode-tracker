const editForm = document.getElementById("edit-form")
const backButton = document.getElementById("back-button")
const deleteButton = document.getElementById("delete-button")
const applyButton = document.getElementById("apply-button")

const seasonDecButton = document.getElementById("season-dec-button")
const seasonIncButton = document.getElementById("season-inc-button")
const episodeDecButton = document.getElementById("episode-dec-button")
const episodeIncButton = document.getElementById("episode-inc-button")

const titleInput = document.getElementById("title-input")
const seasonInput = document.getElementById("season-input")
const episodeInput = document.getElementById("episode-input")
const completedInputYes = document.getElementById("completed-yes")
const completedInputNo = document.getElementById("completed-no")
const linkInput = document.getElementById("link-input")

const queryString = window.location.search
const urlParams = new URLSearchParams(queryString)

let deleteTimeoutId = 0
const deleteTimeout = 1510 //ms

function init() {
  editForm.onsubmit = saveInput
  backButton.onclick = switchToOverview
  deleteButton.onmousedown = () => {
    deleteTimeoutId = setTimeout(deleteSeries, deleteTimeout)
    deleteButton.classList.add("active")
  }
  deleteButton.onmouseup = deleteButton.onmouseleave = () => {
    clearTimeout(deleteTimeoutId)
    deleteButton.classList.remove("active")
  }
  seasonDecButton.onclick = () => seasonInput.value--
  seasonIncButton.onclick = () => seasonInput.value++
  episodeDecButton.onclick = () => episodeInput.value--
  episodeIncButton.onclick = () => episodeInput.value++

  // disable scroll wheel for number input
  seasonInput.onwheel = () => { return false }
  episodeInput.onwheel = () => { return false }

  if (isNotEmptyInitialized()) {
    const seriesId = urlParams.get("seriesId")

    deleteButton.classList.toggle("hide", false)

    browser.storage.local.get("series")
      .then((data) => {
        const seriesList = []
        Object.assign(seriesList, data.series)

        const series = seriesList[seriesId]

        titleInput.value = series.title
        seasonInput.value = series.season
        episodeInput.value = series.episode
        completedInputYes.checked = series.completed
        completedInputNo.checked = !series.completed
        linkInput.value = series.link
      })
  }
}

function storeAndLeave(seriesListFunction) {
  browser.storage.local.get("series")
    .then(data => {
      let seriesList = []
      Object.assign(seriesList, data.series)

      seriesListFunction(seriesList)

      browser.storage.local.set({ "series": seriesList })
    })
    .then(switchToOverview)
}

function switchToOverview() {
  window.location.href = "./index.html"
}

function isNotEmptyInitialized() {
  return urlParams.get("seriesId") ? true : false
}

function deleteSeries() {
  if (!isNotEmptyInitialized) {
    return
  }

  storeAndLeave((seriesList) => {
    const seriesId = urlParams.get("seriesId")
    seriesList.splice(seriesId, 1)
  })
}

function saveInput() {
  const series = {
    title: titleInput.value,
    season: parseInt(seasonInput.value) || 0,
    episode: parseInt(episodeInput.value) || 0,
    completed: completedInputYes.checked,
    link: linkInput.value
  }

  storeAndLeave((seriesList) => {
    if (isNotEmptyInitialized()) {
      const seriesId = urlParams.get("seriesId")
      seriesList[seriesId] = series
    } else {
      seriesList.push(series)
    }
  })

  return false
}

init()
