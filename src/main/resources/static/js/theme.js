const THEME_STORAGE_KEY = "badobiTheme";
const themeToggle = document.querySelector("#theme-toggle");

function obtenerTemaInicial() {
    const savedTheme = localStorage.getItem(
        THEME_STORAGE_KEY
    );

    if (savedTheme === "dark" || savedTheme === "light") {
        return savedTheme;
    }

    return window.matchMedia(
        "(prefers-color-scheme: dark)"
    ).matches
        ? "dark"
        : "light";
}

function aplicarTema(theme) {
    document.documentElement.setAttribute(
        "data-theme",
        theme
    );

    const darkTheme = theme === "dark";

    themeToggle.textContent = darkTheme ? "☀️" : "🌙";

    themeToggle.setAttribute(
        "aria-label",
        darkTheme
            ? "Activar tema claro"
            : "Activar tema oscuro"
    );
}

themeToggle.addEventListener("click", () => {
    const currentTheme =
        document.documentElement.getAttribute("data-theme");

    const nextTheme =
        currentTheme === "dark" ? "light" : "dark";

    localStorage.setItem(
        THEME_STORAGE_KEY,
        nextTheme
    );

    aplicarTema(nextTheme);
});

aplicarTema(obtenerTemaInicial());