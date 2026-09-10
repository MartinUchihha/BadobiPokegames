package com.badobi.badobipokegames.repository;
import com.badobi.badobipokegames.model.*;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface RecompensaDesbloqueadaRepository extends JpaRepository<RecompensaDesbloqueada,Long>{
    boolean existsByJugadorAndRecompensa(JugadorRanking jugador,String recompensa);
    List<RecompensaDesbloqueada> findByJugador(JugadorRanking jugador);
}
