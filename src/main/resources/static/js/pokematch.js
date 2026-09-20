document.addEventListener("DOMContentLoaded", () => {
    const setup = document.querySelector("#match-setup");
    const gameSection = document.querySelector("#match-game");
    const startButton = document.querySelector("#start-match");
    const leaveButton = document.querySelector("#leave-match");
    const playAgainButton = document.querySelector("#play-again");
    const setupError = document.querySelector("#setup-error");
    const modeCards = document.querySelectorAll(".mode-card");
    const sizeCards = document.querySelectorAll(".size-card");
    const setupTileCount = document.querySelector("#setup-tile-count");
    const setupPairCount = document.querySelector("#setup-pair-count");
    const setupTime = document.querySelector("#setup-time");

    const versusHeader = document.querySelector(".versus-header");
    const versusBadge = document.querySelector("#match-versus-badge");
    const rivalStatus = document.querySelector("#rival-status");
    const playerAvatar = document.querySelector(".player-user .player-avatar");
    const playerName = document.querySelector("#player-name");
    const rivalAvatar = document.querySelector(".rival-avatar");
    const rivalName = document.querySelector("#rival-name");
    const rivalDifficulty = document.querySelector("#rival-difficulty");

    const playerProgress = document.querySelector("#player-progress");
    const playerProgressBar = document.querySelector("#player-progress-bar");
    const playerScore = document.querySelector("#player-score");
    const rivalProgress = document.querySelector("#rival-progress");
    const rivalProgressBar = document.querySelector("#rival-progress-bar");
    const rivalScore = document.querySelector("#rival-score");
    const currentScore = document.querySelector("#current-score");
    const currentCombo = document.querySelector("#current-combo");
    const timer = document.querySelector("#match-timer");

    const board = document.querySelector("#match-board");
    const boardLoading = document.querySelector("#board-loading");
    const matchMessage = document.querySelector("#match-message");

    const resultOverlay = document.querySelector("#result-overlay");
    const resultIcon = document.querySelector("#result-icon");
    const resultEyebrow = document.querySelector("#result-eyebrow");
    const resultTitle = document.querySelector("#result-title");
    const resultDescription = document.querySelector("#result-description");
    const resultPairs = document.querySelector("#result-pairs");
    const resultCombo = document.querySelector("#result-combo");
    const resultScore = document.querySelector("#result-score");
    const resultTime = document.querySelector("#result-time");

    let selectedMode = "individual";
    let selectedTileCount = 48;
    let match = null;

    let tilesById = new Map();
    let tileElementsById = new Map();
    let blockersByTileId = new Map();
    let removedTileIds = new Set();
    let selectedTiles = [];

    let playerPairs = 0;
    let points = 0;
    let combo = 0;
    let maximumCombo = 0;
    let rivalPairsFound = 0;
    let rivalPoints = 0;
    let rivalCombo = 0;
    let remainingSeconds = 0;

    let gameActive = false;
    let processingSelection = false;
    let resultReported = false;
    let timerInterval = null;
    let rivalTimeout = null;
    let messageTimeout = null;

    loadPlayerProfile();

    modeCards.forEach((card) => {
        card.addEventListener("click", () => {
            modeCards.forEach((otherCard) => {
                otherCard.classList.remove("selected");
            });

            card.classList.add("selected");
            selectedMode = card.dataset.mode || "individual";
        });
    });

    sizeCards.forEach((card) => {
        card.addEventListener("click", () => {
            sizeCards.forEach((otherCard) => {
                otherCard.classList.remove("selected");
            });

            card.classList.add("selected");
            selectedTileCount = Number(card.dataset.tiles) || 48;
            updateSetupSummary(card);
        });
    });

    startButton.addEventListener("click", startMatch);

    playAgainButton.addEventListener("click", () => {
        resultOverlay.hidden = true;
        startMatch();
    });

    leaveButton.addEventListener("click", () => {
        if (window.confirm("¿Quieres salir de la partida actual?")) {
            returnToSetup();
        }
    });

    board.addEventListener("click", (event) => {
        const tileElement = event.target.closest(".match-tile");

        if (!tileElement || !board.contains(tileElement)) {
            return;
        }

        selectTile(Number(tileElement.dataset.tileId));
    });

    board.addEventListener("contextmenu", (event) => {
        event.preventDefault();
    });

    board.addEventListener("dragstart", (event) => {
        event.preventDefault();
    });

    function updateSetupSummary(card) {
        const totalTiles = Number(card.dataset.tiles);
        const totalSeconds = Number(card.dataset.seconds);

        setupTileCount.textContent = `${totalTiles} fichas`;
        setupPairCount.textContent = `${totalTiles / 2} parejas`;
        setupTime.textContent = formatDurationLabel(totalSeconds);
    }

    async function startMatch() {
        stopProcesses();

        startButton.disabled = true;
        startButton.textContent = "PREPARANDO...";
        setupError.hidden = true;
        resultOverlay.hidden = true;

        try {
            const parameters = new URLSearchParams({
                modo: selectedMode,
                fichas: String(selectedTileCount)
            });

            const response = await fetch(
                `/api/pokematch/partida?${parameters}`,
                {
                    method: "POST",
                    headers: {
                        Accept: "application/json"
                    }
                }
            );

            if (!response.ok) {
                throw new Error(
                    `No se pudo crear la partida: ${response.status}`
                );
            }

            await prepareMatch(await response.json());
        } catch (error) {
            console.error(error);
            setup.hidden = false;
            gameSection.hidden = true;
            setupError.textContent =
                "No se pudo comenzar la partida. "
                + "Comprueba tu conexión e inténtalo nuevamente.";
            setupError.hidden = false;
        } finally {
            startButton.disabled = false;
            startButton.textContent = "COMENZAR PARTIDA";
        }
    }

    async function prepareMatch(newMatch) {
        match = newMatch;
        tilesById = new Map();
        tileElementsById = new Map();
        blockersByTileId = new Map();
        removedTileIds = new Set();
        selectedTiles = [];

        playerPairs = 0;
        points = 0;
        combo = 0;
        maximumCombo = 0;
        rivalPairsFound = 0;
        rivalPoints = 0;
        rivalCombo = 0;
        remainingSeconds = match.duracionSegundos;
        gameActive = false;
        processingSelection = true;
        resultReported = false;

        setup.hidden = true;
        gameSection.hidden = false;
        boardLoading.hidden = false;
        timer.classList.remove("danger");

        configureGameMode();
        renderBoard();
        createBlockerIndex();
        updateInterface();
        updateTileStates();

        await waitForBoardPaint();

        if (!match || match.partidaId !== newMatch.partidaId) {
            return;
        }

        boardLoading.hidden = true;
        gameActive = true;
        processingSelection = false;
        startTimer();

        if (isVersusMode()) {
            scheduleRivalMove();
        }
    }

    function configureGameMode() {
        if (isVersusMode()) {
            rivalStatus.hidden = false;
            versusBadge.textContent = "VS";
            versusHeader.style.gridTemplateColumns =
                "minmax(0, 1fr) auto minmax(0, 1fr)";
            rivalName.textContent = match.nombreRival || "Entrenador";
            rivalDifficulty.textContent = match.nivelRival || "Normal";
            rivalDifficulty.dataset.level = (
                match.nivelRival || "Normal"
            ).toLowerCase();
            showRivalImage(match.imagenRivalUrl, match.nombreRival);
        } else {
            rivalStatus.hidden = true;
            versusBadge.textContent = "SOLO";
            versusHeader.style.gridTemplateColumns =
                "minmax(0, 1fr) auto";
        }
    }

    function showRivalImage(imageUrl, name) {
        rivalAvatar.replaceChildren();

        if (!imageUrl) {
            rivalAvatar.textContent = "⚔️";
            return;
        }

        const image = document.createElement("img");
        image.alt = name || "Entrenador rival";
        image.draggable = false;
        image.decoding = "async";

        image.addEventListener("error", () => {
            rivalAvatar.textContent = "⚔️";
        });

        image.src = imageUrl;
        rivalAvatar.appendChild(image);
    }

    async function loadPlayerProfile() {
        try {
            const response = await fetch("/api/ranking/perfil");
            const profile = await response.json();

            if (!profile.registrado) {
                return;
            }

            playerName.textContent = profile.nombre;
            renderPlayerAvatar(profile.avatar, profile.nombre);
        } catch (error) {
            console.warn("No se pudo cargar el perfil del entrenador");
        }
    }

    function renderPlayerAvatar(avatar, name) {
        playerAvatar.replaceChildren();

        if (!avatar?.startsWith("pokemon-")) {
            playerAvatar.textContent = avatar || "🧢";
            return;
        }

        const pokemonId = Number(avatar.slice("pokemon-".length));
        const image = document.createElement("img");
        image.src = "https://raw.githubusercontent.com/"
            + "PokeAPI/sprites/master/sprites/pokemon/"
            + `${pokemonId}.png`;
        image.alt = `Avatar de ${name}`;
        image.draggable = false;
        image.addEventListener("error", () => {
            playerAvatar.textContent = "🧢";
        }, { once: true });
        playerAvatar.appendChild(image);
    }

    function renderBoard() {
        board.replaceChildren();
        tilesById.clear();
        tileElementsById.clear();

        board.dataset.size = String(match.totalFichas);
        board.style.setProperty("--tile-width", `${match.anchoFicha}%`);
        board.style.setProperty("--tile-height", `${match.altoFicha}%`);

        const fragment = document.createDocumentFragment();

        match.fichas.forEach((tile, index) => {
            tilesById.set(tile.id, tile);

            const button = document.createElement("button");
            button.type = "button";
            button.className = "match-tile";
            button.dataset.tileId = String(tile.id);
            button.dataset.pokemonId = String(tile.pokemonId);
            button.style.left = `${tile.posicionX}%`;
            button.style.top = `${tile.posicionY}%`;
            button.style.zIndex = String(10 + tile.capa);
            button.style.animationDelay = `${Math.min(index * 4, 160)}ms`;
            button.setAttribute("aria-label", tile.nombre);

            const image = document.createElement("img");
            image.src = tile.imagenUrl;
            image.alt = "";
            image.draggable = false;
            image.decoding = "async";

            image.addEventListener("error", () => {
                image.remove();

                if (!button.querySelector(".tile-image-fallback")) {
                    const fallback = document.createElement("span");
                    fallback.className = "tile-image-fallback";
                    fallback.textContent = "◉";
                    button.appendChild(fallback);
                }
            }, { once: true });

            button.appendChild(image);
            tileElementsById.set(tile.id, button);
            fragment.appendChild(button);
        });

        board.appendChild(fragment);
    }

    function createBlockerIndex() {
        blockersByTileId.clear();

        match.fichas.forEach((tile) => {
            const blockers = [];

            match.fichas.forEach((otherTile) => {
                if (
                    otherTile.id !== tile.id
                    && otherTile.capa > tile.capa
                    && tilesOverlap(tile, otherTile)
                ) {
                    blockers.push(otherTile.id);
                }
            });

            blockersByTileId.set(tile.id, blockers);
        });
    }

    function selectTile(tileId) {
        if (
            !gameActive
            || processingSelection
            || removedTileIds.has(tileId)
        ) {
            return;
        }

        const tile = tilesById.get(tileId);
        const element = tileElementsById.get(tileId);

        if (!tile || !element || isTileBlocked(tileId)) {
            return;
        }

        const selectedIndex = selectedTiles.findIndex(
            (selectedTile) => selectedTile.id === tileId
        );

        if (selectedIndex >= 0) {
            selectedTiles.splice(selectedIndex, 1);
            element.classList.remove("selected");
            return;
        }

        selectedTiles.push(tile);
        element.classList.add("selected");

        if (selectedTiles.length === 2) {
            checkSelectedPair();
        }
    }

    function checkSelectedPair() {
        processingSelection = true;

        const [firstTile, secondTile] = selectedTiles;
        const firstElement = tileElementsById.get(firstTile.id);
        const secondElement = tileElementsById.get(secondTile.id);

        if (firstTile.pokemonId === secondTile.pokemonId) {
            processCorrectPair(
                firstTile,
                secondTile,
                firstElement,
                secondElement
            );
        } else {
            processIncorrectPair(firstElement, secondElement);
        }
    }

    function processCorrectPair(
        firstTile,
        secondTile,
        firstElement,
        secondElement
    ) {
        combo += 1;
        maximumCombo = Math.max(maximumCombo, combo);

        const earnedPoints = 100 + Math.min(combo - 1, 4) * 25;

        points += earnedPoints;
        playerPairs += 1;
        removedTileIds.add(firstTile.id);
        removedTileIds.add(secondTile.id);

        firstElement.classList.remove("selected");
        secondElement.classList.remove("selected");
        firstElement.classList.add("matched");
        secondElement.classList.add("matched");

        showPlayerMessage(earnedPoints);
        updateInterface();

        window.setTimeout(() => {
            firstElement.hidden = true;
            secondElement.hidden = true;
            selectedTiles = [];
            processingSelection = false;
            updateTileStates();

            if (gameActive && playerPairs >= match.totalParejas) {
                finishMatch("player_completed");
            }
        }, 280);
    }

    function processIncorrectPair(firstElement, secondElement) {
        combo = 0;
        firstElement.classList.add("incorrect");
        secondElement.classList.add("incorrect");
        updateInterface();

        window.setTimeout(() => {
            firstElement.classList.remove("selected", "incorrect");
            secondElement.classList.remove("selected", "incorrect");
            selectedTiles = [];
            processingSelection = false;
        }, 260);
    }

    function updateTileStates() {
        tileElementsById.forEach((element, tileId) => {
            if (removedTileIds.has(tileId)) {
                return;
            }

            const blocked = isTileBlocked(tileId);
            const tile = tilesById.get(tileId);

            element.disabled = blocked;
            element.classList.toggle("blocked", blocked);
            element.classList.toggle("available", !blocked);
            element.setAttribute("aria-disabled", String(blocked));
            element.setAttribute(
                "aria-label",
                blocked
                    ? `${tile.nombre}, ficha bloqueada`
                    : `${tile.nombre}, ficha disponible`
            );
        });
    }

    function isTileBlocked(tileId) {
        const blockers = blockersByTileId.get(tileId) || [];
        return blockers.some((blockerId) => !removedTileIds.has(blockerId));
    }

    function tilesOverlap(firstTile, secondTile) {
        const horizontalOverlap =
            firstTile.posicionX < secondTile.posicionX + match.anchoFicha
            && firstTile.posicionX + match.anchoFicha > secondTile.posicionX;

        const verticalOverlap =
            firstTile.posicionY < secondTile.posicionY + match.altoFicha
            && firstTile.posicionY + match.altoFicha > secondTile.posicionY;

        return horizontalOverlap && verticalOverlap;
    }

    function updateInterface() {
        if (!match) {
            return;
        }

        playerProgress.textContent = `${playerPairs} / ${match.totalParejas}`;
        playerProgressBar.style.width =
            `${calculatePercentage(playerPairs, match.totalParejas)}%`;
        playerScore.textContent = `${formatNumber(points)} pts`;
        currentScore.textContent = formatNumber(points);
        currentCombo.textContent = `×${combo}`;

        rivalProgress.textContent =
            `${rivalPairsFound} / ${match.totalParejas}`;
        rivalProgressBar.style.width =
            `${calculatePercentage(rivalPairsFound, match.totalParejas)}%`;
        rivalScore.textContent = `${formatNumber(rivalPoints)} pts`;

        timer.textContent = formatTime(remainingSeconds);
        timer.classList.toggle("danger", remainingSeconds <= 20);
    }

    function startTimer() {
        clearInterval(timerInterval);

        timerInterval = window.setInterval(() => {
            if (!gameActive) {
                return;
            }

            remainingSeconds -= 1;

            if (remainingSeconds <= 0) {
                remainingSeconds = 0;
                updateInterface();
                finishMatch("time_finished");
                return;
            }

            updateInterface();
        }, 1000);
    }

    function scheduleRivalMove() {
        clearTimeout(rivalTimeout);

        if (
            !gameActive
            || !isVersusMode()
            || rivalPairsFound >= match.totalParejas
        ) {
            return;
        }

        const timePerPair =
            match.duracionSegundos * 1000 / match.totalParejas;
        const speedMultiplier = Number(match.velocidadRival) || 0.83;
        const rivalBaseTime = Math.max(
            1800,
            timePerPair * speedMultiplier
        );
        const variation = 0.78 + Math.random() * 0.44;
        const delay = Math.round(rivalBaseTime * variation);

        rivalTimeout = window.setTimeout(() => {
            if (!gameActive) {
                return;
            }

            const accuracy = Number(match.precisionRival) || 0.80;

            if (Math.random() > accuracy) {
                rivalCombo = 0;
                showRivalMistake();
                scheduleRivalMove();
                return;
            }

            rivalCombo = Math.random() > 0.27
                ? rivalCombo + 1
                : 1;

            const earnedPoints =
                100 + Math.min(rivalCombo - 1, 4) * 25;

            rivalPairsFound += 1;
            rivalPoints += earnedPoints;
            showRivalMessage(earnedPoints);
            updateInterface();

            if (rivalPairsFound >= match.totalParejas) {
                finishMatch("rival_completed");
                return;
            }

            scheduleRivalMove();
        }, delay);
    }

    function showPlayerMessage(earnedPoints) {
        const text = combo >= 2
            ? `COMBO ×${combo}  +${earnedPoints}`
            : `¡PAREJA! +${earnedPoints}`;

        showMessage(text, "success");
    }

    function showRivalMessage(earnedPoints) {
        showMessage(`${match.nombreRival} +${earnedPoints}`, "rival");
    }

    function showRivalMistake() {
        showMessage(`${match.nombreRival} falló`, "rival-miss");
    }

    function showMessage(text, type) {
        clearTimeout(messageTimeout);
        matchMessage.textContent = text;
        matchMessage.className = `match-message ${type}`;

        messageTimeout = window.setTimeout(() => {
            matchMessage.textContent = "";
            matchMessage.className = "match-message";
        }, 820);
    }

    function finishMatch(reason) {
        if (!gameActive) {
            return;
        }

        gameActive = false;
        processingSelection = true;
        stopProcesses();

        const result = determineResult(reason);
        reportResult(reason);

        resultIcon.textContent = result.icon;
        resultEyebrow.textContent = result.eyebrow;
        resultTitle.textContent = result.title;
        resultDescription.textContent = result.description;
        resultPairs.textContent = `${playerPairs} / ${match.totalParejas}`;
        resultCombo.textContent = `×${maximumCombo}`;
        resultScore.textContent = formatNumber(points);
        resultTime.textContent = formatTime(
            match.duracionSegundos - remainingSeconds
        );

        window.setTimeout(() => {
            resultOverlay.hidden = false;
        }, 300);
    }

    async function reportResult(reason) {
        if (resultReported || !match) {
            return;
        }

        resultReported = true;

        try {
            const response = await fetch("/api/pokematch/resultado", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                body: new URLSearchParams({
                    puntuacion: String(points),
                    parejas: String(playerPairs),
                    totalFichas: String(match.totalFichas),
                    combo: String(maximumCombo),
                    victoria: String(didPlayerWin(reason)),
                    modo: match.modo || "INDIVIDUAL",
                    nivelRival: match.nivelRival || ""
                })
            });

            if (!response.ok) {
                throw new Error("No se pudo guardar el resultado");
            }
        } catch (error) {
            console.warn(error.message);
        }
    }

    function didPlayerWin(reason) {
        if (reason === "player_completed") {
            return true;
        }

        if (reason === "rival_completed" || !isVersusMode()) {
            return false;
        }

        if (playerPairs !== rivalPairsFound) {
            return playerPairs > rivalPairsFound;
        }

        return points > rivalPoints;
    }

    function determineResult(reason) {
        if (reason === "player_completed") {
            return {
                icon: "🏆",
                eyebrow: "TABLERO COMPLETADO",
                title: "¡Victoria!",
                description: isVersusMode()
                    ? `Derrotaste a ${match.nombreRival}.`
                    : "Encontraste todas las parejas."
            };
        }

        if (reason === "rival_completed") {
            return {
                icon: "⚔️",
                eyebrow: "EL RIVAL COMPLETÓ EL TABLERO",
                title: "¡Casi!",
                description:
                    `${match.nombreRival} terminó primero. `
                    + "La revancha te espera."
            };
        }

        if (!isVersusMode()) {
            return {
                icon: "⏱️",
                eyebrow: "TIEMPO TERMINADO",
                title: "¡Buen intento!",
                description:
                    `Encontraste ${playerPairs} `
                    + `de ${match.totalParejas} parejas.`
            };
        }

        if (playerPairs !== rivalPairsFound) {
            const playerWins = playerPairs > rivalPairsFound;

            return {
                icon: playerWins ? "🏆" : "⚔️",
                eyebrow: "TIEMPO TERMINADO",
                title: playerWins ? "¡Victoria!" : "Derrota",
                description: playerWins
                    ? "Encontraste más parejas que tu rival."
                    : `${match.nombreRival} encontró más parejas.`
            };
        }

        if (points !== rivalPoints) {
            const playerWins = points > rivalPoints;

            return {
                icon: playerWins ? "🏆" : "⚔️",
                eyebrow: "DESEMPATE POR PUNTOS",
                title: playerWins ? "¡Victoria!" : "Derrota",
                description: playerWins
                    ? "Tus combos te dieron la victoria."
                    : `${match.nombreRival} consiguió más puntos.`
            };
        }

        return {
            icon: "🤝",
            eyebrow: "RESULTADO FINAL",
            title: "¡Empate!",
            description: "Ambos entrenadores terminaron igualados."
        };
    }

    function stopProcesses() {
        clearInterval(timerInterval);
        clearTimeout(rivalTimeout);
        clearTimeout(messageTimeout);
        timerInterval = null;
        rivalTimeout = null;
        messageTimeout = null;
    }

    function returnToSetup() {
        gameActive = false;
        processingSelection = false;
        stopProcesses();

        match = null;
        selectedTiles = [];
        removedTileIds.clear();
        tilesById.clear();
        tileElementsById.clear();
        blockersByTileId.clear();

        board.replaceChildren();
        matchMessage.textContent = "";
        resultOverlay.hidden = true;
        gameSection.hidden = true;
        setup.hidden = false;
        boardLoading.hidden = false;
    }

    function isVersusMode() {
        return match?.modo === "VERSUS_IA";
    }

    function calculatePercentage(value, maximum) {
        if (maximum <= 0) {
            return 0;
        }

        return Math.min(100, Math.max(0, value / maximum * 100));
    }

    function formatNumber(value) {
        return new Intl.NumberFormat("es-CL").format(value);
    }

    function formatTime(totalSeconds) {
        const safeSeconds = Math.max(0, totalSeconds);
        const minutes = Math.floor(safeSeconds / 60);
        const seconds = safeSeconds % 60;

        return `${String(minutes).padStart(2, "0")}:`
            + `${String(seconds).padStart(2, "0")}`;
    }

    function formatDurationLabel(totalSeconds) {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        if (seconds === 0) {
            return `${minutes} ${minutes === 1 ? "minuto" : "minutos"}`;
        }

        return `${minutes}:${String(seconds).padStart(2, "0")} minutos`;
    }

    function waitForBoardPaint() {
        return new Promise((resolve) => {
            window.requestAnimationFrame(() => {
                window.requestAnimationFrame(resolve);
            });
        });
    }
});
