package com.badobi.badobipokegames.model;

import java.util.HashSet;
import java.util.Set;

public class PartidaStatBattle {
    public static final int VICTORIAS_NECESARIAS = 4;

    private final String generacion;
    private final Set<Integer> pokemonUsados = new HashSet<>();
    private int puntosJugador;
    private int puntosRival;
    private PokemonHigherLower pokemonJugador;
    private PokemonHigherLower pokemonRival;
    private boolean rondaRespondida;
    private boolean terminada;

    public PartidaStatBattle(String generacion) {
        this.generacion = generacion;
    }

    public void prepararRonda(PokemonHigherLower jugador, PokemonHigherLower rival) {
        pokemonJugador = jugador;
        pokemonRival = rival;
        pokemonUsados.add(jugador.getId());
        pokemonUsados.add(rival.getId());
        rondaRespondida = false;
    }

    public int comparar(String estadistica) {
        if (rondaRespondida || terminada) {
            throw new IllegalStateException("La ronda ya fue respondida");
        }
        int valorJugador = pokemonJugador.obtenerEstadistica(estadistica);
        int valorRival = pokemonRival.obtenerEstadistica(estadistica);
        int resultado = Integer.compare(valorJugador, valorRival);
        if (resultado > 0) puntosJugador++;
        if (resultado < 0) puntosRival++;
        rondaRespondida = true;
        terminada = puntosJugador >= VICTORIAS_NECESARIAS
                || puntosRival >= VICTORIAS_NECESARIAS;
        return resultado;
    }

    public int getNumeroRonda() { return puntosJugador + puntosRival + 1; }
    public boolean fueUsado(int id) { return pokemonUsados.contains(id); }
    public String getGeneracion() { return generacion; }
    public int getPuntosJugador() { return puntosJugador; }
    public int getPuntosRival() { return puntosRival; }
    public PokemonHigherLower getPokemonJugador() { return pokemonJugador; }
    public PokemonHigherLower getPokemonRival() { return pokemonRival; }
    public boolean isRondaRespondida() { return rondaRespondida; }
    public boolean isTerminada() { return terminada; }
    public boolean isVictoria() { return terminada && puntosJugador > puntosRival; }
}
