package com.badobi.badobipokegames.service;

import com.badobi.badobipokegames.model.PartidaSilueta;
import com.badobi.badobipokegames.model.RondaSiluetaTiempo;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import tools.jackson.databind.JsonNode;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class SiluetaService {

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

    private final Map<Integer, byte[]> artworkCache =
            new ConcurrentHashMap<>();

    private final Map<Integer, byte[]> silhouetteCache =
            new ConcurrentHashMap<>();

    public SiluetaService() {
        this.pokeApiClient = RestClient
                .builder()
                .baseUrl(POKE_API_URL)
                .build();

        this.imageClient = RestClient.create();
    }

    public PartidaSilueta crearPartida(
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

        String pokemonNombre =
                nameCache.computeIfAbsent(
                        pokemonId,
                        this::obtenerNombreDesdeApi
                );

        return new PartidaSilueta(
                pokemonId,
                pokemonNombre,
                generacion
        );
    }
    public RondaSiluetaTiempo crearRondaTiempo(
            String generacion
    ) {
        RondaSiluetaTiempo ronda =
                new RondaSiluetaTiempo(generacion);

        prepararSiguientePokemon(ronda);

        return ronda;
    }

    public void prepararSiguientePokemon(
            RondaSiluetaTiempo ronda
    ) {
        RangoGeneracion rango =
                RANGOS.getOrDefault(
                        ronda.getGeneracion(),
                        RANGOS.get("all")
                );

        int pokemonAnterior =
                ronda.getPokemonId();

        int nuevoPokemonId;

        do {
            nuevoPokemonId = ThreadLocalRandom
                    .current()
                    .nextInt(
                            rango.inicio(),
                            rango.fin() + 1
                    );
        } while (
                nuevoPokemonId == pokemonAnterior &&
                        rango.inicio() != rango.fin()
        );

        String nuevoPokemonNombre =
                nameCache.computeIfAbsent(
                        nuevoPokemonId,
                        this::obtenerNombreDesdeApi
                );

        /*
         * Preparamos la silueta antes de comenzar
         * o reanudar el reloj.
         */
        obtenerSilueta(nuevoPokemonId);

        ronda.establecerPokemon(
                nuevoPokemonId,
                nuevoPokemonNombre
        );
    }

    public byte[] obtenerSilueta(int pokemonId) {
        return silhouetteCache.computeIfAbsent(
                pokemonId,
                this::crearSilueta
        );
    }

    public byte[] obtenerArtwork(int pokemonId) {
        return artworkCache.computeIfAbsent(
                pokemonId,
                this::descargarArtwork
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

    private byte[] descargarArtwork(int pokemonId) {
        byte[] imagen = imageClient
                .get()
                .uri(ARTWORK_URL.formatted(pokemonId))
                .retrieve()
                .body(byte[].class);

        if (imagen == null || imagen.length == 0) {
            throw new IllegalStateException(
                    "No se pudo descargar la ilustración"
            );
        }

        return imagen;
    }

    private byte[] crearSilueta(int pokemonId) {
        byte[] artwork = obtenerArtwork(pokemonId);

        try {
            BufferedImage original = ImageIO.read(
                    new ByteArrayInputStream(artwork)
            );

            if (original == null) {
                throw new IllegalStateException(
                        "La ilustración no es válida"
                );
            }

            BufferedImage silueta = new BufferedImage(
                    original.getWidth(),
                    original.getHeight(),
                    BufferedImage.TYPE_INT_ARGB
            );

            for (int y = 0; y < original.getHeight(); y++) {
                for (int x = 0; x < original.getWidth(); x++) {
                    int pixel = original.getRGB(x, y);
                    int alpha = (pixel >>> 24) & 0xFF;

                    if (alpha > 0) {
                        int pixelNegro =
                                (alpha << 24);

                        silueta.setRGB(
                                x,
                                y,
                                pixelNegro
                        );
                    }
                }
            }

            ByteArrayOutputStream output =
                    new ByteArrayOutputStream();

            ImageIO.write(
                    silueta,
                    "png",
                    output
            );

            return output.toByteArray();
        } catch (IOException error) {
            throw new IllegalStateException(
                    "No se pudo crear la silueta",
                    error
            );
        }
    }

    private record RangoGeneracion(
            int inicio,
            int fin
    ) {
    }
}