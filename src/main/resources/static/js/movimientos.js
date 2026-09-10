document.addEventListener("DOMContentLoaded", () => {
    const GENERACIONES = {
        all: {
            nombre: "Todas las generaciones",
            inicio: 1,
            fin: 1025
        },
        1: {nombre: "Generación I", inicio: 1, fin: 151},
        2: {nombre: "Generación II", inicio: 152, fin: 251},
        3: {nombre: "Generación III", inicio: 252, fin: 386},
        4: {nombre: "Generación IV", inicio: 387, fin: 493},
        5: {nombre: "Generación V", inicio: 494, fin: 649},
        6: {nombre: "Generación VI", inicio: 650, fin: 721},
        7: {nombre: "Generación VII", inicio: 722, fin: 809},
        8: {nombre: "Generación VIII", inicio: 810, fin: 905},
        9: {nombre: "Generación IX", inicio: 906, fin: 1025}
    };

    const setup =
        document.getElementById("moves-setup");

    const game =
        document.getElementById("moves-game");

    const generationSelect =
        document.getElementById("moves-generation");

    const modeButtons =
        document.querySelectorAll(".mode-option");

    const startButton =
        document.getElementById("moves-start");

    const attemptLabel =
        document.getElementById("moves-attempt");

    const modeLabel =
        document.getElementById("moves-mode");

    const generationLabel =
        document.getElementById("moves-generation-label");

    const movesList =
        document.getElementById("moves-list");

    const movesCount =
        document.getElementById("moves-count");

    const typeHint =
        document.getElementById("pokemon-type-hint");

    const typeList =
        document.getElementById("pokemon-type-list");

    const form =
        document.getElementById("moves-form");

    const input =
        document.getElementById("moves-pokemon-name");

    const submitButton =
        form.querySelector("button[type='submit']");

    const suggestions =
        document.getElementById("moves-suggestions");

    const message =
        document.getElementById("moves-message");

    const attemptsSection =
        document.getElementById("moves-attempts-section");

    const attemptsList =
        document.getElementById("moves-attempts-list");

    const attemptCounter =
        document.getElementById("moves-attempt-counter");

    const modal =
        document.getElementById("moves-result-modal");

    const resultIcon =
        document.getElementById("moves-result-icon");

    const resultKicker =
        document.getElementById("moves-result-kicker");

    const resultTitle =
        document.getElementById("moves-result-title");

    const resultImage =
        document.getElementById("moves-result-image");

    const resultName =
        document.getElementById("moves-result-name");

    const resultTypes =
        document.getElementById("moves-result-types");

    const resultDescription =
        document.getElementById("moves-result-description");

    const playAgainButton =
        document.getElementById("moves-play-again");

    let selectedMode = "normal";
    let selectedGeneration = "all";
    let gameActive = false;
    let allPokemon = [];
    let availablePokemon = [];
    let selectedSuggestion = -1;

    loadPokemon();

    modeButtons.forEach((button) => {
        button.addEventListener("click", () => {
            modeButtons.forEach((option) => {
                option.classList.remove("selected");
            });

            button.classList.add("selected");
            selectedMode = button.dataset.mode;
        });
    });

    startButton.addEventListener(
        "click",
        startGame
    );

    form.addEventListener(
        "submit",
        submitGuess
    );

    input.addEventListener(
        "input",
        showSuggestions
    );

    input.addEventListener(
        "keydown",
        controlSuggestions
    );

    playAgainButton.addEventListener(
        "click",
        returnToSetup
    );

    document.addEventListener("click", (event) => {
        if (!event.target.closest(".moves-search")) {
            closeSuggestions();
        }
    });

    async function loadPokemon() {
        try {
            const response = await fetch(
                "/movimientos/pokemon"
            );

            if (!response.ok) {
                throw new Error(
                    "No se pudo cargar la lista"
                );
            }

            const data = await response.json();

            allPokemon = data.map((pokemon) => ({
                id: pokemon.id,
                name: pokemon.nombre,

                visibleName:
                    formatName(pokemon.nombre),

                image:
                    "https://raw.githubusercontent.com/" +
                    "PokeAPI/sprites/master/sprites/pokemon/" +
                    `other/official-artwork/${pokemon.id}.png`
            }));

            filterPokemon();

        } catch (error) {
            console.error(
                "Error cargando Pokémon:",
                error
            );
        }
    }

    async function startGame() {
        startButton.disabled = true;

        startButton.textContent =
            "Preparando movimientos...";

        selectedGeneration =
            generationSelect.value;

        try {
            const result = await postForm(
                "/movimientos/nueva-partida",
                {
                    generacion: selectedGeneration,
                    modo: selectedMode
                }
            );

            resetGameView();
            filterPokemon();
            renderMoves(result.movimientos);

            attemptLabel.textContent =
                `Intento 1/${result.maxIntentos}`;

            modeLabel.textContent =
                selectedMode === "dificil"
                    ? "Modo difícil"
                    : "Modo normal";

            generationLabel.textContent =
                GENERACIONES[
                    selectedGeneration
                ].nombre;

            setup.hidden = true;
            game.hidden = false;
            gameActive = true;

            input.disabled = false;
            submitButton.disabled = false;
            input.focus();

            game.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        } catch (error) {
            window.alert(
                "No se pudo comenzar la partida. " +
                "Inténtalo nuevamente."
            );

        } finally {
            startButton.disabled = false;

            startButton.textContent =
                "Comenzar partida";
        }
    }

    async function postForm(url, values = {}) {
        const body =
            new URLSearchParams();

        Object.entries(values).forEach(
            ([key, value]) => {
                body.append(key, value);
            }
        );

        const response = await fetch(url, {
            method: "POST",

            headers: {
                "Content-Type":
                    "application/x-www-form-urlencoded"
            },

            body
        });

        if (!response.ok) {
            throw new Error(
                `Error ${response.status}`
            );
        }

        return response.json();
    }
        async function submitGuess(event) {
            event.preventDefault();

            const pokemonName =
                input.value.trim();

            if (!pokemonName || !gameActive) {
                showMessage(
                    "Selecciona un Pokémon.",
                    "error"
                );
                return;
            }

            submitButton.disabled = true;

            submitButton.textContent =
                "Comprobando...";

            closeSuggestions();

            try {
                const result = await postForm(
                    "/movimientos/intento",
                    {
                        pokemonName
                    }
                );

                if (result.estado === "sin-partida") {
                    showMessage(
                        "La partida expiró. Comienza una nueva.",
                        "error"
                    );
                    return;
                }

                if (result.estado === "ya-terminada") {
                    showMessage(
                        "Esta partida ya terminó.",
                        "error"
                    );
                    return;
                }

                if (result.estado === "invalido") {
                    showMessage(
                        "No encontramos ese Pokémon.",
                        "error"
                    );
                    return;
                }

                if (result.estado === "repetido") {
                    showMessage(
                        "Ya probaste ese Pokémon.",
                        "error"
                    );
                    return;
                }

                if (
                    result.estado ===
                    "generacion-invalida"
                ) {
                    showMessage(
                        "Ese Pokémon no pertenece a " +
                        "la generación seleccionada.",
                        "error"
                    );
                    return;
                }

                addAttempt(
                    result.pokemonElegido
                );

                renderMoves(
                    result.movimientos
                );

                renderTypeHint(
                    result.tipoRevelado,
                    result.tipos || []
                );

                attemptCounter.textContent =
                    result.intentos;

                attemptsSection.hidden = false;
                input.value = "";

                if (result.estado === "continua") {
                    attemptLabel.textContent =
                        `Intento ${result.intentos + 1}/6`;

                    showMessage(
                        `No es ese. Te quedan ` +
                        `${result.restantes} intentos.`,
                        "error"
                    );

                    playNotes(
                        [220, 180],
                        0.08,
                        0.05
                    );

                    input.focus();

                } else {
                    gameActive = false;
                    input.disabled = true;
                    submitButton.disabled = true;

                    attemptLabel.textContent =
                        `Intentos ${result.intentos}/6`;

                    window.setTimeout(() => {
                        showResult(result);
                    }, 650);
                }

            } catch (error) {
                showMessage(
                    "No se pudo comprobar la respuesta.",
                    "error"
                );

            } finally {
                if (gameActive) {
                    submitButton.disabled = false;
                }

                submitButton.textContent =
                    "Adivinar";
            }
        }

        function renderMoves(movements) {
            movesList.replaceChildren();
            movesCount.textContent =
                movements.length;

            movements.forEach(
                (movement, index) => {
                    const card =
                        document.createElement(
                            "article"
                        );

                    card.className =
                        "move-card";

                    card.style.animationDelay =
                        `${Math.min(index * 45, 450)}ms`;

                    if (movement.tipo) {
                        card.classList.add(
                            typeClass(
                                movement.tipo
                            )
                        );
                    }

                    const title =
                        document.createElement(
                            "h3"
                        );

                    title.textContent =
                        movement.nombre;

                    card.appendChild(title);

                const details =
                        document.createElement(
                            "div"
                        );

                        details.className =
                            "move-details";

                        addDetail(
                            details,
                            "Tipo",
                            movement.tipo
                        );

                        addDetail(
                            details,
                            "Categoría",
                            movement.categoria
                        );

                        addDetail(
                            details,
                            "Potencia",
                            movement.potencia ??
                                "—"
                        );

                    addDetail(
                        details,
                        "Precisión",
                            movement.precision ==
                                null
                                ? "—"
                            : `${movement.precision}%`
                    );

                    addDetail(
                        details,
                        "PP",
                        movement.pp ?? "—"
                    );

                        addDetail(
                            details,
                            "Nivel",
                            movement.nivel === 0
                                ? "Inicial"
                                : movement.nivel
                        );

                    card.appendChild(
                        details
                    );

                const description =
                    document.createElement("p");

                description.className =
                    "move-description";

                description.textContent =
                    movement.descripcion ||
                    "Descripción no disponible.";

                card.appendChild(description);

                    movesList.appendChild(card);
                }
            );
        }

        function addDetail(
            container,
            label,
            value
        ) {
            const detail =
                document.createElement("span");

            detail.textContent =
                `${label}: ${value}`;

            container.appendChild(detail);
        }

        function renderTypeHint(
            revealed,
            types
        ) {
            typeList.replaceChildren();

            if (!revealed) {
                typeHint.hidden = true;
                return;
            }

            types.forEach((type) => {
                typeList.appendChild(
                    createTypeBadge(type)
                );
            });

            typeHint.hidden = false;
        }

        function addAttempt(pokemon) {
            const card =
                document.createElement(
                    "article"
                );

            const image =
                document.createElement(
                    "img"
                );

            const name =
                document.createElement(
                    "strong"
                );

            card.className =
                "moves-attempt-card";

            image.src = pokemon.imagen;
            image.alt =
                formatName(pokemon.nombre);

            name.textContent =
                formatName(pokemon.nombre);

            card.append(
                image,
                name
            );

            attemptsList.prepend(card);
        }

        function createTypeBadge(type) {
            const badge =
                document.createElement(
                    "span"
                );

            badge.className =
                `type-badge ${typeClass(type)}`;

            badge.textContent = type;

            return badge;
        }

        function typeClass(type) {
            return "type-" +
                type
                    .toLowerCase()
                    .normalize("NFD")
                    .replace(
                        /[\u0300-\u036f]/g,
                        ""
                    )
                    .replace(/\s+/g, "-");
        }
            function showSuggestions() {
                const search =
                    normalize(input.value);

                selectedSuggestion = -1;
                suggestions.replaceChildren();

                if (search.length < 1) {
                    return;
                }

                const matches =
                    availablePokemon
                        .filter((pokemon) =>
                            normalize(
                                pokemon.visibleName
                            ).includes(search)
                        )
                        .sort((first, second) => {
                            const firstStarts =
                                normalize(
                                    first.visibleName
                                ).startsWith(search);

                            const secondStarts =
                                normalize(
                                    second.visibleName
                                ).startsWith(search);

                            return (
                                Number(secondStarts) -
                                Number(firstStarts)
                            );
                        })
                        .slice(0, 8);

                matches.forEach((pokemon) => {
                    const option =
                        document.createElement(
                            "button"
                        );

                    const image =
                        document.createElement(
                            "img"
                        );

                    const name =
                        document.createElement(
                            "span"
                        );

                    option.type = "button";
                    option.className =
                        "moves-suggestion";

                    option.dataset.name =
                        pokemon.name;

                    image.src = pokemon.image;
                    image.alt = "";
                    image.loading = "lazy";

                    name.textContent =
                        pokemon.visibleName;

                    option.append(
                        image,
                        name
                    );

                    option.addEventListener(
                        "click",
                        () => {
                            selectPokemon(
                                pokemon
                            );
                        }
                    );

                    suggestions.appendChild(
                        option
                    );
                });
            }

            function controlSuggestions(event) {
                const options = [
                    ...suggestions.querySelectorAll(
                        ".moves-suggestion"
                    )
                ];

                if (!options.length) {
                    return;
                }

                if (event.key === "ArrowDown") {
                    event.preventDefault();

                    selectedSuggestion =
                        (selectedSuggestion + 1) %
                        options.length;

                    markSuggestion(options);

                } else if (
                    event.key === "ArrowUp"
                ) {
                    event.preventDefault();

                    selectedSuggestion =
                        (
                            selectedSuggestion -
                            1 +
                            options.length
                        ) %
                        options.length;

                    markSuggestion(options);

                } else if (
                    event.key === "Enter" &&
                    selectedSuggestion >= 0
                ) {
                    event.preventDefault();

                    const selectedName =
                        options[
                            selectedSuggestion
                        ].dataset.name;

                    const pokemon =
                        availablePokemon.find(
                            (element) =>
                                element.name ===
                                selectedName
                        );

                    selectPokemon(pokemon);

                } else if (
                    event.key === "Escape"
                ) {
                    closeSuggestions();
                }
            }

            function markSuggestion(options) {
                options.forEach(
                    (option, index) => {
                        option.classList.toggle(
                            "selected",
                            index ===
                                selectedSuggestion
                        );
                    }
                );

                options[
                    selectedSuggestion
                ].scrollIntoView({
                    block: "nearest"
                });
            }

            function selectPokemon(pokemon) {
                if (!pokemon) {
                    return;
                }

                input.value =
                    pokemon.visibleName;

                closeSuggestions();
                input.focus();
            }

            function closeSuggestions() {
                suggestions.replaceChildren();
                selectedSuggestion = -1;
            }

            function filterPokemon() {
                const range =
                    GENERACIONES[
                        selectedGeneration
                    ] || GENERACIONES.all;

                availablePokemon =
                    allPokemon.filter(
                        (pokemon) =>
                            pokemon.id >=
                                range.inicio &&
                            pokemon.id <=
                                range.fin
                    );
            }

            function resetGameView() {
                attemptsList.replaceChildren();
                attemptsSection.hidden = true;
                attemptCounter.textContent = "0";

                typeList.replaceChildren();
                typeHint.hidden = true;

                input.value = "";
                input.disabled = false;
                submitButton.disabled = false;

                showMessage("");
                closeSuggestions();
            }

            function showMessage(
                text,
                type = ""
            ) {
                message.textContent = text;
                message.className =
                    "moves-message";

                if (type) {
                    message.classList.add(type);
                }
            }

            function formatName(name) {
                return name
                    .split("-")
                    .map(
                        (part) =>
                            part.charAt(0)
                                .toUpperCase() +
                            part.slice(1)
                    )
                    .join(" ");
            }

            function normalize(text) {
                return text
                    .toLowerCase()
                    .normalize("NFD")
                    .replace(
                        /[\u0300-\u036f]/g,
                        ""
                    )
                    .trim();
            }
                function showResult(result) {
                    const pokemon =
                        result.pokemon;

                    resultImage.src =
                        pokemon.imagen;

                    resultImage.alt =
                        formatName(
                            pokemon.nombre
                        );

                    resultName.textContent =
                        formatName(
                            pokemon.nombre
                        );

                    resultTypes.replaceChildren();

                    pokemon.tipos.forEach((type) => {
                        resultTypes.appendChild(
                            createTypeBadge(type)
                        );
                    });

                    if (result.victoria) {
                        resultIcon.textContent = "🏆";

                        resultKicker.textContent =
                            "¡Pokémon descubierto!";

                        resultTitle.textContent =
                            "¡Victoria!";

                        resultDescription.textContent =
                            "Reconociste al Pokémon por " +
                            "los movimientos que aprende.";

                        playNotes(
                            [523, 659, 784, 1047],
                            0.12,
                            0.08
                        );

                        launchConfetti();

                    } else {
                        resultIcon.textContent = "🔎";

                        resultKicker.textContent =
                            "Fin del desafío";

                        resultTitle.textContent =
                            "Casi lo consigues";

                        resultDescription.textContent =
                            "Este era el Pokémon " +
                            "del repertorio misterioso.";

                        playNotes(
                            [330, 277, 220],
                            0.18,
                            0.07
                        );
                    }

                    modal.hidden = false;
                    playAgainButton.focus();
                }

                function returnToSetup() {
                    modal.hidden = true;
                    game.hidden = true;
                    setup.hidden = false;
                    gameActive = false;

                    resetGameView();

                    setup.scrollIntoView({
                        behavior: "smooth",
                        block: "center"
                    });
                }

                function playNotes(
                    frequencies,
                    duration,
                    volume
                ) {
                    try {
                        const AudioContextClass =
                            window.AudioContext ||
                            window.webkitAudioContext;

                        const audio =
                            new AudioContextClass();

                        frequencies.forEach(
                            (frequency, index) => {
                                const oscillator =
                                    audio.createOscillator();

                                const gain =
                                    audio.createGain();

                                const start =
                                    audio.currentTime +
                                    index * duration;

                                oscillator.type =
                                    "triangle";

                                oscillator.frequency.value =
                                    frequency;

                                gain.gain.setValueAtTime(
                                    volume,
                                    start
                                );

                                gain.gain
                                    .exponentialRampToValueAtTime(
                                        0.001,
                                        start + duration
                                    );

                                oscillator.connect(gain);
                                gain.connect(
                                    audio.destination
                                );

                                oscillator.start(start);

                                oscillator.stop(
                                    start + duration
                                );
                            }
                        );

                    } catch (error) {
                        console.log(
                            "El navegador bloqueó el sonido."
                        );
                    }
                }

                function launchConfetti() {
                    const colors = [
                        "#ffcb05",
                        "#ef5350",
                        "#3c82f6",
                        "#2fbf71",
                        "#ffffff"
                    ];

                    for (
                        let index = 0;
                        index < 70;
                        index++
                    ) {
                        const piece =
                            document.createElement(
                                "span"
                            );

                        piece.style.position = "fixed";
                        piece.style.zIndex = "1100";
                        piece.style.top = "-20px";

                        piece.style.left =
                            `${Math.random() * 100}%`;

                        piece.style.width =
                            `${6 + Math.random() * 8}px`;

                        piece.style.height =
                            `${10 + Math.random() * 10}px`;

                        piece.style.background =
                            colors[
                                index % colors.length
                            ];

                        piece.style.pointerEvents =
                            "none";

                        piece.style.transform =
                            `rotate(${Math.random() * 360}deg)`;

                        piece.style.transition =
                            "transform 3s linear, " +
                            "top 3s ease-in, " +
                            "opacity 0.5s ease 2.3s";

                        document.body.appendChild(
                            piece
                        );

                        window.requestAnimationFrame(
                            () => {
                                piece.style.top =
                                    "110vh";

                                piece.style.transform =
                                    `translateX(` +
                                    `${Math.random() * 240 - 120}px) ` +
                                    `rotate(${720 + Math.random() * 720}deg)`;

                                piece.style.opacity =
                                    "0";
                            }
                        );

                        window.setTimeout(
                            () => piece.remove(),
                            4000
                        );
                    }
                }
            });
