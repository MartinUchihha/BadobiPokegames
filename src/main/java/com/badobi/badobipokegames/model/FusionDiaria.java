package com.badobi.badobipokegames.model;

import java.time.LocalDate;
import java.util.List;

public class FusionDiaria {

    private final LocalDate fecha;
    private final String imagen;
    private final List<String> pokemon;

    public FusionDiaria(
            LocalDate fecha,
            String imagen,
            List<String> pokemon
    ) {
        this.fecha = fecha;
        this.imagen = imagen;
        this.pokemon = pokemon;
    }

    public LocalDate getFecha() {
        return fecha;
    }

    public String getImagen() {
        return imagen;
    }

    public List<String> getPokemon() {
        return pokemon;
    }
}