document.addEventListener("DOMContentLoaded", () => {
    const grid = document.getElementById("achievement-grid");
    const showcase = document.getElementById("showcase-grid");
    const rewards = document.getElementById("reward-grid");
    const loading = document.getElementById("achievement-loading");
    const notice = document.getElementById("achievement-no-profile");
    const balance = document.getElementById("medal-balance");
    const count = document.getElementById("achievement-count");
    const bar = document.getElementById("achievement-progress");
    const shopMessage = document.getElementById("shop-message");

    let data = null;
    let filter = "Todos";

    document.querySelectorAll(".achievement-tabs button").forEach((button) => {
        button.addEventListener("click", () => {
            document.querySelectorAll(".achievement-tabs button")
                .forEach((item) => item.classList.toggle("active", item === button));
            document.querySelectorAll(".achievement-section")
                .forEach((section) => {
                    section.hidden = true;
                });
            document.getElementById(`${button.dataset.tab}-section`).hidden = false;
        });
    });

    document.querySelectorAll(".achievement-filters button").forEach((button) => {
        button.addEventListener("click", () => {
            filter = button.dataset.filter;
            document.querySelectorAll(".achievement-filters button")
                .forEach((item) => item.classList.toggle("active", item === button));
            renderAchievements();
        });
    });

    load();

    async function load() {
        try {
            const response = await fetch("/api/logros");

            if (!response.ok) {
                throw new Error();
            }

            data = await response.json();
            loading.hidden = true;

            if (!data.registrado) {
                notice.hidden = false;
                return;
            }

            notice.hidden = true;
            render();
        } catch (error) {
            loading.textContent =
                "No se pudieron cargar los logros. Inténtalo nuevamente.";
        }
    }

    function render() {
        balance.textContent = `🏅 ${data.medallas}`;
        count.textContent = `${data.completados} / ${data.total}`;
        bar.style.width = `${(data.completados / data.total) * 100}%`;
        renderAchievements();
        renderShowcase();
        renderRewards();
    }

    function renderAchievements() {
        if (!data?.registrado) {
            return;
        }

        grid.replaceChildren();

        data.logros
            .filter((item) => filter === "Todos" || item.dificultad === filter)
            .forEach((item, index) => {
                const card = document.createElement("article");
                card.className = `global-achievement-card ${
                    item.completado ? "completed" : "locked"
                }`;
                card.style.setProperty("--delay", `${index * 25}ms`);

                const percent = Math.min(
                    100,
                    item.progreso / item.objetivo * 100
                );

                card.innerHTML = `
                    <div class="achievement-card-top">
                        <span class="achievement-big-icon"></span>
                        <span class="difficulty-badge"></span>
                    </div>
                    <h2></h2>
                    <p></p>
                    <div class="achievement-reward">
                        <span></span>
                        <strong></strong>
                    </div>
                    <div class="achievement-card-progress">
                        <i style="width:${percent}%"></i>
                    </div>
                    <small>${item.progreso} / ${item.objetivo}</small>
                `;

                card.querySelector(".achievement-big-icon").textContent = item.icono;
                card.querySelector(".difficulty-badge").textContent = item.dificultad;
                card.querySelector("h2").textContent = item.nombre;
                card.querySelector("p").textContent = item.descripcion;
                card.querySelector(".achievement-reward span").textContent =
                    item.completado ? "✓ Completado" : "Recompensa";
                card.querySelector(".achievement-reward strong").textContent =
                    `🏅 ${item.medallas}`;
                grid.appendChild(card);
            });
    }

    function renderShowcase() {
        showcase.replaceChildren();
        const won = data.logros.filter((item) => item.completado);

        if (!won.length) {
            showcase.innerHTML =
                '<p class="empty-showcase">Todavía no tienes insignias. '
                + "¡Tu primera aventura te espera!</p>";
            return;
        }

        won.forEach((item) => {
            const badge = document.createElement("article");
            badge.className = "showcase-badge";
            const icon = document.createElement("span");
            icon.textContent = item.icono;
            const title = document.createElement("strong");
            title.textContent = item.nombre;
            const difficulty = document.createElement("small");
            difficulty.textContent = item.dificultad;
            badge.append(icon, title, difficulty);
            showcase.appendChild(badge);
        });
    }

    function renderRewards() {
        rewards.replaceChildren();

        data.recompensas.forEach((item) => {
            const card = document.createElement("article");
            card.className = `reward-card ${item.comprada ? "owned" : ""} ${
                item.equipada ? "equipped" : ""
            }`;

            card.appendChild(createRewardVisual(item));

            const title = document.createElement("h3");
            title.textContent = item.nombre;
            const text = document.createElement("p");
            text.textContent = item.descripcion;
            const button = document.createElement("button");

            configureRewardButton(item, button);
            card.append(title, text, button);
            rewards.appendChild(card);
        });
    }

    function createRewardVisual(item) {
        const visual = document.createElement("span");

        if (item.tipo === "avatar" && item.pokemonId > 0) {
            visual.className = "reward-avatar";
            const image = document.createElement("img");
            image.src = pokemonSprite(item.pokemonId);
            image.alt = item.nombre;
            image.loading = "lazy";
            image.draggable = false;
            image.addEventListener("error", () => {
                visual.textContent = item.icono;
            }, { once: true });
            visual.appendChild(image);
        } else {
            visual.textContent = item.icono;
        }

        return visual;
    }

    function configureRewardButton(item, button) {
        if (item.equipada) {
            button.textContent = "✓ Equipado";
            button.disabled = true;
            return;
        }

        if (item.comprada && item.tipo === "avatar") {
            button.textContent = "Usar avatar";
            button.addEventListener("click", () => equipAvatar(item.clave, button));
            return;
        }

        if (item.comprada) {
            button.textContent = "✓ Conseguido";
            button.disabled = true;
            return;
        }

        button.textContent = `Canjear · 🏅 ${item.precio}`;
        button.disabled = data.medallas < item.precio;
        button.addEventListener("click", () => redeem(item.clave, button));
    }

    async function redeem(key, button) {
        button.disabled = true;
        shopMessage.textContent = "Canjeando recompensa...";

        try {
            const response = await postReward("/api/logros/canjear", key);
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "No se pudo canjear");
            }

            shopMessage.textContent = `¡Desbloqueaste ${result.recompensa}!`;
            await load();
        } catch (error) {
            shopMessage.textContent = error.message;
            button.disabled = false;
        }
    }

    async function equipAvatar(key, button) {
        button.disabled = true;
        shopMessage.textContent = "Equipando avatar...";

        try {
            const response = await postReward(
                "/api/logros/equipar-avatar",
                key
            );
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "No se pudo equipar");
            }

            shopMessage.textContent = `Ahora usas ${result.recompensa}.`;
            await load();
        } catch (error) {
            shopMessage.textContent = error.message;
            button.disabled = false;
        }
    }

    function postReward(url, key) {
        return fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({ recompensa: key })
        });
    }

    function pokemonSprite(pokemonId) {
        return "https://raw.githubusercontent.com/"
            + "PokeAPI/sprites/master/sprites/pokemon/"
            + `${pokemonId}.png`;
    }
});
