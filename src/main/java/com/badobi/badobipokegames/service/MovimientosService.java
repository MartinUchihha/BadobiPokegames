package com.badobi.badobipokegames.service;

import com.badobi.badobipokegames.model.MovimientoPokemon;
import com.badobi.badobipokegames.model.PartidaMovimientos;
import com.badobi.badobipokegames.model.PokemonMovimientos;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import tools.jackson.databind.JsonNode;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class MovimientosService {

    private final RestClient pokeApi =
            RestClient.create(
                    "https://pokeapi.co/api/v2"
            );

    private final Map<Integer, PokemonMovimientos>
            cachePokemon =
            new ConcurrentHashMap<>();

    private final Map<String, DetalleMovimiento>
            cacheDetalles =
            new ConcurrentHashMap<>();

    public PartidaMovimientos crearPartida(
            String generacion,
            String modo
    ) {
        String modoCorrecto =
                modo != null &&
                        modo.equalsIgnoreCase("dificil")
                        ? "dificil"
                        : "normal";

        int[] rango =
                obtenerRango(generacion);

        for (
                int intento = 0;
                intento < 15;
                intento++
        ) {
            int pokemonId =
                    ThreadLocalRandom
                            .current()
                            .nextInt(
                                    rango[0],
                                    rango[1] + 1
                            );

            PokemonMovimientos pokemon =
                    obtenerPokemon(pokemonId);

            if (
                    pokemon.getMovimientos()
                            .size() >= 4
            ) {
                return new PartidaMovimientos(
                        pokemon,
                        generacion,
                        modoCorrecto
                );
            }
        }

        throw new IllegalStateException(
                "No se encontró un Pokémon con suficientes movimientos"
        );
    }

    public PokemonMovimientos obtenerPokemon(
            int pokemonId
    ) {
        return cachePokemon.computeIfAbsent(
                pokemonId,
                this::consultarPokemon
        );
    }

    private PokemonMovimientos consultarPokemon(
            int pokemonId
    ) {
        JsonNode pokemon = pokeApi
                .get()
                .uri(
                        "/pokemon/{id}",
                        pokemonId
                )
                .retrieve()
                .body(JsonNode.class);

        if (pokemon == null) {
            throw new IllegalStateException(
                    "No se pudo cargar el Pokémon"
            );
        }

        int id =
                pokemon.path("id").asInt();

        String nombre =
                pokemon.path("name").asText();

        String imagen = pokemon
                .path("sprites")
                .path("other")
                .path("official-artwork")
                .path("front_default")
                .asText();

        if (imagen.isBlank()) {
            imagen = pokemon
                    .path("sprites")
                    .path("front_default")
                    .asText();
        }

        List<String> tipos =
                obtenerTipos(pokemon);

        Map<String, Integer>
                movimientosAprendidos =
                obtenerMovimientosDeNivel(
                        pokemon
                );

        List<MovimientoPokemon> movimientos =
                movimientosAprendidos
                        .entrySet()
                        .stream()
                        .sorted(
                                Map.Entry
                                        .comparingByValue()
                        )
                        .map(entrada ->
                                crearMovimiento(
                                        entrada.getKey(),
                                        entrada.getValue()
                                )
                        )
                        .toList();

        List<MovimientoPokemon>
                movimientosMezclados =
                new ArrayList<>(
                        movimientos
                );

        Collections.shuffle(
                movimientosMezclados
        );

        return new PokemonMovimientos(
                id,
                nombre,
                imagen,
                tipos,
                movimientosMezclados
        );
    }

    private List<String> obtenerTipos(
            JsonNode pokemon
    ) {
        List<String> tipos =
                new ArrayList<>();

        for (
                JsonNode tipo :
                pokemon.path("types")
        ) {
            String nombreTipo = tipo
                    .path("type")
                    .path("name")
                    .asText();

            tipos.add(
                    traducirTipo(nombreTipo)
            );
        }

        return tipos;
    }

    private Map<String, Integer>
    obtenerMovimientosDeNivel(
            JsonNode pokemon
    ) {
        int versionMasReciente = -1;

        for (
                JsonNode movimiento :
                pokemon.path("moves")
        ) {
            for (
                    JsonNode detalle :
                    movimiento.path(
                            "version_group_details"
                    )
            ) {
                String metodo = detalle
                        .path(
                                "move_learn_method"
                        )
                        .path("name")
                        .asText();

                if (
                        metodo.equals("level-up")
                ) {
                    int version =
                            extraerId(
                                    detalle
                                            .path(
                                                    "version_group"
                                            )
                                            .path("url")
                                            .asText()
                            );

                    versionMasReciente =
                            Math.max(
                                    versionMasReciente,
                                    version
                            );
                }
            }
        }

        Map<String, Integer> movimientos =
                new LinkedHashMap<>();

        for (
                JsonNode movimiento :
                pokemon.path("moves")
        ) {
            String nombreMovimiento =
                    movimiento
                            .path("move")
                            .path("name")
                            .asText();

            for (
                    JsonNode detalle :
                    movimiento.path(
                            "version_group_details"
                    )
            ) {
                String metodo = detalle
                        .path(
                                "move_learn_method"
                        )
                        .path("name")
                        .asText();

                int version =
                        extraerId(
                                detalle
                                        .path(
                                                "version_group"
                                        )
                                        .path("url")
                                        .asText()
                        );

                if (
                        metodo.equals("level-up") &&
                                version ==
                                        versionMasReciente
                ) {
                    int nivel = detalle
                            .path(
                                    "level_learned_at"
                            )
                            .asInt();

                    movimientos.merge(
                            nombreMovimiento,
                            nivel,
                            Math::min
                    );
                }
            }
        }

        return movimientos;
    }

    private MovimientoPokemon crearMovimiento(
            String nombreApi,
            int nivel
    ) {
        DetalleMovimiento detalle =
                cacheDetalles.computeIfAbsent(
                        nombreApi,
                        this::consultarDetalleMovimiento
                );

        return new MovimientoPokemon(
                detalle.nombre(),
                detalle.tipo(),
                detalle.categoria(),
                detalle.potencia(),
                detalle.precision(),
                detalle.pp(),
                nivel,
                detalle.descripcion()
        );
    }

    private DetalleMovimiento
    consultarDetalleMovimiento(
            String nombreApi
    ) {
        JsonNode movimiento = pokeApi
                .get()
                .uri(
                        "/move/{nombre}",
                        nombreApi
                )
                .retrieve()
                .body(JsonNode.class);

        if (movimiento == null) {
            return new DetalleMovimiento(
                    formatearNombre(nombreApi),
                    "Desconocido",
                    "Estado",
                    null,
                    null,
                    null,
                    "Información no disponible."
            );
        }

        String nombreTraducido =
                buscarNombreEspanol(
                        movimiento,
                        nombreApi
                );

        String tipo =
                traducirTipo(
                        movimiento
                                .path("type")
                                .path("name")
                                .asText()
                );

        String categoria =
                traducirCategoria(
                        movimiento
                                .path(
                                        "damage_class"
                                )
                                .path("name")
                                .asText()
                );

        Integer potencia =
                obtenerEnteroOpcional(
                        movimiento.path("power")
                );

        Integer precision =
                obtenerEnteroOpcional(
                        movimiento.path(
                                "accuracy"
                        )
                );

        Integer pp =
                obtenerEnteroOpcional(
                        movimiento.path("pp")
                );

        String descripcion =
                buscarDescripcionEspanol(
                        movimiento
                );

        return new DetalleMovimiento(
                nombreTraducido,
                tipo,
                categoria,
                potencia,
                precision,
                pp,
                descripcion
        );
    }

    private String buscarDescripcionEspanol(
            JsonNode movimiento
    ) {
        for (
                JsonNode texto :
                movimiento.path("flavor_text_entries")
        ) {
            String idioma = texto
                    .path("language")
                    .path("name")
                    .asText();

            if (idioma.equals("es")) {
                return texto
                        .path("flavor_text")
                        .asText()
                        .replaceAll("\\s+", " ")
                        .trim();
            }
        }

        return "Descripción no disponible.";
    }

    private String buscarNombreEspanol(
            JsonNode movimiento,
            String nombreApi
    ) {
        for (
                JsonNode nombre :
                movimiento.path("names")
        ) {
            String idioma = nombre
                    .path("language")
                    .path("name")
                    .asText();

            if (idioma.equals("es")) {
                return nombre
                        .path("name")
                        .asText();
            }
        }

        return formatearNombre(
                nombreApi
        );
    }

    private Integer obtenerEnteroOpcional(
            JsonNode valor
    ) {
        if (
                valor.isMissingNode() ||
                        valor.isNull()
        ) {
            return null;
        }

        return valor.asInt();
    }

    private int extraerId(String url) {
        if (
                url == null ||
                        url.isBlank()
        ) {
            return -1;
        }

        String sinBarraFinal =
                url.endsWith("/")
                        ? url.substring(
                        0,
                        url.length() - 1
                )
                        : url;

        int ultimaBarra =
                sinBarraFinal.lastIndexOf('/');

        try {
            return Integer.parseInt(
                    sinBarraFinal.substring(
                            ultimaBarra + 1
                    )
            );
        } catch (
                NumberFormatException error
        ) {
            return -1;
        }
    }

    private String traducirTipo(
            String tipo
    ) {
        return switch (tipo) {
            case "normal" -> "Normal";
            case "fire" -> "Fuego";
            case "water" -> "Agua";
            case "electric" -> "Eléctrico";
            case "grass" -> "Planta";
            case "ice" -> "Hielo";
            case "fighting" -> "Lucha";
            case "poison" -> "Veneno";
            case "ground" -> "Tierra";
            case "flying" -> "Volador";
            case "psychic" -> "Psíquico";
            case "bug" -> "Bicho";
            case "rock" -> "Roca";
            case "ghost" -> "Fantasma";
            case "dragon" -> "Dragón";
            case "dark" -> "Siniestro";
            case "steel" -> "Acero";
            case "fairy" -> "Hada";
            default -> formatearNombre(tipo);
        };
    }

    private String traducirCategoria(
            String categoria
    ) {
        return switch (categoria) {
            case "physical" -> "Físico";
            case "special" -> "Especial";
            default -> "Estado";
        };
    }

    private String formatearNombre(
            String nombre
    ) {
        String[] partes =
                nombre
                        .toLowerCase(
                                Locale.ROOT
                        )
                        .split("-");

        StringBuilder resultado =
                new StringBuilder();

        for (String parte : partes) {
            if (!resultado.isEmpty()) {
                resultado.append(" ");
            }

            resultado.append(
                    Character.toUpperCase(
                            parte.charAt(0)
                    )
            );

            resultado.append(
                    parte.substring(1)
            );
        }

        return resultado.toString();
    }

    private int[] obtenerRango(
            String generacion
    ) {
        return switch (generacion) {
            case "1" -> new int[]{1, 151};
            case "2" -> new int[]{152, 251};
            case "3" -> new int[]{252, 386};
            case "4" -> new int[]{387, 493};
            case "5" -> new int[]{494, 649};
            case "6" -> new int[]{650, 721};
            case "7" -> new int[]{722, 809};
            case "8" -> new int[]{810, 905};
            case "9" -> new int[]{906, 1025};
            default -> new int[]{1, 1025};
        };
    }

    private record DetalleMovimiento(
            String nombre,
            String tipo,
            String categoria,
            Integer potencia,
            Integer precision,
            Integer pp,
            String descripcion
    ) {
    }
}
