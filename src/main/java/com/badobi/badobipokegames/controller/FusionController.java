package com.badobi.badobipokegames.controller;

import com.badobi.badobipokegames.model.FusionDiaria;
import com.badobi.badobipokegames.service.FusionService;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Map;

@Controller
public class FusionController {

    private final FusionService fusionService;

    public FusionController(FusionService fusionService) {
        this.fusionService = fusionService;
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
            @RequestParam String pokemonName
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