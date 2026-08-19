const STATS_STORAGE_KEY = "badobiPokedleStats";

const achievementsCount = document.querySelector(
    "#achievements-count"
);

const achievementsProgressBar = document.querySelector(
    "#achievements-progress-bar"
);

function obtenerEstadisticas() {
    const emptyStats = {
        played: 0,
        victories: 0,
        defeats: 0,
        totalAttempts: 0,
        bestAttempts: null,
        currentStreak: 0,
        bestStreak: 0,
        totalSeconds: 0
    };

    const savedStats = localStorage.getItem(
        STATS_STORAGE_KEY
    );

    if (!savedStats) {
        return emptyStats;
    }

    try {
        return {
            ...emptyStats,
            ...JSON.parse(savedStats)
        };
    } catch (error) {
        console.error(
            "No se pudieron leer las estadísticas",
            error
        );

        return emptyStats;
    }
}

function cargarLogros() {
    const stats = obtenerEstadisticas();

    const achievements = [
        {
            id: "achievement-first-game",
            unlocked: stats.played >= 1
        },
        {
            id: "achievement-first-win",
            unlocked: stats.victories >= 1
        },
        {
            id: "achievement-first-try",
            unlocked: stats.bestAttempts === 1
        },
        {
            id: "achievement-five-wins",
            unlocked: stats.victories >= 5
        },
        {
            id: "achievement-streak-three",
            unlocked: stats.bestStreak >= 3
        },
        {
            id: "achievement-ten-games",
            unlocked: stats.played >= 10
        },
        {
            id: "achievement-fifty-attempts",
            unlocked: stats.totalAttempts >= 50
        },
        {
            id: "achievement-twenty-five-wins",
            unlocked: stats.victories >= 25
        }
    ];

    let unlockedCount = 0;

    achievements.forEach((achievement, index) => {
        const card = document.querySelector(
            `#${achievement.id}`
        );

        if (!achievement.unlocked) {
            return;
        }

        unlockedCount += 1;

        card.classList.remove("locked");
        card.classList.add("unlocked");

        card.style.setProperty(
            "--achievement-delay",
            `${index * 80}ms`
        );

        const lock = card.querySelector(
            ".achievement-lock"
        );

        if (lock) {
            lock.textContent = "✓";
        }
    });

    achievementsCount.textContent =
        `${unlockedCount} / ${achievements.length}`;

    const progress =
        (unlockedCount / achievements.length) * 100;

    achievementsProgressBar.style.width =
        `${progress}%`;
}

cargarLogros();