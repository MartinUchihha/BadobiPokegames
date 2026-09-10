package com.badobi.badobipokegames.repository;

import com.badobi.badobipokegames.model.JugadorRanking;
import com.badobi.badobipokegames.model.RecordRanking;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RecordRankingRepository extends JpaRepository<RecordRanking, Long> {
    Optional<RecordRanking> findByJugadorAndJuegoAndTemporada(
            JugadorRanking jugador,
            String juego,
            String temporada
    );

    List<RecordRanking> findByTemporada(String temporada);
    List<RecordRanking> findByTemporadaAndJuegoOrderByPuntuacionDescActualizadoEnAsc(
            String temporada,
            String juego
    );
}
