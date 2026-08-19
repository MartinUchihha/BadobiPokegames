const RANKING_STORAGE_KEY =
    "badobiPokedlePersonalRanking";

const rankingGeneration = document.querySelector(
    "#ranking-generation"
);

const rankingMode = document.querySelector("#ranking-mode");
const rankingBody = document.querySelector("#ranking-body");
const rankingEmpty = document.querySelector("#ranking-empty");

const rankingTableWrapper = document.querySelector(
    "#ranking-table-wrapper"
);

const clearRankingButton = document.querySelector(
    "#clear-ranking"
);

function obtenerRanking() {
    const savedRanking = localStorage.getItem(
        RANKING_STORAGE_KEY
    );

    if (!savedRanking) {
        return [];
    }

    try {
        return JSON.parse(savedRanking);
    } catch (error) {
        console.error(
            "No se pudo leer el ranking",
            error
        );

        return [];
    }
}

function mostrarRanking() {
    const ranking = obtenerRanking();

    const selectedGeneration = rankingGeneration.value;
    const selectedMode = rankingMode.value;

    const filteredRanking = ranking.filter(game => {
        const generationMatches =
            selectedGeneration === "all"
            || game.generation === selectedGeneration;

        const modeMatches =
            selectedMode === "all"
            || game.mode === selectedMode;

        return generationMatches && modeMatches;
    });

    rankingBody.innerHTML = "";

    if (filteredRanking.length === 0) {
        rankingEmpty.classList.remove("is-hidden");
        rankingTableWrapper.classList.add("is-hidden");
        return;
    }

    rankingEmpty.classList.add("is-hidden");
    rankingTableWrapper.classList.remove("is-hidden");

    filteredRanking.forEach((game, index) => {
        const row = document.createElement("tr");

        row.appendChild(
            crearCeldaPosicion(index + 1)
        );

        row.appendChild(
            crearCelda(game.generation)
        );

        row.appendChild(
            crearCeldaModo(game.mode)
        );

        row.appendChild(
            crearCelda(String(game.attempts))
        );

        row.appendChild(
            crearCelda(formatearTiempo(game.seconds))
        );

        row.appendChild(
            crearCelda(formatearFecha(game.date))
        );

        rankingBody.appendChild(row);
    });
}

function crearCelda(text) {
    const cell = document.createElement("td");
    cell.textContent = text;
    return cell;
}

function crearCeldaPosicion(position) {
    const cell = document.createElement("td");
    cell.className = "ranking-position";

    const medals = {
        1: "🥇",
        2: "🥈",
        3: "🥉"
    };

    cell.textContent = medals[position] || `#${position}`;

    return cell;
}

function crearCeldaModo(mode) {
    const cell = document.createElement("td");
    const badge = document.createElement("span");

    badge.textContent = mode;
    badge.className =
        mode === "Difícil"
            ? "mode-badge difficult"
            : "mode-badge normal";

    cell.appendChild(badge);
    return cell;
}

function formatearTiempo(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return [
        String(minutes).padStart(2, "0"),
        String(seconds).padStart(2, "0")
    ].join(":");
}

function formatearFecha(date) {
    const parsedDate = new Date(date);

    return new Intl.DateTimeFormat("es", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    }).format(parsedDate);
}

rankingGeneration.addEventListener(
    "change",
    mostrarRanking
);

rankingMode.addEventListener(
    "change",
    mostrarRanking
);

clearRankingButton.addEventListener("click", () => {
    const confirmation = window.confirm(
        "¿Seguro que quieres borrar tu ranking personal?"
    );

    if (!confirmation) {
        return;
    }

    localStorage.removeItem(RANKING_STORAGE_KEY);
    mostrarRanking();
});

mostrarRanking();