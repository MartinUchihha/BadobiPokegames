package com.badobi.badobipokegames.controller;

import com.badobi.badobipokegames.service.PokeSortService;
import com.badobi.badobipokegames.service.RankingGlobalService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
public class PokeSortController {
    public record ResultRequest(String partidaId, List<PokeSortService.Move> moves) {}
    public record PauseRequest(String partidaId, boolean paused) {}

    private final PokeSortService service;

    public PokeSortController(PokeSortService service) {
        this.service = service;
    }

    @PostMapping("/api/pokesort/partida")
    public ResponseEntity<?> start(
            @RequestParam int nivel,
            @CookieValue(name = RankingGlobalService.COOKIE, required = false) String token
    ) {
        try {
            return ResponseEntity.ok(service.start(nivel, token));
        } catch (IllegalArgumentException error) {
            return ResponseEntity.badRequest().body(Map.of("error", error.getMessage()));
        }
    }

    @PostMapping("/api/pokesort/resultado")
    public ResponseEntity<?> complete(
            @RequestBody ResultRequest request,
            @CookieValue(name = RankingGlobalService.COOKIE, required = false) String token
    ) {
        try {
            return ResponseEntity.ok(service.complete(request.partidaId(), token, request.moves()));
        } catch (IllegalArgumentException error) {
            return ResponseEntity.badRequest().body(Map.of("error", error.getMessage()));
        }
    }

    @PostMapping("/api/pokesort/pausa")
    public ResponseEntity<?> pause(
            @RequestBody PauseRequest request,
            @CookieValue(name = RankingGlobalService.COOKIE, required = false) String token
    ) {
        try {
            return ResponseEntity.ok(service.setPaused(request.partidaId(), token, request.paused()));
        } catch (IllegalArgumentException error) {
            return ResponseEntity.badRequest().body(Map.of("error", error.getMessage()));
        }
    }
}
