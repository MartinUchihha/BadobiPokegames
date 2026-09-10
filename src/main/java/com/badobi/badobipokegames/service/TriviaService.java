package com.badobi.badobipokegames.service;

import com.badobi.badobipokegames.model.PartidaTrivia;
import com.badobi.badobipokegames.model.PreguntaTrivia;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import tools.jackson.databind.JsonNode;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class TriviaService {

    private static final List<String> TIPOS = List.of(
            "normal", "fire", "water", "electric", "grass",
            "ice", "fighting", "poison", "ground", "flying",
            "psychic", "bug", "rock", "ghost", "dragon",
            "dark", "steel", "fairy"
    );

    private static final List<String> ESTADISTICAS = List.of(
            "ps",
            "ataque",
            "defensa",
            "ataque-especial",
            "defensa-especial",
            "velocidad"
    );

    private static final Map<String, String> NOMBRES_TIPOS = Map.ofEntries(
            Map.entry("normal", "Normal"),
            Map.entry("fire", "Fuego"),
            Map.entry("water", "Agua"),
            Map.entry("electric", "Eléctrico"),
            Map.entry("grass", "Planta"),
            Map.entry("ice", "Hielo"),
            Map.entry("fighting", "Lucha"),
            Map.entry("poison", "Veneno"),
            Map.entry("ground", "Tierra"),
            Map.entry("flying", "Volador"),
            Map.entry("psychic", "Psíquico"),
            Map.entry("bug", "Bicho"),
            Map.entry("rock", "Roca"),
            Map.entry("ghost", "Fantasma"),
            Map.entry("dragon", "Dragón"),
            Map.entry("dark", "Siniestro"),
            Map.entry("steel", "Acero"),
            Map.entry("fairy", "Hada")
    );

    private final RestClient pokeApi = RestClient.create(
            "https://pokeapi.co/api/v2"
    );

    private final Map<Integer, DatosPokemon> cache =
            new ConcurrentHashMap<>();

    public PreguntaTrivia generarPregunta(
            PartidaTrivia partida
    ) {
        for (int intento = 0; intento < 40; intento++) {
            PreguntaTrivia pregunta = generarPorDificultad(partida);

            if (!partida.preguntaFueUtilizada(pregunta.getId())) {
                return pregunta;
            }
        }

        throw new IllegalStateException(
                "No se pudo generar una pregunta diferente"
        );
    }

    private PreguntaTrivia generarPorDificultad(
            PartidaTrivia partida
    ) {
        int numeroPregunta = partida.getNumeroPreguntaActual();
        int opcion;

        if (numeroPregunta <= 3) {
            opcion = numeroAleatorio(0, 2);
        } else if (numeroPregunta <= 7) {
            opcion = numeroAleatorio(0, 3);
        } else {
            opcion = numeroAleatorio(1, 4);
        }

        return switch (opcion) {
            case 0 -> generarPreguntaTipo(partida.getGeneracion());
            case 1 -> generarPreguntaGeneracion(partida.getGeneracion());
            case 2 -> generarPreguntaEstadisticaPrincipal(
                    partida.getGeneracion()
            );
            default -> generarPreguntaComparacion(
                    partida.getGeneracion()
            );
        };
    }

    private PreguntaTrivia generarPreguntaTipo(String generacion) {
        DatosPokemon pokemon = obtenerPokemonAleatorio(generacion, Set.of());
        String tipoCorrecto = pokemon.tipos().get(
                numeroAleatorio(0, pokemon.tipos().size())
        );

        List<String> tiposIncorrectos = TIPOS.stream()
                .filter(tipo -> !pokemon.tipos().contains(tipo))
                .collect(ArrayList::new, ArrayList::add, ArrayList::addAll);

        Collections.shuffle(tiposIncorrectos);

        List<String> opciones = new ArrayList<>();
        opciones.add(traducirTipo(tipoCorrecto));

        tiposIncorrectos.stream()
                .limit(3)
                .map(this::traducirTipo)
                .forEach(opciones::add);

        Collections.shuffle(opciones);

        String respuesta = traducirTipo(tipoCorrecto);

        return new PreguntaTrivia(
                "tipo-" + pokemon.id() + "-" + tipoCorrecto,
                "Tipos",
                "¿Cuál de estos tipos posee "
                        + formatearNombre(pokemon.nombre()) + "?",
                opciones,
                respuesta,
                formatearNombre(pokemon.nombre())
                        + " es de tipo "
                        + traducirTipos(pokemon.tipos()) + "."
        );
    }

    private PreguntaTrivia generarPreguntaGeneracion(
            String generacionSeleccionada
    ) {
        int generacionObjetivo = generacionSeleccionada.equals("all")
                ? numeroAleatorio(1, 10)
                : Integer.parseInt(generacionSeleccionada);

        DatosPokemon correcto = obtenerPokemonAleatorio(
                String.valueOf(generacionObjetivo),
                Set.of()
        );

        Set<Integer> idsUsados = new LinkedHashSet<>();
        idsUsados.add(correcto.id());

        List<String> opciones = new ArrayList<>();
        opciones.add(formatearNombre(correcto.nombre()));

        while (opciones.size() < 4) {
            int otraGeneracion;

            do {
                otraGeneracion = numeroAleatorio(1, 10);
            } while (otraGeneracion == generacionObjetivo);

            DatosPokemon distractor = obtenerPokemonAleatorio(
                    String.valueOf(otraGeneracion),
                    idsUsados
            );

            if (idsUsados.add(distractor.id())) {
                opciones.add(formatearNombre(distractor.nombre()));
            }
        }

        Collections.shuffle(opciones);
        String respuesta = formatearNombre(correcto.nombre());

        return new PreguntaTrivia(
                "generacion-" + generacionObjetivo + "-" + correcto.id(),
                "Generaciones",
                "¿Cuál de estos Pokémon pertenece a la Generación "
                        + numeroRomano(generacionObjetivo) + "?",
                opciones,
                respuesta,
                respuesta + " apareció por primera vez en la Generación "
                        + numeroRomano(generacionObjetivo) + "."
        );
    }

    private PreguntaTrivia generarPreguntaEstadisticaPrincipal(
            String generacion
    ) {
        for (int intento = 0; intento < 25; intento++) {
            DatosPokemon pokemon = obtenerPokemonAleatorio(
                    generacion,
                    Set.of()
            );

            int valorMaximo = ESTADISTICAS.stream()
                    .mapToInt(pokemon::valorEstadistica)
                    .max()
                    .orElse(0);

            List<String> maximas = ESTADISTICAS.stream()
                    .filter(estadistica ->
                            pokemon.valorEstadistica(estadistica)
                                    == valorMaximo
                    )
                    .toList();

            if (maximas.size() != 1) {
                continue;
            }

            String correcta = maximas.getFirst();
            List<String> incorrectas = ESTADISTICAS.stream()
                    .filter(estadistica -> !estadistica.equals(correcta))
                    .collect(ArrayList::new, ArrayList::add, ArrayList::addAll);

            Collections.shuffle(incorrectas);

            List<String> opciones = new ArrayList<>();
            opciones.add(nombreEstadistica(correcta));

            incorrectas.stream()
                    .limit(3)
                    .map(this::nombreEstadistica)
                    .forEach(opciones::add);

            Collections.shuffle(opciones);
            String respuesta = nombreEstadistica(correcta);

            return new PreguntaTrivia(
                    "estadistica-" + pokemon.id() + "-" + correcta,
                    "Estadísticas",
                    "¿Cuál es la estadística base más alta de "
                            + formatearNombre(pokemon.nombre()) + "?",
                    opciones,
                    respuesta,
                    "Su estadística más alta es " + respuesta
                            + ", con un valor base de " + valorMaximo + "."
            );
        }

        return generarPreguntaTipo(generacion);
    }

    private PreguntaTrivia generarPreguntaComparacion(
            String generacion
    ) {
        for (int intento = 0; intento < 25; intento++) {
            String estadistica = ESTADISTICAS.get(
                    numeroAleatorio(0, ESTADISTICAS.size())
            );

            Set<Integer> idsUsados = new LinkedHashSet<>();
            List<DatosPokemon> pokemon = new ArrayList<>();

            while (pokemon.size() < 4) {
                DatosPokemon candidato = obtenerPokemonAleatorio(
                        generacion,
                        idsUsados
                );

                if (idsUsados.add(candidato.id())) {
                    pokemon.add(candidato);
                }
            }

            int valorMaximo = pokemon.stream()
                    .mapToInt(p -> p.valorEstadistica(estadistica))
                    .max()
                    .orElse(0);

            List<DatosPokemon> ganadores = pokemon.stream()
                    .filter(p -> p.valorEstadistica(estadistica) == valorMaximo)
                    .toList();

            if (ganadores.size() != 1) {
                continue;
            }

            DatosPokemon correcto = ganadores.getFirst();
            List<String> opciones = pokemon.stream()
                    .map(DatosPokemon::nombre)
                    .map(this::formatearNombre)
                    .collect(ArrayList::new, ArrayList::add, ArrayList::addAll);

            Collections.shuffle(opciones);
            String respuesta = formatearNombre(correcto.nombre());

            String idsPregunta = pokemon.stream()
                    .map(DatosPokemon::id)
                    .sorted(Comparator.naturalOrder())
                    .map(String::valueOf)
                    .reduce((a, b) -> a + "-" + b)
                    .orElse("");

            return new PreguntaTrivia(
                    "comparacion-" + estadistica + "-" + idsPregunta,
                    "Comparación",
                    "¿Cuál de estos Pokémon tiene más "
                            + nombreEstadistica(estadistica).toLowerCase()
                            + " base?",
                    opciones,
                    respuesta,
                    respuesta + " posee " + valorMaximo + " puntos base de "
                            + nombreEstadistica(estadistica).toLowerCase() + "."
            );
        }

        return generarPreguntaEstadisticaPrincipal(generacion);
    }

    private DatosPokemon obtenerPokemonAleatorio(
            String generacion,
            Set<Integer> idsExcluidos
    ) {
        int[] rango = obtenerRango(generacion);
        int pokemonId;

        do {
            pokemonId = numeroAleatorio(rango[0], rango[1] + 1);
        } while (idsExcluidos.contains(pokemonId));

        return cache.computeIfAbsent(
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

        List<String> tipos = new ArrayList<>();

        for (JsonNode tipo : pokemon.path("types")) {
            tipos.add(
                    tipo.path("type").path("name").asText()
            );
        }

        return new DatosPokemon(
                pokemonId,
                pokemon.path("name").asText(),
                generacionDePokemon(pokemonId),
                List.copyOf(tipos),
                obtenerStat(pokemon, "hp"),
                obtenerStat(pokemon, "attack"),
                obtenerStat(pokemon, "defense"),
                obtenerStat(pokemon, "special-attack"),
                obtenerStat(pokemon, "special-defense"),
                obtenerStat(pokemon, "speed")
        );
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

    private int generacionDePokemon(int pokemonId) {
        if (pokemonId <= 151) return 1;
        if (pokemonId <= 251) return 2;
        if (pokemonId <= 386) return 3;
        if (pokemonId <= 493) return 4;
        if (pokemonId <= 649) return 5;
        if (pokemonId <= 721) return 6;
        if (pokemonId <= 809) return 7;
        if (pokemonId <= 905) return 8;
        return 9;
    }

    private String traducirTipo(String tipo) {
        return NOMBRES_TIPOS.getOrDefault(tipo, tipo);
    }

    private String traducirTipos(List<String> tipos) {
        return tipos.stream()
                .map(this::traducirTipo)
                .reduce((primero, segundo) -> primero + " y " + segundo)
                .orElse("desconocido");
    }

    private String nombreEstadistica(String estadistica) {
        return switch (estadistica) {
            case "ps" -> "PS";
            case "ataque" -> "Ataque";
            case "defensa" -> "Defensa";
            case "ataque-especial" -> "Ataque especial";
            case "defensa-especial" -> "Defensa especial";
            case "velocidad" -> "Velocidad";
            default -> "Estadística";
        };
    }

    private String formatearNombre(String nombre) {
        String[] partes = nombre.split("-");
        StringBuilder resultado = new StringBuilder();

        for (String parte : partes) {
            if (!resultado.isEmpty()) {
                resultado.append(" ");
            }

            resultado.append(
                    Character.toUpperCase(parte.charAt(0))
            );
            resultado.append(parte.substring(1));
        }

        return resultado.toString();
    }

    private String numeroRomano(int numero) {
        return switch (numero) {
            case 1 -> "I";
            case 2 -> "II";
            case 3 -> "III";
            case 4 -> "IV";
            case 5 -> "V";
            case 6 -> "VI";
            case 7 -> "VII";
            case 8 -> "VIII";
            case 9 -> "IX";
            default -> String.valueOf(numero);
        };
    }

    private int numeroAleatorio(int minimo, int maximoExclusivo) {
        return ThreadLocalRandom.current().nextInt(
                minimo,
                maximoExclusivo
        );
    }

    private record DatosPokemon(
            int id,
            String nombre,
            int generacion,
            List<String> tipos,
            int ps,
            int ataque,
            int defensa,
            int ataqueEspecial,
            int defensaEspecial,
            int velocidad
    ) {
        private int valorEstadistica(String estadistica) {
            return switch (estadistica) {
                case "ps" -> ps;
                case "ataque" -> ataque;
                case "defensa" -> defensa;
                case "ataque-especial" -> ataqueEspecial;
                case "defensa-especial" -> defensaEspecial;
                case "velocidad" -> velocidad;
                default -> 0;
            };
        }
    }
}
