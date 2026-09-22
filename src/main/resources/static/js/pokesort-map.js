document.addEventListener("DOMContentLoaded", () => {
    const levels = window.PokeSortLevels;
    const grid = document.getElementById("pokesort-level-grid");
    if (!levels || !grid) return;

    const unlocked = levels.getUnlocked();
    const continueLink = document.getElementById("pokesort-continue");
    document.getElementById("pokesort-current-level").textContent = `Nivel ${unlocked}`;
    document.getElementById("pokesort-continue-label").textContent = `Jugar nivel ${unlocked}`;
    continueLink.href = `/pokesort/jugar?nivel=${unlocked}`;

    const fragment = document.createDocumentFragment();
    for (let number = 1; number <= levels.count; number++) {
        const config = levels.getConfig(number);
        const available = number <= unlocked;
        const card = document.createElement(available ? "a" : "div");
        card.className = `pokesort-level-card ${available ? "available" : "locked"}`;
        if (number === unlocked) card.classList.add("current");
        if (available) card.href = `/pokesort/jugar?nivel=${number}`;
        const numberLabel = document.createElement("strong");
        numberLabel.textContent = String(number).padStart(2, "0");
        const detail = document.createElement("span");
        detail.textContent = available
            ? `${config.totalMatches} tríos · ${config.layers ? `${config.layers} capa${config.layers > 1 ? "s" : ""}` : "sin capas"}`
            : "🔒 Por desbloquear";
        card.append(numberLabel, detail);
        fragment.appendChild(card);
    }
    grid.appendChild(fragment);
});
