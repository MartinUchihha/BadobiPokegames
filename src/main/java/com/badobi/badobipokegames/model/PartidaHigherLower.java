package com.badobi.badobipokegames.model;

public class PartidaHigherLower {

    private PokemonHigherLower pokemonIzquierdo;
    private PokemonHigherLower pokemonDerecho;
    private String estadistica;
    private int puntuacion;
    private boolean activa;

    public PartidaHigherLower(
            PokemonHigherLower pokemonIzquierdo,
            PokemonHigherLower pokemonDerecho,
            String estadistica
    ) {
        this.pokemonIzquierdo = pokemonIzquierdo;
        this.pokemonDerecho = pokemonDerecho;
        this.estadistica = estadistica;
        this.puntuacion = 0;
        this.activa = true;
    }

    public void registrarAcierto() {
        puntuacion++;
    }

    public void prepararSiguienteComparacion(
            PokemonHigherLower nuevoPokemon,
            String nuevaEstadistica
    ) {
        pokemonIzquierdo = pokemonDerecho;
        pokemonDerecho = nuevoPokemon;
        estadistica = nuevaEstadistica;
    }

    public void finalizar() {
        activa = false;
    }

    public boolean debeCambiarEstadistica() {
        return puntuacion > 0 && puntuacion % 5 == 0;
    }

    public PokemonHigherLower getPokemonIzquierdo() {
        return pokemonIzquierdo;
    }

    public PokemonHigherLower getPokemonDerecho() {
        return pokemonDerecho;
    }

    public String getEstadistica() {
        return estadistica;
    }

    public int getPuntuacion() {
        return puntuacion;
    }

    public boolean isActiva() {
        return activa;
    }
}