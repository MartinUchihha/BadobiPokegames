document.addEventListener("DOMContentLoaded", () => {
    const MAX_PLAYS = 5;

    const setup = document.getElementById("sound-game-setup");
    const game = document.getElementById("sound-game");
    const generationSelect = document.getElementById("sound-game-generation");
    const startButton = document.getElementById("sound-game-start");
    const attemptCounter = document.getElementById("sound-game-attempt");
    const playCounter = document.getElementById("sound-game-play-count");
    const player = document.querySelector(".sound-game-player");
    const waves = document.getElementById("sound-game-waves");
    const playButton = document.getElementById("sound-game-play");
    const playIcon = document.getElementById("sound-game-play-icon");
    const playText = document.getElementById("sound-game-play-text");
    const audio = document.getElementById("sound-game-audio");
    const form = document.getElementById("sound-game-form");
    const input = document.getElementById("sound-game-answer");
    const suggestions = document.getElementById("sound-game-suggestions");
    const message = document.getElementById("sound-game-message");
    const attemptList = document.getElementById("sound-game-attempt-list");
    const resultModal = document.getElementById("sound-game-result-modal");
    const resultIcon = document.getElementById("sound-game-result-icon");
    const resultTitle = document.getElementById("sound-game-result-title");
    const resultImage = document.getElementById("sound-game-result-image");
    const resultText = document.getElementById("sound-game-result-text");
    const restartButton = document.getElementById("sound-game-continue");

    let pokemonList = [];
    let currentGeneration = "all";
    let selectedSuggestion = -1;
    let playsUsed = 0;
    let gameActive = false;
    let submitting = false;
    let audioReady = false;

    loadPokemonList();

    startButton.addEventListener("click", startGame);
    playButton.addEventListener("click", playPokemonCry);
    form.addEventListener("submit", submitAttempt);
    restartButton.addEventListener("click", () => {
        closeResult();
        startGame();
    });

    function markAudioReady() {
        audioReady = true;
        updatePlayButton();
    }

    audio.addEventListener("loadedmetadata", markAudioReady);
    audio.addEventListener("loadeddata", markAudioReady);
    audio.addEventListener("canplay", markAudioReady);

    audio.addEventListener("playing", () => {
        waves.classList.add("playing");
        playIcon.textContent = "⏸";
        playText.textContent = "Reproduciendo...";
    });

    audio.addEventListener("ended", stopWaveAnimation);
    audio.addEventListener("pause", stopWaveAnimation);

    audio.addEventListener("error", () => {
        audioReady = false;
        playButton.disabled = true;
        playIcon.textContent = "⚠️";
        playText.textContent = "No se pudo cargar";
        showMessage(
            "No se pudo cargar el grito. Prueba una nueva partida.",
            "error"
        );
    });

    input.addEventListener("input", () => {
        selectedSuggestion = -1;
        renderSuggestions();
    });

    input.addEventListener("keydown", event => {
        const options = Array.from(
            suggestions.querySelectorAll(".sound-game-suggestion")
        );

        if (event.key === "Escape") {
            closeSuggestions();
            return;
        }

        if (options.length === 0) return;

        if (event.key === "ArrowDown") {
            event.preventDefault();
            selectedSuggestion =
                (selectedSuggestion + 1) % options.length;
            updateSelectedSuggestion(options);
        }

        if (event.key === "ArrowUp") {
            event.preventDefault();
            selectedSuggestion =
                (selectedSuggestion - 1 + options.length)
                % options.length;
            updateSelectedSuggestion(options);
        }

        if (event.key === "Enter" && selectedSuggestion >= 0) {
            event.preventDefault();
            options[selectedSuggestion].click();
        }
    });

    document.addEventListener("click", event => {
        if (
            !input.contains(event.target)
            && !suggestions.contains(event.target)
        ) {
            closeSuggestions();
        }
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

    resultImage.addEventListener(
        "dragstart",
        event => event.preventDefault()
    );

    async function startGame() {
        if (submitting) return;

        stopAudio();
        closeResult();
        currentGeneration = generationSelect.value;
        setSetupEnabled(false);
        startButton.textContent = "Preparando sonido...";

        try {
            const result = await postForm(
                "/sonidos/nueva-partida",
                {generacion: currentGeneration}
            );

            resetGameView(result.maxIntentos);
            setup.hidden = true;
            game.hidden = false;
            gameActive = true;
            prepareAudio();
            setFormEnabled(true);
            input.focus();
        } catch (error) {
            window.alert(
                "No pudimos preparar el sonido. Comprueba tu conexión e inténtalo nuevamente."
            );
        } finally {
            setSetupEnabled(true);
            startButton.textContent = "Empezar partida";
        }
    }

    function prepareAudio() {
        audioReady = false;
        audio.src = `/sonidos/audio?t=${Date.now()}`;
        audio.load();
        updatePlayButton();

        window.setTimeout(() => {
            if (
                gameActive
                && audio.networkState
                    !== HTMLMediaElement.NETWORK_NO_SOURCE
            ) {
                audioReady = true;
                updatePlayButton();
            }
        }, 2500);
    }

    async function playPokemonCry() {
        if (!gameActive || !audioReady || playsUsed >= MAX_PLAYS) {
            return;
        }

        try {
            audio.currentTime = 0;
            await audio.play();
            playsUsed++;
            updatePlayCounter();
            updatePlayButton();
        } catch (error) {
            showMessage(
                "El navegador no pudo reproducir el sonido. Pulsa nuevamente.",
                "error"
            );
        }
    }

    function stopWaveAnimation() {
        waves.classList.remove("playing");
        playIcon.textContent = "▶";
        playText.textContent = playsUsed >= MAX_PLAYS
            ? "Sin reproducciones"
            : "Reproducir nuevamente";
    }

    function stopAudio() {
        audio.pause();
        audio.removeAttribute("src");
        audio.load();
        stopWaveAnimation();
    }

    function updatePlayButton() {
        playButton.disabled =
            !gameActive || !audioReady || playsUsed >= MAX_PLAYS;

        if (!audioReady) {
            playIcon.textContent = "⏳";
            playText.textContent = "Cargando sonido...";
        } else if (playsUsed >= MAX_PLAYS) {
            playIcon.textContent = "🔇";
            playText.textContent = "Sin reproducciones";
        } else if (playsUsed === 0) {
            playIcon.textContent = "▶";
            playText.textContent = "Escuchar grito";
        } else if (audio.paused) {
            playIcon.textContent = "▶";
            playText.textContent = "Reproducir nuevamente";
        }
    }

    function updatePlayCounter() {
        playCounter.textContent = `${playsUsed}/${MAX_PLAYS}`;
    }

    async function submitAttempt(event) {
        event.preventDefault();

        if (!gameActive || submitting) return;

        const typedName = input.value.trim();
        if (!typedName) return;

        if (pokemonList.length === 0) {
            showMessage(
                "Espera mientras se carga la lista de Pokémon.",
                "error"
            );
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

        submitting = true;
        closeSuggestions();
        setFormEnabled(false);

        try {
            const result = await postForm(
                "/sonidos/intento",
                {pokemonName: validPokemon.name}
            );

            if (result.estado === "sin-partida") {
                showMessage(
                    "La partida expiró. Inicia una nueva.",
                    "error"
                );
                gameActive = false;
                return;
            }

            if (result.estado === "repetido") {
                showMessage(
                    "Ya intentaste con ese Pokémon.",
                    "error"
                );
                setFormEnabled(true);
                input.focus();
                return;
            }

            if (result.estado === "invalido") {
                showMessage("Escribe un Pokémon válido.", "error");
                setFormEnabled(true);
                input.focus();
                return;
            }

            input.value = "";
            renderAttempts(result.historial, result.victoria);

            if (result.estado === "terminada") {
                finishGame(result);
                return;
            }

            attemptCounter.textContent =
                `${result.intentos + 1}/5`;
            player.classList.add("incorrect");
            showMessage(
                `No es ese Pokémon. Te quedan ${result.restantes} intentos.`,
                "error"
            );

            window.setTimeout(
                () => player.classList.remove("incorrect"),
                600
            );

            setFormEnabled(true);
            input.focus();
        } catch (error) {
            showMessage(
                "No se pudo comprobar la respuesta. Inténtalo nuevamente.",
                "error"
            );
            setFormEnabled(true);
        } finally {
            submitting = false;
        }
    }

    function finishGame(result) {
        gameActive = false;
        stopAudio();
        setFormEnabled(false);
        updatePlayButton();

        const pokemonName = formatPokemonName(result.pokemon);
        attemptCounter.textContent = `${result.intentos}/5`;
        resultImage.src = result.imagen;
        resultImage.alt = pokemonName;

        if (result.victoria) {
            player.classList.add("correct");
            showMessage(`¡Correcto! Era ${pokemonName}.`, "success");
            resultIcon.textContent = "🎉";
            resultTitle.textContent = "¡Sonido descubierto!";
            resultText.textContent =
                `Era ${pokemonName}. Lo reconociste en ${result.intentos} intentos.`;
            playVictorySound();
            launchConfetti();
        } else {
            player.classList.add("incorrect");
            showMessage(
                `Se terminaron los intentos. Era ${pokemonName}.`,
                "error"
            );
            resultIcon.textContent = "🎧";
            resultTitle.textContent = "Fin de la partida";
            resultText.textContent =
                `El grito pertenecía a ${pokemonName}.`;
            playDefeatSound();
        }

        window.setTimeout(() => {
            resultModal.hidden = false;
            document.body.classList.add("sound-game-modal-open");
            restartButton.focus();
        }, 650);
    }

    function resetGameView(maxAttempts) {
        playsUsed = 0;
        audioReady = false;
        submitting = false;
        player.classList.remove("correct", "incorrect");
        input.value = "";
        attemptCounter.textContent = `1/${maxAttempts}`;
        updatePlayCounter();
        attemptList.innerHTML = "";

        const empty = document.createElement("p");
        empty.className = "sound-game-no-attempts";
        empty.textContent =
            "Todavía no has realizado ningún intento.";
        attemptList.appendChild(empty);
        showMessage("Pulsa el botón para escuchar el grito.", "");
    }

    function renderAttempts(history, victory) {
        attemptList.innerHTML = "";

        history.forEach((pokemonName, index) => {
            const item = document.createElement("span");
            item.className = "sound-game-attempt-item";
            item.textContent = formatPokemonName(pokemonName);

            if (victory && index === history.length - 1) {
                item.classList.add("correct");
            }

            attemptList.appendChild(item);
        });
    }

    async function loadPokemonList() {
        try {
            const response = await fetch(
                "https://pokeapi.co/api/v2/pokemon?limit=1025"
            );

            if (!response.ok) {
                throw new Error("No se pudo cargar la lista");
            }

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
            option.className = "sound-game-suggestion";
            option.setAttribute("role", "option");
            option.textContent = formatPokemonName(pokemon.name);

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
            "1": [1, 151],
            "2": [152, 251],
            "3": [252, 386],
            "4": [387, 493],
            "5": [494, 649],
            "6": [650, 721],
            "7": [722, 809],
            "8": [810, 905],
            "9": [906, 1025]
        };

        const range = ranges[currentGeneration];
        if (!range) return pokemonList;

        return pokemonList.filter(
            pokemon =>
                pokemon.id >= range[0]
                && pokemon.id <= range[1]
        );
    }

    function updateSelectedSuggestion(options) {
        options.forEach((option, index) => {
            const selected = index === selectedSuggestion;
            option.classList.toggle("selected", selected);
            option.setAttribute("aria-selected", String(selected));
        });

        options[selectedSuggestion].scrollIntoView({
            block: "nearest"
        });
    }

    function closeSuggestions() {
        suggestions.innerHTML = "";
        suggestions.classList.remove("visible");
        input.setAttribute("aria-expanded", "false");
        selectedSuggestion = -1;
    }

    function closeResult() {
        resultModal.hidden = true;
        document.body.classList.remove("sound-game-modal-open");
        player.classList.remove("correct", "incorrect");
    }

    function setSetupEnabled(enabled) {
        startButton.disabled = !enabled;
        generationSelect.disabled = !enabled;
    }

    function setFormEnabled(enabled) {
        input.disabled = !enabled;
        const submitButton = form.querySelector(
            "button[type='submit']"
        );
        submitButton.disabled = !enabled;
    }

    function showMessage(text, type) {
        message.textContent = text;
        message.classList.remove("success", "error");
        if (type) message.classList.add(type);
    }

    function normalizePokemonName(name) {
        return name
            .trim()
            .toLocaleLowerCase("es")
            .replaceAll(" ", "-")
            .replaceAll(".", "");
    }

    function formatPokemonName(name) {
        return name
            .split("-")
            .map(part =>
                part.charAt(0).toUpperCase() + part.slice(1)
            )
            .join(" ");
    }

    function playVictorySound() {
        playNotes(
            [523.25, 659.25, 783.99, 1046.5],
            0.13,
            "triangle"
        );
    }

    function playDefeatSound() {
        playNotes([392, 329.63, 261.63], 0.2, "sine");
    }

    function playNotes(notes, interval, type) {
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
                0.14,
                noteStart + 0.02
            );
            gain.gain.exponentialRampToValueAtTime(
                0.0001,
                noteStart + 0.3
            );
            oscillator.connect(gain);
            gain.connect(context.destination);
            oscillator.start(noteStart);
            oscillator.stop(noteStart + 0.32);
        });

        window.setTimeout(
            () => context.close(),
            Math.ceil((notes.length * interval + 0.6) * 1000)
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

        for (let index = 0; index < 65; index++) {
            const piece = document.createElement("span");
            piece.className = "sound-game-confetti";
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
