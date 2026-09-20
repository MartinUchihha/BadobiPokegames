package com.badobi.badobipokegames.controller;

import com.badobi.badobipokegames.model.PartidaSonido;
import com.badobi.badobipokegames.service.SonidoService;
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
import java.util.Locale;
import java.util.Map;

@Controller
public class SonidoController {

    private static final String PARTIDA =
            "partidaSonido";

    private final SonidoService sonidoService;
    private final LogrosService logrosService;
    private final RankingGlobalService rankingService;

    public SonidoController(
            SonidoService sonidoService,
            LogrosService logrosService,
            RankingGlobalService rankingService
    ) {
        this.sonidoService = sonidoService;
        this.logrosService = logrosService;
        this.rankingService = rankingService;
    }

    @GetMapping("/sonidos")
    public String mostrarSonidos() {
        return "sonidos";
    }

    @PostMapping("/sonidos/nueva-partida")
    @ResponseBody
    public Map<String, Object> nuevaPartida(
            @RequestParam(defaultValue = "all")
            String generacion,
            HttpSession session
    ) {
        PartidaSonido partida =
                sonidoService.crearPartida(generacion);

        session.setAttribute(PARTIDA, partida);

        return Map.of(
                "estado", "activa",
                "intento", 1,
                "maxIntentos", PartidaSonido.MAX_INTENTOS
        );
    }

    @GetMapping("/sonidos/audio")
    public ResponseEntity<byte[]> obtenerAudio(
            HttpSession session
    ) {
        PartidaSonido partida =
                (PartidaSonido)
                        session.getAttribute(PARTIDA);

        if (partida == null) {
            return ResponseEntity.notFound().build();
        }

        byte[] sonido =
                sonidoService.obtenerSonido(partida);

        return ResponseEntity
                .ok()
                .cacheControl(CacheControl.noStore())
                .contentType(
                        MediaType.parseMediaType("audio/ogg")
                )
                .body(sonido);
    }

    @PostMapping("/sonidos/intento")
    @ResponseBody
    public Map<String, Object> comprobarIntento(
            @RequestParam String pokemonName,
            @CookieValue(name = RankingGlobalService.COOKIE, required = false) String jugadorToken,
            HttpSession session
    ) {
        PartidaSonido partida =
                (PartidaSonido)
                        session.getAttribute(PARTIDA);

        if (partida == null) {
            return Map.of(
                    "estado",
                    "sin-partida"
            );
        }

        if (partida.isTerminada()) {
            return crearResultadoFinal(partida);
        }

        String respuesta =
                normalizarNombre(pokemonName);

        if (respuesta.isBlank()) {
            return Map.of(
                    "estado",
                    "invalido"
            );
        }

        if (partida.yaFueIntentado(respuesta)) {
            return Map.of(
                    "estado", "repetido",
                    "intentos",
                    partida.getNumeroIntentos(),
                    "restantes",
                    partida.getIntentosRestantes()
            );
        }

        boolean correcto =
                partida.registrarIntento(respuesta);

        if (partida.isTerminada()) {
            logrosService.incrementar(jugadorToken, "partidas", 1);
            if (partida.isVictoria()) {
                logrosService.incrementar(jugadorToken, "victorias", 1);
                logrosService.incrementar(jugadorToken, "sonido-aciertos", 1);
                rankingService.registrarMejor(jugadorToken, "sonidos", PartidaSonido.MAX_INTENTOS + 1 - partida.getNumeroIntentos());
            }
            return crearResultadoFinal(partida);
        }

        Map<String, Object> resultado =
                new LinkedHashMap<>();

        resultado.put("estado", "continua");
        resultado.put("correcto", correcto);
        resultado.put(
                "intentos",
                partida.getNumeroIntentos()
        );
        resultado.put(
                "restantes",
                partida.getIntentosRestantes()
        );
        resultado.put(
                "historial",
                partida.getIntentos()
        );

        return resultado;
    }

    private Map<String, Object> crearResultadoFinal(
            PartidaSonido partida
    ) {
        Map<String, Object> resultado =
                new LinkedHashMap<>();

        resultado.put("estado", "terminada");
        resultado.put(
                "correcto",
                partida.isVictoria()
        );
        resultado.put(
                "victoria",
                partida.isVictoria()
        );
        resultado.put(
                "pokemon",
                partida.getPokemonNombre()
        );
        resultado.put(
                "imagen",
                partida.getImagen()
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
                "historial",
                partida.getIntentos()
        );

        return resultado;
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
