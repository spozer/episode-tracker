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
const completedSwitch = document.getElementById("completed-switch")
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

  completedInputYes.onclick = () => {
    completedSwitch.classList.remove("switch-right")
    completedSwitch.classList.add("switch-left")
  }

  completedInputNo.onclick = () => {
    completedSwitch.classList.remove("switch-left")
    completedSwitch.classList.add("switch-right")
  }

  if (isNotEmptyInitialized()) {
    const seriesId = urlParams.get("seriesId")

    deleteButton.classList.toggle("hide", false)

    browser.storage.local.get("series")
      .then((data) => {
        const seriesList = []
        Object.assign(seriesList, data.series)

        const series = seriesList[seriesId]

        // disable switch transitions before setting its state
        completedSwitch.classList.add("no-transition")

        titleInput.value = series.title
        seasonInput.value = series.season
        episodeInput.value = series.episode
        completedSwitch.classList.toggle("switch-left", series.completed)
        completedSwitch.classList.toggle("switch-right", !series.completed)
        completedInputYes.checked = series.completed
        completedInputNo.checked = !series.completed
        linkInput.value = series.link

        // enable switch transitions, but wait for its initialization
        setTimeout(() => completedSwitch.classList.remove("no-transition"), 50)
      })
  } else {
    // default for new series: not completed
    completedSwitch.classList.add("switch-right")
    completedInputNo.checked = true
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
  const now = new Date()

  const series = {
    title: titleInput.value,
    season: parseInt(seasonInput.value) || 0,
    episode: parseInt(episodeInput.value) || 0,
    completed: completedInputYes.checked,
    link: linkInput.value,
    dateModified: now.toISOString()
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
