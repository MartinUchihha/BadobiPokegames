document.addEventListener("DOMContentLoaded", () => {
    const STATS = [
        ["ps", "PS"], ["ataque", "Ataque"], ["defensa", "Defensa"],
        ["ataque-especial", "At. especial"],
        ["defensa-especial", "Def. especial"], ["velocidad", "Velocidad"]
    ];
    const setup = document.getElementById("battle-setup");
    const game = document.getElementById("battle-game");
    const generation = document.getElementById("battle-generation");
    const start = document.getElementById("battle-start");
    const round = document.getElementById("battle-round");
    const playerScore = document.getElementById("player-score");
    const rivalScore = document.getElementById("rival-score");
    const playerCard = document.getElementById("player-card");
    const rivalCard = document.getElementById("rival-card");
    const playerImage = document.getElementById("player-image");
    const rivalImage = document.getElementById("rival-image");
    const playerName = document.getElementById("player-name");
    const rivalName = document.getElementById("rival-name");
    const playerStats = document.getElementById("player-stats");
    const rivalStats = document.getElementById("rival-stats");
    const choices = document.getElementById("stat-choices");
    const message = document.getElementById("battle-message");
    const next = document.getElementById("next-round");
    const modal = document.getElementById("battle-result");
    const resultIcon = document.getElementById("battle-result-icon");
    const resultRank = document.getElementById("battle-rank");
    const resultTitle = document.getElementById("battle-result-title");
    const resultText = document.getElementById("battle-result-text");
    const again = document.getElementById("battle-play-again");
    let active = false;

    start.addEventListener("click", startGame);
    next.addEventListener("click", nextRound);
    again.addEventListener("click", () => {
        modal.hidden = true; game.hidden = true; setup.hidden = false; active = false;
        setup.scrollIntoView({behavior: "smooth", block: "center"});
    });

    async function startGame() {
        setButton(start, true, "Preparando combate...");
        try {
            const data = await post("/stat-battle/nueva-partida", {generacion: generation.value});
            renderRound(data);
            setup.hidden = true; game.hidden = false; active = true;
            game.scrollIntoView({behavior: "smooth", block: "start"});
        } catch (error) {
            alert("No se pudo comenzar el combate. Inténtalo nuevamente.");
        } finally {
            setButton(start, false, "Comenzar combate");
        }
    }

    async function chooseStat(stat) {
        if (!active) return;
        active = false;
        disableChoices(true);
        message.textContent = "Comparando estadísticas...";
        try {
            const data = await post("/stat-battle/elegir", {estadistica: stat});
            if (data.estado === "sin-partida") throw new Error("Partida expirada");
            revealResult(data, stat);
        } catch (error) {
            message.textContent = "No se pudo resolver la ronda.";
            active = true; disableChoices(false);
        }
    }

    async function nextRound() {
        setButton(next, true, "Preparando...");
        try {
            const data = await post("/stat-battle/siguiente-ronda");
            renderRound(data); active = true;
            window.scrollTo({top: game.offsetTop - 15, behavior: "smooth"});
        } catch (error) {
            message.textContent = "No se pudo preparar la siguiente ronda.";
        } finally {
            setButton(next, false, "Siguiente ronda");
        }
    }

    function renderRound(data) {
        round.textContent = `Ronda ${data.ronda}`;
        playerScore.textContent = data.puntosJugador;
        rivalScore.textContent = data.puntosRival;
        playerImage.src = data.jugador.imagen;
        playerImage.alt = format(data.jugador.nombre);
        rivalImage.src = data.rival.imagen;
        rivalImage.alt = format(data.rival.nombre);
        playerName.textContent = format(data.jugador.nombre);
        rivalName.textContent = format(data.rival.nombre);
        playerCard.classList.remove("winner", "loser", "tie");
        rivalCard.classList.remove("winner", "loser", "tie");
        renderStats(playerStats, data.jugador.estadisticas);
        rivalStats.className = "battle-stats hidden-stats";
        rivalStats.textContent = "Elige una estadística para revelar sus valores";
        choices.replaceChildren();
        STATS.forEach(([key, label]) => {
            const button = document.createElement("button");
            button.type = "button"; button.className = "stat-choice";
            button.textContent = `${label} · ${data.jugador.estadisticas[key]}`;
            button.addEventListener("click", () => chooseStat(key));
            choices.appendChild(button);
        });
        next.hidden = true;
        message.textContent = "Selecciona la mayor ventaja de tu Pokémon.";
    }

    function revealResult(data, selectedStat) {
        renderStats(rivalStats, data.estadisticasRival, selectedStat);
        rivalStats.className = "battle-stats";
        playerScore.textContent = data.puntosJugador;
        rivalScore.textContent = data.puntosRival;
        highlightStat(playerStats, selectedStat);
        if (data.resultado === "victoria") {
            playerCard.classList.add("winner"); rivalCard.classList.add("loser");
            message.textContent = `¡Ganaste! ${data.valorJugador} supera a ${data.valorRival}.`;
            notes([523, 659, 784]);
        } else if (data.resultado === "derrota") {
            rivalCard.classList.add("winner"); playerCard.classList.add("loser");
            message.textContent = `El rival gana: ${data.valorRival} contra ${data.valorJugador}.`;
            notes([330, 260, 210]);
        } else {
            playerCard.classList.add("tie"); rivalCard.classList.add("tie");
            message.textContent = `¡Empate! Ambos tienen ${data.valorJugador}.`;
            notes([390, 390]);
        }
        if (data.estado === "terminada") {
            window.setTimeout(() => showFinal(data), 1100);
        } else {
            next.hidden = false;
        }
    }

    function renderStats(container, values, selected = "") {
        container.replaceChildren();
        STATS.forEach(([key, label]) => {
            const row = document.createElement("div");
            row.className = "battle-stat";
            if (key === selected) row.dataset.selected = "true";
            const name = document.createElement("span"); name.textContent = label;
            const track = document.createElement("div"); track.className = "battle-stat-bar";
            const bar = document.createElement("i");
            bar.style.width = `${Math.min(values[key] / 255 * 100, 100)}%`;
            const value = document.createElement("strong"); value.textContent = values[key];
            track.appendChild(bar); row.append(name, track, value); container.appendChild(row);
        });
    }

    function highlightStat(container, selected) {
        [...container.children].forEach((row, index) => {
            row.style.background = STATS[index][0] === selected ? "rgba(255,203,5,.28)" : "";
        });
    }

    function showFinal(data) {
        const victory = data.victoriaFinal;
        resultIcon.textContent = victory ? "🏆" : "🛡️";
        resultTitle.textContent = victory ? "¡Ganaste el combate!" : "El rival ganó esta vez";
        const record = updateRecord(victory);
        resultRank.textContent = victory ? rank(record.current) : "Entrena y vuelve a intentarlo";
        resultText.textContent = `${data.puntosJugador} - ${data.puntosRival} · Mejor racha: ${record.best}`;
        modal.hidden = false;
        if (victory) { confetti(); notes([523, 659, 784, 1047]); }
        else notes([330, 277, 220]);
    }

    function updateRecord(victory) {
        const saved = JSON.parse(localStorage.getItem("badobiStatBattle") || '{"current":0,"best":0}');
        saved.current = victory ? saved.current + 1 : 0;
        saved.best = Math.max(saved.best, saved.current);
        localStorage.setItem("badobiStatBattle", JSON.stringify(saved));
        return saved;
    }

    function rank(streak) {
        if (streak >= 7) return "Campeón Pokémon";
        if (streak >= 4) return "Alto Mando";
        if (streak >= 2) return "Líder de gimnasio";
        return "Entrenador Pokémon";
    }

    function disableChoices(disabled) {
        choices.querySelectorAll("button").forEach(button => button.disabled = disabled);
    }

    async function post(url, values = {}) {
        const body = new URLSearchParams(values);
        const response = await fetch(url, {method: "POST", headers: {"Content-Type": "application/x-www-form-urlencoded"}, body});
        if (!response.ok) throw new Error(`Error ${response.status}`);
        return response.json();
    }

    function setButton(button, disabled, text) { button.disabled = disabled; button.textContent = text; }
    function format(name) { return name.split("-").map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(" "); }

    function notes(frequencies) {
        try {
            const Audio = window.AudioContext || window.webkitAudioContext;
            const context = new Audio();
            frequencies.forEach((frequency, index) => {
                const oscillator = context.createOscillator(); const gain = context.createGain();
                const time = context.currentTime + index * .12;
                oscillator.type = "triangle"; oscillator.frequency.value = frequency;
                gain.gain.setValueAtTime(.07, time); gain.gain.exponentialRampToValueAtTime(.001, time + .12);
                oscillator.connect(gain); gain.connect(context.destination); oscillator.start(time); oscillator.stop(time + .12);
            });
        } catch (error) { console.log("Sonido bloqueado"); }
    }

    function confetti() {
        const colors = ["#ffcb05", "#ef5350", "#3c82f6", "#2fbf71"];
        for (let index = 0; index < 70; index++) {
            const piece = document.createElement("i");
            Object.assign(piece.style, {position:"fixed",zIndex:"1100",top:"-20px",left:`${Math.random()*100}%`,width:"9px",height:"14px",background:colors[index%colors.length],pointerEvents:"none",transition:"top 3s ease-in,transform 3s linear,opacity .5s 2.3s"});
            document.body.appendChild(piece);
            requestAnimationFrame(() => { piece.style.top="110vh"; piece.style.transform=`rotate(${720+Math.random()*720}deg)`; piece.style.opacity="0"; });
            setTimeout(() => piece.remove(), 4000);
        }
    }
});
