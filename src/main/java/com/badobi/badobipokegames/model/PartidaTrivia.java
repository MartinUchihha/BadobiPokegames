package com.badobi.badobipokegames.model;

import java.util.HashSet;
import java.util.Set;

public class PartidaTrivia {

    public static final int TOTAL_PREGUNTAS = 10;

    private final String generacion;
    private final Set<String> preguntasUtilizadas;

    private PreguntaTrivia preguntaActual;
    private int preguntasRespondidas;
    private int puntuacion;
    private int racha;
    private int mejorRacha;
    private boolean activa;
    private boolean ayudaCincuentaUsada;
    private boolean ayudaCambioUsada;

    public PartidaTrivia(String generacion) {
        this.generacion = generacion;
        this.preguntasUtilizadas = new HashSet<>();
        this.preguntasRespondidas = 0;
        this.puntuacion = 0;
        this.racha = 0;
        this.mejorRacha = 0;
        this.activa = true;
        this.ayudaCincuentaUsada = false;
        this.ayudaCambioUsada = false;
    }

    public void establecerPregunta(
            PreguntaTrivia pregunta
    ) {
        this.preguntaActual = pregunta;
        this.preguntasUtilizadas.add(
                pregunta.getId()
        );
    }

    public boolean preguntaFueUtilizada(String preguntaId) {
        return preguntasUtilizadas.contains(preguntaId);
    }

    public int registrarRespuesta(boolean correcta) {
        int puntosGanados = 0;
        preguntasRespondidas++;

        if (correcta) {
            racha++;
            puntosGanados = 100;

            if (racha % 3 == 0) {
                puntosGanados += 50;
            }

            puntuacion += puntosGanados;
            mejorRacha = Math.max(mejorRacha, racha);
        } else {
            racha = 0;
        }

        if (preguntasRespondidas >= TOTAL_PREGUNTAS) {
            activa = false;
        }

        return puntosGanados;
    }

    public int getNumeroPreguntaActual() {
        return preguntasRespondidas + 1;
    }

    public String getGeneracion() {
        return generacion;
    }

    public PreguntaTrivia getPreguntaActual() {
        return preguntaActual;
    }

    public int getPreguntasRespondidas() {
        return preguntasRespondidas;
    }

    public int getPuntuacion() {
        return puntuacion;
    }

    public int getRacha() {
        return racha;
    }

    public int getMejorRacha() {
        return mejorRacha;
    }

    public boolean isActiva() {
        return activa;
    }
    public boolean usarAyudaCincuenta() {
        if (ayudaCincuentaUsada || !activa) {
            return false;
        }

        ayudaCincuentaUsada = true;
        return true;
    }

    public boolean usarAyudaCambio() {
        if (ayudaCambioUsada || !activa) {
            return false;
        }

        ayudaCambioUsada = true;
        return true;
    }

    public boolean isAyudaCincuentaUsada() {
        return ayudaCincuentaUsada;
    }

    public boolean isAyudaCambioUsada() {
        return ayudaCambioUsada;
    }
}