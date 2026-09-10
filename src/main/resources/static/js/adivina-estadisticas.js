document.addEventListener("DOMContentLoaded", () => {
    const TOTAL_POKEMON = 1025;
    const MAX_STAT = 255;

    const GENERACIONES = {
        all: {
            nombre: "Todas las generaciones",
            inicio: 1,
            fin: 1025
        },
        1: {
            nombre: "Generación I",
            inicio: 1,
            fin: 151
        },
        2: {
            nombre: "Generación II",
            inicio: 152,
            fin: 251
        },
        3: {
            nombre: "Generación III",
            inicio: 252,
            fin: 386
        },
        4: {
            nombre: "Generación IV",
            inicio: 387,
            fin: 493
        },
        5: {
            nombre: "Generación V",
            inicio: 494,
            fin: 649
        },
        6: {
            nombre: "Generación VI",
            inicio: 650,
            fin: 721
        },
        7: {
            nombre: "Generación VII",
            inicio: 722,
            fin: 809
        },
        8: {
            nombre: "Generación VIII",
            inicio: 810,
            fin: 905
        },
        9: {
            nombre: "Generación IX",
            inicio: 906,
            fin: 1025
        }
    };

    const ESTADISTICAS = [
        {
            clave: "ps",
            nombre: "PS",
            elemento: "stat-ps"
        },
        {
            clave: "ataque",
            nombre: "Ataque",
            elemento: "stat-ataque"
        },
        {
            clave: "defensa",
            nombre: "Defensa",
            elemento: "stat-defensa"
        },
        {
            clave: "ataqueEspecial",
            nombre: "At. especial",
            elemento: "stat-ataque-especial"
        },
        {
            clave: "defensaEspecial",
            nombre: "Def. especial",
            elemento: "stat-defensa-especial"
        },
        {
            clave: "velocidad",
            nombre: "Velocidad",
            elemento: "stat-velocidad"
        }
    ];

    const setup =
        document.getElementById("game-setup");

    const gameArea =
        document.getElementById("game-area");

    const generationSelect =
        document.getElementById("generation-select");

    const startButton =
        document.getElementById("start-game-button");

    const attemptIndicator =
        document.getElementById("attempt-indicator");

    const generationIndicator =
        document.getElementById("generation-indicator");

    const form =
        document.getElementById("stats-guess-form");

    const input =
        document.getElementById("pokemon-name");

    const submitButton =
        form.querySelector("button[type='submit']");

    const suggestions =
        document.getElementById("pokemon-suggestions");

    const message =
        document.getElementById("game-message");

        const movementHints =
            document.getElementById("movement-hints");

        const movementHintsList =
            document.getElementById("movement-hints-list");

    const attemptsSection =
        document.getElementById("attempts-section");

    const attemptsList =
        document.getElementById("attempts-list");

    const attemptCounter =
        document.getElementById("attempt-counter");

    const modal =
        document.getElementById("result-modal");

    const resultIcon =
        document.getElementById("result-icon");

    const resultKicker =
        document.getElementById("result-kicker");

    const resultTitle =
        document.getElementById("result-title");

    const resultImage =
        document.getElementById("result-image");

    const resultName =
        document.getElementById("result-pokemon-name");

    const resultDescription =
        document.getElementById("result-description");

    const playAgainButton =
        document.getElementById("play-again-button");

    const canvas =
        document.getElementById("stats-radar");

    let todosLosPokemon = [];
    let pokemonDisponibles = [];
    let generacionActual = "all";
    let partidaActiva = false;
    let indiceSeleccionado = -1;
    let estadisticasSecretas = null;

    cargarPokemon();

    startButton.addEventListener(
        "click",
        comenzarPartida
    );

    form.addEventListener(
        "submit",
        enviarIntento
    );

    input.addEventListener(
        "input",
        mostrarSugerencias
    );

    input.addEventListener(
        "keydown",
        controlarTeclado
    );

    playAgainButton.addEventListener(
        "click",
        volverAlInicio
    );

    document.addEventListener("click", (event) => {
        if (!event.target.closest(".pokemon-search")) {
            limpiarSugerencias();
        }
    });

    window.addEventListener("resize", () => {
        if (estadisticasSecretas) {
            dibujarRadar(estadisticasSecretas);
        }
    });

   async function cargarPokemon() {
       try {
           const respuesta = await fetch(
               "/adivina-estadisticas/pokemon"
           );

           if (!respuesta.ok) {
               throw new Error(
                   "No se pudo cargar la lista"
               );
           }

           const datos =
               await respuesta.json();

           todosLosPokemon =
               datos.map((pokemon) => ({
                   id: pokemon.id,

                   nombre:
                       pokemon.nombre,

                   nombreVisible:
                       formatearNombre(
                           pokemon.nombre
                       ),

                   imagen:
                       "https://raw.githubusercontent.com/" +
                       "PokeAPI/sprites/master/sprites/pokemon/" +
                       `other/official-artwork/${pokemon.id}.png`
               }));

           filtrarPorGeneracion();

       } catch (error) {
           console.error(
               "Error cargando Pokémon:",
               error
           );

           mostrarMensaje(
               "No se pudo cargar el autocompletado.",
               "error"
           );
       }
   }

    async function comenzarPartida() {
        startButton.disabled = true;

        startButton.textContent =
            "Preparando estadísticas...";

        generacionActual =
            generationSelect.value;

        try {
            const datos = await enviarFormulario(
                "/adivina-estadisticas/nueva-partida",
                {
                    generacion: generacionActual
                }
            );

            filtrarPorGeneracion();
            limpiarPartidaVisual();
            mostrarEstadisticas(
                datos.estadisticas
            );

            setup.hidden = true;
            gameArea.hidden = false;
            partidaActiva = true;

            attemptIndicator.textContent =
                `Intento 1/${datos.maxIntentos}`;

            generationIndicator.textContent =
                GENERACIONES[
                    generacionActual
                ].nombre;

            input.disabled = false;
            submitButton.disabled = false;
            input.focus();

            gameArea.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        } catch (error) {
            window.alert(
                "No se pudo comenzar la partida. " +
                "Comprueba tu conexión e inténtalo otra vez."
            );

        } finally {
            startButton.disabled = false;

            startButton.textContent =
                "Comenzar partida";
        }
    }

    async function enviarIntento(event) {
        event.preventDefault();

        const nombre =
            input.value.trim();

        if (!nombre || !partidaActiva) {
            mostrarMensaje(
                "Elige un Pokémon antes de continuar.",
                "error"
            );
            return;
        }

        submitButton.disabled = true;

        submitButton.textContent =
            "Comprobando...";

        limpiarSugerencias();

        try {
            const datos = await enviarFormulario(
                "/adivina-estadisticas/intento",
                {
                    pokemonName: nombre
                }
            );

            if (datos.estado === "sin-partida") {
                mostrarMensaje(
                    "La partida expiró. Comienza una nueva.",
                    "error"
                );
                return;
            }

            if (
                datos.estado === "terminada" &&
                !datos.pokemonElegido
            ) {
                mostrarMensaje(
                    "Esta partida ya terminó.",
                    "error"
                );
                return;
            }

            if (datos.estado === "invalido") {
                mostrarMensaje(
                    "No encontramos ese Pokémon.",
                    "error"
                );
                return;
            }

            if (datos.estado === "repetido") {
                mostrarMensaje(
                    "Ya probaste ese Pokémon.",
                    "error"
                );
                return;
            }

            if (
                datos.estado ===
                "generacion-invalida"
            ) {
                mostrarMensaje(
                    "Ese Pokémon no pertenece " +
                    "a la generación elegida.",
                    "error"
                );
                return;
            }

            agregarIntento(
                datos.pokemonElegido
            );

            attemptCounter.textContent =
                datos.intentos;

            attemptsSection.hidden = false;
            mostrarPistasMovimientos(
                datos.movimientos || []
            );
            input.value = "";

            if (datos.estado === "continua") {
                attemptIndicator.textContent =
                    `Intento ${datos.intentos + 1}/6`;

                mostrarMensaje(
                    `No es ese. Te quedan ` +
                    `${datos.restantes} intentos.`,
                    "error"
                );

                reproducirSonidoIntento();
                input.focus();

            } else {
                partidaActiva = false;
                input.disabled = true;
                submitButton.disabled = true;

                attemptIndicator.textContent =
                    `Intentos ${datos.intentos}/6`;

                window.setTimeout(() => {
                    mostrarResultado(datos);
                }, 650);
            }

        } catch (error) {
            mostrarMensaje(
                "Ocurrió un problema al comprobar " +
                "la respuesta.",
                "error"
            );

        } finally {
            if (partidaActiva) {
                submitButton.disabled = false;
            }

            submitButton.textContent =
                "Adivinar";
        }
    }

    async function enviarFormulario(
        url,
        valores
    ) {
        const cuerpo =
            new URLSearchParams();

        Object.entries(valores).forEach(
            ([clave, valor]) => {
                cuerpo.append(clave, valor);
            }
        );

        const respuesta = await fetch(url, {
            method: "POST",

            headers: {
                "Content-Type":
                    "application/x-www-form-urlencoded"
            },

            body: cuerpo
        });

        if (!respuesta.ok) {
            throw new Error(
                `Error ${respuesta.status}`
            );
        }

        return respuesta.json();
    }

    function mostrarEstadisticas(
        estadisticas
    ) {
        estadisticasSecretas =
            estadisticas;

        ESTADISTICAS.forEach((stat) => {
            const valor =
                estadisticas[stat.clave];

            const numero =
                document.getElementById(
                    stat.elemento
                );

            const fila =
                document.querySelector(
                    `.stat-row[data-stat="${stat.clave}"]`
                );

            const barra =
                fila.querySelector(
                    ".stat-track i"
                );

            numero.textContent = valor;
            barra.style.width = "0%";

            window.requestAnimationFrame(() => {
                barra.style.width =
                    `${Math.min(
                        (valor / MAX_STAT) * 100,
                        100
                    )}%`;
            });
        });

        dibujarRadar(estadisticas);
    }

    function dibujarRadar(
        estadisticas
    ) {
        const contexto =
            canvas.getContext("2d");

        const proporcionPantalla =
            window.devicePixelRatio || 1;

        const ancho =
            canvas.clientWidth || 440;

        const alto =
            ancho * (400 / 440);

        canvas.width =
            ancho * proporcionPantalla;

        canvas.height =
            alto * proporcionPantalla;

        contexto.setTransform(
            proporcionPantalla,
            0,
            0,
            proporcionPantalla,
            0,
            0
        );

        contexto.clearRect(
            0,
            0,
            ancho,
            alto
        );

        const centroX = ancho / 2;
        const centroY = alto / 2;

        const radio =
            Math.min(ancho, alto) * 0.31;

        const colorTexto =
            getComputedStyle(document.body)
                .getPropertyValue(
                    "--stats-text"
                )
                .trim() || "#17223b";

        contexto.lineWidth = 1.5;

        for (
            let nivel = 1;
            nivel <= 5;
            nivel++
        ) {
            dibujarPoligono(
                contexto,
                centroX,
                centroY,
                radio * (nivel / 5),
                "rgba(80, 110, 160, 0.24)"
            );
        }

        ESTADISTICAS.forEach(
            (stat, indice) => {
                const punto = obtenerPunto(
                    centroX,
                    centroY,
                    radio,
                    indice
                );

                contexto.beginPath();
                contexto.moveTo(
                    centroX,
                    centroY
                );
                contexto.lineTo(
                    punto.x,
                    punto.y
                );

                contexto.strokeStyle =
                    "rgba(80, 110, 160, 0.2)";

                contexto.stroke();

                const etiqueta =
                    obtenerPunto(
                        centroX,
                        centroY,
                        radio + 30,
                        indice
                    );

                contexto.fillStyle =
                    colorTexto;

                contexto.font =
                    "700 12px sans-serif";

                contexto.textAlign =
                    "center";

                contexto.textBaseline =
                    "middle";

                contexto.fillText(
                    stat.nombre,
                    etiqueta.x,
                    etiqueta.y
                );
            }
        );

        const puntos =
            ESTADISTICAS.map(
                (stat, indice) => {
                    const proporcion =
                        Math.min(
                            estadisticas[
                                stat.clave
                            ] / MAX_STAT,
                            1
                        );

                    return obtenerPunto(
                        centroX,
                        centroY,
                        radio * proporcion,
                        indice
                    );
                }
            );

        contexto.beginPath();

        puntos.forEach(
            (punto, indice) => {
                if (indice === 0) {
                    contexto.moveTo(
                        punto.x,
                        punto.y
                    );
                } else {
                    contexto.lineTo(
                        punto.x,
                        punto.y
                    );
                }
            }
        );

        contexto.closePath();

        contexto.fillStyle =
            "rgba(36, 86, 166, 0.34)";

        contexto.strokeStyle =
            "#2456a6";

        contexto.lineWidth = 3;
        contexto.fill();
        contexto.stroke();

        puntos.forEach((punto) => {
            contexto.beginPath();

            contexto.arc(
                punto.x,
                punto.y,
                5,
                0,
                Math.PI * 2
            );

            contexto.fillStyle =
                "#ffcb05";

            contexto.strokeStyle =
                "#17386f";

            contexto.lineWidth = 2;
            contexto.fill();
            contexto.stroke();
        });
    }

    function dibujarPoligono(
        contexto,
        centroX,
        centroY,
        radio,
        borde
    ) {
        contexto.beginPath();

        for (
            let indice = 0;
            indice < 6;
            indice++
        ) {
            const punto =
                obtenerPunto(
                    centroX,
                    centroY,
                    radio,
                    indice
                );

            if (indice === 0) {
                contexto.moveTo(
                    punto.x,
                    punto.y
                );
            } else {
                contexto.lineTo(
                    punto.x,
                    punto.y
                );
            }
        }

        contexto.closePath();
        contexto.strokeStyle = borde;
        contexto.stroke();
    }

    function obtenerPunto(
        centroX,
        centroY,
        radio,
        indice
    ) {
        const angulo =
            -Math.PI / 2 +
            (Math.PI * 2 * indice) / 6;

        return {
            x:
                centroX +
                Math.cos(angulo) * radio,

            y:
                centroY +
                Math.sin(angulo) * radio
        };
    }

    function mostrarSugerencias() {
        const busqueda =
            normalizar(input.value);

        indiceSeleccionado = -1;
        suggestions.replaceChildren();

        if (busqueda.length < 1) {
            return;
        }

        const coincidencias =
            pokemonDisponibles
                .filter((pokemon) =>
                    normalizar(
                        pokemon.nombreVisible
                    ).includes(busqueda)
                )
                .sort(
                    (primero, segundo) => {
                        const primeroEmpieza =
                            normalizar(
                                primero.nombreVisible
                            ).startsWith(busqueda);

                        const segundoEmpieza =
                            normalizar(
                                segundo.nombreVisible
                            ).startsWith(busqueda);

                        return (
                            Number(segundoEmpieza) -
                            Number(primeroEmpieza)
                        );
                    }
                )
                .slice(0, 8);

        coincidencias.forEach(
            (pokemon) => {
                const opcion =
                    document.createElement(
                        "button"
                    );

                const imagen =
                    document.createElement(
                        "img"
                    );

                const nombre =
                    document.createElement(
                        "span"
                    );

                opcion.type = "button";

                opcion.className =
                    "pokemon-suggestion";

                opcion.dataset.nombre =
                    pokemon.nombre;

                imagen.src =
                    pokemon.imagen;

                imagen.alt = "";
                imagen.loading = "lazy";

                nombre.textContent =
                    pokemon.nombreVisible;

                opcion.append(
                    imagen,
                    nombre
                );

                opcion.addEventListener(
                    "click",
                    () => {
                        seleccionarPokemon(
                            pokemon
                        );
                    }
                );

                suggestions.appendChild(
                    opcion
                );
            }
        );
    }

    function controlarTeclado(event) {
        const opciones = [
            ...suggestions.querySelectorAll(
                ".pokemon-suggestion"
            )
        ];

        if (!opciones.length) {
            return;
        }

        if (event.key === "ArrowDown") {
            event.preventDefault();

            indiceSeleccionado =
                (indiceSeleccionado + 1) %
                opciones.length;

            marcarOpcion(opciones);

        } else if (
            event.key === "ArrowUp"
        ) {
            event.preventDefault();

            indiceSeleccionado =
                (
                    indiceSeleccionado -
                    1 +
                    opciones.length
                ) %
                opciones.length;

            marcarOpcion(opciones);

        } else if (
            event.key === "Enter" &&
            indiceSeleccionado >= 0
        ) {
            event.preventDefault();

            const nombre =
                opciones[
                    indiceSeleccionado
                ].dataset.nombre;

            const pokemon =
                pokemonDisponibles.find(
                    (elemento) =>
                        elemento.nombre ===
                        nombre
                );

            seleccionarPokemon(pokemon);

        } else if (
            event.key === "Escape"
        ) {
            limpiarSugerencias();
        }
    }

    function marcarOpcion(opciones) {
        opciones.forEach(
            (opcion, indice) => {
                opcion.classList.toggle(
                    "selected",
                    indice ===
                        indiceSeleccionado
                );
            }
        );

        opciones[
            indiceSeleccionado
        ].scrollIntoView({
            block: "nearest"
        });
    }

    function seleccionarPokemon(
        pokemon
    ) {
        input.value =
            pokemon.nombreVisible;

        limpiarSugerencias();
        input.focus();
    }

    function limpiarSugerencias() {
        suggestions.replaceChildren();
        indiceSeleccionado = -1;
    }

    function filtrarPorGeneracion() {
        const rango =
            GENERACIONES[
                generacionActual
            ] || GENERACIONES.all;

        pokemonDisponibles =
            todosLosPokemon.filter(
                (pokemon) =>
                    pokemon.id >=
                        rango.inicio &&
                    pokemon.id <=
                        rango.fin
            );
    }

    function agregarIntento(pokemon) {
        const tarjeta =
            document.createElement(
                "article"
            );

        tarjeta.className =
            "attempt-card";

        const identidad =
            document.createElement(
                "div"
            );

        identidad.className =
            "attempt-pokemon";

        const imagen =
            document.createElement(
                "img"
            );

        imagen.src = pokemon.imagen;
        imagen.alt = pokemon.nombre;

        const nombre =
            document.createElement(
                "span"
            );

        nombre.textContent =
            formatearNombre(
                pokemon.nombre
            );

        identidad.append(
            imagen,
            nombre
        );

        tarjeta.appendChild(
            identidad
        );

        ESTADISTICAS.forEach((stat) => {
            const comparacion =
                pokemon.comparaciones[
                    stat.clave
                ];

            const informacion =
                obtenerComparacion(
                    comparacion
                );

            const cuadro =
                document.createElement(
                    "div"
                );

            const etiqueta =
                document.createElement(
                    "small"
                );

            const valor =
                document.createElement(
                    "strong"
                );

            const flecha =
                document.createElement(
                    "b"
                );

            cuadro.className =
                `attempt-stat ${informacion.clase}`;

            etiqueta.textContent =
                stat.nombre;

            valor.textContent =
                pokemon.estadisticas[
                    stat.clave
                ];

            flecha.textContent =
                informacion.flecha;

            cuadro.append(
                etiqueta,
                valor,
                flecha
            );

            tarjeta.appendChild(
                cuadro
            );
        });

        attemptsList.prepend(
            tarjeta
        );
    }

    function obtenerComparacion(
        comparacion
    ) {
        if (comparacion === "mayor") {
            return {
                clase: "higher",
                flecha: "↑"
            };
        }

        if (comparacion === "menor") {
            return {
                clase: "lower",
                flecha: "↓"
            };
        }

        return {
            clase: "equal",
            flecha: "＝"
        };
    }

    function mostrarResultado(datos) {
        const pokemon = datos.pokemon;
        const victoria = datos.victoria;

        resultImage.src =
            pokemon.imagen;

        resultImage.alt =
            formatearNombre(
                pokemon.nombre
            );

        resultName.textContent =
            formatearNombre(
                pokemon.nombre
            );

        if (victoria) {
            resultIcon.textContent = "🏆";

            resultKicker.textContent =
                "¡Pokémon descubierto!";

            resultTitle.textContent =
                "¡Victoria!";

            if (
                datos.respuestaAlternativa
            ) {
                resultDescription.textContent =
                    "Tu respuesta tiene exactamente " +
                    "las mismas seis estadísticas, " +
                    "así que también es válida.";
            } else {
                resultDescription.textContent =
                    "Encontraste al Pokémon oculto " +
                    "usando sus estadísticas.";
            }

            reproducirSonidoVictoria();
            lanzarConfeti();

        } else {
            resultIcon.textContent = "🔍";

            resultKicker.textContent =
                "Fin de la investigación";

            resultTitle.textContent =
                "Casi lo consigues";

            resultDescription.textContent =
                "Este era el Pokémon oculto.";

            reproducirSonidoDerrota();
        }

        modal.hidden = false;
        playAgainButton.focus();
    }

    function volverAlInicio() {
        modal.hidden = true;
        gameArea.hidden = true;
        setup.hidden = false;
        partidaActiva = false;

        limpiarPartidaVisual();

        setup.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    }

    function limpiarPartidaVisual() {
        attemptsList.replaceChildren();
        attemptsSection.hidden = true;
        movementHints.hidden = true;
        movementHintsList.replaceChildren();
        attemptCounter.textContent = "0";
        input.value = "";
        input.disabled = false;
        submitButton.disabled = false;
        estadisticasSecretas = null;

        mostrarMensaje("");
        limpiarSugerencias();
    }
function mostrarPistasMovimientos(movimientos) {
    movementHintsList.replaceChildren();

    if (!movimientos || movimientos.length === 0) {
        movementHints.hidden = true;
        return;
    }

    movimientos.forEach((movimiento, indice) => {
        const pista =
            document.createElement("span");

        pista.className =
            "movement-hint";

        pista.textContent =
            `${indice + 1}. ${formatearNombre(movimiento)}`;

        movementHintsList.appendChild(pista);
    });

    movementHints.hidden = false;
}

function mostrarMensaje(texto, tipo = "") {
    message.textContent = texto;
    message.className = "game-message";

    if (tipo) {
        message.classList.add(tipo);
    }
}

    function formatearNombre(nombre) {
        return nombre
            .split("-")
            .map(
                (parte) =>
                    parte.charAt(0)
                        .toUpperCase() +
                    parte.slice(1)
            )
            .join(" ");
    }

    function normalizar(texto) {
        return texto
            .toLowerCase()
            .normalize("NFD")
            .replace(
                /[\u0300-\u036f]/g,
                ""
            )
            .trim();
    }

    function reproducirSonidoIntento() {
        reproducirNotas(
            [220, 180],
            0.08,
            0.05
        );
    }

    function reproducirSonidoVictoria() {
        reproducirNotas(
            [523, 659, 784, 1047],
            0.12,
            0.08
        );
    }

    function reproducirSonidoDerrota() {
        reproducirNotas(
            [330, 277, 220],
            0.18,
            0.07
        );
    }

    function reproducirNotas(
        frecuencias,
        duracion,
        volumen
    ) {
        try {
            const ContextoAudio =
                window.AudioContext ||
                window.webkitAudioContext;

            const audio =
                new ContextoAudio();

            frecuencias.forEach(
                (frecuencia, indice) => {
                    const oscilador =
                        audio.createOscillator();

                    const ganancia =
                        audio.createGain();

                    const inicio =
                        audio.currentTime +
                        indice * duracion;

                    oscilador.type =
                        "triangle";

                    oscilador.frequency.value =
                        frecuencia;

                    ganancia.gain.setValueAtTime(
                        volumen,
                        inicio
                    );

                    ganancia.gain
                        .exponentialRampToValueAtTime(
                            0.001,
                            inicio + duracion
                        );

                    oscilador.connect(
                        ganancia
                    );

                    ganancia.connect(
                        audio.destination
                    );

                    oscilador.start(inicio);

                    oscilador.stop(
                        inicio + duracion
                    );
                }
            );

        } catch (error) {
            console.log(
                "El navegador bloqueó el sonido."
            );
        }
    }

    function lanzarConfeti() {
        const colores = [
            "#ffcb05",
            "#ef5350",
            "#3c82f6",
            "#2fbf71",
            "#ffffff"
        ];

        for (
            let indice = 0;
            indice < 70;
            indice++
        ) {
            const pieza =
                document.createElement(
                    "span"
                );

            pieza.style.position =
                "fixed";

            pieza.style.zIndex =
                "1100";

            pieza.style.top =
                "-20px";

            pieza.style.left =
                `${Math.random() * 100}%`;

            pieza.style.width =
                `${6 + Math.random() * 8}px`;

            pieza.style.height =
                `${10 + Math.random() * 10}px`;

            pieza.style.background =
                colores[
                    indice %
                    colores.length
                ];

            pieza.style.pointerEvents =
                "none";

            pieza.style.transform =
                `rotate(${Math.random() * 360}deg)`;

            pieza.style.transition =
                "transform 3s linear, " +
                "top 3s ease-in, " +
                "opacity 0.5s ease 2.3s";

            document.body.appendChild(
                pieza
            );

            window.requestAnimationFrame(
                () => {
                    pieza.style.top =
                        "110vh";

                    pieza.style.transform =
                        `translateX(` +
                        `${Math.random() * 240 - 120}px) ` +
                        `rotate(${720 + Math.random() * 720}deg)`;

                    pieza.style.opacity =
                        "0";
                }
            );

            window.setTimeout(
                () => pieza.remove(),
                4000
            );
        }
    }
});
