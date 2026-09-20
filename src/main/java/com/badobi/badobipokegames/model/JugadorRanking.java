package com.badobi.badobipokegames.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "ranking_jugadores")
public class JugadorRanking {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 36)
    private String token;

    @Column(nullable = false, length = 20)
    private String nombre;

    @Column(nullable = false, unique = true, length = 30)
    private String nombreNormalizado;

    @Column(nullable = false, length = 50)
    private String avatar;

    @Column(nullable = false)
    private Instant creadoEn;

    @Column(nullable = false, columnDefinition = "integer default 0")
    private int medallas;

    protected JugadorRanking() {}

    public JugadorRanking(String token, String nombre, String nombreNormalizado, String avatar) {
        this.token = token;
        this.nombre = nombre;
        this.nombreNormalizado = nombreNormalizado;
        this.avatar = avatar;
        this.creadoEn = Instant.now();
    }

    public Long getId() { return id; }
    public String getToken() { return token; }
    public String getNombre() { return nombre; }
    public String getNombreNormalizado() { return nombreNormalizado; }
    public String getAvatar() { return avatar; }
    public Instant getCreadoEn() { return creadoEn; }
    public int getMedallas() { return medallas; }
    public void cambiarAvatar(String avatar) {
        if (avatar == null || avatar.isBlank() || avatar.length() > 50) {
            throw new IllegalArgumentException("Avatar no válido");
        }
        this.avatar = avatar;
    }
    public void sumarMedallas(int cantidad) { medallas += Math.max(0, cantidad); }
    public void gastarMedallas(int cantidad) {
        if (cantidad < 0 || medallas < cantidad) throw new IllegalArgumentException("No tienes suficientes medallas");
        medallas -= cantidad;
    }
}
