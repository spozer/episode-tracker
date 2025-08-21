import { SeriesMap } from "../model/series.js";

export function mergeSeries(srcMap, destMap, lastSync) {
    let result = new SeriesMap();
    let mergeConflicts = new Map();

    const srcSet = new Set(srcMap.keys());
    const destSet = new Set(destMap.keys());

    for (const key of destSet.union(srcSet)) {
        if (destMap.has(key) && srcMap.has(key)) {
            const srcDateModified = srcMap.get(key).dateModified;
            const destDateModified = destMap.get(key).dateModified;

            if (srcDateModified.getTime() === destDateModified.getTime()) {
                result.set(key, destMap.get(key));
            } else if (srcDateModified < lastSync) {
                // updated in dest
                result.set(key, destMap.get(key));
            } else if (destDateModified < lastSync) {
                // updated in src
                result.set(key, srcMap.get(key));
            } else {
                if (!destMap.get(key).isEqualTo(srcMap.get(key))) {
                    // actual merge conflict
                    mergeConflicts.set(key, [srcMap.get(key), destMap.get(key)]);
                    continue;
                }
                result.set(key, srcDateModified < destDateModified ? destMap.get(key) : srcMap.get(key));
            }
        } else if (destMap.has(key)) {
            const dateModified = destMap.get(key).dateModified;
            const dateCreated = destMap.get(key).dateCreated;

            // if series was last modified before lastSync, then it is certain that series got deleted
            if (dateModified <= lastSync) {
                continue;
            }

            // otherwise if series was created before lastSync, then we have a possible merge conflict
            if (dateCreated < lastSync) {
                mergeConflicts.set(key, [null, destMap.get(key)]);
            } else {
                result.set(key, destMap.get(key));
            }
        } else if (srcMap.has(key)) {
            const dateModified = srcMap.get(key).dateModified;
            const dateCreated = srcMap.get(key).dateCreated;

            // if series was last modified before lastSync, then it is certain that series got deleted
            if (dateModified <= lastSync) {
                continue;
            }
            // otherwise if series was created before lastSync, then we have a possible merge conflict
            if (dateCreated < lastSync) {
                mergeConflicts.set(key, [srcMap.get(key), null]);
            } else {
                result.set(key, srcMap.get(key));
            }
        }
    }

    if (mergeConflicts.size === 0) {
        mergeConflicts = null;
    }

    return [result, mergeConflicts];
}

export function generateSimpleId(n) {
    const OMEGA = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    // probability of collision: 1 - e^(-k^2/OMEGA.length^n) = 1e-5 (with k = 1000, OMEGA.length = 62, n = 6)
    let id = "";
    for (let i = 0; i < n; i++) {
        id += OMEGA[Math.floor(Math.random() * OMEGA.length)];
    }
    return id;
}