document.addEventListener("DOMContentLoaded", () => {
    const setup = document.getElementById("trivia-setup");
    const game = document.getElementById("trivia-game");
    const generationSelect = document.getElementById("trivia-generation");
    const startButton = document.getElementById("trivia-start");
    const questionNumber = document.getElementById("trivia-question-number");
    const scoreElement = document.getElementById("trivia-score");
    const streakElement = document.getElementById("trivia-streak");
    const soundToggle = document.getElementById("trivia-sound-toggle");
    const progressBar = document.getElementById("trivia-progress-bar");
    const questionCard = document.getElementById("trivia-question-card");
    const category = document.getElementById("trivia-category");
    const questionText = document.getElementById("trivia-question");
    const optionsContainer = document.getElementById("trivia-options");
    const fiftyButton = document.getElementById("trivia-fifty");
    const changeButton = document.getElementById("trivia-change");
    const feedback = document.getElementById("trivia-feedback");
    const feedbackIcon = document.getElementById("trivia-feedback-icon");
    const feedbackTitle = document.getElementById("trivia-feedback-title");
    const explanation = document.getElementById("trivia-explanation");
    const pointsEarned = document.getElementById("trivia-points-earned");
    const nextButton = document.getElementById("trivia-next");
    const resultModal = document.getElementById("trivia-result-modal");
    const resultIcon = document.getElementById("trivia-result-icon");
    const resultTitle = document.getElementById("trivia-result-title");
    const resultRank = document.getElementById("trivia-result-rank");
    const finalScore = document.getElementById("trivia-final-score");
    const finalStreak = document.getElementById("trivia-final-streak");
    const recordMessage = document.getElementById("trivia-record-message");
    const restartButton = document.getElementById("trivia-restart");

    let gameActive = false;
    let answering = false;
    let currentOptions = [];
    let pendingFinalResult = null;
    let fiftyUsed = false;
    let changeUsed = false;
    let bestBeforeGame = 0;
    let bestScore = Number(
        localStorage.getItem("badobi-trivia-best") || 0
    );
    let soundMuted =
        localStorage.getItem("badobi-trivia-muted") === "true";

    updateSoundButton();

    startButton.addEventListener("click", startGame);
    nextButton.addEventListener("click", continueGame);
    fiftyButton.addEventListener("click", useFiftyFifty);
    changeButton.addEventListener("click", changeQuestion);
    soundToggle.addEventListener("click", toggleSound);
    restartButton.addEventListener("click", () => {
        closeResult();
        startGame();
    });

    resultModal.addEventListener("click", event => {
        if (event.target === resultModal) {
            closeResult();
        }
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && !resultModal.hidden) {
            closeResult();
            return;
        }

        if (!gameActive || answering || !feedback.hidden) return;

        const optionNumber = Number(event.key);
        if (optionNumber >= 1 && optionNumber <= currentOptions.length) {
            currentOptions[optionNumber - 1].click();
        }
    });

    async function startGame() {
        if (answering) return;

        closeResult();
        setSetupEnabled(false);
        startButton.textContent = "Generando preguntas...";
        questionCard.classList.add("loading");

        try {
            const result = await postForm(
                "/trivia/nueva-partida",
                {generacion: generationSelect.value}
            );

            gameActive = true;
            answering = false;
            pendingFinalResult = null;
            bestBeforeGame = bestScore;
            setup.hidden = true;
            game.hidden = false;
            feedback.hidden = true;
            renderQuestion(result);
        } catch (error) {
            window.alert(
                "No pudimos generar la trivia. Comprueba tu conexión e inténtalo nuevamente."
            );
        } finally {
            setSetupEnabled(true);
            startButton.textContent = "Comenzar trivia";
            questionCard.classList.remove("loading");
        }
    }

    function renderQuestion(data) {
        category.textContent = data.categoria;
        questionText.textContent = data.enunciado;
        questionNumber.textContent =
            `${data.numeroPregunta}/${data.totalPreguntas}`;
        scoreElement.textContent = String(data.puntuacion);
        streakElement.textContent = `${data.racha} 🔥`;
        progressBar.style.width =
            `${((data.numeroPregunta - 1) / data.totalPreguntas) * 100}%`;

        optionsContainer.innerHTML = "";
        currentOptions = [];
        const letters = ["A", "B", "C", "D"];

        data.opciones.forEach((optionText, index) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "trivia-option";
            button.dataset.answer = optionText;

            const letter = document.createElement("span");
            letter.className = "trivia-option-letter";
            letter.textContent = letters[index];

            const text = document.createElement("span");
            text.textContent = optionText;

            button.append(letter, text);
            button.addEventListener("click", () => answerQuestion(button));
            optionsContainer.appendChild(button);
            currentOptions.push(button);
        });

        feedback.hidden = true;
        feedback.classList.remove("correct", "incorrect");
        nextButton.textContent = "Siguiente pregunta";
        pendingFinalResult = null;
        fiftyUsed = Boolean(data.ayudaCincuentaUsada);
        changeUsed = Boolean(data.ayudaCambioUsada);
        fiftyButton.disabled = fiftyUsed;
        changeButton.disabled = changeUsed;
        questionCard.classList.remove("entering");
        void questionCard.offsetWidth;
        questionCard.classList.add("entering");
    }

    async function answerQuestion(selectedButton) {
        if (!gameActive || answering) return;

        answering = true;
        setOptionsEnabled(false);
        fiftyButton.disabled = true;
        changeButton.disabled = true;
        questionCard.classList.add("loading");

        try {
            const result = await postForm(
                "/trivia/responder",
                {respuesta: selectedButton.dataset.answer}
            );

            if (result.estado === "sin-partida") {
                throw new Error("La partida expiró");
            }

            if (
                result.estado === "ya-respondida"
                || result.estado === "respuesta-invalida"
            ) {
                throw new Error("La respuesta no pudo procesarse");
            }

            revealCorrectAnswer(
                selectedButton,
                result.respuestaCorrecta,
                result.correcta
            );

            scoreElement.textContent = String(result.puntuacion);
            streakElement.textContent = `${result.racha} 🔥`;
            progressBar.style.width =
                `${(result.preguntasRespondidas / 10) * 100}%`;
            showFeedback(result);

            if (result.estado === "terminada") {
                pendingFinalResult = result;
                nextButton.textContent = "Ver resultado";
            }
        } catch (error) {
            window.alert(
                "No se pudo comprobar la respuesta. Inténtalo nuevamente."
            );
            setOptionsEnabled(true);
            fiftyButton.disabled = fiftyUsed;
            changeButton.disabled = changeUsed;
        } finally {
            questionCard.classList.remove("loading");
            answering = false;
        }
    }

    function revealCorrectAnswer(selectedButton, correctAnswer, wasCorrect) {
        currentOptions.forEach(button => {
            const isCorrect =
                button.dataset.answer.toLocaleLowerCase("es")
                === correctAnswer.toLocaleLowerCase("es");

            if (isCorrect) {
                button.classList.add("correct");
            }
        });

        if (!wasCorrect) {
            selectedButton.classList.add("incorrect");
            playIncorrectSound();
        } else {
            playCorrectSound();
        }
    }

    function showFeedback(result) {
        feedback.hidden = false;
        feedback.classList.toggle("correct", result.correcta);
        feedback.classList.toggle("incorrect", !result.correcta);
        feedbackIcon.textContent = result.correcta ? "✅" : "❌";
        feedbackTitle.textContent = result.correcta
            ? result.puntosGanados > 100
                ? "¡Racha de tres!"
                : "¡Respuesta correcta!"
            : "Respuesta incorrecta";
        explanation.textContent = result.explicacion;

        if (result.puntosGanados > 0) {
            pointsEarned.textContent = `+${result.puntosGanados} puntos`;
            pointsEarned.hidden = false;
        } else {
            pointsEarned.textContent = "La racha vuelve a cero";
            pointsEarned.hidden = false;
        }

        nextButton.focus();
    }

    async function continueGame() {
        if (answering) return;

        if (pendingFinalResult !== null) {
            showFinalResult(pendingFinalResult);
            return;
        }

        answering = true;
        nextButton.disabled = true;
        questionCard.classList.add("loading");

        try {
            const result = await postForm("/trivia/siguiente");

            if (result.estado !== "pregunta") {
                throw new Error("No existe una pregunta siguiente");
            }

            renderQuestion(result);
        } catch (error) {
            window.alert(
                "No se pudo generar la siguiente pregunta. Pulsa nuevamente."
            );
        } finally {
            answering = false;
            nextButton.disabled = false;
            questionCard.classList.remove("loading");
        }
    }

    async function useFiftyFifty() {
        if (!gameActive || answering || fiftyUsed || !feedback.hidden) {
            return;
        }

        answering = true;
        fiftyButton.disabled = true;

        try {
            const result = await postForm("/trivia/ayuda/cincuenta");

            if (result.estado !== "correcto") {
                throw new Error("No se pudo utilizar la ayuda");
            }

            fiftyUsed = true;

            currentOptions.forEach(button => {
                const remove = result.eliminadas.some(
                    option => option.toLocaleLowerCase("es")
                        === button.dataset.answer.toLocaleLowerCase("es")
                );

                if (remove) {
                    button.classList.add("removed");
                    button.disabled = true;
                }
            });

            playHelpSound();
        } catch (error) {
            fiftyButton.disabled = fiftyUsed;
            window.alert("No se pudo utilizar la ayuda 50/50.");
        } finally {
            answering = false;
        }
    }

    async function changeQuestion() {
        if (!gameActive || answering || changeUsed || !feedback.hidden) {
            return;
        }

        answering = true;
        setOptionsEnabled(false);
        fiftyButton.disabled = true;
        changeButton.disabled = true;
        questionCard.classList.add("loading");

        try {
            const result = await postForm("/trivia/ayuda/cambio");

            if (result.estado !== "pregunta-cambiada") {
                throw new Error("No se pudo cambiar la pregunta");
            }

            changeUsed = true;
            renderQuestion(result);
            playHelpSound();
        } catch (error) {
            setOptionsEnabled(true);
            fiftyButton.disabled = fiftyUsed;
            changeButton.disabled = changeUsed;
            window.alert("No se pudo cambiar la pregunta.");
        } finally {
            questionCard.classList.remove("loading");
            answering = false;
        }
    }

    function showFinalResult(result) {
        gameActive = false;
        updateBestScore(result.puntuacion);

        const newRecord = result.puntuacion > bestBeforeGame;
        resultIcon.textContent = rankIcon(result.rango);
        resultTitle.textContent = newRecord
            ? "¡Nuevo récord!"
            : "¡Trivia completada!";
        resultRank.textContent = result.rango;
        finalScore.textContent = String(result.puntuacion);
        finalStreak.textContent = String(result.mejorRacha);
        recordMessage.textContent = newRecord
            ? `Nuevo récord personal: ${result.puntuacion} puntos.`
            : `Tu récord personal es de ${bestScore} puntos.`;
        resultModal.hidden = false;
        document.body.classList.add("trivia-modal-open");

        if (result.puntuacion >= 700 || newRecord) {
            launchConfetti();
            playVictorySound();
        }

        restartButton.focus();
    }

    function updateBestScore(score) {
        if (score <= bestScore) return;

        bestScore = score;
        localStorage.setItem("badobi-trivia-best", String(bestScore));
    }

    function rankIcon(rank) {
        if (rank === "Maestro Pokémon") return "🏆";
        if (rank === "Líder de gimnasio") return "🏅";
        if (rank === "Entrenador Pokémon") return "🎖️";
        return "🎒";
    }

    function setOptionsEnabled(enabled) {
        currentOptions.forEach(button => {
            button.disabled = !enabled;
        });
    }

    function setSetupEnabled(enabled) {
        startButton.disabled = !enabled;
        generationSelect.disabled = !enabled;
    }

    function closeResult() {
        resultModal.hidden = true;
        document.body.classList.remove("trivia-modal-open");
    }

    function toggleSound() {
        soundMuted = !soundMuted;
        localStorage.setItem(
            "badobi-trivia-muted",
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

    function playCorrectSound() {
        playNotes([659.25, 880], 0.11, "sine", 0.11);
    }

    function playIncorrectSound() {
        playNotes([300, 220], 0.16, "square", 0.055);
    }

    function playHelpSound() {
        playNotes([440, 659.25], 0.1, "triangle", 0.08);
    }

    function playVictorySound() {
        playNotes(
            [523.25, 659.25, 783.99, 1046.5],
            0.13,
            "triangle",
            0.14
        );
    }

    function playNotes(notes, interval, type, volume) {
        if (soundMuted) return;

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
                volume,
                noteStart + 0.02
            );
            gain.gain.exponentialRampToValueAtTime(
                0.0001,
                noteStart + 0.28
            );
            oscillator.connect(gain);
            gain.connect(context.destination);
            oscillator.start(noteStart);
            oscillator.stop(noteStart + 0.3);
        });

        window.setTimeout(
            () => context.close(),
            Math.ceil((notes.length * interval + 0.5) * 1000)
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

        for (let index = 0; index < 70; index++) {
            const piece = document.createElement("span");
            piece.className = "trivia-confetti";
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
