package com.badobi.badobipokegames.model;

import java.util.List;

public class PartidaParejas {

    private final String partidaId;
    private final String modo;
    private final long semilla;
    private final int totalFichas;
    private final int totalParejas;
    private final int duracionSegundos;
    private final double anchoFicha;
    private final double altoFicha;
    private final String nombreRival;
    private final String imagenRivalUrl;
    private final String nivelRival;
    private final double velocidadRival;
    private final double precisionRival;
    private final List<FichaPareja> fichas;

    public PartidaParejas(
            String partidaId,
            String modo,
            long semilla,
            int totalFichas,
            int totalParejas,
            int duracionSegundos,
            double anchoFicha,
            double altoFicha,
            String nombreRival,
            String imagenRivalUrl,
            String nivelRival,
            double velocidadRival,
            double precisionRival,
            List<FichaPareja> fichas
    ) {
        this.partidaId = partidaId;
        this.modo = modo;
        this.semilla = semilla;
        this.totalFichas = totalFichas;
        this.totalParejas = totalParejas;
        this.duracionSegundos = duracionSegundos;
        this.anchoFicha = anchoFicha;
        this.altoFicha = altoFicha;
        this.nombreRival = nombreRival;
        this.imagenRivalUrl = imagenRivalUrl;
        this.nivelRival = nivelRival;
        this.velocidadRival = velocidadRival;
        this.precisionRival = precisionRival;
        this.fichas = List.copyOf(fichas);
    }

    public String getPartidaId() {
        return partidaId;
    }

    public String getModo() {
        return modo;
    }

    public long getSemilla() {
        return semilla;
    }

    public int getTotalFichas() {
        return totalFichas;
    }

    public int getTotalParejas() {
        return totalParejas;
    }

    public int getDuracionSegundos() {
        return duracionSegundos;
    }

    public double getAnchoFicha() {
        return anchoFicha;
    }

    public double getAltoFicha() {
        return altoFicha;
    }

    public String getNombreRival() {
        return nombreRival;
    }

    public String getImagenRivalUrl() {
        return imagenRivalUrl;
    }

    public String getNivelRival() {
        return nivelRival;
    }

    public double getVelocidadRival() {
        return velocidadRival;
    }

    public double getPrecisionRival() {
        return precisionRival;
    }

    public List<FichaPareja> getFichas() {
        return fichas;
    }
}
