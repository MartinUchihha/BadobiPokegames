package com.badobi.badobipokegames.controller;

import com.badobi.badobipokegames.model.Pokemon;
import com.badobi.badobipokegames.service.PokeApiService;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;


import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;


@Controller
public class PokedleController {

    private final PokeApiService pokeApiService;

    public PokedleController(PokeApiService pokeApiService) {
        this.pokeApiService = pokeApiService;
    }

    @GetMapping("/pokedle")
    public String mostrarPokedle(
            Model model,
            HttpSession session
    ) {
        agregarDatosPartida(model, session);
        return "pokedle";
    }

    @PostMapping("/pokedle")
    public String comprobarPokemon(
            @RequestParam String pokemonName,
            Model model,
            HttpSession session
    ) {
        Pokemon pokemonOculto = obtenerPokemonOculto(session);
        List<Pokemon> intentos = obtenerIntentos(session);

        try {
            Pokemon pokemonElegido =
                    pokeApiService.buscarPokemon(pokemonName);

            boolean yaIntentado = intentos.stream()
                    .anyMatch(pokemon ->
                            pokemon.getId() == pokemonElegido.getId()
                    );

            if (!yaIntentado) {
                intentos.add(0, pokemonElegido);
            }

            boolean acierto =
                    pokemonElegido.getId() == pokemonOculto.getId();

            model.addAttribute("acierto", acierto);

            if (acierto) {
                session.setAttribute("partidaGanada", true);
                model.addAttribute(
                        "mensaje",
                        "¡Correcto! Has encontrado al Pokémon oculto."
                );
            } else if (yaIntentado) {
                model.addAttribute(
                        "mensaje",
                        "Ya habías probado con ese Pokémon."
                );
            } else {
                model.addAttribute(
                        "mensaje",
                        "No es el Pokémon oculto. Revisa las pistas."
                );
            }

        } catch (IllegalArgumentException error) {
            model.addAttribute("acierto", false);
            model.addAttribute(
                    "mensaje",
                    "Selecciona un Pokémon válido de la lista."
            );
        }

        agregarDatosPartida(model, session);
        return "pokedle";
    }
    @PostMapping("/pokedle/intento")
    @ResponseBody
    public Map<String, Object> comprobarSinRecargar(
            @RequestParam String pokemonName,
            HttpSession session
    ) {
        Map<String, Object> resultado = new LinkedHashMap<>();

        Pokemon pokemonOculto = obtenerPokemonOculto(session);
        List<Pokemon> intentos = obtenerIntentos(session);

        try {
            Pokemon pokemonElegido =
                    pokeApiService.buscarPokemon(pokemonName);

            boolean yaIntentado = intentos.stream()
                    .anyMatch(pokemon ->
                            pokemon.getId() == pokemonElegido.getId()
                    );

            boolean acierto =
                    pokemonElegido.getId() == pokemonOculto.getId();

            if (!yaIntentado) {
                intentos.add(0, pokemonElegido);
            }

            boolean modoDificil =
                    obtenerModo(session).equals("difficult");

            boolean derrota =
                    modoDificil
                            && !acierto
                            && intentos.size() >= 8;

            if (acierto || derrota) {
                session.setAttribute("partidaGanada", true);
            }

            Map<String, Boolean> coincidencias =
                    new LinkedHashMap<>();

            coincidencias.put(
                    "pokemon",
                    pokemonElegido.getId() == pokemonOculto.getId()
            );

            boolean tipo1Exacto = pokemonElegido.getTipo1()
                    .equals(pokemonOculto.getTipo1());

            boolean tipo2Exacto = pokemonElegido.getTipo2()
                    .equals(pokemonOculto.getTipo2());

            boolean tipo1Parcial =
                    !tipo1Exacto
                            && !pokemonElegido.getTipo1().equals("Ninguno")
                            && pokemonElegido.getTipo1()
                            .equals(pokemonOculto.getTipo2());

            boolean tipo2Parcial =
                    !tipo2Exacto
                            && !pokemonElegido.getTipo2().equals("Ninguno")
                            && pokemonElegido.getTipo2()
                            .equals(pokemonOculto.getTipo1());

            coincidencias.put("tipo1", tipo1Exacto);
            coincidencias.put("tipo2", tipo2Exacto);
            coincidencias.put("tipo1Parcial", tipo1Parcial);
            coincidencias.put("tipo2Parcial", tipo2Parcial);

            coincidencias.put(
                    "habitat",
                    pokemonElegido.getHabitat()
                            .equals(pokemonOculto.getHabitat())
            );

            coincidencias.put(
                    "color",
                    pokemonElegido.getColor()
                            .equals(pokemonOculto.getColor())
            );

            coincidencias.put(
                    "faseEvolucion",
                    pokemonElegido.getFaseEvolucion()
                            == pokemonOculto.getFaseEvolucion()
            );

            resultado.put("valido", true);
            resultado.put("acierto", acierto);
            resultado.put("yaIntentado", yaIntentado);
            resultado.put("derrota", derrota);
            resultado.put("pokemon", pokemonElegido);
            if (derrota) {
                resultado.put("pokemonRevelado", pokemonOculto);
            }
            resultado.put("coincidencias", coincidencias);
            int cantidadIntentos = intentos.size();

            resultado.put("cantidadIntentos", cantidadIntentos);

            boolean modoTodasGeneraciones =
                    obtenerGeneracion(session).equals("all");

            if (
                    cantidadIntentos >= 5
                            && modoTodasGeneraciones
                            && !modoDificil
            ) {
                resultado.put(
                        "pistaGeneracion",
                        obtenerNombreGeneracion(pokemonOculto.getId())
                );
            }

            if (cantidadIntentos >= 10 && !modoDificil) {
                resultado.put(
                        "pistaSilueta",
                        pokemonOculto.getImagen()
                );
            }

            if (acierto) {
                resultado.put(
                        "mensaje",
                        "¡Correcto! Has encontrado al Pokémon oculto."
                );
            } else if (derrota) {
                resultado.put(
                        "mensaje",
                        "Te has quedado sin intentos. El Pokémon era "
                                + pokemonOculto.getNombre() + "."
                );
            } else if (yaIntentado) {
                resultado.put(
                        "mensaje",
                        "Ya habías probado con ese Pokémon."
                );
            } else {
                resultado.put(
                        "mensaje",
                        "No es el Pokémon oculto. Revisa las pistas."
                );
            }

        } catch (IllegalArgumentException error) {
            resultado.put("valido", false);
            resultado.put("acierto", false);
            resultado.put(
                    "mensaje",
                    "Selecciona un Pokémon válido de la lista."
            );
        }

        return resultado;
    }
    @PostMapping("/pokedle/nueva-partida")
    public String comenzarNuevaPartida(
            @RequestParam(defaultValue = "all") String generation,
            @RequestParam(defaultValue = "normal") String gameMode,
            HttpSession session
    ) {
        String generacion = validarGeneracion(generation);
        String modo = validarModo(gameMode);

        session.setAttribute("generacion", generacion);
        session.setAttribute("modoJuego", modo);
        session.setAttribute("generacion", generacion);
        session.removeAttribute("pokemonOculto");
        session.removeAttribute("intentos");
        session.removeAttribute("partidaGanada");

        return "redirect:/pokedle";
    }

    private void agregarDatosPartida(
            Model model,
            HttpSession session
    ) {
        model.addAttribute(
                "pokemonOculto",
                obtenerPokemonOculto(session)
        );

        model.addAttribute(
                "intentos",
                obtenerIntentos(session)
        );

        model.addAttribute(
                "generacionSeleccionada",
                obtenerGeneracion(session)
        );
        model.addAttribute(
                "partidaGanada",
                Boolean.TRUE.equals(
                        session.getAttribute("partidaGanada")
                )
        );
        model.addAttribute(
                "modoSeleccionado",
                obtenerModo(session)
        );
    }

    private Pokemon obtenerPokemonOculto(HttpSession session) {
        Pokemon pokemonOculto =
                (Pokemon) session.getAttribute("pokemonOculto");

        if (pokemonOculto == null) {
            String generacion = obtenerGeneracion(session);
            int[] rango = obtenerRango(generacion);

            int idAleatorio = ThreadLocalRandom.current()
                    .nextInt(rango[0], rango[1] + 1);

            pokemonOculto = pokeApiService.buscarPokemon(
                    String.valueOf(idAleatorio)
            );

            session.setAttribute("pokemonOculto", pokemonOculto);
        }

        return pokemonOculto;
    }

    private String obtenerGeneracion(HttpSession session) {
        String generacion =
                (String) session.getAttribute("generacion");

        if (generacion == null) {
            generacion = "all";
            session.setAttribute("generacion", generacion);
        }

        return generacion;
    }
    private String obtenerModo(HttpSession session) {
        String modo =
                (String) session.getAttribute("modoJuego");

        if (modo == null) {
            modo = "normal";
            session.setAttribute("modoJuego", modo);
        }

        return modo;
    }

    private String validarModo(String modo) {
        if ("difficult".equals(modo)) {
            return "difficult";
        }

        return "normal";
    }
    private String validarGeneracion(String generacion) {
        return switch (generacion) {
            case "1", "2", "3", "4", "5",
                 "6", "7", "8", "9" -> generacion;
            default -> "all";
        };
    }
    private String obtenerNombreGeneracion(int idPokemon) {
        if (idPokemon <= 151) {
            return "Generación I";
        }

        if (idPokemon <= 251) {
            return "Generación II";
        }

        if (idPokemon <= 386) {
            return "Generación III";
        }

        if (idPokemon <= 493) {
            return "Generación IV";
        }

        if (idPokemon <= 649) {
            return "Generación V";
        }

        if (idPokemon <= 721) {
            return "Generación VI";
        }

        if (idPokemon <= 809) {
            return "Generación VII";
        }

        if (idPokemon <= 905) {
            return "Generación VIII";
        }

        return "Generación IX";
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

    @SuppressWarnings("unchecked")
    private List<Pokemon> obtenerIntentos(HttpSession session) {
        List<Pokemon> intentos =
                (List<Pokemon>) session.getAttribute("intentos");

        if (intentos == null) {
            intentos = new ArrayList<>();
            session.setAttribute("intentos", intentos);
        }

        return intentos;
    }
}