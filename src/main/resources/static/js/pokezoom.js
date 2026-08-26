document.addEventListener("DOMContentLoaded", () => {
    const setup = document.getElementById("pokezoom-setup");
    const game = document.getElementById("pokezoom-game");
    const generationSelect =
        document.getElementById("pokezoom-generation");
    const startButton =
        document.getElementById("pokezoom-start");

    const image = document.getElementById("pokezoom-image");
    const imageWindow = document.querySelector(
        ".pokezoom-image-window"
    );
    const loading =
        document.getElementById("pokezoom-loading");
    const attemptNumber =
        document.getElementById("pokezoom-attempt-number");
    const zoomLevel =
        document.getElementById("pokezoom-level");

    const form = document.getElementById("pokezoom-form");
    const input = document.getElementById("pokezoom-answer");
    const suggestions =
        document.getElementById("pokezoom-suggestions");
    const message =
        document.getElementById("pokezoom-message");
    const attemptList =
        document.getElementById("pokezoom-attempt-list");
    const newGameButton =
        document.getElementById("pokezoom-new-game");
        const soundToggle = document.getElementById(
            "pokezoom-sound-toggle"
        );
        const victoryModal = document.getElementById(
            "pokezoom-victory-modal"
        );

        const victoryImage = document.getElementById(
            "pokezoom-victory-image"
        );

        const victoryName = document.getElementById(
            "pokezoom-victory-name"
        );

        const victoryAttempts = document.getElementById(
            "pokezoom-victory-attempts"
        );

        const victoryClose = document.getElementById(
            "pokezoom-victory-close"
        );

    let pokemonList = [];
    let currentGeneration = "all";
    let selectedSuggestion = -1;
    let gameActive = false;
    let soundMuted =
        localStorage.getItem(
            "badobi-pokezoom-muted"
        ) === "true";

    loadPokemonList();
    updateSoundButton();

    startButton.addEventListener("click", startGame);
    form.addEventListener("submit", submitAttempt);
    newGameButton.addEventListener("click", returnToSetup);
    soundToggle.addEventListener(
        "click",
        toggleSound
    );
    victoryClose.addEventListener("click", () => {
        closeVictory();
        returnToSetup();
    });

    victoryModal.addEventListener("click", event => {
        if (event.target === victoryModal) {
            closeVictory();
        }
    });

    victoryImage.addEventListener("dragstart", event => {
        event.preventDefault();
    });

    document.addEventListener("keydown", event => {
        if (
            event.key === "Escape" &&
            !victoryModal.hidden
        ) {
            closeVictory();
        }
    });

    image.addEventListener("dragstart", event => {
        event.preventDefault();
    });

    imageWindow.addEventListener("contextmenu", event => {
        event.preventDefault();
    });

    input.addEventListener("input", () => {
        selectedSuggestion = -1;
        renderSuggestions();
    });

    input.addEventListener("keydown", event => {
        const options = Array.from(
            suggestions.querySelectorAll(
                ".pokemon-suggestion"
            )
        );

        if (options.length === 0) {
            return;
        }

        if (event.key === "ArrowDown") {
            event.preventDefault();

            selectedSuggestion =
                (selectedSuggestion + 1) %
                options.length;

            updateSelectedSuggestion(options);
        }

        if (event.key === "ArrowUp") {
            event.preventDefault();

            selectedSuggestion =
                (
                    selectedSuggestion - 1 +
                    options.length
                ) % options.length;

            updateSelectedSuggestion(options);
        }

        if (
            event.key === "Enter" &&
            selectedSuggestion >= 0
        ) {
            event.preventDefault();
            options[selectedSuggestion].click();
        }

        if (event.key === "Escape") {
            closeSuggestions();
        }
    });

    document.addEventListener("click", event => {
        if (
            !input.contains(event.target) &&
            !suggestions.contains(event.target)
        ) {
            closeSuggestions();
        }
    });

   image.addEventListener("load", () => {
       chooseVisibleFocus();

       loading.hidden = true;
       image.hidden = false;
   });

    async function startGame() {
        currentGeneration = generationSelect.value;

        setStartEnabled(false);
        startButton.textContent = "Preparando...";

        try {
            const body = new URLSearchParams();
            body.append(
                "generacion",
                currentGeneration
            );

            const response = await fetch(
                "/pokezoom/nueva-partida",
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/x-www-form-urlencoded"
                    },
                    body
                }
            );

            if (!response.ok) {
                throw new Error(
                    "No se pudo iniciar la partida"
                );
            }

            const result = await response.json();

            resetGameView();
            updateZoom(result.zoom);
            attemptNumber.textContent = result.intento;

            setup.hidden = true;
            game.hidden = false;
            gameActive = true;

            loading.hidden = false;
            image.hidden = true;

            image.src =
                `/pokezoom/imagen?t=${Date.now()}`;

            input.focus();
        } catch (error) {
            startButton.textContent =
                "No se pudo iniciar. Reintentar";
        } finally {
            setStartEnabled(true);
        }
    }

    async function submitAttempt(event) {
        event.preventDefault();

        if (!gameActive) {
            return;
        }

        const typedName = input.value.trim();

        if (!typedName) {
            return;
        }

        if (pokemonList.length === 0) {
            showMessage(
                "Espera mientras se carga la lista de Pokémon.",
                "error"
            );
            return;
        }

        const normalizedName =
            normalizePokemonName(typedName);

        const validPokemon =
            getAvailablePokemon().find(
                pokemon =>
                    pokemon.name === normalizedName
            );

        if (!validPokemon) {
            showMessage(
                "Selecciona un Pokémon válido de la generación elegida.",
                "error"
            );
            input.focus();
            return;
        }

        setFormEnabled(false);
        closeSuggestions();

        try {
            const body = new URLSearchParams();
            body.append(
                "pokemonName",
                validPokemon.name
            );

            const response = await fetch(
                "/pokezoom/intento",
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/x-www-form-urlencoded"
                    },
                    body
                }
            );

            if (!response.ok) {
                throw new Error(
                    "No se pudo comprobar"
                );
            }

            const result = await response.json();

            if (result.estado === "repetido") {
                showMessage(
                    "Ya intentaste con ese Pokémon.",
                    "error"
                );
                return;
            }

            if (result.estado === "sin-partida") {
                showMessage(
                    "La partida expiró. Inicia una nueva.",
                    "error"
                );
                finishGame();
                return;
            }

            updateZoom(result.zoom);
            renderAttempts(
                result.historial,
                result.victoria
            );

            input.value = "";

            if (result.terminada) {
                revealResult(result);
                return;
            }

            attemptNumber.textContent =
                result.intentos + 1;

            showMessage(
                "No es ese Pokémon. La cámara se ha alejado.",
                "error"
            );
        } catch (error) {
            showMessage(
                "No se pudo comprobar la respuesta. Inténtalo nuevamente.",
                "error"
            );
        } finally {
            if (gameActive) {
                setFormEnabled(true);
                input.focus();
            }
        }
    }

    function revealResult(result) {
        updateZoom(100);

        const pokemonName =
            formatPokemonName(result.pokemon);

        if (result.victoria) {
            showMessage(
                `¡Correcto! Era ${pokemonName}.`,
                "success"
            );
            showVictory(
                    pokemonName,
                    result.intentos
                );
        } else {
            showMessage(
                `Se terminaron los intentos. Era ${pokemonName}.`,
                "error"
            );

            playPokeZoomDefeatSound();
        }

        finishGame();
    }
function showVictory(pokemonName, attempts) {
    victoryName.textContent = pokemonName;
    victoryAttempts.textContent = attempts;

    victoryImage.src =
        `/pokezoom/imagen?t=${Date.now()}`;

    victoryModal.hidden = false;
    document.body.classList.add(
        "pokezoom-modal-open"
    );

    playPokeZoomVictorySound();
    launchPokeZoomConfetti();
    victoryClose.focus();
}

function closeVictory() {
    victoryModal.hidden = true;
    document.body.classList.remove(
        "pokezoom-modal-open"
    );
}

function toggleSound() {
    soundMuted = !soundMuted;

    localStorage.setItem(
        "badobi-pokezoom-muted",
        String(soundMuted)
    );

    updateSoundButton();
}

function updateSoundButton() {
    soundToggle.textContent =
        soundMuted ? "🔇" : "🔊";

    soundToggle.setAttribute(
        "aria-label",
        soundMuted
            ? "Activar sonidos"
            : "Silenciar sonidos"
    );

    soundToggle.setAttribute(
        "aria-pressed",
        String(soundMuted)
    );
}

function playPokeZoomDefeatSound() {
    if (soundMuted) {
        return;
    }

    const AudioContextClass =
        window.AudioContext ||
        window.webkitAudioContext;

    if (!AudioContextClass) {
        return;
    }

    const audioContext =
        new AudioContextClass();

    const masterGain =
        audioContext.createGain();

    masterGain.connect(
        audioContext.destination
    );

    const startTime =
        audioContext.currentTime;

    masterGain.gain.setValueAtTime(
        0.0001,
        startTime
    );

    masterGain.gain.exponentialRampToValueAtTime(
        0.14,
        startTime + 0.03
    );

    masterGain.gain.exponentialRampToValueAtTime(
        0.0001,
        startTime + 1.1
    );

    const notes = [
        {frequency: 392.00, delay: 0},
        {frequency: 329.63, delay: 0.22},
        {frequency: 261.63, delay: 0.44}
    ];

    notes.forEach(note => {
        const oscillator =
            audioContext.createOscillator();

        const noteGain =
            audioContext.createGain();

        oscillator.type = "triangle";

        oscillator.frequency.setValueAtTime(
            note.frequency,
            startTime + note.delay
        );

        noteGain.gain.setValueAtTime(
            0.0001,
            startTime + note.delay
        );

        noteGain.gain.exponentialRampToValueAtTime(
            0.7,
            startTime + note.delay + 0.025
        );

        noteGain.gain.exponentialRampToValueAtTime(
            0.0001,
            startTime + note.delay + 0.42
        );

        oscillator.connect(noteGain);
        noteGain.connect(masterGain);

        oscillator.start(
            startTime + note.delay
        );

        oscillator.stop(
            startTime + note.delay + 0.45
        );
    });

    setTimeout(() => {
        audioContext.close();
    }, 1300);
}

function playPokeZoomVictorySound() {
if (soundMuted) {
    return;
}
    const AudioContextClass =
        window.AudioContext ||
        window.webkitAudioContext;

    if (!AudioContextClass) {
        return;
    }

    const audioContext =
        new AudioContextClass();

    const masterGain =
        audioContext.createGain();

    masterGain.connect(
        audioContext.destination
    );

    const startTime =
        audioContext.currentTime;

    masterGain.gain.setValueAtTime(
        0.0001,
        startTime
    );

    masterGain.gain.exponentialRampToValueAtTime(
        0.18,
        startTime + 0.04
    );

    masterGain.gain.exponentialRampToValueAtTime(
        0.0001,
        startTime + 1.35
    );

    const notes = [
        {frequency: 523.25, delay: 0},
        {frequency: 659.25, delay: 0.14},
        {frequency: 783.99, delay: 0.28},
        {frequency: 1046.50, delay: 0.48}
    ];

    notes.forEach((note, index) => {
        const oscillator =
            audioContext.createOscillator();

        const noteGain =
            audioContext.createGain();

        oscillator.type =
            index === notes.length - 1
                ? "sine"
                : "triangle";

        oscillator.frequency.setValueAtTime(
            note.frequency,
            startTime + note.delay
        );

        noteGain.gain.setValueAtTime(
            0.0001,
            startTime + note.delay
        );

        noteGain.gain.exponentialRampToValueAtTime(
            0.75,
            startTime + note.delay + 0.025
        );

        noteGain.gain.exponentialRampToValueAtTime(
            0.0001,
            startTime + note.delay + 0.38
        );

        oscillator.connect(noteGain);
        noteGain.connect(masterGain);

        oscillator.start(
            startTime + note.delay
        );

        oscillator.stop(
            startTime + note.delay + 0.4
        );
    });

    setTimeout(() => {
        audioContext.close();
    }, 1600);
}
function launchPokeZoomConfetti() {
    const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reducedMotion) {
        return;
    }

    const colors = [
        "#ffcb05",
        "#3b82f6",
        "#ef4444",
        "#22c55e",
        "#a855f7",
        "#ffffff"
    ];

    for (let index = 0; index < 70; index++) {
        const piece = document.createElement("span");

        piece.className = "pokezoom-confetti";

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
            `${Math.random() * 0.7}s`
        );

        piece.style.setProperty(
            "--confetti-duration",
            `${2.2 + Math.random() * 1.4}s`
        );

        document.body.appendChild(piece);

        setTimeout(() => {
            piece.remove();
        }, 4300);
    }
}
    function finishGame() {
        gameActive = false;
        setFormEnabled(false);
        newGameButton.hidden = false;
    }

    function returnToSetup() {
        game.hidden = true;
        setup.hidden = false;
        newGameButton.hidden = true;
        startButton.textContent = "Empezar partida";
        showMessage("", "");
        generationSelect.focus();
    }

    function resetGameView() {
        form.reset();
        form.hidden = false;
        newGameButton.hidden = true;
        attemptNumber.textContent = "1";
        attemptList.innerHTML = "";

        const empty = document.createElement("p");
        empty.className = "pokezoom-no-attempts";
        empty.textContent =
            "Todavía no has realizado ningún intento.";

        attemptList.appendChild(empty);

        showMessage("", "");
        setFormEnabled(true);
    }
function chooseVisibleFocus() {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext(
        "2d",
        {willReadFrequently: true}
    );

    const width = image.naturalWidth;
    const height = image.naturalHeight;

    canvas.width = width;
    canvas.height = height;

    context.drawImage(image, 0, 0);

    const pixels = context.getImageData(
        0,
        0,
        width,
        height
    ).data;

    const candidates = [];
    const step = 6;
    const distance = 12;

    function getAlpha(x, y) {
        const position = (y * width + x) * 4;
        return pixels[position + 3];
    }

    for (
        let y = distance;
        y < height - distance;
        y += step
    ) {
        for (
            let x = distance;
            x < width - distance;
            x += step
        ) {
            const center = getAlpha(x, y);
            const left = getAlpha(x - distance, y);
            const right = getAlpha(x + distance, y);
            const top = getAlpha(x, y - distance);
            const bottom = getAlpha(x, y + distance);

            const visibleNeighbors = [
                left,
                right,
                top,
                bottom
            ].filter(alpha => alpha > 80).length;

            if (
                center > 120 &&
                visibleNeighbors >= 3
            ) {
                candidates.push({x, y});
            }
        }
    }

    if (candidates.length === 0) {
        image.style.transformOrigin = "50% 50%";
        return;
    }

    const selected = candidates[
        Math.floor(Math.random() * candidates.length)
    ];

    const focusX =
        (selected.x / width) * 100;

    const focusY =
        (selected.y / height) * 100;

    image.style.transformOrigin =
        `${focusX}% ${focusY}%`;
}
    function updateZoom(percentage) {
        zoomLevel.textContent = `${percentage}%`;

        image.style.setProperty(
            "--pokezoom-scale",
            String(percentage / 100)
        );
    }

    function renderAttempts(history, victory) {
        attemptList.innerHTML = "";

        history.forEach((pokemonName, index) => {
            const item = document.createElement("span");

            item.className = "pokezoom-attempt-item";
            item.textContent =
                formatPokemonName(pokemonName);

            const isCorrect =
                victory &&
                index === history.length - 1;

            if (isCorrect) {
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
                throw new Error(
                    "No se pudo cargar la lista"
                );
            }

            const data = await response.json();

            pokemonList = data.results.map(pokemon => {
                const parts = pokemon.url
                    .split("/")
                    .filter(Boolean);

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
        const search =
            normalizePokemonName(input.value);

        suggestions.innerHTML = "";

        if (!search) {
            closeSuggestions();
            return;
        }

        const matches = getAvailablePokemon()
            .filter(pokemon =>
                pokemon.name.startsWith(search)
            )
            .slice(0, 8);

        if (matches.length === 0) {
            closeSuggestions();
            return;
        }

        matches.forEach(pokemon => {
            const option =
                document.createElement("button");

            option.type = "button";
            option.className =
                "pokemon-suggestion pokezoom-suggestion";
            option.setAttribute("role", "option");

            const name = document.createElement("span");
            name.textContent =
                formatPokemonName(pokemon.name);

            option.appendChild(name);

            option.addEventListener("click", () => {
                input.value =
                    formatPokemonName(pokemon.name);

                closeSuggestions();
                input.focus();
            });

            suggestions.appendChild(option);
        });

        suggestions.classList.add("visible");
        input.setAttribute("aria-expanded", "true");
    }

    function getAvailablePokemon() {
        if (currentGeneration === "all") {
            return pokemonList;
        }

        const generationRanges = {
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

        const range =
            generationRanges[currentGeneration];

        if (!range) {
            return pokemonList;
        }

        return pokemonList.filter(
            pokemon =>
                pokemon.id >= range[0] &&
                pokemon.id <= range[1]
        );
    }

    function updateSelectedSuggestion(options) {
        options.forEach((option, index) => {
            const selected =
                index === selectedSuggestion;

            option.classList.toggle(
                "selected",
                selected
            );

            option.setAttribute(
                "aria-selected",
                String(selected)
            );
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
                part.charAt(0).toUpperCase() +
                part.slice(1)
            )
            .join(" ");
    }

    function showMessage(text, type) {
        message.textContent = text;
        message.classList.remove(
            "success",
            "error"
        );

        if (type) {
            message.classList.add(type);
        }
    }

    function setStartEnabled(enabled) {
        startButton.disabled = !enabled;
        generationSelect.disabled = !enabled;
    }

    function setFormEnabled(enabled) {
        input.disabled = !enabled;

        const button = form.querySelector(
            "button[type='submit']"
        );

        if (button) {
            button.disabled = !enabled;
        }
    }
});
