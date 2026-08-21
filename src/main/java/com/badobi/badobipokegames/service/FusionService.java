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
                            "Porygon-Z",
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