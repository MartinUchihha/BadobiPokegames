package com.badobi.badobipokegames.model;

import java.util.ArrayList;
import java.util.List;

public class RondaSiluetaTiempo {

    public static final long DURACION_MILISEGUNDOS =
            60_000;

    public static final long PENALIZACION_SALTO =
            5_000;

    private final String generacion;
    private final List<String> intentosActuales;

    private int pokemonId;
    private String pokemonNombre;

    private int puntos;
    private int rachaActual;
    private int mejorRacha;

    private long tiempoRestante;
    private long inicioDelTramo;

    private boolean relojActivo;
    private boolean terminada;

    public RondaSiluetaTiempo(String generacion) {
        this.generacion = generacion;
        this.intentosActuales = new ArrayList<>();
        this.puntos = 0;
        this.rachaActual = 0;
        this.mejorRacha = 0;
        this.tiempoRestante =
                DURACION_MILISEGUNDOS;
        this.relojActivo = false;
        this.terminada = false;
    }

    public synchronized void establecerPokemon(
            int pokemonId,
            String pokemonNombre
    ) {
        this.pokemonId = pokemonId;
        this.pokemonNombre = pokemonNombre;
        this.intentosActuales.clear();
    }

    public synchronized void iniciarReloj() {
        actualizarTiempo();

        if (!terminada && !relojActivo) {
            inicioDelTramo =
                    System.currentTimeMillis();

            relojActivo = true;
        }
    }

    public synchronized void pausarReloj() {
        actualizarTiempo();
        relojActivo = false;
    }

    public synchronized boolean registrarIntento(
            String nombrePokemon
    ) {
        actualizarTiempo();

        if (terminada) {
            return false;
        }

        intentosActuales.add(nombrePokemon);

        boolean correcto =
                pokemonNombre.equalsIgnoreCase(
                        nombrePokemon.trim()
                );

        if (correcto) {
            puntos++;
            rachaActual++;
            mejorRacha = Math.max(
                    mejorRacha,
                    rachaActual
            );
        } else {
            rachaActual = 0;
        }

        return correcto;
    }

    public synchronized boolean yaFueIntentado(
            String nombrePokemon
    ) {
        return intentosActuales.stream().anyMatch(
                intento ->
                        intento.equalsIgnoreCase(
                                nombrePokemon.trim()
                        )
        );
    }

    public synchronized void saltarPokemon() {
        actualizarTiempo();

        if (terminada) {
            return;
        }

        tiempoRestante = Math.max(
                0,
                tiempoRestante - PENALIZACION_SALTO
        );

        rachaActual = 0;

        if (tiempoRestante == 0) {
            terminada = true;
            relojActivo = false;
        }
    }

    public synchronized void finalizar() {
        actualizarTiempo();
        terminada = true;
        relojActivo = false;
    }

    public synchronized long getTiempoRestante() {
        actualizarTiempo();
        return tiempoRestante;
    }

    private void actualizarTiempo() {
        if (!relojActivo || terminada) {
            return;
        }

        long ahora = System.currentTimeMillis();
        long transcurrido = ahora - inicioDelTramo;

        tiempoRestante = Math.max(
                0,
                tiempoRestante - transcurrido
        );

        inicioDelTramo = ahora;

        if (tiempoRestante == 0) {
            terminada = true;
            relojActivo = false;
        }
    }

    public String getGeneracion() {
        return generacion;
    }

    public int getPokemonId() {
        return pokemonId;
    }

    public String getPokemonNombre() {
        return pokemonNombre;
    }

    public List<String> getIntentosActuales() {
        return List.copyOf(intentosActuales);
    }

    public int getPuntos() {
        return puntos;
    }

    public int getRachaActual() {
        return rachaActual;
    }

    public int getMejorRacha() {
        return mejorRacha;
    }

    public boolean isRelojActivo() {
        return relojActivo;
    }

    public boolean isTerminada() {
        actualizarTiempo();
        return terminada;
    }
}