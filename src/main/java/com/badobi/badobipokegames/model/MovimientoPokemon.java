package com.badobi.badobipokegames.model;

public class MovimientoPokemon {

    private final String nombre;
    private final String tipo;
    private final String categoria;
    private final Integer potencia;
    private final Integer precision;
    private final Integer pp;
    private final int nivel;
    private final String descripcion;

    public MovimientoPokemon(
            String nombre,
            String tipo,
            String categoria,
            Integer potencia,
            Integer precision,
            Integer pp,
            int nivel,
            String descripcion
    ) {
        this.nombre = nombre;
        this.tipo = tipo;
        this.categoria = categoria;
        this.potencia = potencia;
        this.precision = precision;
        this.pp = pp;
        this.nivel = nivel;
        this.descripcion = descripcion;
    }

    public String getNombre() {
        return nombre;
    }

    public String getTipo() {
        return tipo;
    }

    public String getCategoria() {
        return categoria;
    }

    public Integer getPotencia() {
        return potencia;
    }

    public Integer getPrecision() {
        return precision;
    }

    public Integer getPp() {
        return pp;
    }

    public int getNivel() {
        return nivel;
    }

    public String getDescripcion() {
        return descripcion;
    }
}
