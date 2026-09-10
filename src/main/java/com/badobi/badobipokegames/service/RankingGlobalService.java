package com.badobi.badobipokegames.service;

import com.badobi.badobipokegames.model.JugadorRanking;
import com.badobi.badobipokegames.model.RecordRanking;
import com.badobi.badobipokegames.repository.JugadorRankingRepository;
import com.badobi.badobipokegames.repository.RecordRankingRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.time.LocalDate;
import java.time.Month;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
public class RankingGlobalService {
    public static final String COOKIE = "badobi-player";
    private static final ZoneId ZONA = ZoneId.of("America/Santiago");
    private static final String[] AVATARES = {"⚡", "🔥", "💧", "🌿", "🌙", "⭐", "💎", "🐉"};
    private final JugadorRankingRepository jugadores;
    private final RecordRankingRepository records;

    public RankingGlobalService(
            JugadorRankingRepository jugadores,
            RecordRankingRepository records
    ) {
        this.jugadores = jugadores;
        this.records = records;
    }

    @Transactional
    public synchronized JugadorRanking crearJugador(String nombre) {
        String limpio = limpiarNombre(nombre);
        String normalizado = normalizar(limpio);
        if (jugadores.existsByNombreNormalizado(normalizado)) {
            throw new IllegalArgumentException("Ese nombre de entrenador ya está ocupado");
        }
        String token = UUID.randomUUID().toString();
        String avatar = AVATARES[Math.floorMod(normalizado.hashCode(), AVATARES.length)];
        return jugadores.save(new JugadorRanking(token, limpio, normalizado, avatar));
    }

    public JugadorRanking buscarJugador(String token) {
        if (token == null || token.isBlank()) return null;
        return jugadores.findByToken(token).orElse(null);
    }

    @Transactional
    public void registrarMejor(String token, String juego, int puntuacion) {
        JugadorRanking jugador = buscarJugador(token);
        if (jugador == null || puntuacion < 0 || puntuacion > 100_000) return;

        String temporada = claveTemporada();
        int experiencia = calcularExperiencia(juego, puntuacion);
        RecordRanking record = records
                .findByJugadorAndJuegoAndTemporada(jugador, juego, temporada)
                .orElse(null);

        if (record == null) {
            records.save(new RecordRanking(jugador, juego, temporada, puntuacion, experiencia));
        } else if (puntuacion > record.getPuntuacion()) {
            record.actualizar(puntuacion, experiencia);
            records.save(record);
        }
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> obtenerRanking(String juego) {
        String temporada = claveTemporada();
        if (juego == null || juego.equals("general")) {
            return rankingGeneral(records.findByTemporada(temporada));
        }

        return records
                .findByTemporadaAndJuegoOrderByPuntuacionDescActualizadoEnAsc(temporada, juego)
                .stream()
                .limit(100)
                .map(record -> crearFila(
                        record.getJugador(),
                        record.getPuntuacion(),
                        record.getExperiencia()
                ))
                .toList();
    }

    public Map<String, Object> obtenerTemporada() {
        LocalDate hoy = LocalDate.now(ZONA);
        int mesInicial = ((hoy.getMonthValue() - 1) / 2) * 2 + 1;
        YearMonth inicio = YearMonth.of(hoy.getYear(), mesInicial);
        YearMonth fin = inicio.plusMonths(1);
        return Map.of(
                "clave", claveTemporada(),
                "nombre", Month.of(mesInicial).getDisplayName(java.time.format.TextStyle.FULL, new Locale("es"))
                        + " – " + fin.getMonth().getDisplayName(java.time.format.TextStyle.FULL, new Locale("es")),
                "termina", fin.atEndOfMonth().toString()
        );
    }

    private List<Map<String, Object>> rankingGeneral(List<RecordRanking> resultados) {
        Map<Long, Integer> experiencia = new LinkedHashMap<>();
        Map<Long, JugadorRanking> participantes = new LinkedHashMap<>();
        for (RecordRanking record : resultados) {
            Long id = record.getJugador().getId();
            participantes.put(id, record.getJugador());
            experiencia.merge(id, record.getExperiencia(), Integer::sum);
        }

        List<Map.Entry<Long, Integer>> orden = new ArrayList<>(experiencia.entrySet());
        orden.sort(Map.Entry.<Long, Integer>comparingByValue(Comparator.reverseOrder()));
        return orden.stream()
                .limit(100)
                .map(entry -> crearFila(participantes.get(entry.getKey()), entry.getValue(), entry.getValue()))
                .toList();
    }

    private Map<String, Object> crearFila(JugadorRanking jugador, int puntuacion, int experiencia) {
        Map<String, Object> fila = new LinkedHashMap<>();
        fila.put("nombre", jugador.getNombre());
        fila.put("avatar", jugador.getAvatar());
        fila.put("puntuacion", puntuacion);
        fila.put("experiencia", experiencia);
        return fila;
    }

    private int calcularExperiencia(String juego, int puntuacion) {
        return switch (juego) {
            case "higher-lower", "pokeprice" -> puntuacion * 100;
            case "pokedle", "pokezoom", "sonidos", "movimientos", "adivina-estadisticas", "silueta" -> puntuacion * 100;
            case "fusion" -> puntuacion * 10;
            case "silueta-tiempo" -> puntuacion * 150;
            default -> puntuacion;
        };
    }

    private String claveTemporada() {
        LocalDate hoy = LocalDate.now(ZONA);
        int mesInicial = ((hoy.getMonthValue() - 1) / 2) * 2 + 1;
        return "%04d-%02d".formatted(hoy.getYear(), mesInicial);
    }

    private String limpiarNombre(String nombre) {
        if (nombre == null) throw new IllegalArgumentException("Escribe un nombre de entrenador");
        String limpio = nombre.trim().replaceAll("\\s+", " ");
        if (limpio.length() < 3 || limpio.length() > 20) {
            throw new IllegalArgumentException("El nombre debe tener entre 3 y 20 caracteres");
        }
        if (!limpio.matches("[\\p{L}\\p{N}_ -]+")) {
            throw new IllegalArgumentException("Usa solamente letras, números, espacios, guiones o guion bajo");
        }
        return limpio;
    }

    private String normalizar(String nombre) {
        return Normalizer.normalize(nombre, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT);
    }
}
