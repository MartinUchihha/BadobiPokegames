package com.badobi.badobipokegames.model;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class PartidaEstadisticas {

    public static final int MAX_INTENTOS = 6;

    private final PokemonHigherLower pokemonSecreto;
    private final String generacion;
    private final List<String> intentos;

    private PokemonHigherLower pokemonAcertado;
    private boolean terminada;
    private boolean victoria;

    public PartidaEstadisticas(
            PokemonHigherLower pokemonSecreto,
            String generacion
    ) {
        this.pokemonSecreto = pokemonSecreto;
        this.generacion = generacion;
        this.intentos = new ArrayList<>();
        this.pokemonAcertado = null;
        this.terminada = false;
        this.victoria = false;
    }

    public boolean registrarIntento(
            PokemonHigherLower pokemonElegido
    ) {
        if (terminada) {
            return false;
        }

        intentos.add(pokemonElegido.getNombre());

        if (
                pokemonElegido.getId() == pokemonSecreto.getId()
                        || tienenLasMismasEstadisticas(
                        pokemonElegido,
                        pokemonSecreto
                )
        ) {
            pokemonAcertado = pokemonElegido;
            victoria = true;
            terminada = true;
            return true;
        }

        if (intentos.size() >= MAX_INTENTOS) {
            terminada = true;
        }

        return false;
    }

    private boolean tienenLasMismasEstadisticas(
            PokemonHigherLower primero,
            PokemonHigherLower segundo
    ) {
        return primero.getPs() == segundo.getPs()
                && primero.getAtaque() == segundo.getAtaque()
                && primero.getDefensa() == segundo.getDefensa()
                && primero.getAtaqueEspecial()
                == segundo.getAtaqueEspecial()
                && primero.getDefensaEspecial()
                == segundo.getDefensaEspecial()
                && primero.getVelocidad()
                == segundo.getVelocidad();
    }

    public boolean yaFueIntentado(String nombrePokemon) {
        return intentos.stream().anyMatch(
                intento ->
                        intento.equalsIgnoreCase(nombrePokemon)
        );
    }

    public PokemonHigherLower getPokemonSecreto() {
        return pokemonSecreto;
    }

    public PokemonHigherLower getPokemonResultado() {
        return pokemonAcertado != null
                ? pokemonAcertado
                : pokemonSecreto;
    }

    public String getGeneracion() {
        return generacion;
    }

    public List<String> getIntentos() {
        return Collections.unmodifiableList(intentos);
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