document.addEventListener("DOMContentLoaded", () => {
    const levels = window.PokeSortLevels;
    if (!levels) return;
    const requested = Number(new URLSearchParams(window.location.search).get("nivel"));
    const levelNumber = Number.isInteger(requested) && requested >= 1 && requested <= levels.count
        ? Math.min(requested, levels.getUnlocked()) : levels.getUnlocked();
    const config = levels.getConfig(levelNumber);
    const SPRITES = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/";
    const ITEMS = {
        pikachu: { name: "Peluche de Pikachu", image: "/images/pokesort/peluche-pikachu.png", kind: "plush" },
        eevee: { name: "Peluche de Eevee", image: "/images/pokesort/peluche-eevee.png", kind: "plush" },
        "poke-ball": { name: "Poké Ball", image: `${SPRITES}poke-ball.png`, kind: "sprite" },
        "great-ball": { name: "Super Ball", image: `${SPRITES}great-ball.png`, kind: "sprite" },
        "ultra-ball": { name: "Ultra Ball", image: `${SPRITES}ultra-ball.png`, kind: "sprite" },
        potion: { name: "Poción", image: `${SPRITES}potion.png`, kind: "sprite" },
        "super-potion": { name: "Superpoción", image: `${SPRITES}super-potion.png`, kind: "sprite" },
        "hyper-potion": { name: "Hiperpoción", image: `${SPRITES}hyper-potion.png`, kind: "sprite" },
        bulbasaur: { name: "Peluche de Bulbasaur", image: "/images/pokesort/peluche-bulbasaur.png", kind: "plush" },
        charmander: { name: "Peluche de Charmander", image: "/images/pokesort/peluche-charmander.png", kind: "plush" },
        squirtle: { name: "Peluche de Squirtle", image: "/images/pokesort/peluche-squirtle.png", kind: "plush" },
        jigglypuff: { name: "Peluche de Jigglypuff", image: "/images/pokesort/peluche-jigglypuff.png", kind: "plush" },
        psyduck: { name: "Peluche de Psyduck", image: "/images/pokesort/peluche-psyduck.png", kind: "plush" },
        piplup: { name: "Peluche de Piplup", image: "/images/pokesort/peluche-piplup.png", kind: "plush" },
        gengar: { name: "Peluche de Gengar", image: "/images/pokesort/peluche-gengar.png", kind: "plush" },
        snorlax: { name: "Peluche de Snorlax", image: "/images/pokesort/peluche-snorlax.png", kind: "plush" },
        mew: { name: "Peluche de Mew", image: "/images/pokesort/peluche-mew.png", kind: "plush" },
        umbreon: { name: "Peluche de Umbreon", image: "/images/pokesort/peluche-umbreon.png", kind: "plush" },
        mimikyu: { name: "Peluche de Mimikyu", image: "/images/pokesort/peluche-mimikyu.png", kind: "plush" },
        torchic: { name: "Peluche de Torchic", image: "/images/pokesort/peluche-torchic.png", kind: "plush" },
        fuecoco: { name: "Peluche de Fuecoco", image: "/images/pokesort/peluche-fuecoco.png", kind: "plush" },
        rowlet: { name: "Peluche de Rowlet", image: "/images/pokesort/peluche-rowlet.png", kind: "plush" }
    };

    const shelvesEl = document.getElementById("sort-shelves");
    const timerEl = document.getElementById("sort-timer");
    const matchesEl = document.getElementById("sort-matches");
    const remainingEl = document.getElementById("sort-remaining");
    const messageEl = document.getElementById("sort-message");
    const pauseButton = document.getElementById("sort-pause");
    const overlayEl = document.getElementById("sort-overlay");
    const dialogIconEl = document.getElementById("sort-dialog-icon");
    const dialogTitleEl = document.getElementById("sort-dialog-title");
    const dialogTextEl = document.getElementById("sort-dialog-text");
    const dialogActionEl = document.getElementById("sort-dialog-action");
    const replayButton = document.getElementById("sort-dialog-replay");
    if (!shelvesEl || !dialogActionEl) return;

    document.getElementById("sort-level-label").textContent = `PokéSort · Nivel ${levelNumber} de ${levels.count}`;
    document.getElementById("sort-dialog-level").textContent = `PokéSort · Nivel ${levelNumber}`;
    let shelves = [];
    let selected = null;
    let matchingShelf = null;
    let matches = 0;
    let secondsLeft = config.seconds;
    let deadline = 0;
    let timerId = null;
    let matchTimeoutId = null;
    let phase = "intro";
    let locked = false;
    let sessionId = null;
    let moves = [];

    function resetBoard() {
        shelves = levels.buildLevel(levelNumber).shelves;
        selected = null;
        matchingShelf = null;
        matches = 0;
        secondsLeft = config.seconds;
        locked = false;
        sessionId = null;
        moves = [];
    }

    function makeImage(itemId) {
        const image = document.createElement("img");
        image.src = ITEMS[itemId].image;
        image.alt = "";
        image.draggable = false;
        return image;
    }

    function renderBoard() {
        const fragment = document.createDocumentFragment();
        shelves.forEach((shelf, shelfIndex) => {
            const cubby = document.createElement("div");
            cubby.className = "sort-cubby";
            cubby.dataset.shelf = String(shelfIndex);
            if (selected && selected.shelfIndex !== shelfIndex && shelf.items.includes(null)) cubby.classList.add("can-receive");
            if (matchingShelf === shelfIndex) cubby.classList.add("matching");
            if (shelf.layers.length) {
                cubby.classList.add("has-back-layer");
                const preview = document.createElement("div");
                preview.className = "sort-back-preview";
                preview.setAttribute("aria-hidden", "true");
                shelf.layers[0].forEach(itemId => preview.appendChild(makeImage(itemId)));
                cubby.appendChild(preview);
                const badge = document.createElement("span");
                badge.className = "sort-layer-badge";
                badge.textContent = String(shelf.layers.length);
                badge.title = `${shelf.layers.length} capa${shelf.layers.length > 1 ? "s" : ""} oculta${shelf.layers.length > 1 ? "s" : ""}`;
                cubby.appendChild(badge);
            }
            shelf.items.forEach((itemId, slotIndex) => {
                const product = document.createElement("button");
                product.type = "button";
                product.className = "sort-product";
                product.dataset.slot = String(slotIndex);
                product.disabled = phase !== "playing" || locked;
                if (itemId) {
                    product.dataset.kind = ITEMS[itemId].kind;
                    product.title = ITEMS[itemId].name;
                    product.setAttribute("aria-label", `Seleccionar ${ITEMS[itemId].name} del estante ${shelfIndex + 1}`);
                    product.appendChild(makeImage(itemId));
                } else {
                    product.classList.add("empty");
                    product.setAttribute("aria-label", `Espacio libre en el estante ${shelfIndex + 1}`);
                }
                if (selected && selected.shelfIndex === shelfIndex && selected.slotIndex === slotIndex) {
                    product.classList.add("selected");
                    product.setAttribute("aria-pressed", "true");
                }
                cubby.appendChild(product);
            });
            fragment.appendChild(cubby);
        });
        shelvesEl.replaceChildren(fragment);
    }

    function updateStatus() {
        timerEl.textContent = `${String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:${String(secondsLeft % 60).padStart(2, "0")}`;
        timerEl.classList.toggle("urgent", secondsLeft <= 30);
        matchesEl.textContent = `${matches} / ${config.totalMatches}`;
        remainingEl.textContent = String(shelves.reduce((sum, shelf) =>
            sum + shelf.items.filter(Boolean).length + shelf.layers.reduce((hidden, layer) => hidden + layer.length, 0), 0));
        pauseButton.disabled = phase !== "playing" || locked;
    }

    function render() {
        renderBoard();
        updateStatus();
    }

    function stopTimer() {
        if (timerId !== null) window.clearInterval(timerId);
        timerId = null;
    }

    function tick() {
        if (phase !== "playing") return;
        secondsLeft = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
        updateStatus();
        if (secondsLeft === 0) finish(false);
    }

    function startTimer() {
        stopTimer();
        deadline = Date.now() + secondsLeft * 1000;
        timerId = window.setInterval(tick, 200);
        tick();
    }

    function showDialog(icon, title, description, action) {
        dialogIconEl.textContent = icon;
        dialogTitleEl.textContent = title;
        dialogTextEl.textContent = description;
        dialogActionEl.textContent = action;
        replayButton.hidden = true;
        dialogActionEl.disabled = false;
        overlayEl.hidden = false;
        dialogActionEl.focus();
    }

    async function postJson(url, payload) {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "No se pudo guardar la partida.");
        return result;
    }

    function finish(won, result = null) {
        if (phase !== "playing" && phase !== "saving") return;
        phase = won ? "won" : "lost";
        stopTimer();
        if (matchTimeoutId !== null) window.clearTimeout(matchTimeoutId);
        matchTimeoutId = null;
        selected = null;
        matchingShelf = null;
        locked = false;
        if (won) {
            levels.unlockAfter(levelNumber);
            messageEl.textContent = "¡Todos los estantes ordenados!";
            const reward = result.saved
                ? `Ganaste ${result.experience} XP y avanzaste en tus logros. `
                : "Nivel superado. Crea un entrenador en Ranking para guardar XP y logros en las próximas partidas. ";
            if (levelNumber < levels.count) {
                showDialog("🏆", "¡Nivel completado!", `${reward}Ya puedes jugar el nivel ${levelNumber + 1}.`, "Siguiente nivel");
                replayButton.hidden = false;
            } else {
                showDialog("🏆", "¡Completaste los 20 niveles!", `${reward}Puedes volver a jugar con un tablero nuevo.`, "Volver a jugar");
            }
        } else {
            messageEl.textContent = "Se acabó el tiempo.";
            showDialog("⌛", "¡Se acabó el tiempo!", "Inténtalo de nuevo: el tablero será diferente y conservarás este nivel desbloqueado.", "Reintentar");
        }
        render();
    }

    async function verifyVictory() {
        if (phase !== "playing" || !sessionId) return;
        phase = "saving";
        stopTimer();
        messageEl.textContent = "Comprobando tu victoria y guardando la experiencia...";
        render();
        try {
            const result = await postJson("/api/pokesort/resultado", { partidaId: sessionId, moves });
            finish(true, result);
        } catch (error) {
            phase = "error";
            messageEl.textContent = error.message;
            showDialog("⚠️", "No se pudo guardar", `${error.message} La experiencia no se añadió. Empieza una nueva partida.`, "Nueva partida");
            render();
        }
    }

    function revealIfEmpty(shelfIndex) {
        const shelf = shelves[shelfIndex];
        if (shelf.layers.length && shelf.items.every(item => item === null)) {
            shelf.items = shelf.layers.shift();
            return true;
        }
        return false;
    }

    function moveToShelf(targetShelfIndex) {
        if (!selected || selected.shelfIndex === targetShelfIndex) return;
        const target = shelves[targetShelfIndex].items;
        const emptySlot = target.indexOf(null);
        if (emptySlot === -1) {
            messageEl.textContent = "Ese estante está lleno. Elige otro con espacio.";
            return;
        }
        const sourceIndex = selected.shelfIndex;
        const sourceSlot = selected.slotIndex;
        const source = shelves[sourceIndex].items;
        const itemId = source[sourceSlot];
        if (!itemId) { selected = null; render(); return; }
        source[sourceSlot] = null;
        target[emptySlot] = itemId;
        moves.push({ sourceShelf: sourceIndex, sourceSlot, targetShelf: targetShelfIndex });
        selected = null;
        const revealedSource = revealIfEmpty(sourceIndex);

        if (target.every(item => item === itemId)) {
            locked = true;
            matchingShelf = targetShelfIndex;
            messageEl.textContent = `¡Trío de ${ITEMS[itemId].name}!`;
            render();
            matchTimeoutId = window.setTimeout(() => {
                matchTimeoutId = null;
                target.fill(null);
                matches++;
                matchingShelf = null;
                const revealedTarget = revealIfEmpty(targetShelfIndex);
                locked = false;
                if (revealedTarget) messageEl.textContent = "¡Había más productos detrás del estante!";
                render();
                if (matches === config.totalMatches) verifyVictory();
                else if (document.hidden && phase === "playing") pauseGame();
            }, 450);
        } else {
            messageEl.textContent = revealedSource
                ? "¡Aparecieron productos que estaban detrás del estante!"
                : `${ITEMS[itemId].name} movido al estante ${targetShelfIndex + 1}.`;
            render();
        }
    }

    function handleShelfClick(event) {
        if (phase !== "playing" || locked) return;
        const cubby = event.target.closest(".sort-cubby[data-shelf]");
        if (!cubby || !shelvesEl.contains(cubby)) return;
        const shelfIndex = Number(cubby.dataset.shelf);
        const button = event.target.closest("button[data-slot]");
        const slotIndex = button ? Number(button.dataset.slot) : -1;
        if (selected && selected.shelfIndex !== shelfIndex) {
            moveToShelf(shelfIndex);
            return;
        }
        const itemId = slotIndex >= 0 ? shelves[shelfIndex].items[slotIndex] : null;
        if (itemId) {
            if (selected && selected.shelfIndex === shelfIndex && selected.slotIndex === slotIndex) {
                selected = null;
                messageEl.textContent = "Selección cancelada.";
            } else {
                selected = { shelfIndex, slotIndex };
                messageEl.textContent = `${ITEMS[itemId].name} seleccionado. Toca otro estante con espacio.`;
            }
            render();
        } else {
            messageEl.textContent = selected ? "Toca otro estante para mover el producto." : "Primero selecciona un producto.";
        }
    }

    async function startGame() {
        if (phase === "loading") return;
        if (matchTimeoutId !== null) window.clearTimeout(matchTimeoutId);
        stopTimer();
        resetBoard();
        phase = "loading";
        render();
        showDialog("🛍️", "Preparando la tienda...", "Estamos preparando un tablero nuevo para ti.", "Cargando...");
        dialogActionEl.disabled = true;
        try {
            const response = await fetch(`/api/pokesort/partida?nivel=${levelNumber}`, {
                method: "POST", credentials: "same-origin"
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || "No se pudo comenzar la partida.");
            sessionId = result.partidaId;
            shelves = result.shelves;
            secondsLeft = result.seconds;
            moves = [];
            phase = "playing";
            messageEl.textContent = "Toca un producto y después un estante que tenga espacio.";
            overlayEl.hidden = true;
            render();
            startTimer();
        } catch (error) {
            phase = "error";
            messageEl.textContent = error.message;
            showDialog("⚠️", "No se pudo comenzar", `${error.message} Comprueba tu conexión e inténtalo otra vez.`, "Reintentar");
            render();
        }
    }

    async function pauseGame() {
        if (phase !== "playing" || locked) return;
        tick();
        if (phase !== "playing") return;
        phase = "pausing";
        stopTimer();
        render();
        try {
            const result = await postJson("/api/pokesort/pausa", { partidaId: sessionId, paused: true });
            secondsLeft = result.remainingSeconds;
            phase = "paused";
            render();
            showDialog("⏸️", "Partida pausada", "Tu tiempo está detenido. Continúa cuando quieras.", "Continuar");
        } catch (error) {
            phase = "playing";
            messageEl.textContent = "No se pudo pausar: " + error.message;
            render();
            startTimer();
        }
    }

    async function resumeGame() {
        if (phase !== "paused") return;
        phase = "resuming";
        dialogActionEl.disabled = true;
        try {
            const result = await postJson("/api/pokesort/pausa", { partidaId: sessionId, paused: false });
            secondsLeft = result.remainingSeconds;
            phase = "playing";
            overlayEl.hidden = true;
            render();
            startTimer();
        } catch (error) {
            phase = "paused";
            showDialog("⚠️", "No se pudo continuar", error.message, "Reintentar");
        }
    }

    shelvesEl.addEventListener("click", handleShelfClick);
    dialogActionEl.addEventListener("click", () => {
        if (phase === "paused") {
            resumeGame();
        } else if (phase === "won" && levelNumber < levels.count) {
            window.location.href = `/pokesort/jugar?nivel=${levelNumber + 1}`;
        } else {
            startGame();
        }
    });
    replayButton.addEventListener("click", startGame);
    pauseButton.addEventListener("click", pauseGame);
    document.addEventListener("visibilitychange", () => {
        if (document.hidden && phase === "playing" && !locked) pauseGame();
    });

    Object.values(ITEMS).forEach(item => { const image = new Image(); image.src = item.image; });
    resetBoard();
    render();
    showDialog("🛍️", `Nivel ${levelNumber} de ${levels.count}`,
        `${config.totalMatches} tríos, ${config.shelfCount} estantes y ${Math.floor(config.seconds / 60)} minutos${config.seconds % 60 ? ` ${config.seconds % 60} segundos` : ""}. ${config.layers ? "Al vaciar algunos estantes aparecerán productos ocultos." : "Selecciona un producto y muévelo a otro estante con espacio."}`,
        "Comenzar");
});
