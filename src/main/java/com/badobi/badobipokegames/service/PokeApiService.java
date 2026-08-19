package com.badobi.badobipokegames.service;

import com.badobi.badobipokegames.model.Pokemon;
import tools.jackson.databind.JsonNode;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class PokeApiService {

    private final RestClient restClient;

    public PokeApiService() {
        this.restClient = RestClient.create(
                "https://pokeapi.co/api/v2"
        );
    }

    public Pokemon buscarPokemon(String nombreIntroducido) {
        try {
            String nombre = normalizarNombre(nombreIntroducido);

            JsonNode datosPokemon = restClient.get()
                    .uri("/pokemon/{nombre}", nombre)
                    .retrieve()
                    .body(JsonNode.class);

            if (datosPokemon == null) {
                throw new IllegalArgumentException(
                        "No se encontró el Pokémon"
                );
            }

            int id = datosPokemon.path("id").asInt();

            JsonNode datosEspecie = restClient.get()
                    .uri("/pokemon-species/{id}", id)
                    .retrieve()
                    .body(JsonNode.class);

            if (datosEspecie == null) {
                throw new IllegalArgumentException(
                        "No se encontraron los datos de la especie"
                );
            }

            String nombreMostrado = obtenerNombreEspanol(
                    datosEspecie,
                    datosPokemon.path("name").asText()
            );

            String imagen = datosPokemon
                    .path("sprites")
                    .path("other")
                    .path("official-artwork")
                    .path("front_default")
                    .asText();

            if (imagen.isBlank()) {
                imagen = datosPokemon
                        .path("sprites")
                        .path("front_default")
                        .asText();
            }

            JsonNode tipos = datosPokemon.path("types");

            String tipo1 = traducirTipo(
                    tipos.get(0)
                            .path("type")
                            .path("name")
                            .asText()
            );

            String tipo2 = "Ninguno";

            if (tipos.size() > 1) {
                tipo2 = traducirTipo(
                        tipos.get(1)
                                .path("type")
                                .path("name")
                                .asText()
                );
            }

            String habitat = "Desconocido";

            if (!datosEspecie.path("habitat").isNull()) {
                habitat = traducirHabitat(
                        datosEspecie
                                .path("habitat")
                                .path("name")
                                .asText()
                );
            }

            String color = traducirColor(
                    datosEspecie
                            .path("color")
                            .path("name")
                            .asText()
            );

            String urlEvolucion = datosEspecie
                    .path("evolution_chain")
                    .path("url")
                    .asText();

            int faseEvolucion = obtenerFaseEvolucion(
                    urlEvolucion,
                    datosPokemon
                            .path("species")
                            .path("name")
                            .asText()
            );

            return new Pokemon(
                    id,
                    nombreMostrado,
                    imagen,
                    tipo1,
                    tipo2,
                    habitat,
                    color,
                    faseEvolucion
            );

        } catch (Exception error) {
            throw new IllegalArgumentException(
                    "No se pudo encontrar ese Pokémon",
                    error
            );
        }
    }

    private int obtenerFaseEvolucion(
            String urlEvolucion,
            String nombreEspecie
    ) {
        JsonNode datosEvolucion = RestClient.create()
                .get()
                .uri(urlEvolucion)
                .retrieve()
                .body(JsonNode.class);

        if (datosEvolucion == null) {
            return 1;
        }

        int fase = buscarFase(
                datosEvolucion.path("chain"),
                nombreEspecie,
                1
        );

        return fase == 0 ? 1 : fase;
    }

    private int buscarFase(
            JsonNode cadena,
            String nombreEspecie,
            int faseActual
    ) {
        String nombreActual = cadena
                .path("species")
                .path("name")
                .asText();

        if (nombreActual.equals(nombreEspecie)) {
            return faseActual;
        }

        for (JsonNode evolucion : cadena.path("evolves_to")) {
            int resultado = buscarFase(
                    evolucion,
                    nombreEspecie,
                    faseActual + 1
            );

            if (resultado != 0) {
                return resultado;
            }
        }

        return 0;
    }

    private String obtenerNombreEspanol(
            JsonNode especie,
            String nombreAlternativo
    ) {
        for (JsonNode nombre : especie.path("names")) {
            String idioma = nombre
                    .path("language")
                    .path("name")
                    .asText();

            if (idioma.equals("es")) {
                return nombre.path("name").asText();
            }
        }

        return capitalizar(nombreAlternativo);
    }

    private String normalizarNombre(String nombre) {
        return nombre
                .trim()
                .toLowerCase()
                .replace(" ", "-");
    }

    private String capitalizar(String texto) {
        if (texto == null || texto.isBlank()) {
            return texto;
        }

        return texto.substring(0, 1).toUpperCase()
                + texto.substring(1);
    }

    private String traducirTipo(String tipo) {
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
            default -> capitalizar(tipo);
        };
    }

    private String traducirColor(String color) {
        return switch (color) {
            case "black" -> "Negro";
            case "blue" -> "Azul";
            case "brown" -> "Marrón";
            case "gray" -> "Gris";
            case "green" -> "Verde";
            case "pink" -> "Rosa";
            case "purple" -> "Morado";
            case "red" -> "Rojo";
            case "white" -> "Blanco";
            case "yellow" -> "Amarillo";
            default -> capitalizar(color);
        };
    }

    private String traducirHabitat(String habitat) {
        return switch (habitat) {
            case "cave" -> "Cueva";
            case "forest" -> "Bosque";
            case "grassland" -> "Pradera";
            case "mountain" -> "Montaña";
            case "rare" -> "Raro";
            case "rough-terrain" -> "Terreno abrupto";
            case "sea" -> "Mar";
            case "urban" -> "Urbano";
            case "waters-edge" -> "Orilla";
            default -> capitalizar(habitat);
        };
    }
}