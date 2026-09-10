package com.badobi.badobipokegames.controller;

import com.badobi.badobipokegames.model.JugadorRanking;
import com.badobi.badobipokegames.service.RankingGlobalService;
import com.badobi.badobipokegames.service.LogrosService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
public class RankingGlobalController {
    private final RankingGlobalService service;
    private final LogrosService logrosService;

    public RankingGlobalController(RankingGlobalService service, LogrosService logrosService) {
        this.service = service;
        this.logrosService = logrosService;
    }

    @GetMapping("/api/ranking/perfil")
    public Map<String, Object> perfil(
            @CookieValue(name = RankingGlobalService.COOKIE, required = false) String token
    ) {
        JugadorRanking jugador = service.buscarJugador(token);
        if (jugador == null) return Map.of("registrado", false);
        return crearPerfil(jugador);
    }

    @PostMapping("/api/ranking/perfil")
    public ResponseEntity<Map<String, Object>> crearPerfil(@RequestParam String nombre) {
        try {
            JugadorRanking jugador = service.crearJugador(nombre);
            logrosService.actualizarMaximo(jugador.getToken(), "perfil", 1);
            ResponseCookie cookie = ResponseCookie
                    .from(RankingGlobalService.COOKIE, jugador.getToken())
                    .httpOnly(true)
                    .sameSite("Lax")
                    .path("/")
                    .maxAge(Duration.ofDays(365))
                    .build();
            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, cookie.toString())
                    .body(crearPerfil(jugador));
        } catch (IllegalArgumentException error) {
            return ResponseEntity.badRequest().body(Map.of("error", error.getMessage()));
        }
    }

    @GetMapping("/api/ranking/global")
    public Map<String, Object> ranking(
            @RequestParam(defaultValue = "general") String juego
    ) {
        List<Map<String, Object>> filas = service.obtenerRanking(juego);
        return Map.of(
                "temporada", service.obtenerTemporada(),
                "juego", juego,
                "ranking", filas
        );
    }

    private Map<String, Object> crearPerfil(JugadorRanking jugador) {
        Map<String, Object> perfil = new LinkedHashMap<>();
        perfil.put("registrado", true);
        perfil.put("nombre", jugador.getNombre());
        perfil.put("avatar", jugador.getAvatar());
        return perfil;
    }
}
