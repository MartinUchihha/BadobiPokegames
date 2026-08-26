package com.badobi.badobipokegames.model;

import java.util.ArrayList;
import java.util.List;

public class PartidaSilueta {

    public static final int MAX_INTENTOS = 6;

    private final int pokemonId;
    private final String pokemonNombre;
    private final String generacion;
    private final List<String> intentos;

    private boolean terminada;
    private boolean victoria;

    public PartidaSilueta(
            int pokemonId,
            String pokemonNombre,
            String generacion
    ) {
        this.pokemonId = pokemonId;
        this.pokemonNombre = pokemonNombre;
        this.generacion = generacion;
        this.intentos = new ArrayList<>();
        this.terminada = false;
        this.victoria = false;
    }

    public boolean registrarIntento(String nombrePokemon) {
        if (terminada) {
            return false;
        }

        intentos.add(nombrePokemon);

        if (
                pokemonNombre.equalsIgnoreCase(
                        nombrePokemon.trim()
                )
        ) {
            victoria = true;
            terminada = true;
            return true;
        }

        if (intentos.size() >= MAX_INTENTOS) {
            terminada = true;
        }

        return false;
    }

    public boolean yaFueIntentado(String nombrePokemon) {
        return intentos.stream().anyMatch(
                intento ->
                        intento.equalsIgnoreCase(
                                nombrePokemon.trim()
                        )
        );
    }

    public int getPokemonId() {
        return pokemonId;
    }

    public String getPokemonNombre() {
        return pokemonNombre;
    }

    public String getGeneracion() {
        return generacion;
    }

    public List<String> getIntentos() {
        return List.copyOf(intentos);
    }

    public int getNumeroIntentos() {
        return intentos.size();
    }

    public int getIntentosRestantes() {
        return MAX_INTENTOS - intentos.size();
    }

    public boolean isTerminada() {
        return terminada;
    }

    public boolean isVictoria() {
        return victoria;
    }
}