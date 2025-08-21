
const popupOverlay = document.getElementById("merge-popup-overlay");
const applyButton = document.getElementById("merge-apply-button");
const cancelButton = document.getElementById("merge-cancel-button");


export function showMergePopup(mergeConflicts, onApply, onCancel) {
    popupOverlay.classList.remove("hide");

    let resolvedConflicts = new Map();

    // TODO: merge selection with: LOCAL <-> DELETE <-> CLOUD

    applyButton.onclick = () => {
        onApply(resolvedConflicts);
        popupOverlay.classList.add("hide");
    };

    cancelButton.onclick = () => {
        onCancel();
        popupOverlay.classList.add("hide");
    };
}