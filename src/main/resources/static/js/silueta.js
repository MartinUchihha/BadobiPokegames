document.addEventListener("DOMContentLoaded", () => {
    const setup = document.getElementById("silhouette-setup");
    const game = document.getElementById("silhouette-game");
    const modeSelect = document.getElementById("silhouette-mode");
    const generationSelect = document.getElementById("silhouette-generation");
    const startButton = document.getElementById("silhouette-start");
    const classicStatus = document.getElementById("silhouette-classic-status");
    const timeStatus = document.getElementById("silhouette-time-status");
    const attemptNumber = document.getElementById("silhouette-attempt");
    const timer = document.getElementById("silhouette-timer");
    const score = document.getElementById("silhouette-score");
    const streak = document.getElementById("silhouette-streak");
    const imageWindow = document.querySelector(".silhouette-image-window");
    const image = document.getElementById("silhouette-image");
    const loading = document.getElementById("silhouette-loading");
    const form = document.getElementById("silhouette-form");
    const input = document.getElementById("silhouette-answer");
    const suggestions = document.getElementById("silhouette-suggestions");
    const skipButton = document.getElementById("silhouette-skip");
    const message = document.getElementById("silhouette-message");
    const attemptsSection = document.getElementById("silhouette-attempts-section");
    const attemptList = document.getElementById("silhouette-attempt-list");
    const newGameButton = document.getElementById("silhouette-new-game");
    const resultModal = document.getElementById("silhouette-result-modal");
    const resultIcon = document.getElementById("silhouette-result-icon");
    const resultTitle = document.getElementById("silhouette-result-title");
    const resultImage = document.getElementById("silhouette-result-image");
    const resultText = document.getElementById("silhouette-result-text");
    const resultClose = document.getElementById("silhouette-result-close");
    const soundToggle = document.getElementById("silhouette-sound-toggle");

    let pokemonList = [];
    let currentMode = "classic";
    let currentGeneration = "all";
    let selectedSuggestion = -1;
    let gameActive = false;
    let resumeClockAfterImage = false;
    let timerInterval = null;
    let remainingMilliseconds = 60_000;
    let lastTimerUpdate = 0;
    let timerFinishing = false;
    let soundMuted =
        localStorage.getItem("badobi-silhouette-muted") === "true";

    updateSoundButton();
    soundToggle.addEventListener("click", toggleSound);

    loadPokemonList();

    startButton.addEventListener("click", startGame);
    form.addEventListener("submit", submitAttempt);
    skipButton.addEventListener("click", skipPokemon);
    newGameButton.addEventListener("click", returnToSetup);

    resultClose.addEventListener("click", () => {
        closeResult();
        returnToSetup();
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
    });

    image.addEventListener("dragstart", event => event.preventDefault());
    resultImage.addEventListener("dragstart", event => event.preventDefault());
    imageWindow.addEventListener("contextmenu", event => event.preventDefault());

    image.addEventListener("load", async () => {
        loading.hidden = true;
        image.hidden = false;

        if (resumeClockAfterImage && currentMode === "time" && gameActive) {
            resumeClockAfterImage = false;
            await resumeTimeClock();
        }
    });

    input.addEventListener("input", () => {
        selectedSuggestion = -1;
        renderSuggestions();
    });

    input.addEventListener("keydown", event => {
        const options = Array.from(
            suggestions.querySelectorAll(".silhouette-suggestion")
        );

        if (options.length === 0) return;

        if (event.key === "ArrowDown") {
            event.preventDefault();
            selectedSuggestion = (selectedSuggestion + 1) % options.length;
            updateSelectedSuggestion(options);
        }

        if (event.key === "ArrowUp") {
            event.preventDefault();
            selectedSuggestion =
                (selectedSuggestion - 1 + options.length) % options.length;
            updateSelectedSuggestion(options);
        }

        if (event.key === "Enter" && selectedSuggestion >= 0) {
            event.preventDefault();
            options[selectedSuggestion].click();
        }

        if (event.key === "Escape") closeSuggestions();
    });

    document.addEventListener("click", event => {
        if (!input.contains(event.target) && !suggestions.contains(event.target)) {
            closeSuggestions();
        }
    });

    async function startGame() {
        currentMode = modeSelect.value;
        currentGeneration = generationSelect.value;
        setSetupEnabled(false);
        startButton.textContent = "Preparando...";

        try {
            const endpoint = currentMode === "time"
                ? "/silueta/tiempo/nueva-ronda"
                : "/silueta/nueva-partida";

            const result = await postForm(endpoint, {
                generacion: currentGeneration
            });

            resetGameView();
            setup.hidden = true;
            game.hidden = false;
            gameActive = true;

            if (currentMode === "time") {
                classicStatus.hidden = true;
                timeStatus.hidden = false;
                skipButton.hidden = false;
                attemptsSection.hidden = true;
                updateTimeStats(result);
                remainingMilliseconds = result.tiempo;
                updateTimerDisplay();
                resumeClockAfterImage = true;
            } else {
                classicStatus.hidden = false;
                timeStatus.hidden = true;
                skipButton.hidden = true;
                attemptsSection.hidden = false;
                attemptNumber.textContent = result.intento;
                resumeClockAfterImage = false;
            }

            loadCurrentImage(false);
        } catch (error) {
            startButton.textContent = "No se pudo iniciar. Reintentar";
        } finally {
            setSetupEnabled(true);
        }
    }

    async function submitAttempt(event) {
        event.preventDefault();
        if (!gameActive) return;

        const typedName = input.value.trim();
        if (!typedName) return;

        if (pokemonList.length === 0) {
            showMessage("Espera mientras se carga la lista de Pokémon.", "error");
            return;
        }

        const normalizedName = normalizePokemonName(typedName);
        const validPokemon = getAvailablePokemon().find(
            pokemon => pokemon.name === normalizedName
        );

        if (!validPokemon) {
            showMessage(
                "Selecciona un Pokémon válido de la generación elegida.",
                "error"
            );
            input.focus();
            return;
        }

        closeSuggestions();
        setFormEnabled(false);

        if (currentMode === "time") pauseClientClock();

        try {
            const endpoint = currentMode === "time"
                ? "/silueta/tiempo/intento"
                : "/silueta/intento";

            const result = await postForm(endpoint, {
                pokemonName: validPokemon.name
            });

            if (result.estado === "repetido") {
                showMessage("Ya intentaste con ese Pokémon.", "error");
                if (currentMode === "time") await resumeTimeClock(result.tiempo);
                else setFormEnabled(true);
                return;
            }

            if (result.estado === "sin-partida" || result.estado === "sin-ronda") {
                showMessage("La partida expiró. Inicia una nueva.", "error");
                finishGame();
                return;
            }

            input.value = "";

            if (currentMode === "time") {
                await handleTimeAttempt(result);
            } else {
                handleClassicAttempt(result);
            }
        } catch (error) {
            showMessage("No se pudo comprobar la respuesta.", "error");
            if (currentMode === "time" && gameActive) await resumeTimeClock();
            else if (gameActive) setFormEnabled(true);
        }
    }

    function handleClassicAttempt(result) {
        renderAttempts(result.historial, result.victoria);

        if (result.terminada) {
            revealClassicResult(result);
            return;
        }

        attemptNumber.textContent = result.intentos + 1;
        showMessage("No es ese Pokémon. Inténtalo nuevamente.", "error");
        setFormEnabled(true);
        input.focus();
    }

    async function handleTimeAttempt(result) {
        updateTimeStats(result);
        remainingMilliseconds = result.tiempo;
        updateTimerDisplay();

        if (result.terminada) {
            finishTimeRound(result);
            return;
        }

        if (result.correcto) {
            const solvedName = formatPokemonName(result.pokemonResuelto);
            showMessage(`¡Correcto! Era ${solvedName}.`, "success");
            playQuickSuccessSound();
            resumeClockAfterImage = true;
            loadCurrentImage(false);
        } else {
            showMessage("No es ese Pokémon.", "error");
            await resumeTimeClock(result.tiempo);
        }
    }

    async function skipPokemon() {
        if (!gameActive || currentMode !== "time") return;

        pauseClientClock();
        setFormEnabled(false);
        skipButton.disabled = true;

        try {
            const result = await postForm("/silueta/tiempo/saltar");
            updateTimeStats(result);
            remainingMilliseconds = result.tiempo;
            updateTimerDisplay();

            if (result.terminada) {
                finishTimeRound(result);
                return;
            }

            showMessage(
                `Era ${formatPokemonName(result.pokemonSaltado)}. Se restaron 5 segundos.`,
                "error"
            );
            input.value = "";
            resumeClockAfterImage = true;
            loadCurrentImage(false);
        } catch (error) {
            showMessage("No se pudo saltar el Pokémon.", "error");
            await resumeTimeClock();
        } finally {
            skipButton.disabled = false;
        }
    }

    function revealClassicResult(result) {
        const pokemonName = formatPokemonName(result.pokemon);
        loadCurrentImage(true);

        if (result.victoria) {
            showMessage(`¡Correcto! Era ${pokemonName}.`, "success");
            showResult(
                "¡Silueta descubierta!",
                "✨",
                `Era ${pokemonName}. Lo descubriste en ${result.intentos} intentos.`,
                "/silueta/imagen",
                true
            );
        } else {
            showMessage(`Se terminaron los intentos. Era ${pokemonName}.`, "error");
            showResult(
                "Fin de la partida",
                "😵",
                `La respuesta era ${pokemonName}.`,
                "/silueta/imagen",
                false
            );
        }

        finishGame();
    }

    async function finishTimeByClock() {
        if (timerFinishing || !gameActive || currentMode !== "time") return;
        timerFinishing = true;
        pauseClientClock();

        try {
            const result = await postForm("/silueta/tiempo/finalizar");
            finishTimeRound(result);
        } catch (error) {
            showMessage("No se pudo finalizar la ronda.", "error");
        } finally {
            timerFinishing = false;
        }
    }

    function finishTimeRound(result) {
        pauseClientClock();
        updateTimeStats(result);
        remainingMilliseconds = 0;
        updateTimerDisplay();
        loadCurrentImage(true);

        showResult(
            "¡Tiempo terminado!",
            "⏱️",
            `Conseguiste ${result.puntos} puntos. Tu mejor racha fue ${result.mejorRacha}.`,
            "/silueta/tiempo/imagen",
            result.puntos > 0
        );

        finishGame();
    }

    function loadCurrentImage(revealed) {
        loading.textContent = revealed
            ? "Revelando Pokémon..."
            : "Preparando silueta...";
        loading.hidden = false;
        image.hidden = true;

        const endpoint = currentMode === "time"
            ? "/silueta/tiempo/imagen"
            : "/silueta/imagen";

        image.src = `${endpoint}?t=${Date.now()}`;
    }

    async function resumeTimeClock(knownTime) {
        if (!gameActive || currentMode !== "time") return;

        try {
            let time = knownTime;
            if (time === undefined) {
                const result = await postForm("/silueta/tiempo/iniciar-reloj");
                if (result.estado === "sin-ronda") {
                    finishGame();
                    return;
                }
                time = result.tiempo;
            } else {
                const result = await postForm("/silueta/tiempo/iniciar-reloj");
                time = result.tiempo;
            }

            startClientClock(time);
            setFormEnabled(true);
            skipButton.disabled = false;
            input.focus();
        } catch (error) {
            showMessage("No se pudo reanudar el reloj.", "error");
        }
    }

    function startClientClock(milliseconds) {
        pauseClientClock();
        remainingMilliseconds = milliseconds;
        lastTimerUpdate = performance.now();
        updateTimerDisplay();

        timerInterval = window.setInterval(() => {
            const now = performance.now();
            remainingMilliseconds = Math.max(
                0,
                remainingMilliseconds - (now - lastTimerUpdate)
            );
            lastTimerUpdate = now;
            updateTimerDisplay();

            if (remainingMilliseconds <= 0) finishTimeByClock();
        }, 100);
    }

    function pauseClientClock() {
        if (timerInterval !== null) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }

    function updateTimerDisplay() {
        timer.textContent = (Math.max(0, remainingMilliseconds) / 1000).toFixed(1);
        timer.classList.toggle("danger", remainingMilliseconds <= 10_000);
    }

    function updateTimeStats(result) {
        if (result.puntos !== undefined) score.textContent = result.puntos;
        if (result.mejorRacha !== undefined) streak.textContent = result.mejorRacha;
    }

    function finishGame() {
        gameActive = false;
        pauseClientClock();
        setFormEnabled(false);
        skipButton.disabled = true;
        newGameButton.hidden = false;
    }

    function returnToSetup() {
        pauseClientClock();
        gameActive = false;
        game.hidden = true;
        setup.hidden = false;
        newGameButton.hidden = true;
        closeResult();
        startButton.textContent = "Empezar partida";
        showMessage("", "");
        modeSelect.focus();
    }

    function resetGameView() {
        pauseClientClock();
        timerFinishing = false;
        form.reset();
        newGameButton.hidden = true;
        attemptNumber.textContent = "1";
        score.textContent = "0";
        streak.textContent = "0";
        attemptList.innerHTML = "";

        const empty = document.createElement("p");
        empty.className = "silhouette-no-attempts";
        empty.textContent = "Todavía no has realizado ningún intento.";
        attemptList.appendChild(empty);

        showMessage("", "");
        setFormEnabled(true);
        skipButton.disabled = false;
    }

    function renderAttempts(history, victory) {
        attemptList.innerHTML = "";
        history.forEach((pokemonName, index) => {
            const item = document.createElement("span");
            item.className = "silhouette-attempt-item";
            item.textContent = formatPokemonName(pokemonName);
            if (victory && index === history.length - 1) {
                item.classList.add("correct");
            }
            attemptList.appendChild(item);
        });
    }

    function showResult(title, icon, text, endpoint, celebrate) {
        resultTitle.textContent = title;
        resultIcon.textContent = icon;
        resultText.textContent = text;
        resultImage.src = `${endpoint}?t=${Date.now()}`;
        resultModal.hidden = false;
        document.body.classList.add("silhouette-modal-open");
        if (celebrate) {
            launchConfetti();
            playSilhouetteVictorySound();
        } else {
            playSilhouetteDefeatSound();
        }
        resultClose.focus();
    }

    function closeResult() {
        resultModal.hidden = true;
        document.body.classList.remove("silhouette-modal-open");
    }

    function launchConfetti() {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        const colors = ["#ffcb05", "#3b82f6", "#ef4444", "#22c55e", "#a855f7"];

        for (let index = 0; index < 60; index++) {
            const piece = document.createElement("span");
            piece.className = "silhouette-confetti";
            piece.style.setProperty("--confetti-x", `${Math.random() * 100}vw`);
            piece.style.setProperty("--confetti-drift", `${Math.random() * 180 - 90}px`);
            piece.style.setProperty("--confetti-color", colors[index % colors.length]);
            piece.style.setProperty("--confetti-delay", `${Math.random() * 0.6}s`);
            document.body.appendChild(piece);
            setTimeout(() => piece.remove(), 4000);
        }
    }

    function playQuickSuccessSound() {
        if (soundMuted) return;

        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        const context = new AudioContextClass();
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(660, context.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(990, context.currentTime + 0.12);
        gain.gain.setValueAtTime(0.12, context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.2);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start();
        oscillator.stop(context.currentTime + 0.2);
        setTimeout(() => context.close(), 350);
    }

    function toggleSound() {
        soundMuted = !soundMuted;
        localStorage.setItem(
            "badobi-silhouette-muted",
            String(soundMuted)
        );
        updateSoundButton();
    }

    function updateSoundButton() {
        soundToggle.textContent = soundMuted ? "🔇" : "🔊";
        soundToggle.setAttribute(
            "aria-label",
            soundMuted ? "Activar sonidos" : "Silenciar sonidos"
        );
        soundToggle.setAttribute("aria-pressed", String(soundMuted));
    }

    function playSilhouetteVictorySound() {
        if (soundMuted) return;

        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;

        const audioContext = new AudioContextClass();
        const notes = [523.25, 659.25, 783.99, 1046.5];
        const startTime = audioContext.currentTime;

        notes.forEach((frequency, index) => {
            const oscillator = audioContext.createOscillator();
            const gain = audioContext.createGain();
            const noteStart = startTime + index * 0.13;

            oscillator.type = "triangle";
            oscillator.frequency.setValueAtTime(frequency, noteStart);
            gain.gain.setValueAtTime(0.0001, noteStart);
            gain.gain.exponentialRampToValueAtTime(0.18, noteStart + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.28);
            oscillator.connect(gain);
            gain.connect(audioContext.destination);
            oscillator.start(noteStart);
            oscillator.stop(noteStart + 0.3);
        });

        window.setTimeout(() => audioContext.close(), 1000);
    }

    function playSilhouetteDefeatSound() {
        if (soundMuted) return;

        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;

        const audioContext = new AudioContextClass();
        const notes = [392, 329.63, 261.63];
        const startTime = audioContext.currentTime;

        notes.forEach((frequency, index) => {
            const oscillator = audioContext.createOscillator();
            const gain = audioContext.createGain();
            const noteStart = startTime + index * 0.2;

            oscillator.type = "sine";
            oscillator.frequency.setValueAtTime(frequency, noteStart);
            gain.gain.setValueAtTime(0.0001, noteStart);
            gain.gain.exponentialRampToValueAtTime(0.14, noteStart + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.35);
            oscillator.connect(gain);
            gain.connect(audioContext.destination);
            oscillator.start(noteStart);
            oscillator.stop(noteStart + 0.38);
        });

        window.setTimeout(() => audioContext.close(), 1200);
    }

    async function loadPokemonList() {
        try {
            const response = await fetch("https://pokeapi.co/api/v2/pokemon?limit=1025");
            if (!response.ok) throw new Error("No se pudo cargar la lista");
            const data = await response.json();
            pokemonList = data.results.map(pokemon => {
                const parts = pokemon.url.split("/").filter(Boolean);
                return {
                    id: Number(parts[parts.length - 1]),
                    name: pokemon.name
                };
            });
        } catch (error) {
            pokemonList = [];
        }
    }

    function renderSuggestions() {
        const search = normalizePokemonName(input.value);
        suggestions.innerHTML = "";
        if (!search) {
            closeSuggestions();
            return;
        }

        const matches = getAvailablePokemon()
            .filter(pokemon => pokemon.name.startsWith(search))
            .slice(0, 8);

        if (matches.length === 0) {
            closeSuggestions();
            return;
        }

        matches.forEach(pokemon => {
            const option = document.createElement("button");
            option.type = "button";
            option.className = "pokemon-suggestion silhouette-suggestion";
            option.setAttribute("role", "option");
            const name = document.createElement("span");
            name.textContent = formatPokemonName(pokemon.name);
            option.appendChild(name);
            option.addEventListener("click", () => {
                input.value = formatPokemonName(pokemon.name);
                closeSuggestions();
                input.focus();
            });
            suggestions.appendChild(option);
        });

        suggestions.classList.add("visible");
        input.setAttribute("aria-expanded", "true");
    }

    function getAvailablePokemon() {
        if (currentGeneration === "all") return pokemonList;
        const ranges = {
            "1": [1, 151], "2": [152, 251], "3": [252, 386],
            "4": [387, 493], "5": [494, 649], "6": [650, 721],
            "7": [722, 809], "8": [810, 905], "9": [906, 1025]
        };
        const range = ranges[currentGeneration];
        if (!range) return pokemonList;
        return pokemonList.filter(
            pokemon => pokemon.id >= range[0] && pokemon.id <= range[1]
        );
    }

    function updateSelectedSuggestion(options) {
        options.forEach((option, index) => {
            const selected = index === selectedSuggestion;
            option.classList.toggle("selected", selected);
            option.setAttribute("aria-selected", String(selected));
        });
        options[selectedSuggestion].scrollIntoView({block: "nearest"});
    }

    function closeSuggestions() {
        suggestions.innerHTML = "";
        suggestions.classList.remove("visible");
        input.setAttribute("aria-expanded", "false");
        selectedSuggestion = -1;
    }

    function normalizePokemonName(name) {
        return name.trim().toLocaleLowerCase("es").replaceAll(" ", "-").replaceAll(".", "");
    }

    function formatPokemonName(name) {
        return name.split("-").map(
            part => part.charAt(0).toUpperCase() + part.slice(1)
        ).join(" ");
    }

    function showMessage(text, type) {
        message.textContent = text;
        message.classList.remove("success", "error");
        if (type) message.classList.add(type);
    }

    function setSetupEnabled(enabled) {
        startButton.disabled = !enabled;
        modeSelect.disabled = !enabled;
        generationSelect.disabled = !enabled;
    }

    function setFormEnabled(enabled) {
        input.disabled = !enabled;
        const submit = form.querySelector("button[type='submit']");
        if (submit) submit.disabled = !enabled;
    }

    async function postForm(endpoint, values = {}) {
        const body = new URLSearchParams();
        Object.entries(values).forEach(([key, value]) => body.append(key, value));
        const response = await fetch(endpoint, {
            method: "POST",
            headers: {"Content-Type": "application/x-www-form-urlencoded"},
            body
        });
        if (!response.ok) throw new Error("La solicitud falló");
        return response.json();
    }
});
