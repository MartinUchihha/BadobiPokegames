package com.badobi.badobipokegames.model;

public class PokemonHigherLower {

    private final int id;
    private final String nombre;
    private final String imagen;
    private final int ps;
    private final int ataque;
    private final int defensa;
    private final int ataqueEspecial;
    private final int defensaEspecial;
    private final int velocidad;

    public PokemonHigherLower(
            int id,
            String nombre,
            String imagen,
            int ps,
            int ataque,
            int defensa,
            int ataqueEspecial,
            int defensaEspecial,
            int velocidad
    ) {
        this.id = id;
        this.nombre = nombre;
        this.imagen = imagen;
        this.ps = ps;
        this.ataque = ataque;
        this.defensa = defensa;
        this.ataqueEspecial = ataqueEspecial;
        this.defensaEspecial = defensaEspecial;
        this.velocidad = velocidad;
    }

    public int obtenerEstadistica(String estadistica) {
        return switch (estadistica) {
            case "ps" -> ps;
            case "ataque" -> ataque;
            case "defensa" -> defensa;
            case "ataque-especial" -> ataqueEspecial;
            case "defensa-especial" -> defensaEspecial;
            case "velocidad" -> velocidad;
            case "total" -> obtenerTotal();
            default -> 0;
        };
    }

    public int obtenerTotal() {
        return ps
                + ataque
                + defensa
                + ataqueEspecial
                + defensaEspecial
                + velocidad;
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

    public int getPs() {
        return ps;
    }

    public int getAtaque() {
        return ataque;
    }

    public int getDefensa() {
        return defensa;
    }

    public int getAtaqueEspecial() {
        return ataqueEspecial;
    }

    public int getDefensaEspecial() {
        return defensaEspecial;
    }

    public int getVelocidad() {
        return velocidad;
    }

    public int getTotal() {
        return obtenerTotal();
    }
}