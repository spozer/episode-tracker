const seriesCardTemplate = document.getElementById("series-card-template")
const seriesCardsContainer = document.getElementById("series-cards-container")
const searchInput = document.getElementById("search")
const addButton = document.getElementById("add-button")
const settingsButton = document.getElementById("settings-button")
const filterButton = document.getElementById("filter-button")
const sortButton = document.getElementById("sort-button")
const filterDropdown = document.getElementById("filter-dropdown")
const sortDropdown = document.getElementById("sort-dropdown")
const filterAll = document.getElementById("filter-all")
const filterCompleted = document.getElementById("filter-completed")
const filterWatching = document.getElementById("filter-watching")
const sortTitle = document.getElementById("sort-title")
const sortDateModified = document.getElementById("sort-date-modified")

let seriesCards = []
let currentFilter = "all"
let currentSort = "title"
let sortReversed = false;

function init() {
  window.addEventListener("unload", () => {
    localStorage.setItem('scrollpos', seriesCardsContainer.scrollTop)
  });

  searchInput.oninput = onSearch
  addButton.onclick = switchToEditForm
  settingsButton.onclick = switchToSettings

  filterButton.onclick = () => filterDropdown.classList.toggle("hide")
  sortButton.onclick = () => sortDropdown.classList.toggle("hide")
  filterDropdown.onmouseleave = () => filterDropdown.classList.toggle("hide", true)
  sortDropdown.onmouseleave = () => sortDropdown.classList.toggle("hide", true)

  document.onclick = (element) => {
    // hide dropdown when clicking outside
    if (!filterDropdown.parentElement.contains(element.target)) {
      filterDropdown.classList.toggle("hide", true)
    }

    if (!sortDropdown.parentElement.contains(element.target)) {
      sortDropdown.classList.toggle("hide", true)
    }
  }

  filterAll.onclick = (element) => setFilter(element.target.value)
  filterCompleted.onclick = (element) => setFilter(element.target.value)
  filterWatching.onclick = (element) => setFilter(element.target.value)
  sortTitle.onclick = (element) => setSort(element.target.value, sortTitle)
  sortDateModified.onclick = (element) => setSort(element.target.value, sortDateModified)

  browser.storage.local.get("options")
    .then(data => {
      const options = {}
      Object.assign(options, data.options)

      currentFilter = options.filter
      currentSort = options.sort
      sortReversed = !!options.sortReversed

      switch (currentFilter) {
        case "all":
        default:
          filterAll.checked = true
          break
        case "completed":
          filterCompleted.checked = true
          break
        case "watching":
          filterWatching.checked = true
          break
      }

      switch (currentSort) {
        case "title":
        default:
          sortTitle.checked = true
          sortTitle.toggleAttribute('reversed', sortReversed)
          break
        case "date-modified":
          sortDateModified.checked = true
          sortDateModified.toggleAttribute('reversed', sortReversed)
          break
      }
    })
    .then(() => browser.storage.local.get("series")
      .then(data => {
        const seriesList = []
        Object.assign(seriesList, data.series)

        seriesCards = seriesList.map((series, id) => {
          const card = seriesCardTemplate.content.cloneNode(true).children[0]
          const header = card.querySelector("#data-header")
          const seriesInfo = card.querySelector("#series-info")
          const linkButton = card.querySelector("#link-button")

          header.textContent = series.title

          if (parseInt(series.season) > 0) {
            seriesInfo.textContent += "Season: " + series.season + " \u00B7 "
          }

          seriesInfo.textContent += "Episode: " + series.episode

          if (series.completed) {
            card.toggleAttribute('completed', true)
          }

          if (series.link) {
            linkButton.classList.toggle("hide", false)
            linkButton.onclick = (e) => {
              e.stopPropagation()
              browser.tabs.create({
                url: series.link,
              })
              window.close()
            }
          }

          card.onclick = () => openSeriesEditor(id)

          return {
            id: id,
            title: series.title,
            completed: series.completed,
            dateModified: series.dateModified,
            element: card
          }
        })
      }))
    .then(fillContainer)
    .then(() => {
      const scrollpos = localStorage.getItem('scrollpos')
      if (scrollpos) {
        seriesCardsContainer.scrollTo(0, scrollpos)
        localStorage.removeItem('scrollpos')
      }
    })
}

function saveOptions() {
  const options = {
    filter: currentFilter,
    sort: currentSort,
    sortReversed: sortReversed
  }

  browser.storage.local.set({ "options": options })
}

function setFilter(filter) {
  if (currentFilter === filter) {
    return
  }
  currentFilter = filter
  saveOptions()
  fillContainer()
  seriesCardsContainer.scrollTo(0,0)
}

function setSort(sort, element) {
  if (currentSort === sort) {
    sortReversed = !sortReversed
  } else {
    currentSort = sort
    sortReversed = false;
  }
  element.toggleAttribute('reversed', sortReversed)
  saveOptions()
  fillContainer()
  seriesCardsContainer.scrollTo(0,0)
}

function getFilterFunction() {
  switch (currentFilter) {
    case "all":
    default:
      return () => true
    case "completed":
      return (series) => series.completed
    case "watching":
      return (series) => !series.completed
  }
}

function getSortFunction() {
  switch (currentSort) {
    case "title":
    default:
      return (seriesA, seriesB) => sortReversed ? seriesA.title.toLowerCase() <= seriesB.title.toLowerCase() : seriesA.title.toLowerCase() > seriesB.title.toLowerCase()
    case "date-modified":
      return (seriesA, seriesB) => {
        const dateA = new Date(seriesA.dateModified)
        const dateB = new Date(seriesB.dateModified)
        return sortReversed ? dateA >= dateB : dateA < dateB
      }
  }
}

function fillContainer() {
  // etmpty container
  while (seriesCardsContainer.firstChild) {
    seriesCardsContainer.removeChild(seriesCardsContainer.firstChild)
  }

  const sortFunction = getSortFunction()
  const filterFunction = getFilterFunction()

  seriesCards.sort(sortFunction)

  seriesCards.forEach((series) => {
    if (filterFunction(series)) {
      seriesCardsContainer.append(series.element)
    }
  })
}

function onSearch(input) {
  const value = input.target.value.toLowerCase()

  seriesCards.forEach(seriesCard => {
    const isVisiable = seriesCard.title.toLowerCase().includes(value)
    seriesCard.element.classList.toggle("hide", !isVisiable)
  })
}

function openSeriesEditor(seriesId) {
  window.location.href = "./edit-form.html?seriesId=" + seriesId
}

function switchToEditForm() {
  window.location.href = "./edit-form.html"
}

function switchToSettings() {
  browser.tabs.create({
    url: "./settings.html",
  })
  window.close()
}

init()
