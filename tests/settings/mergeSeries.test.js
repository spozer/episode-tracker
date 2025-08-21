import { mergeSeries, generateSimpleId } from "../../popup/utils/helpers.js"
import { SeriesMap, Series } from "../../popup/model/series.js";

const now = new Date();

function addDaysToDate(date, days) {
    const result = new Date(date);
    result.setDate(date.getDate() + days);
    return result;
}

function getRandomSeriesMap(count, minDate, maxDate) {
    const result = new SeriesMap();

    const start = minDate ?? new Date();
    const end = maxDate ?? addDaysToDate(start, 10);

    for (let i = 0; i < count; i++) {
        const randomDate = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
        result.add(Series.from({
            title: generateSimpleId(10),
            season: Math.floor(Math.random() * 15),
            episode: Math.floor(Math.random() * 50),
            completed: Math.random() < 0.5,
            link: generateSimpleId(10),
            dateModified: randomDate.getTime(),
            dateCreated: randomDate.getTime()
        }));
    }

    return result;
}

function cloneAndModifySeriesMap(seriesMap, seriesToModify, newProperties) {
    const clonedMap = new SeriesMap();

    seriesMap.forEach((value, key) => {
        clonedMap.set(key, value);
    });

    if (newProperties && clonedMap.has(seriesToModify)) {
        clonedMap.set(seriesToModify, Series.from({
            ...seriesMap.get(seriesToModify),
            ...newProperties
        }));
    }

    return clonedMap;
}

test("merge conflict with change, where lastSync < srcModified < destModified", () => {
    const lastSync = addDaysToDate(now, -10);
    const srcModified = addDaysToDate(now, -1);
    const destModified = now;

    const baseLineMap = getRandomSeriesMap(5);
    const key = baseLineMap.keys().next().value;

    const srcMap = cloneAndModifySeriesMap(
        baseLineMap,
        key,
        { dateModified: srcModified.getTime() }
    );

    const destMap = cloneAndModifySeriesMap(
        baseLineMap,
        key,
        {
            dateModified: destModified.getTime(),
            episode: baseLineMap.get(key).episode + 1
        }
    );

    baseLineMap.delete(key);

    expect(mergeSeries(srcMap, destMap, lastSync)).toStrictEqual([
        baseLineMap, // result
        new Map([[key, [srcMap.get(key), destMap.get(key)]]]) // mergeConflicts
    ]);
});

test("no merge conflict with no actual change, where lastSync < srcModified < destModified", () => {
    const lastSync = addDaysToDate(now, -10);
    const srcModified = addDaysToDate(now, -1);
    const destModified = now;

    const baseLineMap = getRandomSeriesMap(5);
    const key = baseLineMap.keys().next().value;

    const srcMap = cloneAndModifySeriesMap(
        baseLineMap,
        key,
        { dateModified: srcModified.getTime() }
    );

    const destMap = cloneAndModifySeriesMap(
        baseLineMap,
        key,
        { dateModified: destModified.getTime() }
    );

    expect(mergeSeries(srcMap, destMap, lastSync)).toStrictEqual([
        destMap, // result
        null // mergeConflicts
    ]);
});

test("merge conflict with change, where lastSync < destModified < srcModified", () => {
    const lastSync = addDaysToDate(now, -10);
    const srcModified = now;
    const destModified = addDaysToDate(now, -1);

    const baseLineMap = getRandomSeriesMap(5);
    const key = baseLineMap.keys().next().value;

    const srcMap = cloneAndModifySeriesMap(
        baseLineMap,
        key,
        { dateModified: srcModified.getTime() }
    );

    const destMap = cloneAndModifySeriesMap(
        baseLineMap,
        key,
        {
            dateModified: destModified.getTime(),
            episode: baseLineMap.get(key).episode + 1
        }
    );

    baseLineMap.delete(key);

    expect(mergeSeries(srcMap, destMap, lastSync)).toStrictEqual([
        baseLineMap, // result
        new Map([[key, [srcMap.get(key), destMap.get(key)]]]) // mergeConflicts
    ]);
});

test("no merge conflict with change, where srcModified < lastSync < destModified", () => {
    const lastSync = addDaysToDate(now, -1);
    const srcModified = addDaysToDate(now, -10);
    const destModified = now;

    const baseLineMap = getRandomSeriesMap(5);
    const key = baseLineMap.keys().next().value;

    const srcMap = cloneAndModifySeriesMap(
        baseLineMap,
        key,
        { dateModified: srcModified.getTime() }
    );

    const destMap = cloneAndModifySeriesMap(
        baseLineMap,
        key,
        {
            dateModified: destModified.getTime(),
            episode: baseLineMap.get(key).episode + 1
        }
    );

    expect(mergeSeries(srcMap, destMap, lastSync)).toStrictEqual([
        destMap, // result
        null // mergeConflicts
    ]);
});

test("no merge conflict with change, where srcModified < destModified < lastSync", () => {
    const lastSync = now;
    const srcModified = addDaysToDate(now, -10);
    const destModified = addDaysToDate(now, -1);

    const baseLineMap = getRandomSeriesMap(5);
    const key = baseLineMap.keys().next().value;

    const srcMap = cloneAndModifySeriesMap(
        baseLineMap,
        key,
        { dateModified: srcModified.getTime() }
    );

    const destMap = cloneAndModifySeriesMap(
        baseLineMap,
        key,
        {
            dateModified: destModified.getTime(),
            episode: baseLineMap.get(key).episode + 1
        }
    );

    expect(mergeSeries(srcMap, destMap, lastSync)).toStrictEqual([
        destMap, // result
        null // mergeConflicts
    ]);
});

test("no merge conflict with change, where destModified < srcModified < lastSync", () => {
    const lastSync = now;
    const srcModified = addDaysToDate(now, -1);
    const destModified = addDaysToDate(now, -10);

    const baseLineMap = getRandomSeriesMap(5);
    const key = baseLineMap.keys().next().value;

    const srcMap = cloneAndModifySeriesMap(
        baseLineMap,
        key,
        { dateModified: srcModified.getTime() }
    );

    const destMap = cloneAndModifySeriesMap(
        baseLineMap,
        key,
        {
            dateModified: destModified.getTime(),
            episode: baseLineMap.get(key).episode + 1
        }
    );

    expect(mergeSeries(srcMap, destMap, lastSync)).toStrictEqual([
        destMap, // result
        null // mergeConflicts
    ]);
});

test("merge conflict with addition in mapA / deletion in mapB, where dateCreated < lastSync < dateModified", () => {
    const lastSync = addDaysToDate(now, -1);
    const dateCreated = addDaysToDate(now, -10);
    const dateModified = now;

    const baseLineMap = getRandomSeriesMap(5);
    const key = baseLineMap.keys().next().value;

    const mapA = cloneAndModifySeriesMap(
        baseLineMap,
        key,
        {
            dateModified: dateModified.getTime(),
            dateCreated: dateCreated.getTime()
        }
    );

    baseLineMap.delete(key);
    const mapB = baseLineMap;

    expect(mergeSeries(mapA, mapB, lastSync)).toStrictEqual([
        baseLineMap, // result
        new Map([[key, [mapA.get(key), null]]]) // mergeConflicts
    ]);
    expect(mergeSeries(mapB, mapA, lastSync)).toStrictEqual([
        baseLineMap, // result
        new Map([[key, [null, mapA.get(key)]]]) // mergeConflicts
    ]);
});

test("no merge conflict with addition in mapA, where lastSync < dateCreated < dateModified", () => {
    const lastSync = addDaysToDate(now, -10);
    const dateCreated = addDaysToDate(now, -1);
    const dateModified = now;

    const baseLineMap = getRandomSeriesMap(5);
    const key = baseLineMap.keys().next().value;

    const mapA = cloneAndModifySeriesMap(
        baseLineMap,
        key,
        {
            dateModified: dateModified.getTime(),
            dateCreated: dateCreated.getTime()
        }
    );

    baseLineMap.delete(key);
    const mapB = baseLineMap;

    expect(mergeSeries(mapA, mapB, lastSync)).toStrictEqual([
        mapA, // result
        null // mergeConflicts
    ]);
    expect(mergeSeries(mapB, mapA, lastSync)).toStrictEqual([
        mapA, // result
        null // mergeConflicts
    ]);
});


test("no merge conflict with addition in mapA / deletion in mapB, where dateModified < lastSync", () => {
    const lastSync = now;
    const dateModified = addDaysToDate(now, -10);

    const baseLineMap = getRandomSeriesMap(5);
    const key = baseLineMap.keys().next().value;

    const mapA = cloneAndModifySeriesMap(
        baseLineMap,
        key,
        { dateModified: dateModified.getTime() }
    );

    baseLineMap.delete(key);
    const mapB = baseLineMap;

    expect(mergeSeries(mapA, mapB, lastSync)).toStrictEqual([
        mapB, // result
        null // mergeConflicts
    ]);
    expect(mergeSeries(mapB, mapA, lastSync)).toStrictEqual([
        mapB, // result
        null // mergeConflicts
    ]);
});
