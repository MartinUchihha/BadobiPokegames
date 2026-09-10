package com.badobi.badobipokegames.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.Instant;

@Entity
@Table(
        name = "ranking_records",
        uniqueConstraints = @UniqueConstraint(
                columnNames = {"jugador_id", "juego", "temporada"}
        )
)
public class RecordRanking {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "jugador_id", nullable = false)
    private JugadorRanking jugador;

    @Column(nullable = false, length = 30)
    private String juego;

    @Column(nullable = false, length = 15)
    private String temporada;

    @Column(nullable = false)
    private int puntuacion;

    @Column(nullable = false)
    private int experiencia;

    @Column(nullable = false)
    private Instant actualizadoEn;

    protected RecordRanking() {}

    public RecordRanking(
            JugadorRanking jugador,
            String juego,
            String temporada,
            int puntuacion,
            int experiencia
    ) {
        this.jugador = jugador;
        this.juego = juego;
        this.temporada = temporada;
        actualizar(puntuacion, experiencia);
    }

    public void actualizar(int puntuacion, int experiencia) {
        this.puntuacion = puntuacion;
        this.experiencia = experiencia;
        this.actualizadoEn = Instant.now();
    }

    public Long getId() { return id; }
    public JugadorRanking getJugador() { return jugador; }
    public String getJuego() { return juego; }
    public String getTemporada() { return temporada; }
    public int getPuntuacion() { return puntuacion; }
    public int getExperiencia() { return experiencia; }
    public Instant getActualizadoEn() { return actualizadoEn; }
}
