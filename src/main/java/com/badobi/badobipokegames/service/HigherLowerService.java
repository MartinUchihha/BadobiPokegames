package com.badobi.badobipokegames.service;

import com.badobi.badobipokegames.model.PartidaHigherLower;
import com.badobi.badobipokegames.model.PokemonHigherLower;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import tools.jackson.databind.JsonNode;

import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class HigherLowerService {

    private static final List<String> ESTADISTICAS = List.of(
            "ps",
            "ataque",
            "defensa",
            "ataque-especial",
            "defensa-especial",
            "velocidad",
            "total"
    );

    private final RestClient restClient = RestClient.create(
            "https://pokeapi.co/api/v2"
    );

    public PartidaHigherLower crearPartida(String generacion) {
        String estadistica = elegirEstadistica(null);

        PokemonHigherLower pokemonIzquierdo =
                obtenerPokemonAleatorio(generacion, -1);

        PokemonHigherLower pokemonDerecho =
                obtenerPokemonConValorDiferente(
                        generacion,
                        pokemonIzquierdo,
                        estadistica
                );

        return new PartidaHigherLower(
                pokemonIzquierdo,
                pokemonDerecho,
                estadistica
        );
    }

    public void prepararSiguienteComparacion(
            PartidaHigherLower partida,
            String generacion
    ) {
        String estadisticaActual = partida.getEstadistica();
        String nuevaEstadistica = estadisticaActual;

        if (partida.debeCambiarEstadistica()) {
            nuevaEstadistica =
                    elegirEstadistica(estadisticaActual);
        }

        PokemonHigherLower nuevoPokemon =
                obtenerPokemonConValorDiferente(
                        generacion,
                        partida.getPokemonDerecho(),
                        nuevaEstadistica
                );

        partida.prepararSiguienteComparacion(
                nuevoPokemon,
                nuevaEstadistica
        );
    }

    public boolean comprobarRespuesta(
            PartidaHigherLower partida,
            String respuesta
    ) {
        int valorIzquierdo =
                partida.getPokemonIzquierdo()
                        .obtenerEstadistica(
                                partida.getEstadistica()
                        );

        int valorDerecho =
                partida.getPokemonDerecho()
                        .obtenerEstadistica(
                                partida.getEstadistica()
                        );

        return switch (respuesta) {
            case "mayor" -> valorDerecho > valorIzquierdo;
            case "menor" -> valorDerecho < valorIzquierdo;
            default -> false;
        };
    }

    private PokemonHigherLower obtenerPokemonConValorDiferente(
            String generacion,
            PokemonHigherLower pokemonReferencia,
            String estadistica
    ) {
        int valorReferencia =
                pokemonReferencia.obtenerEstadistica(
                        estadistica
                );

        for (int intento = 0; intento < 30; intento++) {
            PokemonHigherLower candidato =
                    obtenerPokemonAleatorio(
                            generacion,
                            pokemonReferencia.getId()
                    );

            int valorCandidato =
                    candidato.obtenerEstadistica(
                            estadistica
                    );

            if (valorCandidato != valorReferencia) {
                return candidato;
            }
        }

        throw new IllegalStateException(
                "No se encontró una comparación sin empate"
        );
    }

    private PokemonHigherLower obtenerPokemonAleatorio(
            String generacion,
            int idExcluido
    ) {
        int[] rango = obtenerRango(generacion);
        int pokemonId;

        do {
            pokemonId = ThreadLocalRandom.current().nextInt(
                    rango[0],
                    rango[1] + 1
            );
        } while (pokemonId == idExcluido);

        return obtenerPokemon(pokemonId);
    }

    private PokemonHigherLower obtenerPokemon(int pokemonId) {
        JsonNode pokemon = restClient
                .get()
                .uri("/pokemon/{id}", pokemonId)
                .retrieve()
                .body(JsonNode.class);

        if (pokemon == null) {
            throw new IllegalStateException(
                    "No se pudo obtener el Pokémon"
            );
        }

        String nombre = pokemon.path("name").asText();

        String imagen = pokemon
                .path("sprites")
                .path("other")
                .path("official-artwork")
                .path("front_default")
                .asText();

        int ps = obtenerStat(pokemon, "hp");
        int ataque = obtenerStat(pokemon, "attack");
        int defensa = obtenerStat(pokemon, "defense");

        int ataqueEspecial =
                obtenerStat(pokemon, "special-attack");

        int defensaEspecial =
                obtenerStat(pokemon, "special-defense");

        int velocidad = obtenerStat(pokemon, "speed");

        return new PokemonHigherLower(
                pokemonId,
                nombre,
                imagen,
                ps,
                ataque,
                defensa,
                ataqueEspecial,
                defensaEspecial,
                velocidad
        );
    }

    private int obtenerStat(
            JsonNode pokemon,
            String nombreStat
    ) {
        for (JsonNode stat : pokemon.path("stats")) {
            String nombre = stat
                    .path("stat")
                    .path("name")
                    .asText();

            if (nombre.equals(nombreStat)) {
                return stat.path("base_stat").asInt();
            }
        }

        return 0;
    }

    private String elegirEstadistica(
            String estadisticaExcluida
    ) {
        String estadistica;

        do {
            estadistica = ESTADISTICAS.get(
                    ThreadLocalRandom.current().nextInt(
                            ESTADISTICAS.size()
                    )
            );
        } while (estadistica.equals(estadisticaExcluida));

        return estadistica;
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