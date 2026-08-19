package com.badobi.badobipokegames.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeController {

    @GetMapping("/")
    public String mostrarInicio() {
        return "index";
    }
    @GetMapping("/estadisticas")
    public String mostrarEstadisticas() {
        return "estadisticas";
    }
    @GetMapping("/logros")
    public String mostrarLogros() {
        return "logros";
    }
    @GetMapping("/ranking")
    public String mostrarRanking() {
        return "ranking";
    }
}