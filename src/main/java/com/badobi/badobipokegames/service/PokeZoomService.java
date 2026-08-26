package com.badobi.badobipokegames.service;

import com.badobi.badobipokegames.model.PartidaPokeZoom;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import tools.jackson.databind.JsonNode;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class PokeZoomService {

    private static final String POKE_API_URL =
            "https://pokeapi.co/api/v2";

    private static final String ARTWORK_URL =
            "https://raw.githubusercontent.com/" +
                    "PokeAPI/sprites/master/sprites/pokemon/" +
                    "other/official-artwork/%d.png";

    private static final Map<String, RangoGeneracion> RANGOS =
            Map.ofEntries(
                    Map.entry("1", new RangoGeneracion(1, 151)),
                    Map.entry("2", new RangoGeneracion(152, 251)),
                    Map.entry("3", new RangoGeneracion(252, 386)),
                    Map.entry("4", new RangoGeneracion(387, 493)),
                    Map.entry("5", new RangoGeneracion(494, 649)),
                    Map.entry("6", new RangoGeneracion(650, 721)),
                    Map.entry("7", new RangoGeneracion(722, 809)),
                    Map.entry("8", new RangoGeneracion(810, 905)),
                    Map.entry("9", new RangoGeneracion(906, 1025)),
                    Map.entry(
                            "all",
                            new RangoGeneracion(1, 1025)
                    )
            );

    private final RestClient pokeApiClient;
    private final RestClient imageClient;

    private final Map<Integer, String> nameCache =
            new ConcurrentHashMap<>();

    private final Map<Integer, byte[]> imageCache =
            new ConcurrentHashMap<>();

    public PokeZoomService() {
        this.pokeApiClient = RestClient
                .builder()
                .baseUrl(POKE_API_URL)
                .build();

        this.imageClient = RestClient.create();
    }

    public PartidaPokeZoom crearPartida(
            String generacion
    ) {
        RangoGeneracion rango =
                RANGOS.getOrDefault(
                        generacion,
                        RANGOS.get("all")
                );

        int pokemonId = ThreadLocalRandom
                .current()
                .nextInt(
                        rango.inicio(),
                        rango.fin() + 1
                );

        String pokemonNombre = nameCache.computeIfAbsent(
                pokemonId,
                this::obtenerNombreDesdeApi
        );

        return new PartidaPokeZoom(
                pokemonId,
                pokemonNombre,
                generacion
        );
    }

    public byte[] obtenerImagen(int pokemonId) {
        return imageCache.computeIfAbsent(
                pokemonId,
                this::descargarImagen
        );
    }

    private String obtenerNombreDesdeApi(int pokemonId) {
        JsonNode respuesta = pokeApiClient
                .get()
                .uri("/pokemon/{id}", pokemonId)
                .retrieve()
                .body(JsonNode.class);

        if (respuesta == null) {
            throw new IllegalStateException(
                    "PokeAPI no devolvió el Pokémon"
            );
        }

        return respuesta.path("name").asText();
    }

    private byte[] descargarImagen(int pokemonId) {
        byte[] imagen = imageClient
                .get()
                .uri(ARTWORK_URL.formatted(pokemonId))
                .retrieve()
                .body(byte[].class);

        if (imagen == null || imagen.length == 0) {
            throw new IllegalStateException(
                    "No se pudo descargar la imagen"
            );
        }

        return imagen;
    }

    private record RangoGeneracion(
            int inicio,
            int fin
    ) {
    }
}