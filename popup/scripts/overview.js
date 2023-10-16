const seriesCardTemplate = document.getElementById("series-card-template")
const seriesCardsContainer = document.getElementById("series-cards-container")
const searchInput = document.getElementById("search")
const addButton = document.getElementById("add-button")

let seriesCards = []

function init() {
  searchInput.oninput = onSearch
  addButton.onclick = switchToEditForm

  browser.storage.local.get("series")
    .then(data => {
      const seriesList = []
      Object.assign(seriesList, data.series)

      seriesCards = seriesList.map((series, id) => {
        const card = seriesCardTemplate.content.cloneNode(true).children[0]
        const header = card.querySelector("#data-header")
        const body = card.querySelector("#data-body")
        const seriesInfo = body.querySelector("#series-info")
        const linkButton = body.querySelector("#link-button")

        header.textContent = series.title

        if (parseInt(series.season) > 0) {
          seriesInfo.textContent += "Season: " + series.season + " \u00B7 "
        }

        seriesInfo.textContent += "Episode: " + series.episode

        if (series.completed) {
          card.classList.add("completed")
        }

        if (series.link) {
          linkButton.classList.toggle("hide", false)
          linkButton.onclick = (e) => {
            e.stopPropagation()
            window.open(series.link, '_blank')
            window.close()
          }
        }

        card.onclick = () => openSeriesEditor(id)

        return {
          id: id,
          title: series.title,
          element: card
        }
      })

      // sort series ascending
      seriesCards.sort((a, b) => {
        return a.title.toLowerCase() > b.title.toLowerCase()
      })

      seriesCards.forEach((series) => {
        seriesCardsContainer.append(series.element)
      })
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

init()
