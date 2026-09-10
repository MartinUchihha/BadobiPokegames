package com.badobi.badobipokegames.repository;
import com.badobi.badobipokegames.model.*;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface ProgresoLogroRepository extends JpaRepository<ProgresoLogro,Long>{
    Optional<ProgresoLogro> findByJugadorAndLogro(JugadorRanking jugador,String logro);
    List<ProgresoLogro> findByJugador(JugadorRanking jugador);
}
