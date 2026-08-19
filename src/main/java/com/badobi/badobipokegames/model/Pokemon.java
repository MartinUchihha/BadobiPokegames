package com.badobi.badobipokegames.model;

public class Pokemon {

    private final int id;
    private final String nombre;
    private final String imagen;
    private final String tipo1;
    private final String tipo2;
    private final String habitat;
    private final String color;
    private final int faseEvolucion;

    public Pokemon(
            int id,
            String nombre,
            String imagen,
            String tipo1,
            String tipo2,
            String habitat,
            String color,
            int faseEvolucion
    ) {
        this.id = id;
        this.nombre = nombre;
        this.imagen = imagen;
        this.tipo1 = tipo1;
        this.tipo2 = tipo2;
        this.habitat = habitat;
        this.color = color;
        this.faseEvolucion = faseEvolucion;
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

    public String getTipo1() {
        return tipo1;
    }

    public String getTipo2() {
        return tipo2;
    }

    public String getHabitat() {
        return habitat;
    }

    public String getColor() {
        return color;
    }

    public int getFaseEvolucion() {
        return faseEvolucion;
    }
}