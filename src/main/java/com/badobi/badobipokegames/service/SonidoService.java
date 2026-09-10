package com.badobi.badobipokegames.service;

import com.badobi.badobipokegames.model.PartidaSonido;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import tools.jackson.databind.JsonNode;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class SonidoService {

    private final RestClient pokeApi = RestClient.create(
            "https://pokeapi.co/api/v2"
    );

    private final RestClient archivosRemotos =
            RestClient.create();

    private final Map<Integer, DatosPokemon> cachePokemon =
            new ConcurrentHashMap<>();

    private final Map<String, byte[]> cacheSonidos =
            new ConcurrentHashMap<>();

    public PartidaSonido crearPartida(String generacion) {
        int[] rango = obtenerRango(generacion);

        for (int intento = 0; intento < 20; intento++) {
            int pokemonId =
                    ThreadLocalRandom.current().nextInt(
                            rango[0],
                            rango[1] + 1
                    );

            DatosPokemon pokemon =
                    obtenerDatosPokemon(pokemonId);

            if (
                    pokemon.sonido() != null
                            && !pokemon.sonido().isBlank()
            ) {
                return new PartidaSonido(
                        pokemon.id(),
                        pokemon.nombre(),
                        pokemon.imagen(),
                        pokemon.sonido(),
                        generacion
                );
            }
        }

        throw new IllegalStateException(
                "No se encontró un Pokémon con sonido"
        );
    }

    public byte[] obtenerSonido(
            PartidaSonido partida
    ) {
        return cacheSonidos.computeIfAbsent(
                partida.getSonido(),
                this::descargarSonido
        );
    }

    private DatosPokemon obtenerDatosPokemon(int pokemonId) {
        return cachePokemon.computeIfAbsent(
                pokemonId,
                this::consultarPokemon
        );
    }

    private DatosPokemon consultarPokemon(int pokemonId) {
        JsonNode pokemon = pokeApi
                .get()
                .uri("/pokemon/{id}", pokemonId)
                .retrieve()
                .body(JsonNode.class);

        if (pokemon == null) {
            throw new IllegalStateException(
                    "No se pudo obtener el Pokémon"
            );
        }

        String nombre =
                pokemon.path("name").asText();

        String imagen = pokemon
                .path("sprites")
                .path("other")
                .path("official-artwork")
                .path("front_default")
                .asText();

        String sonido = pokemon
                .path("cries")
                .path("latest")
                .asText();

        if (sonido.isBlank()) {
            sonido = pokemon
                    .path("cries")
                    .path("legacy")
                    .asText();
        }

        return new DatosPokemon(
                pokemonId,
                nombre,
                imagen,
                sonido
        );
    }

    private byte[] descargarSonido(String url) {
        byte[] sonido = archivosRemotos
                .get()
                .uri(url)
                .retrieve()
                .body(byte[].class);

        if (sonido == null || sonido.length == 0) {
            throw new IllegalStateException(
                    "No se pudo descargar el sonido"
            );
        }

        return sonido;
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

    private record DatosPokemon(
            int id,
            String nombre,
            String imagen,
            String sonido
    ) {
    }
}