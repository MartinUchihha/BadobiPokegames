const pokemonInput = document.querySelector("#pokemon-name");
const suggestionsContainer = document.querySelector("#pokemon-suggestions");
const victoryModal = document.querySelector("#victory-modal");
const victoryImage = document.querySelector("#victory-image");
const victoryName = document.querySelector("#victory-name");
const victoryAttempts = document.querySelector("#victory-attempts");
const victoryTime = document.querySelector("#victory-time");
const closeVictoryButton = document.querySelector("#close-victory");
const soundToggle = document.querySelector("#sound-toggle");
const generationHint = document.querySelector("#generation-hint");
const victoryLabel = document.querySelector("#victory-label");
const victoryTitle = document.querySelector("#victory-title");
const victoryMessage = document.querySelector("#victory-message");
const shareResultButton = document.querySelector("#share-result");
const gameModeSelector = document.querySelector("#game-mode");
const unlockableHints = document.querySelector(
    "#unlockable-hints"
);
const generationHintValue = document.querySelector(
    "#generation-hint-value"
);
const generationHintRequirement = document.querySelector(
    "#generation-hint-requirement"
);

const silhouetteHint = document.querySelector("#silhouette-hint");
const silhouetteHintImage = document.querySelector(
    "#silhouette-hint-image"
);
const silhouetteHintRequirement = document.querySelector(
    "#silhouette-hint-requirement"
);
const generationSelector = document.querySelector(
    "#pokedle-generation"
);
const shareRows = [];
let finalResultWasVictory = false;
let finalResultRegistered = false;
if (
    generationSelector
    && generationSelector.value !== "all"
) {
    generationHint.classList.add("is-hidden");
}
if (
    gameModeSelector
    && gameModeSelector.value === "difficult"
) {
    unlockableHints.classList.add("is-hidden");
}
if (
    gameModeSelector
    && gameModeSelector.value === "difficult"
) {
    const usedAttempts = Number(attemptCounter.textContent);
    const remaining = Math.max(0, 8 - usedAttempts);

    remainingAttempts.textContent =
        `Quedan ${remaining}`;

    remainingAttempts.classList.remove("is-hidden");
}
const gameSettingsForm = document.querySelector(
    ".game-settings"
);
let pokemonList = [];
let activeSuggestionIndex = -1;
let selectedPokemonName = null;

async function cargarPokemon() {
    try {
        const respuesta = await fetch(
            "https://pokeapi.co/api/v2/pokemon?limit=1025"
        );

        const datos = await respuesta.json();

        pokemonList = datos.results.map((pokemon) => {
            const partesUrl = pokemon.url.split("/").filter(Boolean);
            const id = partesUrl[partesUrl.length - 1];

            return {
                id: id,
                name: pokemon.name,
                displayName: formatearNombre(pokemon.name),
                image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`
            };
        });
    } catch (error) {
        console.error("No se pudieron cargar los Pokémon:", error);
    }
}

function formatearNombre(nombre) {
    return nombre
        .split("-")
        .map(parte => parte.charAt(0).toUpperCase() + parte.slice(1))
        .join(" ");
}

function mostrarSugerencias(texto) {
    suggestionsContainer.innerHTML = "";
    activeSuggestionIndex = -1;

    const busqueda = texto.trim().toLowerCase();

    if (busqueda.length === 0) {
        ocultarSugerencias();
        return;
    }

    const coincidencias = pokemonList
        .filter(pokemon => pokemon.name.startsWith(busqueda))
        .slice(0, 6);

    if (coincidencias.length === 0) {
        suggestionsContainer.innerHTML = `
            <p class="no-suggestions">No se encontraron Pokémon.</p>
        `;
        suggestionsContainer.classList.add("visible");
        pokemonInput.setAttribute("aria-expanded", "true");
        return;
    }

coincidencias.forEach((pokemon, index) => {
        const button = document.createElement("button");

        button.type = "button";
        button.className = "pokemon-suggestion";
        button.id = `pokemon-suggestion-${index}`;
        button.setAttribute("role", "option");
        button.setAttribute("aria-selected", "false");

        button.innerHTML = `
            <img src="${pokemon.image}"
                 alt="${pokemon.displayName}">
            <span>${pokemon.displayName}</span>
        `;

        button.addEventListener("click", () => {
            pokemonInput.value = pokemon.displayName;
            selectedPokemonName = pokemon.displayName;

            ocultarSugerencias();
            pokemonInput.focus();
        });

        suggestionsContainer.appendChild(button);
    });

    suggestionsContainer.classList.add("visible");
    pokemonInput.setAttribute("aria-expanded", "true");
}

function ocultarSugerencias() {
activeSuggestionIndex = -1;

pokemonInput.setAttribute("aria-expanded", "false");
pokemonInput.removeAttribute("aria-activedescendant");

    suggestionsContainer.classList.remove("visible");
    suggestionsContainer.innerHTML = "";
}

pokemonInput.addEventListener("input", () => {
    if (
        pokemonInput.value.trim()
        !== selectedPokemonName
    ) {
        selectedPokemonName = null;
    }

    mostrarSugerencias(pokemonInput.value);
});
pokemonInput.addEventListener("keydown", event => {
    const suggestions = [
        ...suggestionsContainer.querySelectorAll(
            ".pokemon-suggestion"
        )
    ];

    if (suggestions.length === 0) {
        return;
    }

    if (event.key === "ArrowDown") {
        event.preventDefault();

        activeSuggestionIndex =
            (activeSuggestionIndex + 1)
            % suggestions.length;

        actualizarSugerenciaActiva(suggestions);
    }

    if (event.key === "ArrowUp") {
        event.preventDefault();

        activeSuggestionIndex =
            activeSuggestionIndex <= 0
                ? suggestions.length - 1
                : activeSuggestionIndex - 1;

        actualizarSugerenciaActiva(suggestions);
    }

    if (
        event.key === "Enter"
        && activeSuggestionIndex >= 0
    ) {
        event.preventDefault();
        suggestions[activeSuggestionIndex].click();
    }

    if (event.key === "Escape") {
        event.preventDefault();
        ocultarSugerencias();
    }
});

function actualizarSugerenciaActiva(suggestions) {
    suggestions.forEach((suggestion, index) => {
        const active = index === activeSuggestionIndex;

        suggestion.classList.toggle(
            "active",
            active
        );
        suggestion.setAttribute(
            "aria-selected",
            String(active)
        );

        if (active) {
        pokemonInput.setAttribute(
            "aria-activedescendant",
            suggestion.id
        );
            suggestion.scrollIntoView({
                block: "nearest"
            });
        }
    });
}

document.addEventListener("click", event => {
    if (
        !pokemonInput.contains(event.target) &&
        !suggestionsContainer.contains(event.target)
    ) {
        ocultarSugerencias();
    }
});

cargarPokemon();
const guessForm = document.querySelector("#guess-form");
const attemptsBody = document.querySelector("#attempts-body");
const attemptsEmpty = document.querySelector("#attempts-empty");
const attemptCounter = document.querySelector("#attempt-counter");
const remainingAttempts = document.querySelector(
    "#remaining-attempts"
);
const gameTimer = document.querySelector("#game-timer");
const cluesWrapper = document.querySelector("#clues-wrapper");
const resultMessage = document.querySelector("#result-message");
const guessButton = guessForm.querySelector("button[type='submit']");
const newGameButton = document.querySelector(
    ".game-settings button[type='submit']"
);
const TIMER_START_KEY = "badobiPokedleStartTime";
const TIMER_END_KEY = "badobiPokedleEndTime";
const GENERATION_HINT_KEY =
    "badobiPokedleGenerationHint";

const SILHOUETTE_HINT_KEY =
    "badobiPokedleSilhouetteHint";

let gameStartTime = Number(
    sessionStorage.getItem(TIMER_START_KEY)
);

let gameEndTime = Number(
    sessionStorage.getItem(TIMER_END_KEY)
);

if (!gameStartTime) {
    gameStartTime = Date.now();

    sessionStorage.setItem(
        TIMER_START_KEY,
        String(gameStartTime)
    );
}

function actualizarCronometro() {
    const referenceTime = gameEndTime || Date.now();

    const elapsedMilliseconds =
        referenceTime - gameStartTime;

    const totalSeconds = Math.max(
        0,
        Math.floor(elapsedMilliseconds / 1000)
    );

    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    const formattedMinutes = String(minutes).padStart(2, "0");
    const formattedSeconds = String(seconds).padStart(2, "0");

    gameTimer.textContent =
        `⏱ ${formattedMinutes}:${formattedSeconds}`;
}

actualizarCronometro();

let timerInterval = null;

if (!gameEndTime) {
    timerInterval = setInterval(
        actualizarCronometro,
        1000
    );
}
guessForm.addEventListener("submit", async event => {
    event.preventDefault();
    if (!selectedPokemonName) {
        mostrarMensaje(
            "Selecciona un Pokémon de la lista de sugerencias.",
            false
        );

        pokemonInput.focus();
        mostrarSugerencias(pokemonInput.value);

        return;
    }
    prepararAudio();

    const nombre = pokemonInput.value.trim();

    if (!nombre) {
        return;
    }

    guessButton.disabled = true;
    guessButton.textContent = "Comprobando...";

    try {
        const respuesta = await fetch("/pokedle/intento", {
            method: "POST",
            headers: {
                "Content-Type":
                    "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
                pokemonName: nombre
            })
        });

        const resultado = await respuesta.json();

        if (!resultado.valido) {
            mostrarMensaje(resultado.mensaje, false);
            return;
        }

        if (resultado.yaIntentado) {
            mostrarMensaje(resultado.mensaje, false);
            return;
        }

        agregarFilaAnimada(
            resultado.pokemon,
            resultado.coincidencias
        );
        actualizarIntentosRestantes(
            resultado.cantidadIntentos
        );
        if (
            !resultado.acierto
            && !resultado.derrota
            && newGameButton
        ) {
            newGameButton.disabled = true;
            newGameButton.textContent = "🔒 Partida en curso";
        }
        setTimeout(() => {
            actualizarPistasDesbloqueables(resultado);
        }, 1200);

        pokemonInput.value = "";
        selectedPokemonName = null;
        ocultarSugerencias();

        const tiempoAnimacion = 1200;

        setTimeout(() => {
            mostrarMensaje(
                resultado.mensaje,
                resultado.acierto
            );

          if (
              (resultado.acierto || resultado.derrota)
              && newGameButton
          ) {
              gameEndTime = Date.now();

              sessionStorage.setItem(
                  TIMER_END_KEY,
                  String(gameEndTime)
              );
               clearInterval(timerInterval);
              actualizarCronometro();

              newGameButton.disabled = false;
              newGameButton.textContent = "Nueva partida";

              pokemonInput.disabled = true;
              guessButton.disabled = true;

              if (resultado.acierto) {
                  mostrarVictoria(resultado.pokemon);
              } else {
                  mostrarDerrota(resultado.pokemonRevelado);
              }
          }
        }, tiempoAnimacion);

    } catch (error) {
        console.error(error);

        mostrarMensaje(
            "No se pudo comprobar el Pokémon. Inténtalo otra vez.",
            false
        );
    } finally {
        guessButton.disabled = false;
        guessButton.textContent = "Adivinar";
    }
});

function agregarFilaAnimada(pokemon, coincidencias) {
    attemptsEmpty.classList.add("is-hidden");
    cluesWrapper.classList.remove("is-hidden");
    const cantidadActual = Number(attemptCounter.textContent);
    attemptCounter.textContent = cantidadActual + 1;

    const fila = document.createElement("tr");

    const celdaPokemon = document.createElement("td");

    celdaPokemon.classList.add(
        "pokemon-clue",
        coincidencias.pokemon
            ? "clue-correct"
            : "clue-wrong",
        "clue-reveal"
    );

    celdaPokemon.style.setProperty("--delay", "0ms");

    const imagen = document.createElement("img");
    imagen.src = pokemon.imagen;
    imagen.alt = pokemon.nombre;

    const nombre = document.createElement("span");
    nombre.textContent = pokemon.nombre;

    celdaPokemon.append(imagen, nombre);
    fila.appendChild(celdaPokemon);

  fila.appendChild(
      crearCeldaTipo(
          pokemon.tipo1,
          coincidencias.tipo1,
          coincidencias.tipo1Parcial,
          1
      )
  );

  fila.appendChild(
      crearCeldaTipo(
          pokemon.tipo2,
          coincidencias.tipo2,
          coincidencias.tipo2Parcial,
          2
      )
  );

    fila.appendChild(
        crearCelda(
            pokemon.habitat,
            coincidencias.habitat,
            3
        )
    );

    fila.appendChild(
        crearCelda(
            pokemon.color,
            coincidencias.color,
            4
        )
    );

    fila.appendChild(
        crearCelda(
            `Fase ${pokemon.faseEvolucion}`,
            coincidencias.faseEvolucion,
            5
        )
    );

    attemptsBody.prepend(fila);
    guardarFilaParaCompartir(coincidencias);
    reproducirSonidosPistas();
}
function crearCeldaTipo(
    texto,
    esCorrecto,
    esParcial,
    posicion
) {
    const celda = document.createElement("td");

    celda.textContent = texto;

    let claseResultado = "clue-wrong";

    if (esCorrecto) {
        claseResultado = "clue-correct";
    } else if (esParcial) {
        claseResultado = "clue-partial";
    }

    celda.classList.add(
        claseResultado,
        "clue-reveal"
    );

    celda.style.setProperty(
        "--delay",
        `${posicion * 180}ms`
    );

    return celda;
}
function crearCelda(texto, esCorrecto, posicion) {
    const celda = document.createElement("td");

    celda.textContent = texto;

    celda.classList.add(
        esCorrecto ? "clue-correct" : "clue-wrong",
        "clue-reveal"
    );

    celda.style.setProperty(
        "--delay",
        `${posicion * 180}ms`
    );

    return celda;
}

function mostrarMensaje(mensaje, acierto) {
    const texto = resultMessage.querySelector("p");

    texto.textContent = mensaje;

    resultMessage.classList.remove(
        "is-hidden",
        "result-correct",
        "result-wrong"
    );

    resultMessage.classList.add(
        acierto ? "result-correct" : "result-wrong"
    );
}
function mostrarVictoria(pokemon) {
finalResultWasVictory = true;
registrarResultado(true);
victoryModal.classList.remove("defeat-modal");

victoryLabel.textContent = "¡Pokémon encontrado!";
victoryTitle.textContent = "¡Excelente trabajo!";
victoryMessage.textContent =
    "Has completado esta partida de Badobi Pokédle.";
    victoryImage.src = pokemon.imagen;
    victoryImage.alt = pokemon.nombre;
    victoryName.textContent = pokemon.nombre;

    victoryAttempts.textContent =
        attemptCounter.textContent;

    victoryTime.textContent =
        gameTimer.textContent.replace("⏱", "").trim();

    victoryModal.classList.remove("is-hidden");
    document.body.classList.add("modal-open");

    closeVictoryButton.focus();
    reproducirSonidoVictoria();
    lanzarConfeti();
}

function cerrarVictoria() {
    victoryModal.classList.add("is-hidden");
    document.body.classList.remove("modal-open");

    if (newGameButton) {
        newGameButton.focus();
    }
}

closeVictoryButton.addEventListener(
    "click",
    cerrarVictoria
);

victoryModal.addEventListener("click", event => {
    if (event.target === victoryModal) {
        cerrarVictoria();
    }
});

document.addEventListener("keydown", event => {
    if (
        event.key === "Escape"
        && !victoryModal.classList.contains("is-hidden")
    ) {
        cerrarVictoria();
    }
});
function lanzarConfeti() {
    const confettiLayer = document.createElement("div");
    confettiLayer.className = "confetti-layer";

    const colors = [
        "#ef5350",
        "#ffcb05",
        "#3b82f6",
        "#48e68d",
        "#a855f7",
        "#ffffff"
    ];

    for (let index = 0; index < 90; index++) {
        const piece = document.createElement("span");

        piece.className = "confetti-piece";

        piece.style.left = `${Math.random() * 100}%`;
        piece.style.background =
            colors[Math.floor(Math.random() * colors.length)];

        piece.style.setProperty(
            "--fall-duration",
            `${2.5 + Math.random() * 2}s`
        );

        piece.style.setProperty(
            "--fall-delay",
            `${Math.random() * 0.8}s`
        );

        piece.style.setProperty(
            "--horizontal-movement",
            `${-100 + Math.random() * 200}px`
        );

        piece.style.setProperty(
            "--rotation",
            `${360 + Math.random() * 720}deg`
        );

        if (Math.random() > 0.5) {
            piece.classList.add("confetti-circle");
        }

        confettiLayer.appendChild(piece);
    }

    document.body.appendChild(confettiLayer);

    setTimeout(() => {
        confettiLayer.remove();
    }, 5000);
}
let soundEnabled =
    localStorage.getItem("pokedleSound") !== "off";

let audioContext = null;

function prepararAudio() {
    if (!soundEnabled) {
        return;
    }

    if (!audioContext) {
        const AudioContext =
            window.AudioContext || window.webkitAudioContext;

        audioContext = new AudioContext();
    }

    if (audioContext.state === "suspended") {
        audioContext.resume();
    }
}

function reproducirTono(
    frecuencia,
    duracion,
    retraso = 0,
    tipo = "sine"
) {
    if (!soundEnabled || !audioContext) {
        return;
    }

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const startTime = audioContext.currentTime + retraso;

    oscillator.type = tipo;
    oscillator.frequency.setValueAtTime(
        frecuencia,
        startTime
    );

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(
        0.12,
        startTime + 0.02
    );
    gain.gain.exponentialRampToValueAtTime(
        0.0001,
        startTime + duracion
    );

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start(startTime);
    oscillator.stop(startTime + duracion);
}

function reproducirSonidosPistas() {
    const frecuencias = [420, 470, 520, 570, 620, 680];

    frecuencias.forEach((frecuencia, index) => {
        reproducirTono(
            frecuencia,
            0.16,
            index * 0.18,
            "sine"
        );
    });
}

function reproducirSonidoVictoria() {
    reproducirTono(523, 0.35, 0, "triangle");
    reproducirTono(659, 0.35, 0.15, "triangle");
    reproducirTono(784, 0.5, 0.3, "triangle");
    reproducirTono(1046, 0.7, 0.5, "triangle");
}

function actualizarBotonSonido() {
    soundToggle.textContent = soundEnabled ? "🔊" : "🔇";

    soundToggle.setAttribute(
        "aria-label",
        soundEnabled
            ? "Silenciar sonidos"
            : "Activar sonidos"
    );

    soundToggle.classList.toggle(
        "sound-muted",
        !soundEnabled
    );
}

soundToggle.addEventListener("click", () => {
    soundEnabled = !soundEnabled;

    localStorage.setItem(
        "pokedleSound",
        soundEnabled ? "on" : "off"
    );

    actualizarBotonSonido();

    if (soundEnabled) {
        prepararAudio();
        reproducirTono(660, 0.2);
    }
});

actualizarBotonSonido();
function actualizarPistasDesbloqueables(resultado) {
    if (
        resultado.cantidadIntentos >= 5
        && resultado.pistaGeneracion
    ) {
        generationHintValue.textContent =
            resultado.pistaGeneracion;
            sessionStorage.setItem(
                GENERATION_HINT_KEY,
                resultado.pistaGeneracion
            );

        generationHintRequirement.textContent =
            "¡Pista desbloqueada!";

        generationHint.classList.remove("hint-locked");
        generationHint.classList.add("hint-unlocked");
    }

    if (
        resultado.cantidadIntentos >= 10
        && resultado.pistaSilueta
    ) {
        silhouetteHintImage.src =
            resultado.pistaSilueta;
            sessionStorage.setItem(
                SILHOUETTE_HINT_KEY,
                resultado.pistaSilueta
            );

        silhouetteHintRequirement.textContent =
            "¡Pista desbloqueada!";

        silhouetteHint.classList.remove("hint-locked");
        silhouetteHint.classList.add("hint-unlocked");
    }
}
function mostrarDerrota(pokemon) {
finalResultWasVictory = false;
registrarResultado(false);
    victoryModal.classList.add("defeat-modal");

    victoryLabel.textContent = "Partida terminada";
    victoryTitle.textContent = "¡Casi lo consigues!";
    victoryMessage.textContent =
        "Has agotado los 8 intentos del modo difícil.";

    victoryImage.src = pokemon.imagen;
    victoryImage.alt = pokemon.nombre;
    victoryName.textContent = pokemon.nombre;

    victoryAttempts.textContent =
        attemptCounter.textContent;

    victoryTime.textContent =
        gameTimer.textContent.replace("⏱", "").trim();

    victoryModal.classList.remove("is-hidden");
    document.body.classList.add("modal-open");

    closeVictoryButton.focus();
}
function guardarFilaParaCompartir(coincidencias) {
    const tipo1 = coincidencias.tipo1
        ? "🟩"
        : coincidencias.tipo1Parcial
            ? "🟨"
            : "🟥";

    const tipo2 = coincidencias.tipo2
        ? "🟩"
        : coincidencias.tipo2Parcial
            ? "🟨"
            : "🟥";

    const fila = [
        coincidencias.pokemon ? "🟩" : "🟥",
        tipo1,
        tipo2,
        coincidencias.habitat ? "🟩" : "🟥",
        coincidencias.color ? "🟩" : "🟥",
        coincidencias.faseEvolucion ? "🟩" : "🟥"
    ].join("");

    shareRows.push(fila);
}

function crearTextoCompartible() {
    const estado = finalResultWasVictory ? "✅" : "❌";

    const intentos = attemptCounter.textContent.trim();

    const tiempo = gameTimer.textContent
        .replace("⏱", "")
        .trim();

    return [
        "Badobi Pokédle",
        `${estado} ${intentos} intentos · ${tiempo}`,
        "",
        ...shareRows,
        "",
        "¿Puedes superar mi resultado?"
    ].join("\n");
}

async function compartirResultado() {
    const texto = crearTextoCompartible();
    const textoOriginal = shareResultButton.textContent;

    try {
        if (navigator.share) {
            await navigator.share({
                title: "Badobi Pokédle",
                text: texto
            });

            shareResultButton.textContent = "¡Compartido!";
        } else {
            await navigator.clipboard.writeText(texto);
            shareResultButton.textContent = "¡Copiado!";
        }

        setTimeout(() => {
            shareResultButton.textContent = textoOriginal;
        }, 2000);

    } catch (error) {
        if (error.name !== "AbortError") {
            console.error(error);
            shareResultButton.textContent = "No se pudo copiar";

            setTimeout(() => {
                shareResultButton.textContent = textoOriginal;
            }, 2000);
        }
    }
}

shareResultButton.addEventListener(
    "click",
    compartirResultado
);
const STATS_STORAGE_KEY = "badobiPokedleStats";

function obtenerEstadisticas() {
    const savedStats = localStorage.getItem(
        STATS_STORAGE_KEY
    );

    if (!savedStats) {
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

    try {
        return JSON.parse(savedStats);
    } catch (error) {
        console.error(
            "No se pudieron leer las estadísticas",
            error
        );

        localStorage.removeItem(STATS_STORAGE_KEY);
        return obtenerEstadisticas();
    }
}

function registrarResultado(victoria) {
    if (finalResultRegistered) {
        return;
    }

    finalResultRegistered = true;

    const stats = obtenerEstadisticas();
    const attempts = Number(attemptCounter.textContent);
    const seconds = obtenerSegundosCronometro();

    stats.played += 1;
    stats.totalAttempts += attempts;
    stats.totalSeconds += seconds;

    if (victoria) {
        stats.victories += 1;
        stats.currentStreak += 1;
        registrarPartidaEnRanking(
            attempts,
            seconds
        );

        if (
            stats.bestAttempts === null
            || attempts < stats.bestAttempts
        ) {
            stats.bestAttempts = attempts;
        }

        if (stats.currentStreak > stats.bestStreak) {
            stats.bestStreak = stats.currentStreak;
        }
    } else {
        stats.defeats += 1;
        stats.currentStreak = 0;
    }

    localStorage.setItem(
        STATS_STORAGE_KEY,
        JSON.stringify(stats)
    );
    comprobarNuevosLogros(stats);
}

function obtenerSegundosCronometro() {
    const time = gameTimer.textContent
        .replace("⏱", "")
        .trim();

    const parts = time.split(":").map(Number);

    if (parts.length !== 2) {
        return 0;
    }

    return parts[0] * 60 + parts[1];
}
const ACHIEVEMENTS_STORAGE_KEY =
    "badobiUnlockedAchievements";

function comprobarNuevosLogros(stats) {
    const achievements = [
        {
            id: "first-game",
            name: "Primeros pasos",
            icon: "🎮",
            unlocked: stats.played >= 1
        },
        {
            id: "first-win",
            name: "Primera victoria",
            icon: "🏆",
            unlocked: stats.victories >= 1
        },
        {
            id: "first-try",
            name: "¡A la primera!",
            icon: "🎯",
            unlocked: stats.bestAttempts === 1
        },
        {
            id: "five-wins",
            name: "Entrenador Pokémon",
            icon: "⭐",
            unlocked: stats.victories >= 5
        },
        {
            id: "streak-three",
            name: "En racha",
            icon: "🔥",
            unlocked: stats.bestStreak >= 3
        },
        {
            id: "ten-games",
            name: "Explorador",
            icon: "🧭",
            unlocked: stats.played >= 10
        },
        {
            id: "fifty-attempts",
            name: "Persistencia",
            icon: "🧠",
            unlocked: stats.totalAttempts >= 50
        },
        {
            id: "twenty-five-wins",
            name: "Maestro Pokédle",
            icon: "👑",
            unlocked: stats.victories >= 25
        }
    ];

    const savedAchievements = JSON.parse(
        localStorage.getItem(
            ACHIEVEMENTS_STORAGE_KEY
        ) || "[]"
    );

    const unlockedAchievements =
        new Set(savedAchievements);

    let notificationDelay = 500;

    achievements.forEach(achievement => {
        if (
            achievement.unlocked
            && !unlockedAchievements.has(achievement.id)
        ) {
            unlockedAchievements.add(achievement.id);

            setTimeout(() => {
                mostrarNotificacionLogro(achievement);
            }, notificationDelay);

            notificationDelay += 1200;
        }
    });

    localStorage.setItem(
        ACHIEVEMENTS_STORAGE_KEY,
        JSON.stringify([...unlockedAchievements])
    );
}

function mostrarNotificacionLogro(achievement) {
    const notification = document.createElement("div");

    notification.className = "achievement-toast";

    notification.innerHTML = `
        <span class="achievement-toast-icon">
            ${achievement.icon}
        </span>

        <div>
            <small>¡Logro desbloqueado!</small>
            <strong>${achievement.name}</strong>
        </div>
    `;

    document.body.appendChild(notification);

    requestAnimationFrame(() => {
        notification.classList.add("visible");
    });

    setTimeout(() => {
        notification.classList.remove("visible");

        setTimeout(() => {
            notification.remove();
        }, 400);
    }, 3500);
}
function actualizarIntentosRestantes(cantidadIntentos) {
    if (
        !gameModeSelector
        || gameModeSelector.value !== "difficult"
    ) {
        return;
    }

    const remaining = Math.max(
        0,
        8 - cantidadIntentos
    );

    remainingAttempts.textContent =
        remaining === 1
            ? "Queda 1"
            : `Quedan ${remaining}`;

    remainingAttempts.classList.remove("is-hidden");

    remainingAttempts.classList.toggle(
        "danger",
        remaining <= 2
    );
}
gameSettingsForm.addEventListener("submit", () => {
    sessionStorage.removeItem(TIMER_START_KEY);
    sessionStorage.removeItem(TIMER_END_KEY);
    sessionStorage.removeItem(GENERATION_HINT_KEY);
    sessionStorage.removeItem(SILHOUETTE_HINT_KEY);
});
function restaurarPistasDesbloqueadas() {
    if (
        gameModeSelector
        && gameModeSelector.value === "difficult"
    ) {
        return;
    }

    const savedGenerationHint =
        sessionStorage.getItem(GENERATION_HINT_KEY);

    const savedSilhouetteHint =
        sessionStorage.getItem(SILHOUETTE_HINT_KEY);

    if (
        savedGenerationHint
        && generationSelector.value === "all"
    ) {
        generationHintValue.textContent =
            savedGenerationHint;

        generationHintRequirement.textContent =
            "¡Pista desbloqueada!";

        generationHint.classList.remove("hint-locked");
        generationHint.classList.add("hint-unlocked");
    }

    if (savedSilhouetteHint) {
        silhouetteHintImage.src =
            savedSilhouetteHint;

        silhouetteHintRequirement.textContent =
            "¡Pista desbloqueada!";

        silhouetteHint.classList.remove("hint-locked");
        silhouetteHint.classList.add("hint-unlocked");
    }
}

restaurarPistasDesbloqueadas();
const RANKING_STORAGE_KEY =
    "badobiPokedlePersonalRanking";

function registrarPartidaEnRanking(attempts, seconds) {
    const savedRanking = localStorage.getItem(
        RANKING_STORAGE_KEY
    );

    let ranking = [];

    if (savedRanking) {
        try {
            ranking = JSON.parse(savedRanking);
        } catch (error) {
            console.error(
                "No se pudo leer el ranking",
                error
            );
        }
    }

    const generation =
        generationSelector.value === "all"
            ? "Todas"
            : `Generación ${convertirGeneracionARomano(
                generationSelector.value
            )}`;

    const mode =
        gameModeSelector.value === "difficult"
            ? "Difícil"
            : "Normal";

    ranking.push({
        generation: generation,
        mode: mode,
        attempts: attempts,
        seconds: seconds,
        date: new Date().toISOString()
    });

    ranking.sort((firstGame, secondGame) => {
        if (firstGame.attempts !== secondGame.attempts) {
            return firstGame.attempts - secondGame.attempts;
        }

        return firstGame.seconds - secondGame.seconds;
    });

    ranking = ranking.slice(0, 50);

    localStorage.setItem(
        RANKING_STORAGE_KEY,
        JSON.stringify(ranking)
    );
}

function convertirGeneracionARomano(generation) {
    const romanNumbers = {
        "1": "I",
        "2": "II",
        "3": "III",
        "4": "IV",
        "5": "V",
        "6": "VI",
        "7": "VII",
        "8": "VIII",
        "9": "IX"
    };

    return romanNumbers[generation] || generation;
}