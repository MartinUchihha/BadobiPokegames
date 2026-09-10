package com.badobi.badobipokegames.model;

import java.util.HashSet;
import java.util.Set;

public class PartidaPokePrice {
    private final Set<String> variantesUsadas = new HashSet<>();
    private final String modo;
    private CartaPokePrice cartaIzquierda;
    private CartaPokePrice cartaDerecha;
    private int puntuacion;
    private boolean activa = true;

    public PartidaPokePrice(String modo, CartaPokePrice izquierda, CartaPokePrice derecha) {
        this.modo = modo;
        this.cartaIzquierda = izquierda;
        this.cartaDerecha = derecha;
        registrar(izquierda);
        registrar(derecha);
    }

    public boolean comprobar(String respuesta) {
        int comparacion = cartaDerecha.getPrecio().compareTo(cartaIzquierda.getPrecio());
        return ("mayor".equals(respuesta) && comparacion > 0)
                || ("menor".equals(respuesta) && comparacion < 0);
    }

    public void avanzar(CartaPokePrice siguiente) {
        puntuacion++;
        cartaIzquierda = cartaDerecha;
        cartaDerecha = siguiente;
        registrar(siguiente);
    }

    public void finalizar() { activa = false; }

    private void registrar(CartaPokePrice carta) {
        variantesUsadas.add(carta.getVarianteId());
    }

    public boolean fueUsada(String varianteId) { return variantesUsadas.contains(varianteId); }
    public String getModo() { return modo; }
    public CartaPokePrice getCartaIzquierda() { return cartaIzquierda; }
    public CartaPokePrice getCartaDerecha() { return cartaDerecha; }
    public int getPuntuacion() { return puntuacion; }
    public boolean isActiva() { return activa; }
}
