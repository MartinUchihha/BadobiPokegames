(function () {
    "use strict";

    const STORAGE_KEY = "pokesort-unlocked-level";
    const POOL = [
        "pikachu", "eevee", "poke-ball", "great-ball", "ultra-ball", "potion", "super-potion", "hyper-potion",
        "bulbasaur", "charmander", "squirtle", "jigglypuff", "psyduck", "piplup", "gengar", "snorlax",
        "mew", "umbreon", "mimikyu", "torchic", "fuecoco", "rowlet"
    ];
    // [tipos iniciales, estantes con capas, número de capas, segundos, movimientos de mezcla]
    const LEVELS = [
        [8, 0, 0, 180, 2],
        [8, 3, 1, 240, 4],
        [8, 4, 1, 260, 6],
        [8, 4, 1, 240, 8],
        [10, 3, 1, 300, 8],
        [10, 4, 1, 320, 10],
        [10, 5, 1, 340, 12],
        [10, 4, 2, 390, 14],
        [10, 5, 2, 420, 16],
        [12, 4, 2, 450, 16],
        [12, 5, 2, 480, 18],
        [12, 6, 2, 510, 20],
        [12, 6, 2, 490, 22],
        [12, 6, 2, 470, 24],
        [12, 6, 2, 450, 26],
        [14, 5, 2, 630, 24],
        [14, 6, 2, 690, 26],
        [14, 7, 2, 750, 28],
        [14, 6, 3, 810, 30],
        [14, 7, 3, 870, 32]
    ];

    function shuffle(values, random) {
        const result = [...values];
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }

    function getConfig(level) {
        const number = Math.min(LEVELS.length, Math.max(1, Math.floor(Number(level) || 1)));
        const [types, hiddenShelves, layers, seconds, scrambleMoves] = LEVELS[number - 1];
        return {
            number,
            types,
            shelfCount: types * 3 / 2,
            hiddenShelves,
            layers,
            seconds,
            scrambleMoves,
            totalMatches: types + hiddenShelves * layers
        };
    }

    function getUnlocked() {
        try {
            const stored = window.localStorage.getItem(STORAGE_KEY);
            if (stored === null && window.localStorage.getItem("pokesort-level-1-complete") === "true") return 2;
            const saved = Number(stored);
            return Number.isInteger(saved) ? Math.min(LEVELS.length, Math.max(1, saved)) : 1;
        } catch (_) {
            return 1;
        }
    }

    function unlockAfter(level) {
        const next = Math.min(LEVELS.length, Math.max(getUnlocked(), level + 1));
        try { window.localStorage.setItem(STORAGE_KEY, String(next)); } catch (_) { /* El juego funciona sin almacenamiento. */ }
        return next;
    }

    function buildLevel(level, random = Math.random) {
        const config = getConfig(level);
        const half = config.types / 2;
        const eligibleCount = Math.min(POOL.length, Math.max(config.types, 8 + Math.floor((config.number - 1) * 0.8)));
        const eligible = POOL.slice(0, eligibleCount);
        const chosen = shuffle(eligible, random).slice(0, config.types);
        const shelves = [];

        // Esta plantilla se resuelve llevando cada pieza suelta a su pareja y
        // después reuniendo las piezas de la segunda mitad. Los movimientos de
        // mezcla de abajo son reversibles, por lo que no crean tableros imposibles.
        for (let i = 0; i < half; i++) shelves.push({ items: [chosen[i], chosen[i], null], layers: [] });
        for (let i = 0; i < half; i++) shelves.push({ items: [chosen[i], chosen[half + i], null], layers: [] });
        for (let i = 0; i < half; i++) {
            shelves.push({ items: [chosen[half + i], chosen[half + ((i + 1) % half)], null], layers: [] });
        }

        const hiddenIndices = shuffle(Array.from({ length: half }, (_, i) => i), random).slice(0, config.hiddenShelves);
        for (let wave = 0; wave < config.layers; wave++) {
            const other = shuffle(eligible.filter(id => !chosen.includes(id)), random);
            const hiddenTypes = [...other, ...shuffle(chosen, random)].slice(0, config.hiddenShelves);
            const waveShelves = hiddenIndices.map(() => []);
            hiddenTypes.forEach((itemId, index) => {
                for (let offset = 0; offset < 3; offset++) {
                    waveShelves[(index + offset) % hiddenIndices.length].push(itemId);
                }
            });
            hiddenIndices.forEach((shelfIndex, index) => {
                shelves[shelfIndex].layers.push(shuffle(waveShelves[index], random));
            });
        }

        const splitCount = Math.min(half, Math.max(1, Math.floor(config.scrambleMoves / 3)));
        shuffle(Array.from({ length: half }, (_, i) => i), random).slice(0, splitCount).forEach(pairIndex => {
            const source = shelves[pairIndex].items;
            const target = shelves[half * 2 + pairIndex].items;
            target[target.indexOf(null)] = source[source.indexOf(chosen[pairIndex])];
            source[source.indexOf(chosen[pairIndex])] = null;
        });

        for (let step = splitCount; step < config.scrambleMoves; step++) {
            const candidates = [];
            shelves.forEach((source, sourceIndex) => {
                if (source.items.filter(Boolean).length < 2) return;
                source.items.forEach((itemId, slotIndex) => {
                    if (!itemId) return;
                    shelves.forEach((target, targetIndex) => {
                        if (sourceIndex === targetIndex || !target.items.includes(null)) return;
                        if (target.items.filter(item => item === itemId).length === 2) return;
                        candidates.push({ sourceIndex, slotIndex, targetIndex });
                    });
                });
            });
            if (!candidates.length) break;
            const move = candidates[Math.floor(random() * candidates.length)];
            const source = shelves[move.sourceIndex].items;
            const target = shelves[move.targetIndex].items;
            target[target.indexOf(null)] = source[move.slotIndex];
            source[move.slotIndex] = null;
        }

        shelves.forEach(shelf => { shelf.items = shuffle(shelf.items, random); });
        return { config, shelves: shuffle(shelves, random) };
    }

    window.PokeSortLevels = { count: LEVELS.length, getConfig, getUnlocked, unlockAfter, buildLevel };
})();
