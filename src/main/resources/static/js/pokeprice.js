document.addEventListener("DOMContentLoaded", () => {
    const setup = document.getElementById("price-setup");
    const game = document.getElementById("price-game");
    const start = document.getElementById("price-start");
    const mode = document.getElementById("price-mode");
    const setupMessage = document.getElementById("price-setup-message");
    const score = document.getElementById("price-score");
    const best = document.getElementById("price-best");
    const leftCard = document.getElementById("price-left-card");
    const rightCard = document.getElementById("price-right-card");
    const higher = document.getElementById("price-higher");
    const lower = document.getElementById("price-lower");
    const message = document.getElementById("price-message");
    const modal = document.getElementById("price-result");
    const finalScore = document.getElementById("price-final-score");
    const resultRank = document.getElementById("price-result-rank");
    const resultText = document.getElementById("price-result-text");
    const restart = document.getElementById("price-restart");
    let active = false;
    let answering = false;
    let bestScore = Number(localStorage.getItem("badobi-pokeprice-best") || 0);

    best.textContent = String(bestScore);
    start.addEventListener("click", startGame);
    restart.addEventListener("click", () => { modal.hidden = true; startGame(); });
    higher.addEventListener("click", () => answer("mayor"));
    lower.addEventListener("click", () => answer("menor"));
    modal.addEventListener("click", event => { if (event.target === modal) modal.hidden = true; });
    document.addEventListener("keydown", event => {
        if (!active || answering) return;
        if (event.key === "ArrowUp") answer("mayor");
        if (event.key === "ArrowDown") answer("menor");
    });

    document.querySelectorAll(".tcg-image-frame img").forEach(image => {
        image.addEventListener("dragstart", event => event.preventDefault());
        image.addEventListener("contextmenu", event => event.preventDefault());
    });

    async function startGame() {
        if (answering) return;
        active = false;
        answering = true;
        setButtons(false);
        start.disabled = true;
        start.textContent = "Buscando cartas y precios...";
        setupMessage.textContent = "La primera carga puede tardar unos segundos.";
        modal.hidden = true;
        try {
            const state = await post(
                "/pokeprice/nueva-partida",
                {modo: mode.value}
            );
            renderState(state);
            setup.hidden = true;
            game.hidden = false;
            active = true;
            answering = false;
            setButtons(true);
            setupMessage.textContent = "";
        } catch (error) {
            answering = false;
            setup.hidden = false;
            game.hidden = true;
            setupMessage.textContent = "No pudimos cargar los precios. Comprueba tu conexión e inténtalo nuevamente.";
        } finally {
            start.disabled = false;
            start.textContent = "Comenzar partida";
        }
    }

    async function answer(choice) {
        if (!active || answering) return;
        answering = true;
        setButtons(false);
        message.className = "price-message";
        message.textContent = "Comprobando el mercado...";
        try {
            const result = await post("/pokeprice/responder", {respuesta: choice});
            if (result.estado === "sin-partida") throw new Error("La partida expiró");
            revealCard("right", result.derechaResuelta);
            animatePrices(result.izquierdaResuelta.precio, result.derechaResuelta.precio);

            if (result.correcto) {
                rightCard.classList.add("reveal-good");
                message.className = "price-message success";
                message.textContent = "¡Correcto! La racha continúa.";
                playTone(true);
                score.textContent = String(result.puntuacion);
                updateBest(result.puntuacion);
                window.setTimeout(() => {
                    rightCard.classList.remove("reveal-good");
                    renderState(result.siguiente);
                    answering = false;
                    setButtons(true);
                }, 1600);
            } else {
                active = false;
                rightCard.classList.add("reveal-bad");
                message.className = "price-message error";
                message.textContent = "Esta vez no era la respuesta correcta.";
                playTone(false);
                window.setTimeout(() => showResult(result.puntuacion), 1300);
            }
        } catch (error) {
            answering = false;
            setButtons(true);
            message.className = "price-message error";
            message.textContent = "No se pudo comprobar la respuesta. Inténtalo otra vez.";
        }
    }

    function renderState(state) {
        score.textContent = String(state.puntuacion);
        revealCard("left", state.izquierda);
        revealCard("right", state.derecha, true);
        rightCard.classList.remove("reveal-bad", "reveal-good");
        message.className = "price-message";
        message.textContent = "Elige usando los botones o las flechas ↑ y ↓.";
    }

    function revealCard(side, card, hidePrice = false) {
        const image = document.getElementById(`price-${side}-image`);
        image.src = card.imagen;
        image.alt = `${card.nombre}, ${card.coleccion}, ${card.acabado}`;
        document.getElementById(`price-${side}-name`).textContent = card.nombre;
        document.getElementById(`price-${side}-set`).textContent = `${card.coleccion} · #${card.numero} · ${card.rareza}`;
        document.getElementById(`price-${side}-finish`).textContent = card.acabado;
        const value = document.getElementById(`price-${side}-value`);
        value.classList.toggle("hidden-price", hidePrice);
        value.textContent = hidePrice ? "US$ ???" : formatPrice(card.precio);
    }

    function animatePrices(leftPrice, rightPrice) {
        document.getElementById("price-left-value").textContent = formatPrice(leftPrice);
        const target = document.getElementById("price-right-value");
        target.classList.remove("hidden-price");
        const finalValue = Number(rightPrice);
        const duration = 650;
        const started = performance.now();
        function frame(now) {
            const progress = Math.min((now - started) / duration, 1);
            target.textContent = formatPrice(finalValue * (1 - Math.pow(1 - progress, 3)));
            if (progress < 1) requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
    }

    function showResult(points) {
        updateBest(points);
        finalScore.textContent = String(points);
        resultRank.textContent = rank(points);
        resultText.textContent = points === 0
            ? "El mercado te sorprendió, pero la próxima racha puede ser enorme."
            : `Reconociste correctamente el valor de ${points} ${points === 1 ? "carta" : "cartas"}.`;
        modal.hidden = false;
        if (points >= 5) confetti(points >= 20 ? 100 : 55);
        answering = false;
    }

    function updateBest(points) {
        if (points <= bestScore) return;
        bestScore = points;
        best.textContent = String(bestScore);
        localStorage.setItem("badobi-pokeprice-best", String(bestScore));
    }

    function rank(points) {
        if (points >= 20) return "🏆 MAESTRO DEL MERCADO";
        if (points >= 10) return "💎 EXPERTO TCG";
        if (points >= 5) return "✨ COLECCIONISTA";
        return "🎒 ENTRENADOR";
    }

    function setButtons(enabled) {
        higher.disabled = !enabled;
        lower.disabled = !enabled;
    }

    function formatPrice(value) {
        return new Intl.NumberFormat("es-CL", {style: "currency", currency: "USD", minimumFractionDigits: 2}).format(Number(value));
    }

    async function post(url, values = {}) {
        const response = await fetch(url, {
            method: "POST",
            headers: {"Content-Type": "application/x-www-form-urlencoded"},
            body: new URLSearchParams(values)
        });
        if (!response.ok) throw new Error(`Error ${response.status}`);
        return response.json();
    }

    function playTone(success) {
        try {
            const context = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = context.createOscillator();
            const gain = context.createGain();
            oscillator.connect(gain); gain.connect(context.destination);
            oscillator.frequency.setValueAtTime(success ? 523 : 180, context.currentTime);
            if (success) oscillator.frequency.linearRampToValueAtTime(784, context.currentTime + .22);
            gain.gain.setValueAtTime(.12, context.currentTime);
            gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + .42);
            oscillator.start(); oscillator.stop(context.currentTime + .42);
        } catch (ignored) {}
    }

    function confetti(amount) {
        const colors = ["#ffcb05", "#ef5350", "#4054b2", "#22b573"];
        for (let i = 0; i < amount; i++) {
            const piece = document.createElement("i");
            piece.className = "price-confetti";
            piece.style.left = `${Math.random() * 100}vw`;
            piece.style.background = colors[i % colors.length];
            piece.style.animationDelay = `${Math.random() * .6}s`;
            document.body.appendChild(piece);
            window.setTimeout(() => piece.remove(), 3000);
        }
    }
});
