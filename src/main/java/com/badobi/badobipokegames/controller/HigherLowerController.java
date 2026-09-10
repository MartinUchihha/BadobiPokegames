package com.badobi.badobipokegames.controller;

import com.badobi.badobipokegames.model.PartidaHigherLower;
import com.badobi.badobipokegames.model.PokemonHigherLower;
import com.badobi.badobipokegames.service.HigherLowerService;
import com.badobi.badobipokegames.service.RankingGlobalService;
import com.badobi.badobipokegames.service.LogrosService;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import java.util.LinkedHashMap;
import java.util.Map;

@Controller
public class HigherLowerController {

    private static final String PARTIDA =
            "partidaHigherLower";

    private static final String GENERACION =
            "generacionHigherLower";

    private final HigherLowerService higherLowerService;
    private final RankingGlobalService rankingService;
    private final LogrosService logrosService;

    public HigherLowerController(
            HigherLowerService higherLowerService,
            RankingGlobalService rankingService,
            LogrosService logrosService
    ) {
        this.higherLowerService = higherLowerService;
        this.rankingService = rankingService;
        this.logrosService = logrosService;
    }

    @GetMapping("/higher-lower")
    public String mostrarHigherLower() {
        return "higher-lower";
    }

    @PostMapping("/higher-lower/nueva-partida")
    @ResponseBody
    public Map<String, Object> nuevaPartida(
            @RequestParam(defaultValue = "all")
            String generacion,
            HttpSession session
    ) {
        PartidaHigherLower partida =
                higherLowerService.crearPartida(generacion);

        session.setAttribute(PARTIDA, partida);
        session.setAttribute(GENERACION, generacion);

        return crearEstadoPartida(partida);
    }

    @PostMapping("/higher-lower/responder")
    @ResponseBody
    public Map<String, Object> responder(
            @RequestParam String respuesta,
            @CookieValue(name = RankingGlobalService.COOKIE, required = false) String jugadorToken,
            HttpSession session
    ) {
        PartidaHigherLower partida =
                (PartidaHigherLower)
                        session.getAttribute(PARTIDA);

        if (partida == null || !partida.isActiva()) {
            return Map.of(
                    "estado",
                    "sin-partida"
            );
        }

        String generacion =
                (String) session.getAttribute(GENERACION);

        if (generacion == null) {
            generacion = "all";
        }

        PokemonHigherLower pokemonResuelto =
                partida.getPokemonDerecho();

        String estadisticaRespondida =
                partida.getEstadistica();

        int valorResuelto =
                pokemonResuelto.obtenerEstadistica(
                        estadisticaRespondida
                );

        boolean correcto =
                higherLowerService.comprobarRespuesta(
                        partida,
                        respuesta
                );

        if (!correcto) {
            partida.finalizar();
            logrosService.incrementar(jugadorToken, "partidas", 1);
            logrosService.actualizarMaximo(jugadorToken, "higher-racha", partida.getPuntuacion());
            rankingService.registrarMejor(
                    jugadorToken,
                    "higher-lower",
                    partida.getPuntuacion()
            );

            Map<String, Object> resultado =
                    new LinkedHashMap<>();

            resultado.put("estado", "terminada");
            resultado.put("correcto", false);
            resultado.put(
                    "pokemonResuelto",
                    crearPokemonRevelado(
                            pokemonResuelto,
                            estadisticaRespondida
                    )
            );
            resultado.put(
                    "estadistica",
                    estadisticaRespondida
            );
            resultado.put(
                    "nombreEstadistica",
                    obtenerNombreEstadistica(
                            estadisticaRespondida
                    )
            );
            resultado.put("valor", valorResuelto);
            resultado.put(
                    "puntuacion",
                    partida.getPuntuacion()
            );

            return resultado;
        }

        partida.registrarAcierto();
        logrosService.actualizarMaximo(jugadorToken, "higher-racha", partida.getPuntuacion());

        boolean cambioEstadistica =
                partida.debeCambiarEstadistica();

        higherLowerService.prepararSiguienteComparacion(
                partida,
                generacion
        );

        Map<String, Object> resultado =
                crearEstadoPartida(partida);

        resultado.put("estado", "continua");
        resultado.put("correcto", true);
        resultado.put(
                "pokemonResuelto",
                crearPokemonRevelado(
                        pokemonResuelto,
                        estadisticaRespondida
                )
        );
        resultado.put(
                "estadisticaRespondida",
                estadisticaRespondida
        );
        resultado.put(
                "nombreEstadisticaRespondida",
                obtenerNombreEstadistica(
                        estadisticaRespondida
                )
        );
        resultado.put("valorRespondido", valorResuelto);
        resultado.put(
                "cambioEstadistica",
                cambioEstadistica
        );

        return resultado;
    }

    private Map<String, Object> crearEstadoPartida(
            PartidaHigherLower partida
    ) {
        Map<String, Object> estado =
                new LinkedHashMap<>();

        estado.put("estado", "activa");
        estado.put(
                "estadistica",
                partida.getEstadistica()
        );
        estado.put(
                "nombreEstadistica",
                obtenerNombreEstadistica(
                        partida.getEstadistica()
                )
        );
        estado.put(
                "pokemonIzquierdo",
                crearPokemonRevelado(
                        partida.getPokemonIzquierdo(),
                        partida.getEstadistica()
                )
        );
        estado.put(
                "pokemonDerecho",
                crearPokemonOculto(
                        partida.getPokemonDerecho()
                )
        );
        estado.put(
                "puntuacion",
                partida.getPuntuacion()
        );
        estado.put(
                "faltanParaCambio",
                calcularFaltantes(partida.getPuntuacion())
        );

        return estado;
    }

    private Map<String, Object> crearPokemonRevelado(
            PokemonHigherLower pokemon,
            String estadistica
    ) {
        return Map.of(
                "id", pokemon.getId(),
                "nombre", pokemon.getNombre(),
                "imagen", pokemon.getImagen(),
                "valor",
                pokemon.obtenerEstadistica(estadistica)
        );
    }

    private Map<String, Object> crearPokemonOculto(
            PokemonHigherLower pokemon
    ) {
        return Map.of(
                "id", pokemon.getId(),
                "nombre", pokemon.getNombre(),
                "imagen", pokemon.getImagen()
        );
    }

    private int calcularFaltantes(int puntuacion) {
        int resto = puntuacion % 5;
        return resto == 0 ? 5 : 5 - resto;
    }

    private String obtenerNombreEstadistica(
            String estadistica
    ) {
        return switch (estadistica) {
            case "ps" -> "PS";
            case "ataque" -> "Ataque";
            case "defensa" -> "Defensa";
            case "ataque-especial" ->
                    "Ataque especial";
            case "defensa-especial" ->
                    "Defensa especial";
            case "velocidad" -> "Velocidad";
            case "total" ->
                    "Total de estadísticas";
            default -> "Estadística";
        };
    }
}
