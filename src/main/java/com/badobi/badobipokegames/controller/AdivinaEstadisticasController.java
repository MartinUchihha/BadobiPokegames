package com.badobi.badobipokegames.controller;

import com.badobi.badobipokegames.model.PartidaEstadisticas;
import com.badobi.badobipokegames.model.PokemonHigherLower;
import com.badobi.badobipokegames.service.EstadisticasService;
import com.badobi.badobipokegames.service.LogrosService;
import com.badobi.badobipokegames.service.RankingGlobalService;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.List;

@Controller
public class AdivinaEstadisticasController {

    private static final String PARTIDA = "partidaEstadisticas";

    private final EstadisticasService estadisticasService;
    private final LogrosService logrosService;
    private final RankingGlobalService rankingService;

    public AdivinaEstadisticasController(
            EstadisticasService estadisticasService,
            LogrosService logrosService,
            RankingGlobalService rankingService
    ) {
        this.estadisticasService = estadisticasService;
        this.logrosService = logrosService;
        this.rankingService = rankingService;
    }

    @GetMapping("/adivina-estadisticas")
    public String mostrarJuego() {
        return "adivina-estadisticas";
    }
    @GetMapping("/adivina-estadisticas/pokemon")
    @ResponseBody
    public List<Map<String, Object>> obtenerListaPokemon() {
        return estadisticasService.obtenerListaPokemon();
    }

    @PostMapping("/adivina-estadisticas/nueva-partida")
    @ResponseBody
    public Map<String, Object> nuevaPartida(
            @RequestParam(defaultValue = "all") String generacion,
            HttpSession session
    ) {
        PartidaEstadisticas partida =
                estadisticasService.crearPartida(generacion);

        session.setAttribute(PARTIDA, partida);

        Map<String, Object> resultado = new LinkedHashMap<>();
        resultado.put("estado", "activa");
        resultado.put(
                "estadisticas",
                crearEstadisticas(partida.getPokemonSecreto())
        );
        resultado.put("intento", 1);
        resultado.put(
                "maxIntentos",
                PartidaEstadisticas.MAX_INTENTOS
        );

        return resultado;
    }

    @PostMapping("/adivina-estadisticas/intento")
    @ResponseBody
    public Map<String, Object> comprobarIntento(
            @RequestParam String pokemonName,
            @CookieValue(name = RankingGlobalService.COOKIE, required = false) String jugadorToken,
            HttpSession session
    ) {
        PartidaEstadisticas partida =
                (PartidaEstadisticas)
                        session.getAttribute(PARTIDA);

        if (partida == null) {
            return Map.of("estado", "sin-partida");
        }

        if (partida.isTerminada()) {
            return Map.of("estado", "terminada");
        }

        String nombreNormalizado = normalizarNombre(pokemonName);

        if (nombreNormalizado.isBlank()) {
            return Map.of("estado", "invalido");
        }

        if (partida.yaFueIntentado(nombreNormalizado)) {
            return Map.of(
                    "estado", "repetido",
                    "intentos", partida.getNumeroIntentos()
            );
        }

        PokemonHigherLower pokemonElegido;

        try {
            pokemonElegido = estadisticasService.obtenerPokemon(
                    nombreNormalizado
            );
        } catch (RuntimeException error) {
            return Map.of("estado", "invalido");
        }

        if (
                !estadisticasService.perteneceAGeneracion(
                        pokemonElegido,
                        partida.getGeneracion()
                )
        ) {
            return Map.of("estado", "generacion-invalida");
        }

        Map<String, String> comparaciones =
                estadisticasService.compararEstadisticas(
                        partida.getPokemonSecreto(),
                        pokemonElegido
                );

        boolean correcto = partida.registrarIntento(pokemonElegido);

        Map<String, Object> resultado = new LinkedHashMap<>();
        resultado.put(
                "estado",
                partida.isTerminada() ? "terminada" : "continua"
        );
        resultado.put("correcto", correcto);
        resultado.put(
                "pokemonElegido",
                crearPokemonIntentado(
                        pokemonElegido,
                        comparaciones
                )
        );
        resultado.put("intentos", partida.getNumeroIntentos());
        resultado.put("restantes", partida.getIntentosRestantes());
        resultado.put("victoria", partida.isVictoria());
        resultado.put(
                "movimientos",
                estadisticasService.obtenerPistasMovimientos(
                        partida.getPokemonSecreto(),
                        partida.getNumeroIntentos()
                )
        );

        if (partida.isTerminada()) {
            logrosService.incrementar(jugadorToken, "partidas", 1);
            if (partida.isVictoria()) {
                logrosService.actualizarMaximo(jugadorToken, "victorias", 1);
                rankingService.registrarMejor(jugadorToken, "adivina-estadisticas", PartidaEstadisticas.MAX_INTENTOS + 1 - partida.getNumeroIntentos());
            }
            PokemonHigherLower solucion =
                    partida.getPokemonResultado();

            resultado.put(
                    "pokemon",
                    crearPokemonRevelado(solucion)
            );
            resultado.put(
                    "respuestaAlternativa",
                    correcto
                            && solucion.getId()
                            != partida.getPokemonSecreto().getId()
            );
        }

        return resultado;
    }

    private Map<String, Object> crearPokemonIntentado(
            PokemonHigherLower pokemon,
            Map<String, String> comparaciones
    ) {
        Map<String, Object> resultado = new LinkedHashMap<>();
        resultado.put("id", pokemon.getId());
        resultado.put("nombre", pokemon.getNombre());
        resultado.put("imagen", pokemon.getImagen());
        resultado.put("estadisticas", crearEstadisticas(pokemon));
        resultado.put("comparaciones", comparaciones);
        return resultado;
    }

    private Map<String, Object> crearPokemonRevelado(
            PokemonHigherLower pokemon
    ) {
        Map<String, Object> resultado = new LinkedHashMap<>();
        resultado.put("id", pokemon.getId());
        resultado.put("nombre", pokemon.getNombre());
        resultado.put("imagen", pokemon.getImagen());
        resultado.put("estadisticas", crearEstadisticas(pokemon));
        return resultado;
    }

    private Map<String, Integer> crearEstadisticas(
            PokemonHigherLower pokemon
    ) {
        Map<String, Integer> estadisticas = new LinkedHashMap<>();
        estadisticas.put("ps", pokemon.getPs());
        estadisticas.put("ataque", pokemon.getAtaque());
        estadisticas.put("defensa", pokemon.getDefensa());
        estadisticas.put(
                "ataqueEspecial",
                pokemon.getAtaqueEspecial()
        );
        estadisticas.put(
                "defensaEspecial",
                pokemon.getDefensaEspecial()
        );
        estadisticas.put("velocidad", pokemon.getVelocidad());
        return estadisticas;
    }

    private String normalizarNombre(String nombre) {
        if (nombre == null) {
            return "";
        }

        return nombre
                .trim()
                .toLowerCase(Locale.ROOT)
                .replace(" ", "-")
                .replace(".", "");
    }
}
