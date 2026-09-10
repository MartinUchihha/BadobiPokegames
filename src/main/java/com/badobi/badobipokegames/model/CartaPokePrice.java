package com.badobi.badobipokegames.model;

import java.math.BigDecimal;

public class CartaPokePrice {
    private final String id;
    private final String varianteId;
    private final String nombre;
    private final String imagen;
    private final String coleccion;
    private final String numero;
    private final String rareza;
    private final String acabado;
    private final BigDecimal precio;
    private final String enlace;
    private final String fechaPrecio;

    public CartaPokePrice(
            String id,
            String varianteId,
            String nombre,
            String imagen,
            String coleccion,
            String numero,
            String rareza,
            String acabado,
            BigDecimal precio,
            String enlace,
            String fechaPrecio
    ) {
        this.id = id;
        this.varianteId = varianteId;
        this.nombre = nombre;
        this.imagen = imagen;
        this.coleccion = coleccion;
        this.numero = numero;
        this.rareza = rareza;
        this.acabado = acabado;
        this.precio = precio;
        this.enlace = enlace;
        this.fechaPrecio = fechaPrecio;
    }

    public String getId() { return id; }
    public String getVarianteId() { return varianteId; }
    public String getNombre() { return nombre; }
    public String getImagen() { return imagen; }
    public String getColeccion() { return coleccion; }
    public String getNumero() { return numero; }
    public String getRareza() { return rareza; }
    public String getAcabado() { return acabado; }
    public BigDecimal getPrecio() { return precio; }
    public String getEnlace() { return enlace; }
    public String getFechaPrecio() { return fechaPrecio; }
}
