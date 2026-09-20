document.addEventListener("DOMContentLoaded", () => {
    const profileCreate = document.getElementById("profile-create");
    const profileReady = document.getElementById("profile-ready");
    const profileForm = document.getElementById("profile-form");
    const profileName = document.getElementById("profile-name");
    const profileMessage = document.getElementById("profile-message");
    const playerName = document.getElementById("profile-player-name");
    const playerAvatar = document.getElementById("profile-avatar");
    const gameSelect = document.getElementById("global-ranking-game");
    const body = document.getElementById("global-ranking-body");
    const wrapper = document.getElementById("global-ranking-wrapper");
    const status = document.getElementById("ranking-status");
    const scoreHeading = document.getElementById("score-heading");
    let currentName = "";

    profileForm.addEventListener("submit", createProfile);
    gameSelect.addEventListener("change", loadRanking);
    loadProfile();
    loadRanking();

    async function loadProfile() {
        try {
            const response = await fetch("/api/ranking/perfil");
            const profile = await response.json();
            if (profile.registrado) showProfile(profile);
        } catch (error) {
            profileMessage.textContent = "No se pudo comprobar tu perfil.";
        }
    }

    async function createProfile(event) {
        event.preventDefault();
        const button = profileForm.querySelector("button");
        button.disabled = true;
        button.textContent = "Creando...";
        profileMessage.textContent = "";
        try {
            const response = await fetch("/api/ranking/perfil", {
                method: "POST",
                headers: {"Content-Type": "application/x-www-form-urlencoded"},
                body: new URLSearchParams({nombre: profileName.value})
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "No se pudo crear el perfil");
            showProfile(data);
            await loadRanking();
        } catch (error) {
            profileMessage.textContent = error.message;
        } finally {
            button.disabled = false;
            button.textContent = "Crear entrenador";
        }
    }

    function showProfile(profile) {
        currentName = profile.nombre;
        playerName.textContent = profile.nombre;
        renderAvatar(playerAvatar, profile.avatar, profile.nombre);
        profileCreate.hidden = true;
        profileReady.hidden = false;
    }

    async function loadRanking() {
        status.hidden = false;
        status.textContent = "Cargando clasificación...";
        wrapper.hidden = true;
        try {
            const response = await fetch(`/api/ranking/global?juego=${encodeURIComponent(gameSelect.value)}`);
            if (!response.ok) throw new Error();
            const data = await response.json();
            document.getElementById("season-name").textContent = capitalize(data.temporada.nombre);
            document.getElementById("season-end").textContent = `Finaliza el ${formatDate(data.temporada.termina)}`;
            renderRows(data.ranking);
        } catch (error) {
            status.textContent = "No se pudo cargar el ranking. Inténtalo nuevamente.";
        }
    }

    function renderRows(rows) {
        body.innerHTML = "";
        const headings = {
            general: "Experiencia",
            pokedle: "Eficiencia",
            fusion: "Completado",
            silueta: "Eficiencia",
            "silueta-tiempo": "Aciertos",
            pokeprice: "Mejor racha",
            "higher-lower": "Mejor racha",
            "stat-battle": "Puntuación",
            trivia: "Puntuación",
            pokezoom: "Eficiencia",
            sonidos: "Eficiencia",
            movimientos: "Eficiencia",
            "adivina-estadisticas": "Eficiencia",
            pokematch: "Puntuación"
        };
        scoreHeading.textContent = headings[gameSelect.value] || "Puntuación";
        if (rows.length === 0) {
            status.hidden = false;
            status.textContent = "Todavía no hay resultados. ¡Puedes ser el primer entrenador!";
            wrapper.hidden = true;
            return;
        }

        rows.forEach((entry, index) => {
            const row = document.createElement("tr");
            if (entry.nombre === currentName) row.classList.add("current-player");
            row.append(cell(position(index + 1), "ranking-place"));
            const trainer = document.createElement("td");
            const avatar = document.createElement("span");
            avatar.className = "table-avatar";
            renderAvatar(avatar, entry.avatar, entry.nombre);
            const name = document.createElement("strong");
            name.textContent = entry.nombre;
            trainer.append(avatar, name);
            row.appendChild(trainer);
            row.append(cell(formatNumber(entry.puntuacion), "ranking-score"));
            row.append(cell(`${formatNumber(entry.experiencia)} XP`, "ranking-xp"));
            body.appendChild(row);
        });
        status.hidden = true;
        wrapper.hidden = false;
    }

    function cell(text, className) {
        const element = document.createElement("td");
        element.textContent = text;
        element.className = className;
        return element;
    }

    function position(value) { return ({1: "🥇", 2: "🥈", 3: "🥉"})[value] || `#${value}`; }
    function formatNumber(value) { return new Intl.NumberFormat("es-CL").format(value); }
    function formatDate(value) {
        return new Intl.DateTimeFormat("es-CL", {day: "numeric", month: "long", year: "numeric"})
            .format(new Date(`${value}T12:00:00`));
    }
    function capitalize(value) { return value.charAt(0).toUpperCase() + value.slice(1); }

    function renderAvatar(container, avatar, trainerName) {
        container.replaceChildren();

        if (avatar?.startsWith("pokemon-")) {
            const pokemonId = Number(avatar.slice("pokemon-".length));
            const image = document.createElement("img");
            image.src = pokemonSprite(pokemonId);
            image.alt = `Avatar de ${trainerName}`;
            image.loading = "lazy";
            image.draggable = false;
            image.addEventListener("error", () => {
                container.textContent = "⚡";
            }, { once: true });
            container.appendChild(image);
            return;
        }

        container.textContent = avatar || "⚡";
    }

    function pokemonSprite(pokemonId) {
        return "https://raw.githubusercontent.com/"
            + "PokeAPI/sprites/master/sprites/pokemon/"
            + `${pokemonId}.png`;
    }
});
