package com.badobi.badobipokegames.controller;

import com.badobi.badobipokegames.model.PartidaParejas;
import com.badobi.badobipokegames.service.ParejasService;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
public class ParejasController {

    private final ParejasService parejasService;

    public ParejasController(
            ParejasService parejasService
    ) {
        this.parejasService = parejasService;
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
}
