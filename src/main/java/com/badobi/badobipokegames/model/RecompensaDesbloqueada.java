package com.badobi.badobipokegames.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name="logros_recompensas", uniqueConstraints=@UniqueConstraint(columnNames={"jugador_id","recompensa"}))
public class RecompensaDesbloqueada {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="jugador_id", nullable=false)
    private JugadorRanking jugador;
    @Column(nullable=false, length=50)
    private String recompensa;
    @Column(nullable=false)
    private Instant desbloqueadaEn;
    protected RecompensaDesbloqueada() {}
    public RecompensaDesbloqueada(JugadorRanking jugador,String recompensa){this.jugador=jugador;this.recompensa=recompensa;this.desbloqueadaEn=Instant.now();}
    public String getRecompensa(){return recompensa;}
}
