package com.badobi.badobipokegames.controller;

import com.badobi.badobipokegames.model.FusionDiaria;
import com.badobi.badobipokegames.service.FusionService;
import com.badobi.badobipokegames.service.LogrosService;
import com.badobi.badobipokegames.service.RankingGlobalService;
import jakarta.servlet.http.HttpSession;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Map;
import java.util.HashSet;
import java.util.Set;

@Controller
public class FusionController {

    private final FusionService fusionService;
    private final LogrosService logrosService;
    private final RankingGlobalService rankingService;

    public FusionController(FusionService fusionService, LogrosService logrosService, RankingGlobalService rankingService) {
        this.fusionService = fusionService;
        this.logrosService = logrosService;
        this.rankingService = rankingService;
    }

    @GetMapping("/fusion")
    public String mostrarFusion(Model model) {
        FusionDiaria fusion =
                fusionService.obtenerFusionDeHoy();

        ZoneId zonaChile =
                ZoneId.of("America/Santiago");

        String proximoCambio = LocalDate
                .now(zonaChile)
                .plusDays(1)
                .atStartOfDay(zonaChile)
                .toInstant()
                .toString();

        model.addAttribute("fusion", fusion);

        model.addAttribute(
                "proximoCambio",
                proximoCambio
        );

        return "fusion";
    }

    @PostMapping("/fusion/comprobar")
    @ResponseBody
    public Map<String, Object> comprobarFusion(
            @RequestParam String pokemonName,
            @CookieValue(name = RankingGlobalService.COOKIE, required = false) String jugadorToken,
            HttpSession session
    ) {
        int posicion =
                fusionService.comprobarPokemon(pokemonName);

        if (posicion == -1) {
            return Map.of(
                    "correcto", false
            );
        }

        FusionDiaria fusion =
                fusionService.obtenerFusionDeHoy();

        String nombreCorrecto =
                fusion.getPokemon().get(posicion);

        String clavePartida = "fusion-encontrados-" + fusion.getFecha();
        @SuppressWarnings("unchecked")
        Set<Integer> encontrados = (Set<Integer>) session.getAttribute(clavePartida);
        if (encontrados == null) {
            encontrados = new HashSet<>();
            session.setAttribute(clavePartida, encontrados);
        }
        encontrados.add(posicion);
        String claveRegistrada = "fusion-registrada-" + fusion.getFecha();
        if (encontrados.size() == fusion.getPokemon().size() && !Boolean.TRUE.equals(session.getAttribute(claveRegistrada))) {
            session.setAttribute(claveRegistrada, true);
            logrosService.incrementar(jugadorToken, "partidas", 1);
            logrosService.actualizarMaximo(jugadorToken, "victorias", 1);
            logrosService.incrementar(jugadorToken, "fusion-victorias", 1);
            rankingService.registrarMejor(jugadorToken, "fusion", 100);
        }

        return Map.of(
                "correcto", true,
                "posicion", posicion,
                "pokemon", nombreCorrecto
        );
    }

    @GetMapping(
            value = "/fusion/imagen",
            produces = MediaType.IMAGE_PNG_VALUE
    )
    @ResponseBody
    public ResponseEntity<Resource> obtenerImagenFusion() {
        FusionDiaria fusion =
                fusionService.obtenerFusionDeHoy();

        Resource imagen =
                new ClassPathResource(
                        fusion.getImagen()
                );

        return ResponseEntity
                .ok()
                .cacheControl(CacheControl.noStore())
                .contentType(MediaType.IMAGE_PNG)
                .body(imagen);
    }
}
