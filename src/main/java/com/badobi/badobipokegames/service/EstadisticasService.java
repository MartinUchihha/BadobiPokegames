package com.badobi.badobipokegames.service;

import com.badobi.badobipokegames.model.PartidaEstadisticas;
import com.badobi.badobipokegames.model.PokemonHigherLower;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import tools.jackson.databind.JsonNode;

import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;
import java.util.ArrayList;
import java.util.List;

@Service
public class EstadisticasService {

    private final RestClient pokeApi = RestClient.create(
            "https://pokeapi.co/api/v2"
    );

    private final Map<String, PokemonHigherLower> cache =
            new ConcurrentHashMap<>();
    private List<Map<String, Object>> listaPokemon;
    private final Map<Integer, List<String>> cacheMovimientos =
            new ConcurrentHashMap<>();

    public PartidaEstadisticas crearPartida(String generacion) {
        int[] rango = obtenerRango(generacion);
        int pokemonId = ThreadLocalRandom.current().nextInt(
                rango[0],
                rango[1] + 1
        );

        PokemonHigherLower pokemonSecreto =
                obtenerPokemon(String.valueOf(pokemonId));

        return new PartidaEstadisticas(
                pokemonSecreto,
                generacion
        );
    }

    public PokemonHigherLower obtenerPokemon(String nombreOId) {
        String clave = normalizarNombre(nombreOId);

        PokemonHigherLower pokemonGuardado =
                cache.get(clave);

        if (pokemonGuardado != null) {
            return pokemonGuardado;
        }

        PokemonHigherLower pokemon =
                consultarPokemon(clave);

        cache.putIfAbsent(clave, pokemon);

        return pokemon;
    }
    public List<Map<String, Object>> obtenerListaPokemon() {
        if (listaPokemon != null) {
            return listaPokemon;
        }

        JsonNode respuesta = pokeApi
                .get()
                .uri("/pokemon?limit=1025")
                .retrieve()
                .body(JsonNode.class);

        if (respuesta == null) {
            throw new IllegalStateException(
                    "No se pudo cargar la lista de Pokémon"
            );
        }

        List<Map<String, Object>> pokemon =
                new ArrayList<>();

        int id = 1;

        for (
                JsonNode resultado :
                respuesta.path("results")
        ) {
            Map<String, Object> informacion =
                    new LinkedHashMap<>();

            informacion.put("id", id);
            informacion.put(
                    "nombre",
                    resultado.path("name").asText()
            );
            informacion.put(
                    "imagen",
                    "https://raw.githubusercontent.com/" +
                            "PokeAPI/sprites/master/sprites/" +
                            "pokemon/" + id + ".png"
            );

            pokemon.add(informacion);
            id++;
        }

        listaPokemon = List.copyOf(pokemon);

        return listaPokemon;
    }
    public List<String> obtenerPistasMovimientos(
            PokemonHigherLower pokemon,
            int numeroIntentos
    ) {
        int cantidadPistas;

        if (numeroIntentos < 2) {
            cantidadPistas = 0;
        } else if (numeroIntentos < 4) {
            cantidadPistas = 1;
        } else if (numeroIntentos < 5) {
            cantidadPistas = 2;
        } else {
            cantidadPistas = 3;
        }

        if (cantidadPistas == 0) {
            return List.of();
        }

        List<String> movimientos =
                cacheMovimientos.computeIfAbsent(
                        pokemon.getId(),
                        this::consultarMovimientos
                );

        return movimientos.stream()
                .limit(cantidadPistas)
                .toList();
    }

    private List<String> consultarMovimientos(int pokemonId) {
        JsonNode pokemon = pokeApi
                .get()
                .uri("/pokemon/{id}", pokemonId)
                .retrieve()
                .body(JsonNode.class);

        if (pokemon == null) {
            return List.of();
        }

        List<String> movimientosNivel =
                new ArrayList<>();

        List<String> todosLosMovimientos =
                new ArrayList<>();

        for (
                JsonNode movimiento :
                pokemon.path("moves")
        ) {
            String nombre = movimiento
                    .path("move")
                    .path("name")
                    .asText();

            if (nombre.isBlank()) {
                continue;
            }

            todosLosMovimientos.add(nombre);

            boolean aprendidoPorNivel = false;

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
                    aprendidoPorNivel = true;
                    break;
                }
            }

            if (aprendidoPorNivel) {
                movimientosNivel.add(nombre);
            }
        }

        List<String> disponibles =
                movimientosNivel.size() >= 3
                        ? movimientosNivel
                        : todosLosMovimientos;

        if (disponibles.isEmpty()) {
            return List.of();
        }

        List<String> ordenados =
                new ArrayList<>();

        int posicionInicial =
                Math.floorMod(
                        pokemonId * 7,
                        disponibles.size()
                );

        for (
                int posicion = 0;
                posicion < disponibles.size();
                posicion++
        ) {
            int indice =
                    (
                            posicionInicial +
                                    posicion
                    ) %
                            disponibles.size();

            String movimiento =
                    disponibles.get(indice);

            if (!ordenados.contains(movimiento)) {
                ordenados.add(movimiento);
            }
        }

        return List.copyOf(ordenados);
    }
    public boolean perteneceAGeneracion(
            PokemonHigherLower pokemon,
            String generacion
    ) {
        if (generacion == null || generacion.equals("all")) {
            return true;
        }

        int[] rango = obtenerRango(generacion);

        return pokemon.getId() >= rango[0]
                && pokemon.getId() <= rango[1];
    }

    public Map<String, String> compararEstadisticas(
            PokemonHigherLower pokemonSecreto,
            PokemonHigherLower pokemonElegido
    ) {
        Map<String, String> comparaciones =
                new LinkedHashMap<>();

        comparaciones.put(
                "ps",
                comparar(
                        pokemonSecreto.getPs(),
                        pokemonElegido.getPs()
                )
        );
        comparaciones.put(
                "ataque",
                comparar(
                        pokemonSecreto.getAtaque(),
                        pokemonElegido.getAtaque()
                )
        );
        comparaciones.put(
                "defensa",
                comparar(
                        pokemonSecreto.getDefensa(),
                        pokemonElegido.getDefensa()
                )
        );
        comparaciones.put(
                "ataqueEspecial",
                comparar(
                        pokemonSecreto.getAtaqueEspecial(),
                        pokemonElegido.getAtaqueEspecial()
                )
        );
        comparaciones.put(
                "defensaEspecial",
                comparar(
                        pokemonSecreto.getDefensaEspecial(),
                        pokemonElegido.getDefensaEspecial()
                )
        );
        comparaciones.put(
                "velocidad",
                comparar(
                        pokemonSecreto.getVelocidad(),
                        pokemonElegido.getVelocidad()
                )
        );

        return comparaciones;
    }

    private String comparar(int valorSecreto, int valorElegido) {
        if (valorSecreto > valorElegido) {
            return "mayor";
        }

        if (valorSecreto < valorElegido) {
            return "menor";
        }

        return "igual";
    }

    private PokemonHigherLower consultarPokemon(String nombreOId) {
        JsonNode pokemon = pokeApi
                .get()
                .uri("/pokemon/{nombreOId}", nombreOId)
                .retrieve()
                .body(JsonNode.class);

        if (pokemon == null) {
            throw new IllegalStateException(
                    "No se pudo obtener el Pokémon"
            );
        }

        int id = pokemon.path("id").asInt();
        String nombre = pokemon.path("name").asText();

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

        PokemonHigherLower resultado = new PokemonHigherLower(
                id,
                nombre,
                imagen,
                obtenerStat(pokemon, "hp"),
                obtenerStat(pokemon, "attack"),
                obtenerStat(pokemon, "defense"),
                obtenerStat(pokemon, "special-attack"),
                obtenerStat(pokemon, "special-defense"),
                obtenerStat(pokemon, "speed")
        );

        cache.putIfAbsent(String.valueOf(id), resultado);
        cache.putIfAbsent(nombre, resultado);

        return resultado;
    }

    private int obtenerStat(JsonNode pokemon, String nombreStat) {
        for (JsonNode stat : pokemon.path("stats")) {
            if (
                    stat.path("stat")
                            .path("name")
                            .asText()
                            .equals(nombreStat)
            ) {
                return stat.path("base_stat").asInt();
            }
        }

        return 0;
    }

    private String normalizarNombre(String nombre) {
        return nombre
                .trim()
                .toLowerCase(Locale.ROOT)
                .replace(" ", "-")
                .replace(".", "");
    }

    private int[] obtenerRango(String generacion) {
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
}
