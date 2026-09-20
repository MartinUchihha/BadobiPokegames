package com.badobi.badobipokegames.model;

public class FichaPareja {

    private final int id;
    private final int pokemonId;
    private final String nombre;
    private final String imagenUrl;
    private final double posicionX;
    private final double posicionY;
    private final int capa;

    public FichaPareja(
            int id,
            int pokemonId,
            String nombre,
            String imagenUrl,
            double posicionX,
            double posicionY,
            int capa
    ) {
        this.id = id;
        this.pokemonId = pokemonId;
        this.nombre = nombre;
        this.imagenUrl = imagenUrl;
        this.posicionX = posicionX;
        this.posicionY = posicionY;
        this.capa = capa;
    }

    public int getId() {
        return id;
    }

    public int getPokemonId() {
        return pokemonId;
    }

    public String getNombre() {
        return nombre;
    }

    public String getImagenUrl() {
        return imagenUrl;
    }

    public double getPosicionX() {
        return posicionX;
    }

    public double getPosicionY() {
        return posicionY;
    }

    public int getCapa() {
        return capa;
    }
}
