document.addEventListener("DOMContentLoaded", () => {
    const setup = document.getElementById("higher-lower-setup");
    const game = document.getElementById("higher-lower-game");
    const generationSelect = document.getElementById("higher-lower-generation");
    const startButton = document.getElementById("higher-lower-start");

    const scoreElement = document.getElementById("higher-lower-score");
    const bestElement = document.getElementById("higher-lower-best");
    const soundButton = document.getElementById("higher-lower-sound");
    const statBanner = document.querySelector(".higher-lower-stat-banner");
    const statIcon = document.getElementById("higher-lower-stat-icon");
    const statName = document.getElementById("higher-lower-stat-name");
    const progressText = document.getElementById("higher-lower-progress-text");
    const progressSteps = Array.from(
        document.querySelectorAll("#higher-lower-progress span")
    );

    const leftCard = document.getElementById("higher-lower-left-card");
    const leftImage = document.getElementById("higher-lower-left-image");
    const leftName = document.getElementById("higher-lower-left-name");
    const leftLabel = document.getElementById("higher-lower-left-label");
    const leftValue = document.getElementById("higher-lower-left-value");

    const rightCard = document.getElementById("higher-lower-right-card");
    const rightImage = document.getElementById("higher-lower-right-image");
    const rightName = document.getElementById("higher-lower-right-name");
    const rightLabel = document.getElementById("higher-lower-right-label");
    const rightValue = document.getElementById("higher-lower-right-value");

    const higherButton = document.getElementById("higher-lower-higher");
    const lowerButton = document.getElementById("higher-lower-lower");
    const message = document.getElementById("higher-lower-message");

    const resultModal = document.getElementById("higher-lower-result-modal");
    const resultIcon = document.getElementById("higher-lower-result-icon");
    const resultTitle = document.getElementById("higher-lower-result-title");
    const resultText = document.getElementById("higher-lower-result-text");
    const finalScore = document.getElementById("higher-lower-final-score");
    const restartButton = document.getElementById("higher-lower-restart");

    let gameActive = false;
    let answering = false;
    let bestBeforeGame = 0;
    let bestScore = Number(
        localStorage.getItem("badobi-higher-lower-best") || 0
    );
    let soundMuted =
        localStorage.getItem("badobi-higher-lower-muted") === "true";

    bestElement.textContent = String(bestScore);
    updateSoundButton();

    startButton.addEventListener("click", startGame);
    higherButton.addEventListener("click", () => answer("mayor"));
    lowerButton.addEventListener("click", () => answer("menor"));
    soundButton.addEventListener("click", toggleSound);
    restartButton.addEventListener("click", () => {
        closeResult();
        startGame();
    });

    resultModal.addEventListener("click", event => {
        if (event.target === resultModal) {
            closeResult();
        }
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && !resultModal.hidden) {
            closeResult();
        }

        if (!gameActive || answering) return;

        if (event.key === "ArrowUp") answer("mayor");
        if (event.key === "ArrowDown") answer("menor");
    });

    [leftImage, rightImage].forEach(pokemonImage => {
        pokemonImage.addEventListener(
            "dragstart",
            event => event.preventDefault()
        );
        pokemonImage.addEventListener(
            "contextmenu",
            event => event.preventDefault()
        );
    });

    async function startGame() {
        if (answering) return;

        closeResult();
        setStartEnabled(false);
        startButton.textContent = "Preparando Pokémon...";
        showMessage("", "");

        try {
            const state = await postForm(
                "/higher-lower/nueva-partida",
                {generacion: generationSelect.value}
            );

            gameActive = true;
            answering = false;
            bestBeforeGame = bestScore;
            setup.hidden = true;
            game.hidden = false;
            clearCardAnimations();
            renderState(state, true);
            setChoiceEnabled(true);
        } catch (error) {
            startButton.textContent = "No se pudo iniciar. Reintentar";
            showSetupError();
        } finally {
            setStartEnabled(true);
            if (gameActive) {
                startButton.textContent = "Empezar partida";
            }
        }
    }

    async function answer(choice) {
        if (!gameActive || answering) return;

        answering = true;
        setChoiceEnabled(false);
        showMessage("Comprobando respuesta...", "");

        try {
            const result = await postForm(
                "/higher-lower/responder",
                {respuesta: choice}
            );

            if (result.estado === "sin-partida") {
                gameActive = false;
                showMessage(
                    "La partida expiró. Vuelve a comenzar.",
                    "error"
                );
                setup.hidden = false;
                game.hidden = true;
                return;
            }

            revealRightValue(result);

            if (!result.correcto) {
                rightCard.classList.add("incorrect");
                showMessage(
                    `No era ${choice}. El valor era ${result.valor}.`,
                    "error"
                );
                playDefeatSound();
                await delay(950);
                finishGame(result.puntuacion);
                return;
            }

            rightCard.classList.add("correct");
            showMessage("¡Correcto! Sumas un punto.", "success");
            playCorrectSound();
            updateScore(result.puntuacion);
            await delay(900);

            clearCardAnimations();
            renderState(result, true);

            if (result.cambioEstadistica) {
                statBanner.classList.add("changing");
                showMessage(
                    `🔥 ¡Racha de 5! Nueva estadística: ${result.nombreEstadistica}.`,
                    "success"
                );
                playStatChangeSound();
                await delay(850);
                statBanner.classList.remove("changing");
            } else {
                showMessage("", "");
            }

            setChoiceEnabled(true);
            answering = false;
        } catch (error) {
            showMessage(
                "No se pudo comprobar la respuesta. Inténtalo nuevamente.",
                "error"
            );
            setChoiceEnabled(true);
            answering = false;
        }
    }

    function renderState(state, animate) {
        updateScore(state.puntuacion);
        renderStatistic(state.estadistica, state.nombreEstadistica);
        renderProgress(state.faltanParaCambio);

        leftImage.src = state.pokemonIzquierdo.imagen;
        leftImage.alt = formatPokemonName(state.pokemonIzquierdo.nombre);
        leftName.textContent = formatPokemonName(
            state.pokemonIzquierdo.nombre
        );
        leftLabel.textContent = state.nombreEstadistica;
        leftValue.textContent = state.pokemonIzquierdo.valor;

        rightImage.src = state.pokemonDerecho.imagen;
        rightImage.alt = formatPokemonName(state.pokemonDerecho.nombre);
        rightName.textContent = formatPokemonName(
            state.pokemonDerecho.nombre
        );
        rightLabel.textContent = state.nombreEstadistica;
        rightValue.textContent = "?";
        rightValue.classList.remove("higher-lower-right-value-reveal");

        if (animate) {
            leftCard.classList.add("entering");
            rightCard.classList.add("entering");
            window.setTimeout(() => {
                leftCard.classList.remove("entering");
                rightCard.classList.remove("entering");
            }, 600);
        }
    }

    function revealRightValue(result) {
        const revealed = result.pokemonResuelto;
        rightValue.textContent = revealed.valor;
        rightValue.classList.remove("higher-lower-right-value-reveal");
        void rightValue.offsetWidth;
        rightValue.classList.add("higher-lower-right-value-reveal");
    }

    function renderStatistic(statistic, displayName) {
        const icons = {
            "ps": "❤️",
            "ataque": "⚔️",
            "defensa": "🛡️",
            "ataque-especial": "✨",
            "defensa-especial": "🔮",
            "velocidad": "💨",
            "total": "📊"
        };

        statIcon.textContent = icons[statistic] || "📊";
        statName.textContent = displayName;
    }

    function renderProgress(remaining) {
        const completed = Math.max(0, 5 - remaining);

        progressSteps.forEach((step, index) => {
            step.classList.toggle("completed", index < completed);
        });

        progressText.textContent = remaining === 1
            ? "1 acierto para cambiar"
            : `${remaining} aciertos para cambiar`;
    }

    function updateScore(points) {
        scoreElement.textContent = String(points);

        if (points > bestScore) {
            bestScore = points;
            bestElement.textContent = String(bestScore);
            localStorage.setItem(
                "badobi-higher-lower-best",
                String(bestScore)
            );
        }
    }

    function finishGame(points) {
        gameActive = false;
        answering = false;
        setChoiceEnabled(false);
        updateScore(points);

        const newRecord = points > bestBeforeGame;
        resultIcon.textContent = newRecord ? "🏆" : "📊";
        resultTitle.textContent = newRecord
            ? "¡Nuevo récord!"
            : "Fin de la partida";
        resultText.textContent = newRecord
            ? "Superaste tu mejor puntuación en Higher or Lower."
            : "Buen intento. Ya puedes comenzar otra ronda.";
        finalScore.textContent = String(points);
        resultModal.hidden = false;
        document.body.classList.add("higher-lower-modal-open");

        if (newRecord && points > 0) {
            launchConfetti();
            playRecordSound();
        }

        restartButton.focus();
    }

    function closeResult() {
        resultModal.hidden = true;
        document.body.classList.remove("higher-lower-modal-open");
    }

    function clearCardAnimations() {
        leftCard.classList.remove("correct", "incorrect", "entering");
        rightCard.classList.remove("correct", "incorrect", "entering");
    }

    function setStartEnabled(enabled) {
        startButton.disabled = !enabled;
        generationSelect.disabled = !enabled;
    }

    function setChoiceEnabled(enabled) {
        higherButton.disabled = !enabled;
        lowerButton.disabled = !enabled;
    }

    function showMessage(text, type) {
        message.textContent = text;
        message.classList.remove("success", "error");
        if (type) message.classList.add(type);
    }

    function showSetupError() {
        window.alert(
            "No pudimos preparar los Pokémon. Comprueba tu conexión e inténtalo nuevamente."
        );
    }

    function toggleSound() {
        soundMuted = !soundMuted;
        localStorage.setItem(
            "badobi-higher-lower-muted",
            String(soundMuted)
        );
        updateSoundButton();
    }

    function updateSoundButton() {
        soundButton.textContent = soundMuted ? "🔇" : "🔊";
        soundButton.setAttribute(
            "aria-label",
            soundMuted ? "Activar sonidos" : "Silenciar sonidos"
        );
        soundButton.setAttribute(
            "aria-pressed",
            String(soundMuted)
        );
    }

    function playCorrectSound() {
        playNotes([659.25, 880], 0.1, "sine", 0.1);
    }

    function playStatChangeSound() {
        playNotes([523.25, 659.25, 783.99], 0.12, "triangle", 0.12);
    }

    function playDefeatSound() {
        playNotes([392, 329.63, 261.63], 0.18, "sine", 0.12);
    }

    function playRecordSound() {
        playNotes(
            [523.25, 659.25, 783.99, 1046.5],
            0.13,
            "triangle",
            0.15
        );
    }

    function playNotes(notes, interval, type, volume) {
        if (soundMuted) return;

        const AudioContextClass =
            window.AudioContext || window.webkitAudioContext;

        if (!AudioContextClass) return;

        const context = new AudioContextClass();
        const startTime = context.currentTime;

        notes.forEach((frequency, index) => {
            const oscillator = context.createOscillator();
            const gain = context.createGain();
            const noteStart = startTime + index * interval;

            oscillator.type = type;
            oscillator.frequency.setValueAtTime(frequency, noteStart);
            gain.gain.setValueAtTime(0.0001, noteStart);
            gain.gain.exponentialRampToValueAtTime(
                volume,
                noteStart + 0.02
            );
            gain.gain.exponentialRampToValueAtTime(
                0.0001,
                noteStart + 0.28
            );

            oscillator.connect(gain);
            gain.connect(context.destination);
            oscillator.start(noteStart);
            oscillator.stop(noteStart + 0.3);
        });

        window.setTimeout(
            () => context.close(),
            Math.ceil((notes.length * interval + 0.5) * 1000)
        );
    }

    function launchConfetti() {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            return;
        }

        const colors = [
            "#ffcb05",
            "#315da8",
            "#22c55e",
            "#ef4444",
            "#a855f7"
        ];

        for (let index = 0; index < 70; index++) {
            const piece = document.createElement("span");
            piece.className = "higher-lower-confetti";
            piece.style.setProperty(
                "--confetti-x",
                `${Math.random() * 100}vw`
            );
            piece.style.setProperty(
                "--confetti-drift",
                `${Math.random() * 180 - 90}px`
            );
            piece.style.setProperty(
                "--confetti-color",
                colors[index % colors.length]
            );
            piece.style.setProperty(
                "--confetti-delay",
                `${Math.random() * 0.55}s`
            );
            document.body.appendChild(piece);
            window.setTimeout(() => piece.remove(), 4000);
        }
    }

    function formatPokemonName(name) {
        return name
            .split("-")
            .map(part =>
                part.charAt(0).toUpperCase() + part.slice(1)
            )
            .join(" ");
    }

    function delay(milliseconds) {
        return new Promise(resolve => {
            window.setTimeout(resolve, milliseconds);
        });
    }

    async function postForm(endpoint, values = {}) {
        const body = new URLSearchParams();

        Object.entries(values).forEach(([key, value]) => {
            body.append(key, value);
        });

        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body
        });

        if (!response.ok) {
            throw new Error("La solicitud falló");
        }

        return response.json();
    }
});
