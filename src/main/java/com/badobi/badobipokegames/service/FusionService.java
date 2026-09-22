package com.badobi.badobipokegames.service;

import com.badobi.badobipokegames.model.FusionDiaria;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

@Service
public class FusionService {

    private static final ZoneId ZONA_CHILE =
            ZoneId.of("America/Santiago");

    private final List<FusionDiaria> fusiones = List.of(

            new FusionDiaria(
                    LocalDate.of(2026, 8, 20),
                    "fusions/fusion-001.png",
                    List.of(
                            "Magikarp",
                            "Charmander",
                            "Mudkip",
                            "Pikachu"
                    )
            ),

            new FusionDiaria(
                    LocalDate.of(2026, 8, 21),
                    "fusions/fusion-002.png",
                    List.of(
                            "Snorlax",
                            "Gengar",
                            "Leafeon",
                            "Slowbro"
                    )
            ),

            new FusionDiaria(
                    LocalDate.of(2026, 8, 22),
                    "fusions/fusion-003.png",
                    List.of(
                            "Lapras",
                            "Sableye",
                            "Haxorus",
                            "Altaria"
                    )
            ),

            new FusionDiaria(
                    LocalDate.of(2026, 8, 23),
                    "fusions/fusion-004.png",
                    List.of(
                            "Porygon",
                            "Espurr",
                            "Noivern",
                            "Girafarig"
                    )
            ),

            new FusionDiaria(
                    LocalDate.of(2026, 8, 24),
                    "fusions/fusion-005.png",
                    List.of(
                            "Whiscash",
                            "Sableye",
                            "Scizor",
                            "Parasect"
                    )
            ),

            new FusionDiaria(
                    LocalDate.of(2026, 8, 25),
                    "fusions/fusion-006.png",
                    List.of(
                            "Appletun",
                            "Mimikyu",
                            "Lurantis",
                            "Vileplume"
                    )
            ),

            new FusionDiaria(
                    LocalDate.of(2026, 8, 26),
                    "fusions/fusion-007.png",
                    List.of(
                            "Cetoddle",
                            "Spiritomb",
                            "Sigilyph",
                            "Grafaiai"
                    )
            ),
            new FusionDiaria(
                    LocalDate.of(2026, 8, 27),
                    "fusions/fusion-008.png",
                    List.of(
                            "Torterra",
                            "Arcanine",
                            "Flygon",
                            "Toxicroak"
                    )
            ),

            new FusionDiaria(
                    LocalDate.of(2026, 8, 28),
                    "fusions/fusion-009.png",
                    List.of(
                            "Wailord",
                            "Krookodile",
                            "Chandelure",
                            "Tsareena"
                    )
            ),

            new FusionDiaria(
                    LocalDate.of(2026, 8, 29),
                    "fusions/fusion-010.png",
                    List.of(
                            "Reuniclus",
                            "Dusknoir",
                            "Clawitzer",
                            "Jumpluff"
                    )
            ),

            new FusionDiaria(
                    LocalDate.of(2026, 8, 30),
                    "fusions/fusion-011.png",
                    List.of(
                            "Falinks",
                            "Malamar",
                            "Skarmory",
                            "Bellossom"
                    )
            ),

            new FusionDiaria(
                    LocalDate.of(2026, 8, 31),
                    "fusions/fusion-012.png",
                    List.of(
                            "Orthworm",
                            "Banette",
                            "Masquerain",
                            "Cacturne"
                    )
            ),

            new FusionDiaria(
                    LocalDate.of(2026, 9, 1),
                    "fusions/fusion-013.png",
                    List.of(
                            "Araquanid",
                            "Runerigus",
                            "Bruxish",
                            "Pawniard"
                    )
            ),

            new FusionDiaria(
                    LocalDate.of(2026, 9, 2),
                    "fusions/fusion-014.png",
                    List.of(
                            "Dragalge",
                            "Cofagrigus",
                            "Frosmoth",
                            "Ambipom"
                    )
            ),

            new FusionDiaria(
                    LocalDate.of(2026, 9, 21),
                    "fusions/fusion-002.png",
                    List.of(
                            "Snorlax",
                            "Gengar",
                            "Leafeon",
                            "Slowbro"
                    )
            ),

            new FusionDiaria(
                    LocalDate.of(2026, 9, 22),
                    "fusions/fusion-009.png",
                    List.of(
                            "Wailord",
                            "Krookodile",
                            "Chandelure",
                            "Tsareena"
                    )
            ),

            new FusionDiaria(
                    LocalDate.of(2026, 9, 23),
                    "fusions/fusion-010.png",
                    List.of(
                            "Reuniclus",
                            "Dusknoir",
                            "Clawitzer",
                            "Jumpluff"
                    )
            ),

            new FusionDiaria(
                    LocalDate.of(2026, 9, 24),
                    "fusions/fusion-012.png",
                    List.of(
                            "Orthworm",
                            "Banette",
                            "Masquerain",
                            "Cacturne"
                    )
            ),

            new FusionDiaria(
                    LocalDate.of(2026, 9, 25),
                    "fusions/fusion-013.png",
                    List.of(
                            "Araquanid",
                            "Runerigus",
                            "Bruxish",
                            "Pawniard"
                    )
            )
    );

    public FusionDiaria obtenerFusionDeHoy() {
        LocalDate fechaActual =
                LocalDate.now(ZONA_CHILE);

        return fusiones.stream()
                .filter(fusion ->
                        fusion.getFecha().equals(fechaActual)
                )
                .findFirst()
                .orElse(fusiones.getLast());
    }

    public int comprobarPokemon(String nombrePokemon) {
        if (
                nombrePokemon == null ||
                        nombrePokemon.isBlank()
        ) {
            return -1;
        }

        List<String> respuestas =
                obtenerFusionDeHoy().getPokemon();

        for (
                int posicion = 0;
                posicion < respuestas.size();
                posicion++
        ) {
            String respuestaCorrecta =
                    respuestas.get(posicion);

            if (
                    respuestaCorrecta.equalsIgnoreCase(
                            nombrePokemon.trim()
                    )
            ) {
                return posicion;
            }
        }

        return -1;
    }
}
