document.addEventListener("DOMContentLoaded", () => {
    const game = document.getElementById("fusion-game");
    const form = document.getElementById("fusion-form");
    const input = document.getElementById("fusion-pokemon");
    const suggestions = document.getElementById(
        "fusion-suggestions"
    );
    const message = document.getElementById("fusion-message");
    const counter = document.getElementById("fusion-correct-count");
    const attemptCounter = document.getElementById(
        "fusion-attempt-count"
    );

    const attemptList = document.getElementById(
        "fusion-attempt-list"
    );
    const victoryModal = document.getElementById(
        "fusion-victory-modal"
    );

    const victoryAttempts = document.getElementById(
        "fusion-victory-attempts"
    );

    const victoryClose = document.getElementById(
        "fusion-victory-close"
    );
    const slots = Array.from(
        document.querySelectorAll(".fusion-slot")
    );

    if (!game || !form || !input) {
        return;
    }

    const fusionDate = game.dataset.fusionDate;
    const nextChange = new Date(
        game.dataset.nextChange
    );

    const countdown = document.getElementById(
        "fusion-countdown"
    );
    const storageKey = `badobi-fusion-${fusionDate}`;

    let progress = loadProgress();
    updateCountdown();

    const countdownInterval = setInterval(
        updateCountdown,
        1000
    );

    renderProgress();
    let pokemonList = [];
    let selectedSuggestion = -1;

    loadPokemonList();

    input.addEventListener("input", () => {
        selectedSuggestion = -1;
        renderSuggestions();
    });

    input.addEventListener("keydown", event => {
        const options = Array.from(
            suggestions.querySelectorAll(".pokemon-suggestion")
        );

        if (options.length === 0) {
            return;
        }

        if (event.key === "ArrowDown") {
            event.preventDefault();

            selectedSuggestion =
                (selectedSuggestion + 1) % options.length;

            updateSelectedSuggestion(options);
        }

        if (event.key === "ArrowUp") {
            event.preventDefault();

            selectedSuggestion =
                (selectedSuggestion - 1 + options.length) %
                options.length;

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
                const parts = pokemon.url
                    .split("/")
                    .filter(Boolean);

                const id = parts[parts.length - 1];

                return {
                    id,
                    name: pokemon.name
                };
            });
            renderAttempts();
        } catch (error) {
            pokemonList = [];
        }
    }

    function renderSuggestions() {
        const search = input.value
            .trim()
            .toLocaleLowerCase("es");

        suggestions.innerHTML = "";

        if (!search) {
            closeSuggestions();
            return;
        }

        const matches = pokemonList
            .filter(pokemon =>
                pokemon.name.startsWith(search)
            )
            .slice(0, 8);

        if (matches.length === 0) {
            closeSuggestions();
            return;
        }

        matches.forEach(pokemon => {
            const option = document.createElement("button");

            option.type = "button";
            option.className = "pokemon-suggestion";
            option.setAttribute("role", "option");

            const image = document.createElement("img");

            image.src =
                "https://raw.githubusercontent.com/" +
                "PokeAPI/sprites/master/sprites/pokemon/" +
                `${pokemon.id}.png`;

            image.alt = "";

            const name = document.createElement("span");
            name.textContent = capitalizePokemonName(
                pokemon.name
            );

            option.append(image, name);

            option.addEventListener("click", () => {
                input.value = capitalizePokemonName(
                    pokemon.name
                );

                closeSuggestions();
                input.focus();
            });

            suggestions.appendChild(option);
        });

        suggestions.classList.add("visible");
        input.setAttribute("aria-expanded", "true");
    }

    function updateSelectedSuggestion(options) {
        options.forEach((option, index) => {
            const selected = index === selectedSuggestion;

            option.classList.toggle("selected", selected);
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

    function capitalizePokemonName(name) {
        return name.charAt(0).toUpperCase() + name.slice(1);
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const pokemonName = input.value.trim();

        if (!pokemonName) {
            return;
        }

        if (pokemonList.length === 0) {
            showMessage(
                "Espera un momento mientras se cargan los Pokémon.",
                "error"
            );
            return;
        }

        const normalizedPokemonName =
            pokemonName.toLocaleLowerCase("es");

        const validPokemon = pokemonList.some(
            pokemon =>
                pokemon.name === normalizedPokemonName
        );

        if (!validPokemon) {
            showMessage(
                "Selecciona un Pokémon válido de la lista.",
                "error"
            );

            input.focus();
            return;
        }

        if (wasAlreadyTried(pokemonName)) {
            showMessage(
                "Ya probaste ese Pokémon.",
                "error"
            );
            return;
        }

        setFormEnabled(false);
        showMessage("Comprobando...", "");

        try {
            const body = new URLSearchParams();
            body.append("pokemonName", pokemonName);

            const response = await fetch("/fusion/comprobar", {
                method: "POST",
                headers: {
                    "Content-Type":
                        "application/x-www-form-urlencoded"
                },
                body
            });

            if (!response.ok) {
                throw new Error("No se pudo comprobar");
            }

            const result = await response.json();

            progress.intentos.push(pokemonName);

            if (result.correcto) {
                saveCorrectAnswer(
                    result.posicion,
                    result.pokemon
                );

                showMessage(
                    `¡Correcto! ${result.pokemon} forma parte de la fusión.`,
                    "success"
                );
            } else {
                showMessage(
                    `${pokemonName} no forma parte de esta fusión.`,
                    "error"
                );
            }

            saveProgress();
            renderProgress();

            input.value = "";

            if (!isVictory()) {
                input.focus();
            }
        } catch (error) {
            showMessage(
                "No se pudo comprobar la respuesta. Inténtalo nuevamente.",
                "error"
            );
        } finally {
            if (!isVictory()) {
                setFormEnabled(true);
            }
        }
    });
function showVictory() {
    victoryAttempts.textContent =
        progress.intentos.length;

    victoryModal.hidden = false;
    document.body.classList.add("fusion-modal-open");
    launchFusionConfetti();

    progress.celebrated = true;
    saveProgress();

    victoryClose.focus();
}
function launchFusionConfetti() {
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

        piece.className = "fusion-confetti";

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
function closeVictory() {
    victoryModal.hidden = true;
    document.body.classList.remove("fusion-modal-open");
}

victoryClose.addEventListener("click", closeVictory);

victoryModal.addEventListener("click", event => {
    if (event.target === victoryModal) {
        closeVictory();
    }
});

document.addEventListener("keydown", event => {
    if (
        event.key === "Escape" &&
        !victoryModal.hidden
    ) {
        closeVictory();
    }
});
function updateCountdown() {
    const remaining =
        nextChange.getTime() - Date.now();

    if (remaining <= 0) {
        clearInterval(countdownInterval);
        countdown.textContent = "00:00:00";

        window.location.reload();
        return;
    }

    const totalSeconds =
        Math.floor(remaining / 1000);

    const hours = Math.floor(
        totalSeconds / 3600
    );

    const minutes = Math.floor(
        (totalSeconds % 3600) / 60
    );

    const seconds = totalSeconds % 60;

    countdown.textContent = [
        hours,
        minutes,
        seconds
    ]
        .map(number =>
            String(number).padStart(2, "0")
        )
        .join(":");
}
    function saveCorrectAnswer(position, pokemonName) {
        const alreadyDiscovered = progress.correctos.some(
            answer => answer.posicion === position
        );

        if (!alreadyDiscovered) {
            progress.correctos.push({
                posicion: position,
                pokemon: pokemonName
            });
        }
    }

    function renderProgress() {
        slots.forEach(slot => {
            slot.textContent = "???";
            slot.classList.remove("correct");
        });

        progress.correctos.forEach(answer => {
            const slot = slots[answer.posicion];

            if (slot) {
                slot.textContent = answer.pokemon;
                slot.classList.add("correct");
            }
        });

        counter.textContent = progress.correctos.length;
        renderAttempts();

        if (isVictory()) {
            showMessage(
                "¡Fusión completada! Descubriste los cuatro Pokémon.",
                "success"
            );

            setFormEnabled(false);

            if (!progress.celebrated) {
                showVictory();
            }
        }
    }
function renderAttempts() {
    attemptCounter.textContent =
        progress.intentos.length;

    attemptList.innerHTML = "";

    const correctNames = progress.correctos.map(
        answer =>
            answer.pokemon.toLocaleLowerCase("es")
    );

    const incorrectAttempts = progress.intentos.filter(
        attempt =>
            !correctNames.includes(
                attempt.toLocaleLowerCase("es")
            )
    );

    if (incorrectAttempts.length === 0) {
        const emptyMessage =
            document.createElement("p");

        emptyMessage.className =
            "fusion-no-attempts";

        emptyMessage.textContent =
            "No tienes intentos incorrectos.";

        attemptList.appendChild(emptyMessage);
        return;
    }

    incorrectAttempts
        .slice()
        .reverse()
        .forEach(attempt => {
            const attemptItem =
                document.createElement("div");

            attemptItem.className =
                "fusion-attempt-item";

            const icon = document.createElement("span");
            icon.className = "fusion-attempt-icon";
            icon.textContent = "✕";

            const pokemonData = pokemonList.find(
                pokemon =>
                    pokemon.name ===
                    attempt.toLocaleLowerCase("es")
            );

            if (pokemonData) {
                const image = document.createElement("img");

                image.className =
                    "fusion-attempt-image";

                image.src =
                    "https://raw.githubusercontent.com/" +
                    "PokeAPI/sprites/master/sprites/pokemon/" +
                    `${pokemonData.id}.png`;

                image.alt = "";
                image.loading = "lazy";

                attemptItem.appendChild(image);
            }

            const name = document.createElement("span");
            name.textContent = attempt;

            attemptItem.append(icon, name);
            attemptList.appendChild(attemptItem);
        });
}
    function wasAlreadyTried(pokemonName) {
        const normalizedName =
            pokemonName.toLocaleLowerCase("es");

        return progress.intentos.some(
            attempt =>
                attempt.toLocaleLowerCase("es") ===
                normalizedName
        );
    }

    function isVictory() {
        return progress.correctos.length === slots.length;
    }

    function showMessage(text, type) {
        message.textContent = text;
        message.classList.remove("success", "error");

        if (type) {
            message.classList.add(type);
        }
    }

    function setFormEnabled(enabled) {
        input.disabled = !enabled;

        const button = form.querySelector("button");

        if (button) {
            button.disabled = !enabled;
        }
    }

    function saveProgress() {
        localStorage.setItem(
            storageKey,
            JSON.stringify(progress)
        );
    }

    function loadProgress() {
        const savedProgress =
            localStorage.getItem(storageKey);

        if (!savedProgress) {
            return {
                intentos: [],
                correctos: []
            };
        }

        try {
            return JSON.parse(savedProgress);
        } catch (error) {
            return {
                intentos: [],
                correctos: []
            };
        }
    }
});