package com.badobi.badobipokegames.controller;

import com.badobi.badobipokegames.model.PartidaParejas;
import com.badobi.badobipokegames.service.LogrosService;
import com.badobi.badobipokegames.service.ParejasService;
import com.badobi.badobipokegames.service.RankingGlobalService;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import java.util.Map;

@Controller
public class ParejasController {

    private final ParejasService parejasService;
    private final RankingGlobalService rankingService;
    private final LogrosService logrosService;

    public ParejasController(
            ParejasService parejasService,
            RankingGlobalService rankingService,
            LogrosService logrosService
    ) {
        this.parejasService = parejasService;
        this.rankingService = rankingService;
        this.logrosService = logrosService;
    }

    @GetMapping("/pokematch")
    public String mostrarJuego() {
        return "pokematch";
    }

    @PostMapping("/api/pokematch/partida")
    @ResponseBody
    public PartidaParejas crearPartida(
            @RequestParam(
                    defaultValue = "individual"
            )
            String modo,
            @RequestParam(
                    defaultValue = "48"
            )
            int fichas
    ) {
        return parejasService.crearPartida(
                modo,
                fichas
        );
    }

    @PostMapping("/api/pokematch/resultado")
    @ResponseBody
    public Map<String, Object> registrarResultado(
            @CookieValue(
                    name = RankingGlobalService.COOKIE,
                    required = false
            )
            String jugadorToken,
            @RequestParam int puntuacion,
            @RequestParam int parejas,
            @RequestParam int totalFichas,
            @RequestParam int combo,
            @RequestParam boolean victoria,
            @RequestParam(defaultValue = "individual") String modo,
            @RequestParam(defaultValue = "") String nivelRival
    ) {
        int puntuacionSegura = Math.clamp(puntuacion, 0, 100_000);
        int fichasSeguras = switch (totalFichas) {
            case 24, 48, 72, 144 -> totalFichas;
            default -> 48;
        };
        int parejasSeguras = Math.clamp(parejas, 0, fichasSeguras / 2);
        int comboSeguro = Math.clamp(combo, 0, fichasSeguras / 2);

        rankingService.registrarMejor(
                jugadorToken,
                "pokematch",
                puntuacionSegura
        );

        logrosService.incrementar(jugadorToken, "partidas", 1);
        logrosService.incrementar(jugadorToken, "pokematch-partidas", 1);
        logrosService.incrementar(
                jugadorToken,
                "pokematch-parejas",
                parejasSeguras
        );
        logrosService.actualizarMaximo(
                jugadorToken,
                "pokematch-combo",
                comboSeguro
        );

        if (victoria) {
            logrosService.incrementar(jugadorToken, "victorias", 1);
            logrosService.incrementar(
                    jugadorToken,
                    "pokematch-victorias",
                    1
            );

            if (
                    fichasSeguras == 144
                            && parejasSeguras == fichasSeguras / 2
            ) {
                logrosService.incrementar(
                        jugadorToken,
                        "pokematch-144-victorias",
                        1
                );
            }

            if (
                    modo.equalsIgnoreCase("versus_ia")
                            && nivelRival.equalsIgnoreCase("Maestro")
            ) {
                logrosService.incrementar(
                        jugadorToken,
                        "pokematch-maestro-victorias",
                        1
                );
            }
        }

        return Map.of(
                "guardado",
                rankingService.buscarJugador(jugadorToken) != null,
                "experiencia",
                Math.min(5_000, 200 + puntuacionSegura / 2)
        );
    }
}
