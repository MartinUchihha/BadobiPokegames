package com.badobi.badobipokegames.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name="logros_progreso", uniqueConstraints=@UniqueConstraint(columnNames={"jugador_id","logro"}))
public class ProgresoLogro {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="jugador_id", nullable=false)
    private JugadorRanking jugador;
    @Column(nullable=false, length=50)
    private String logro;
    @Column(nullable=false)
    private int progreso;
    @Column(nullable=false)
    private boolean completado;
    private Instant completadoEn;

    protected ProgresoLogro() {}
    public ProgresoLogro(JugadorRanking jugador, String logro) { this.jugador=jugador; this.logro=logro; }
    public boolean actualizar(int valor, int objetivo) {
        progreso=Math.max(progreso, Math.min(valor, objetivo));
        if (!completado && progreso>=objetivo) { completado=true; completadoEn=Instant.now(); return true; }
        return false;
    }
    public String getLogro(){return logro;} public int getProgreso(){return progreso;} public boolean isCompletado(){return completado;}
}
