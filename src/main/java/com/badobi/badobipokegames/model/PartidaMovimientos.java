package com.badobi.badobipokegames.model;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class PartidaMovimientos {

    public static final int MAX_INTENTOS = 6;

    private final PokemonMovimientos pokemonSecreto;
    private final String generacion;
    private final String modo;
    private final List<String> intentos;

    private boolean terminada;
    private boolean victoria;

    public PartidaMovimientos(
            PokemonMovimientos pokemonSecreto,
            String generacion,
            String modo
    ) {
        this.pokemonSecreto = pokemonSecreto;
        this.generacion = generacion;
        this.modo = modo;
        this.intentos = new ArrayList<>();
        this.terminada = false;
        this.victoria = false;
    }

    public boolean registrarIntento(
            PokemonHigherLower pokemonElegido
    ) {
        if (terminada) {
            return false;
        }

        intentos.add(
                pokemonElegido.getNombre()
        );

        if (
                pokemonElegido.getId() ==
                        pokemonSecreto.getId()
        ) {
            victoria = true;
            terminada = true;
            return true;
        }

        if (
                intentos.size() >=
                        MAX_INTENTOS
        ) {
            terminada = true;
        }

        return false;
    }

    public boolean yaFueIntentado(
            String nombrePokemon
    ) {
        return intentos.stream()
                .anyMatch(
                        nombre ->
                                nombre.equalsIgnoreCase(
                                        nombrePokemon
                                )
                );
    }

    public int getCantidadMovimientosVisibles() {
        if (!modo.equals("dificil")) {
            return pokemonSecreto
                    .getMovimientos()
                    .size();
        }

        return Math.min(
                4 + intentos.size(),
                pokemonSecreto
                        .getMovimientos()
                        .size()
        );
    }

    public List<MovimientoPokemon> getMovimientosVisibles() {
        int cantidad =
                getCantidadMovimientosVisibles();

        return pokemonSecreto
                .getMovimientos()
                .stream()
                .limit(cantidad)
                .toList();
    }

    public boolean isTipoRevelado() {
        return modo.equals("dificil")
                && intentos.size() >= 5
                && !terminada;
    }

    public PokemonMovimientos getPokemonSecreto() {
        return pokemonSecreto;
    }

    public String getGeneracion() {
        return generacion;
    }

    public String getModo() {
        return modo;
    }

    public List<String> getIntentos() {
        return Collections.unmodifiableList(
                intentos
        );
    }

    public int getNumeroIntentos() {
        return intentos.size();
    }

    public int getIntentosRestantes() {
        return Math.max(
                0,
                MAX_INTENTOS -
                        intentos.size()
        );
    }

    public boolean isTerminada() {
        return terminada;
    }

    public boolean isVictoria() {
        return victoria;
    }
}