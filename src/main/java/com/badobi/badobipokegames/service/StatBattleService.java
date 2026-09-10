package com.badobi.badobipokegames.service;

import com.badobi.badobipokegames.model.PartidaStatBattle;
import com.badobi.badobipokegames.model.PokemonHigherLower;
import org.springframework.stereotype.Service;

import java.util.concurrent.ThreadLocalRandom;

@Service
public class StatBattleService {
    private final EstadisticasService estadisticasService;

    public StatBattleService(EstadisticasService estadisticasService) {
        this.estadisticasService = estadisticasService;
    }

    public PartidaStatBattle crearPartida(String generacion) {
        PartidaStatBattle partida = new PartidaStatBattle(generacion);
        prepararRonda(partida);
        return partida;
    }

    public void prepararRonda(PartidaStatBattle partida) {
        if (partida.isTerminada()) return;
        PokemonHigherLower jugador = obtenerNoUsado(partida);
        PokemonHigherLower rival = obtenerNoUsado(partida, jugador.getId());
        partida.prepararRonda(jugador, rival);
    }

    private PokemonHigherLower obtenerNoUsado(PartidaStatBattle partida, int... excluidos) {
        int[] rango = obtenerRango(partida.getGeneracion());
        for (int intento = 0; intento < 100; intento++) {
            int id = ThreadLocalRandom.current().nextInt(rango[0], rango[1] + 1);
            boolean excluido = partida.fueUsado(id);
            for (int otro : excluidos) excluido |= id == otro;
            if (!excluido) return estadisticasService.obtenerPokemon(String.valueOf(id));
        }
        throw new IllegalStateException("No se pudo preparar una ronda nueva");
    }

    private int[] obtenerRango(String generacion) {
        return switch (generacion) {
            case "1" -> new int[]{1, 151};
            case "2" -> new int[]{152, 251};
            case "3" -> new int[]{252, 386};
            case "4" -> new int[]{387, 493};
            case "5" -> new int[]{494, 649};
            case "6" -> new int[]{650, 721};
            case "7" -> new int[]{722, 809};
            case "8" -> new int[]{810, 905};
            case "9" -> new int[]{906, 1025};
            default -> new int[]{1, 1025};
        };
    }
}
