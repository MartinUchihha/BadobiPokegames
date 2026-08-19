const STATS_STORAGE_KEY = "badobiPokedleStats";

const playedElement = document.querySelector("#stat-played");
const victoriesElement = document.querySelector("#stat-victories");
const defeatsElement = document.querySelector("#stat-defeats");
const winRateElement = document.querySelector("#stat-win-rate");
const bestAttemptsElement = document.querySelector(
    "#stat-best-attempts"
);
const averageAttemptsElement = document.querySelector(
    "#stat-average-attempts"
);
const currentStreakElement = document.querySelector(
    "#stat-current-streak"
);
const bestStreakElement = document.querySelector(
    "#stat-best-streak"
);
const totalTimeElement = document.querySelector("#stat-total-time");
const resetButton = document.querySelector("#reset-stats");

function obtenerEstadisticas() {
    const savedStats = localStorage.getItem(
        STATS_STORAGE_KEY
    );

    if (!savedStats) {
        return crearEstadisticasVacias();
    }

    try {
        return {
            ...crearEstadisticasVacias(),
            ...JSON.parse(savedStats)
        };
    } catch (error) {
        console.error(
            "No se pudieron leer las estadísticas",
            error
        );

        return crearEstadisticasVacias();
    }
}

function crearEstadisticasVacias() {
    return {
        played: 0,
        victories: 0,
        defeats: 0,
        totalAttempts: 0,
        bestAttempts: null,
        currentStreak: 0,
        bestStreak: 0,
        totalSeconds: 0
    };
}

function mostrarEstadisticas() {
    const stats = obtenerEstadisticas();

    const winRate = stats.played === 0
        ? 0
        : Math.round(
            (stats.victories / stats.played) * 100
        );

    const averageAttempts = stats.played === 0
        ? null
        : stats.totalAttempts / stats.played;

    playedElement.textContent = stats.played;
    victoriesElement.textContent = stats.victories;
    defeatsElement.textContent = stats.defeats;
    winRateElement.textContent = `${winRate}%`;

    bestAttemptsElement.textContent =
        stats.bestAttempts === null
            ? "—"
            : `${stats.bestAttempts} intentos`;

    averageAttemptsElement.textContent =
        averageAttempts === null
            ? "—"
            : averageAttempts.toFixed(1);

    currentStreakElement.textContent =
        stats.currentStreak;

    bestStreakElement.textContent =
        stats.bestStreak;

    totalTimeElement.textContent =
        formatearTiempo(stats.totalSeconds);
}

function formatearTiempo(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor(
        (totalSeconds % 3600) / 60
    );
    const seconds = totalSeconds % 60;

    if (hours > 0) {
        return [
            String(hours).padStart(2, "0"),
            String(minutes).padStart(2, "0"),
            String(seconds).padStart(2, "0")
        ].join(":");
    }

    return [
        String(minutes).padStart(2, "0"),
        String(seconds).padStart(2, "0")
    ].join(":");
}

resetButton.addEventListener("click", () => {
    const confirmation = window.confirm(
        "¿Seguro que quieres borrar todas tus estadísticas?"
    );

    if (!confirmation) {
        return;
    }

    localStorage.removeItem(STATS_STORAGE_KEY);
    mostrarEstadisticas();
});

mostrarEstadisticas();