package com.badobi.badobipokegames.controller;

import com.badobi.badobipokegames.model.PartidaStatBattle;
import com.badobi.badobipokegames.model.PokemonHigherLower;
import com.badobi.badobipokegames.service.StatBattleService;
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
import java.util.Map;
import java.util.Set;

@Controller
public class StatBattleController {
    private static final String PARTIDA = "partidaStatBattle";
    private static final Set<String> ESTADISTICAS = Set.of(
            "ps", "ataque", "defensa", "ataque-especial",
            "defensa-especial", "velocidad"
    );
    private final StatBattleService service;
    private final LogrosService logrosService;
    private final RankingGlobalService rankingService;

    public StatBattleController(StatBattleService service, LogrosService logrosService, RankingGlobalService rankingService) {
        this.service = service; this.logrosService = logrosService; this.rankingService = rankingService;
    }

    @GetMapping("/stat-battle")
    public String mostrarJuego() { return "stat-battle"; }

    @PostMapping("/stat-battle/nueva-partida")
    @ResponseBody
    public Map<String, Object> nuevaPartida(
            @RequestParam(defaultValue = "all") String generacion,
            HttpSession session
    ) {
        PartidaStatBattle partida = service.crearPartida(generacion);
        session.setAttribute(PARTIDA, partida);
        return crearRonda(partida);
    }

    @PostMapping("/stat-battle/elegir")
    @ResponseBody
    public Map<String, Object> elegir(
            @RequestParam String estadistica,
            @CookieValue(name = RankingGlobalService.COOKIE, required = false) String jugadorToken,
            HttpSession session
    ) {
        PartidaStatBattle partida = (PartidaStatBattle) session.getAttribute(PARTIDA);
        if (partida == null) return Map.of("estado", "sin-partida");
        if (partida.isRondaRespondida()) return Map.of("estado", "ronda-respondida");
        if (!ESTADISTICAS.contains(estadistica)) return Map.of("estado", "invalido");

        int resultadoComparacion = partida.comparar(estadistica);
        int jugador = partida.getPokemonJugador().obtenerEstadistica(estadistica);
        int rival = partida.getPokemonRival().obtenerEstadistica(estadistica);
        Map<String, Object> resultado = new LinkedHashMap<>();
        resultado.put("estado", partida.isTerminada() ? "terminada" : "ronda-finalizada");
        resultado.put("resultado", resultadoComparacion > 0 ? "victoria" : resultadoComparacion < 0 ? "derrota" : "empate");
        resultado.put("estadistica", estadistica);
        resultado.put("valorJugador", jugador);
        resultado.put("valorRival", rival);
        resultado.put("puntosJugador", partida.getPuntosJugador());
        resultado.put("puntosRival", partida.getPuntosRival());
        resultado.put("estadisticasRival", crearEstadisticas(partida.getPokemonRival()));
        resultado.put("victoriaFinal", partida.isVictoria());
        if (partida.isTerminada()) {
            logrosService.incrementar(jugadorToken, "partidas", 1);
            if (partida.isVictoria()) {
                logrosService.incrementar(jugadorToken, "victorias", 1);
                logrosService.incrementar(jugadorToken, "stat-victorias", 1);
                if (partida.getPuntosRival() == 0) logrosService.incrementar(jugadorToken, "stat-perfectas", 1);
                rankingService.registrarMejor(jugadorToken, "stat-battle", 400 - partida.getPuntosRival() * 50);
            }
        }
        return resultado;
    }

    @PostMapping("/stat-battle/siguiente-ronda")
    @ResponseBody
    public Map<String, Object> siguienteRonda(HttpSession session) {
        PartidaStatBattle partida = (PartidaStatBattle) session.getAttribute(PARTIDA);
        if (partida == null) return Map.of("estado", "sin-partida");
        if (partida.isTerminada()) return Map.of("estado", "terminada");
        if (!partida.isRondaRespondida()) return Map.of("estado", "ronda-pendiente");
        service.prepararRonda(partida);
        return crearRonda(partida);
    }

    private Map<String, Object> crearRonda(PartidaStatBattle partida) {
        Map<String, Object> resultado = new LinkedHashMap<>();
        resultado.put("estado", "ronda");
        resultado.put("ronda", partida.getNumeroRonda());
        resultado.put("puntosJugador", partida.getPuntosJugador());
        resultado.put("puntosRival", partida.getPuntosRival());
        resultado.put("jugador", crearPokemon(partida.getPokemonJugador(), true));
        resultado.put("rival", crearPokemon(partida.getPokemonRival(), false));
        return resultado;
    }

    private Map<String, Object> crearPokemon(PokemonHigherLower pokemon, boolean mostrarStats) {
        Map<String, Object> resultado = new LinkedHashMap<>();
        resultado.put("id", pokemon.getId());
        resultado.put("nombre", pokemon.getNombre());
        resultado.put("imagen", pokemon.getImagen());
        if (mostrarStats) resultado.put("estadisticas", crearEstadisticas(pokemon));
        return resultado;
    }

    private Map<String, Integer> crearEstadisticas(PokemonHigherLower pokemon) {
        Map<String, Integer> resultado = new LinkedHashMap<>();
        resultado.put("ps", pokemon.getPs());
        resultado.put("ataque", pokemon.getAtaque());
        resultado.put("defensa", pokemon.getDefensa());
        resultado.put("ataque-especial", pokemon.getAtaqueEspecial());
        resultado.put("defensa-especial", pokemon.getDefensaEspecial());
        resultado.put("velocidad", pokemon.getVelocidad());
        return resultado;
    }
}
