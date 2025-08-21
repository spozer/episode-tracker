import { VIEWS, Popup } from "./popup.js";

export const HASHES = {
    loading: "",
    overview: "#overview",
    edit: "#edit"
}

const ROUTES = {
    [HASHES.loading]: {
        file: "view/loading.html"
    },
    [HASHES.overview]: {
        view: VIEWS.overview,
        file: "view/overview.html"
    },
    [HASHES.edit]: {
        view: VIEWS.editForm,
        file: "view/edit-form.html"
    }
};

async function routeHandler() {
    const route = ROUTES[window.location.hash];
    const html = await fetch(route.file).then((response) => response.text());
    document.getElementById("root").innerHTML = html;

    console.log("route to: " + window.location.href.replace(window.location.origin, ''));

    app.navigate(route.view);
}

routeHandler();
window.addEventListener("popstate", routeHandler);

const app = new Popup();
