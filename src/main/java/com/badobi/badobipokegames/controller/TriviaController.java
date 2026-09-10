package com.badobi.badobipokegames.controller;

import com.badobi.badobipokegames.model.PartidaTrivia;
import com.badobi.badobipokegames.model.PreguntaTrivia;
import com.badobi.badobipokegames.service.TriviaService;
import com.badobi.badobipokegames.service.LogrosService;
import com.badobi.badobipokegames.service.RankingGlobalService;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.LinkedHashMap;
import java.util.Map;

@Controller
public class TriviaController {

    private static final String PARTIDA = "partidaTrivia";
    private static final String RESPONDIDA = "preguntaTriviaRespondida";

    private final TriviaService triviaService;
    private final LogrosService logrosService;
    private final RankingGlobalService rankingService;

    public TriviaController(TriviaService triviaService, LogrosService logrosService, RankingGlobalService rankingService) {
        this.triviaService = triviaService;
        this.logrosService = logrosService;
        this.rankingService = rankingService;
    }

    @GetMapping("/trivia")
    public String mostrarTrivia() {
        return "trivia";
    }

    @PostMapping("/trivia/nueva-partida")
    @ResponseBody
    public Map<String, Object> nuevaPartida(
            @RequestParam(defaultValue = "all") String generacion,
            HttpSession session
    ) {
        PartidaTrivia partida = new PartidaTrivia(generacion);
        PreguntaTrivia pregunta = triviaService.generarPregunta(partida);
        partida.establecerPregunta(pregunta);

        session.setAttribute(PARTIDA, partida);
        session.setAttribute(RESPONDIDA, false);

        return crearPreguntaPublica(partida);
    }

    @PostMapping("/trivia/responder")
    @ResponseBody
    public Map<String, Object> responder(
            @RequestParam String respuesta,
            @CookieValue(name = RankingGlobalService.COOKIE, required = false) String jugadorToken,
            HttpSession session
    ) {
        PartidaTrivia partida = obtenerPartida(session);

        if (partida == null || !partida.isActiva()) {
            return Map.of("estado", "sin-partida");
        }

        if (Boolean.TRUE.equals(session.getAttribute(RESPONDIDA))) {
            return Map.of("estado", "ya-respondida");
        }

        PreguntaTrivia pregunta = partida.getPreguntaActual();

        boolean opcionValida = pregunta.getOpciones().stream()
                .anyMatch(opcion -> opcion.equalsIgnoreCase(respuesta.trim()));

        if (!opcionValida) {
            return Map.of("estado", "respuesta-invalida");
        }

        boolean correcta = pregunta.comprobarRespuesta(respuesta);
        int puntosGanados = partida.registrarRespuesta(correcta);
        session.setAttribute(RESPONDIDA, true);

        Map<String, Object> resultado = new LinkedHashMap<>();
        resultado.put("estado", partida.isActiva() ? "respondida" : "terminada");
        resultado.put("correcta", correcta);
        resultado.put("respuestaCorrecta", pregunta.getRespuestaCorrecta());
        resultado.put("explicacion", pregunta.getExplicacion());
        resultado.put("puntosGanados", puntosGanados);
        resultado.put("puntuacion", partida.getPuntuacion());
        resultado.put("racha", partida.getRacha());
        resultado.put("mejorRacha", partida.getMejorRacha());
        resultado.put("preguntasRespondidas", partida.getPreguntasRespondidas());

        if (!partida.isActiva()) {
            resultado.put("rango", obtenerRango(partida.getPuntuacion()));
            logrosService.incrementar(jugadorToken, "partidas", 1);
            logrosService.actualizarMaximo(jugadorToken, "trivia-aciertos", partida.getMejorRacha());
            if (partida.getPuntuacion() >= 1150) logrosService.incrementar(jugadorToken, "trivia-perfectas", 1);
            rankingService.registrarMejor(jugadorToken, "trivia", partida.getPuntuacion());
        }

        return resultado;
    }

    @PostMapping("/trivia/siguiente")
    @ResponseBody
    public Map<String, Object> siguientePregunta(HttpSession session) {
        PartidaTrivia partida = obtenerPartida(session);

        if (partida == null || !partida.isActiva()) {
            return Map.of("estado", "sin-partida");
        }

        if (!Boolean.TRUE.equals(session.getAttribute(RESPONDIDA))) {
            return Map.of("estado", "falta-responder");
        }

        PreguntaTrivia pregunta = triviaService.generarPregunta(partida);
        partida.establecerPregunta(pregunta);
        session.setAttribute(RESPONDIDA, false);

        return crearPreguntaPublica(partida);
    }
    @PostMapping("/trivia/ayuda/cincuenta")
    @ResponseBody
    public Map<String, Object> usarCincuenta(
            HttpSession session
    ) {
        PartidaTrivia partida = obtenerPartida(session);

        if (partida == null || !partida.isActiva()) {
            return Map.of("estado", "sin-partida");
        }

        if (Boolean.TRUE.equals(session.getAttribute(RESPONDIDA))) {
            return Map.of("estado", "ya-respondida");
        }

        if (!partida.usarAyudaCincuenta()) {
            return Map.of("estado", "ayuda-usada");
        }

        PreguntaTrivia pregunta =
                partida.getPreguntaActual();

        List<String> incorrectas = new ArrayList<>(
                pregunta.getOpciones()
                        .stream()
                        .filter(opcion ->
                                !opcion.equalsIgnoreCase(
                                        pregunta.getRespuestaCorrecta()
                                )
                        )
                        .toList()
        );

        Collections.shuffle(incorrectas);

        return Map.of(
                "estado", "correcto",
                "eliminadas", incorrectas.subList(0, 2)
        );
    }

    @PostMapping("/trivia/ayuda/cambio")
    @ResponseBody
    public Map<String, Object> cambiarPregunta(
            HttpSession session
    ) {
        PartidaTrivia partida = obtenerPartida(session);

        if (partida == null || !partida.isActiva()) {
            return Map.of("estado", "sin-partida");
        }

        if (Boolean.TRUE.equals(session.getAttribute(RESPONDIDA))) {
            return Map.of("estado", "ya-respondida");
        }

        if (!partida.usarAyudaCambio()) {
            return Map.of("estado", "ayuda-usada");
        }

        PreguntaTrivia nuevaPregunta =
                triviaService.generarPregunta(partida);

        partida.establecerPregunta(nuevaPregunta);

        Map<String, Object> resultado =
                crearPreguntaPublica(partida);

        resultado.put("estado", "pregunta-cambiada");

        return resultado;
    }
    private PartidaTrivia obtenerPartida(HttpSession session) {
        return (PartidaTrivia) session.getAttribute(PARTIDA);
    }

    private Map<String, Object> crearPreguntaPublica(
            PartidaTrivia partida
    ) {
        PreguntaTrivia pregunta = partida.getPreguntaActual();
        Map<String, Object> resultado = new LinkedHashMap<>();

        resultado.put("estado", "pregunta");
        resultado.put("id", pregunta.getId());
        resultado.put("categoria", pregunta.getCategoria());
        resultado.put("enunciado", pregunta.getEnunciado());
        resultado.put("opciones", pregunta.getOpciones());
        resultado.put("numeroPregunta", partida.getNumeroPreguntaActual());
        resultado.put("totalPreguntas", PartidaTrivia.TOTAL_PREGUNTAS);
        resultado.put("puntuacion", partida.getPuntuacion());
        resultado.put("racha", partida.getRacha());
        resultado.put(
                "ayudaCincuentaUsada",
                partida.isAyudaCincuentaUsada()
        );

        resultado.put(
                "ayudaCambioUsada",
                partida.isAyudaCambioUsada()
        );

        return resultado;
    }

    private String obtenerRango(int puntuacion) {
        if (puntuacion <= 300) {
            return "Entrenador principiante";
        }

        if (puntuacion <= 600) {
            return "Entrenador Pokémon";
        }

        if (puntuacion <= 900) {
            return "Líder de gimnasio";
        }

        return "Maestro Pokémon";
    }
}
