package com.badobi.badobipokegames.model;

import java.util.List;

public class PokemonMovimientos {

    private final int id;
    private final String nombre;
    private final String imagen;
    private final List<String> tipos;
    private final List<MovimientoPokemon> movimientos;

    public PokemonMovimientos(
            int id,
            String nombre,
            String imagen,
            List<String> tipos,
            List<MovimientoPokemon> movimientos
    ) {
        this.id = id;
        this.nombre = nombre;
        this.imagen = imagen;
        this.tipos = List.copyOf(tipos);
        this.movimientos = List.copyOf(movimientos);
    }

    public int getId() {
        return id;
    }

    public String getNombre() {
        return nombre;
    }

    public String getImagen() {
        return imagen;
    }

    public List<String> getTipos() {
        return tipos;
    }

    public List<MovimientoPokemon> getMovimientos() {
        return movimientos;
    }
}