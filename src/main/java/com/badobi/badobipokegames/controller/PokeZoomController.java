package com.badobi.badobipokegames.controller;

import com.badobi.badobipokegames.model.PartidaPokeZoom;
import com.badobi.badobipokegames.service.PokeZoomService;
import com.badobi.badobipokegames.service.LogrosService;
import com.badobi.badobipokegames.service.RankingGlobalService;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import java.util.LinkedHashMap;
import java.util.Map;

@Controller
public class PokeZoomController {

    private static final String SESSION_GAME =
            "pokezoomPartida";

    private static final int[] ZOOM_LEVELS = {
            1200,
            1000,
            800,
            600,
            450,
            320,
            200,
            100
    };

    private final PokeZoomService pokeZoomService;
    private final LogrosService logrosService;
    private final RankingGlobalService rankingService;

    public PokeZoomController(
            PokeZoomService pokeZoomService,
            LogrosService logrosService,
            RankingGlobalService rankingService
    ) {
        this.pokeZoomService = pokeZoomService;
        this.logrosService = logrosService;
        this.rankingService = rankingService;
    }

    @GetMapping("/pokezoom")
    public String mostrarPokeZoom() {
        return "pokezoom";
    }

    @PostMapping("/pokezoom/nueva-partida")
    @ResponseBody
    public Map<String, Object> nuevaPartida(
            @RequestParam String generacion,
            HttpSession session
    ) {
        PartidaPokeZoom partida =
                pokeZoomService.crearPartida(generacion);

        session.setAttribute(
                SESSION_GAME,
                partida
        );

        return Map.of(
                "iniciada", true,
                "generacion", partida.getGeneracion(),
                "intento", 1,
                "maxIntentos", PartidaPokeZoom.MAX_INTENTOS,
                "zoom", ZOOM_LEVELS[0]
        );
    }

    @GetMapping(
            value = "/pokezoom/imagen",
            produces = MediaType.IMAGE_PNG_VALUE
    )
    @ResponseBody
    public ResponseEntity<byte[]> obtenerImagen(
            HttpSession session
    ) {
        PartidaPokeZoom partida =
                obtenerPartida(session);

        if (partida == null) {
            return ResponseEntity.notFound().build();
        }

        byte[] imagen = pokeZoomService.obtenerImagen(
                partida.getPokemonId()
        );

        return ResponseEntity
                .ok()
                .cacheControl(CacheControl.noStore())
                .contentType(MediaType.IMAGE_PNG)
                .body(imagen);
    }

    @PostMapping("/pokezoom/intento")
    @ResponseBody
    public Map<String, Object> comprobarIntento(
            @RequestParam String pokemonName,
            @CookieValue(name = RankingGlobalService.COOKIE, required = false) String jugadorToken,
            HttpSession session
    ) {
        PartidaPokeZoom partida =
                obtenerPartida(session);

        if (partida == null) {
            return Map.of(
                    "estado", "sin-partida"
            );
        }

        if (partida.isTerminada()) {
            return crearResultado(partida, false);
        }

        if (partida.yaFueIntentado(pokemonName)) {
            return Map.of(
                    "estado", "repetido"
            );
        }

        boolean correcto =
                partida.registrarIntento(pokemonName);

        if (partida.isTerminada()) {
            logrosService.incrementar(jugadorToken, "partidas", 1);
            if (partida.isVictoria()) {
                logrosService.incrementar(jugadorToken, "victorias", 1);
                logrosService.incrementar(jugadorToken, "zoom-victorias", 1);
                rankingService.registrarMejor(jugadorToken, "pokezoom", PartidaPokeZoom.MAX_INTENTOS + 1 - partida.getNumeroIntentos());
            }
        }

        return crearResultado(partida, correcto);
    }

    private Map<String, Object> crearResultado(
            PartidaPokeZoom partida,
            boolean correcto
    ) {
        Map<String, Object> resultado =
                new LinkedHashMap<>();

        resultado.put(
                "estado",
                correcto ? "correcto" : "incorrecto"
        );

        resultado.put("correcto", correcto);
        resultado.put(
                "terminada",
                partida.isTerminada()
        );
        resultado.put(
                "victoria",
                partida.isVictoria()
        );
        resultado.put(
                "intentos",
                partida.getNumeroIntentos()
        );
        resultado.put(
                "restantes",
                partida.getIntentosRestantes()
        );
        resultado.put(
                "zoom",
                obtenerZoom(partida)
        );
        resultado.put(
                "historial",
                partida.getIntentos()
        );

        if (partida.isTerminada()) {
            resultado.put(
                    "pokemon",
                    partida.getPokemonNombre()
            );
        }

        return resultado;
    }

    private int obtenerZoom(PartidaPokeZoom partida) {
        if (partida.isTerminada()) {
            return 100;
        }

        int posicion = Math.min(
                partida.getNumeroIntentos(),
                ZOOM_LEVELS.length - 1
        );

        return ZOOM_LEVELS[posicion];
    }

    private PartidaPokeZoom obtenerPartida(
            HttpSession session
    ) {
        Object partida =
                session.getAttribute(SESSION_GAME);

        if (partida instanceof PartidaPokeZoom pokeZoom) {
            return pokeZoom;
        }

        return null;
    }
}
