package com.badobi.badobipokegames.repository;

import com.badobi.badobipokegames.model.JugadorRanking;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface JugadorRankingRepository extends JpaRepository<JugadorRanking, Long> {
    Optional<JugadorRanking> findByToken(String token);
    boolean existsByNombreNormalizado(String nombreNormalizado);
}
