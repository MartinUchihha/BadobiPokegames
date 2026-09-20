package com.badobi.badobipokegames.controller;

import com.badobi.badobipokegames.model.MovimientoPokemon;
import com.badobi.badobipokegames.model.PartidaMovimientos;
import com.badobi.badobipokegames.model.PokemonHigherLower;
import com.badobi.badobipokegames.model.PokemonMovimientos;
import com.badobi.badobipokegames.service.EstadisticasService;
import com.badobi.badobipokegames.service.MovimientosService;
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
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Controller
public class MovimientosController {

    private static final String PARTIDA =
            "partidaMovimientos";

    private final MovimientosService
            movimientosService;

    private final EstadisticasService
            estadisticasService;
    private final LogrosService logrosService;
    private final RankingGlobalService rankingService;

    public MovimientosController(
            MovimientosService movimientosService,
            EstadisticasService estadisticasService,
            LogrosService logrosService,
            RankingGlobalService rankingService
    ) {
        this.movimientosService =
                movimientosService;

        this.estadisticasService =
                estadisticasService;
        this.logrosService = logrosService;
        this.rankingService = rankingService;
    }

    @GetMapping("/movimientos")
    public String mostrarJuego() {
        return "movimientos";
    }

    @GetMapping("/movimientos/pokemon")
    @ResponseBody
    public List<Map<String, Object>>
    obtenerListaPokemon() {
        return estadisticasService
                .obtenerListaPokemon();
    }

    @PostMapping(
            "/movimientos/nueva-partida"
    )
    @ResponseBody
    public Map<String, Object> nuevaPartida(
            @RequestParam(
                    defaultValue = "all"
            )
            String generacion,

            @RequestParam(
                    defaultValue = "normal"
            )
            String modo,

            HttpSession session
    ) {
        PartidaMovimientos partida =
                movimientosService.crearPartida(
                        generacion,
                        modo
                );

        session.setAttribute(
                PARTIDA,
                partida
        );

        Map<String, Object> resultado =
                new LinkedHashMap<>();

        resultado.put(
                "estado",
                "activa"
        );

        resultado.put(
                "modo",
                partida.getModo()
        );

        resultado.put(
                "movimientos",
                crearMovimientosPublicos(
                        partida
                )
        );

        resultado.put(
                "intento",
                1
        );

        resultado.put(
                "maxIntentos",
                PartidaMovimientos.MAX_INTENTOS
        );

        resultado.put(
                "tipoRevelado",
                false
        );

        return resultado;
    }

    @PostMapping("/movimientos/intento")
    @ResponseBody
    public Map<String, Object> comprobarIntento(
            @RequestParam String pokemonName,
            @CookieValue(name = RankingGlobalService.COOKIE, required = false) String jugadorToken,
            HttpSession session
    ) {
        PartidaMovimientos partida =
                (PartidaMovimientos)
                        session.getAttribute(
                                PARTIDA
                        );

        if (partida == null) {
            return Map.of(
                    "estado",
                    "sin-partida"
            );
        }

        if (partida.isTerminada()) {
            return Map.of(
                    "estado",
                    "ya-terminada"
            );
        }

        String nombre =
                normalizarNombre(
                        pokemonName
                );

        if (nombre.isBlank()) {
            return Map.of(
                    "estado",
                    "invalido"
            );
        }

        if (
                partida.yaFueIntentado(
                        nombre
                )
        ) {
            return Map.of(
                    "estado",
                    "repetido"
            );
        }

        PokemonHigherLower
                pokemonElegido;

        try {
            pokemonElegido =
                    estadisticasService
                            .obtenerPokemon(
                                    nombre
                            );
        } catch (
                RuntimeException error
        ) {
            return Map.of(
                    "estado",
                    "invalido"
            );
        }

        if (
                !estadisticasService
                        .perteneceAGeneracion(
                                pokemonElegido,
                                partida
                                        .getGeneracion()
                        )
        ) {
            return Map.of(
                    "estado",
                    "generacion-invalida"
            );
        }

        boolean correcto =
                partida.registrarIntento(
                        pokemonElegido
                );

        Map<String, Object> resultado =
                new LinkedHashMap<>();

        resultado.put(
                "estado",
                partida.isTerminada()
                        ? "terminada"
                        : "continua"
        );

        resultado.put(
                "correcto",
                correcto
        );

        resultado.put(
                "pokemonElegido",
                crearPokemonElegido(
                        pokemonElegido
                )
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
                "movimientos",
                crearMovimientosPublicos(
                        partida
                )
        );

        resultado.put(
                "tipoRevelado",
                partida.isTipoRevelado()
        );

        if (partida.isTipoRevelado()) {
            resultado.put(
                    "tipos",
                    partida
                            .getPokemonSecreto()
                            .getTipos()
            );
        }

        if (partida.isTerminada()) {
            logrosService.incrementar(jugadorToken, "partidas", 1);
            if (partida.isVictoria()) {
                logrosService.incrementar(jugadorToken, "victorias", 1);
                logrosService.incrementar(jugadorToken, "movimientos-victorias", 1);
                rankingService.registrarMejor(jugadorToken, "movimientos", PartidaMovimientos.MAX_INTENTOS + 1 - partida.getNumeroIntentos());
            }
            resultado.put(
                    "victoria",
                    partida.isVictoria()
            );

            resultado.put(
                    "pokemon",
                    crearPokemonResultado(
                            partida
                                    .getPokemonSecreto()
                    )
            );
        }

        return resultado;
    }

    private List<Map<String, Object>>
    crearMovimientosPublicos(
            PartidaMovimientos partida
    ) {
        List<Map<String, Object>>
                resultado =
                new ArrayList<>();

        for (
                MovimientoPokemon movimiento :
                partida.getMovimientosVisibles()
        ) {
            Map<String, Object> datos =
                    new LinkedHashMap<>();

            datos.put(
                    "nombre",
                    movimiento.getNombre()
            );

            datos.put("tipo", movimiento.getTipo());
            datos.put("categoria", movimiento.getCategoria());
            datos.put("potencia", movimiento.getPotencia());
            datos.put("precision", movimiento.getPrecision());
            datos.put("pp", movimiento.getPp());
            datos.put("nivel", movimiento.getNivel());
            datos.put("descripcion", movimiento.getDescripcion());

            resultado.add(datos);
        }

        return resultado;
    }

    private Map<String, Object>
    crearPokemonElegido(
            PokemonHigherLower pokemon
    ) {
        Map<String, Object> resultado =
                new LinkedHashMap<>();

        resultado.put(
                "id",
                pokemon.getId()
        );

        resultado.put(
                "nombre",
                pokemon.getNombre()
        );

        resultado.put(
                "imagen",
                pokemon.getImagen()
        );

        return resultado;
    }

    private Map<String, Object>
    crearPokemonResultado(
            PokemonMovimientos pokemon
    ) {
        Map<String, Object> resultado =
                new LinkedHashMap<>();

        resultado.put(
                "id",
                pokemon.getId()
        );

        resultado.put(
                "nombre",
                pokemon.getNombre()
        );

        resultado.put(
                "imagen",
                pokemon.getImagen()
        );

        resultado.put(
                "tipos",
                pokemon.getTipos()
        );

        return resultado;
    }

    private String normalizarNombre(
            String nombre
    ) {
        if (nombre == null) {
            return "";
        }

        return nombre
                .trim()
                .toLowerCase(
                        Locale.ROOT
                )
                .replace(" ", "-")
                .replace(".", "");
    }
}
