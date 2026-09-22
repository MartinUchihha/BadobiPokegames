package com.badobi.badobipokegames.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.Random;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class PokeSortService {
    private static final int[][] LEVELS = {
            {8, 0, 0, 180, 2}, {8, 3, 1, 240, 4}, {8, 4, 1, 260, 6}, {8, 4, 1, 240, 8},
            {10, 3, 1, 300, 8}, {10, 4, 1, 320, 10}, {10, 5, 1, 340, 12},
            {10, 4, 2, 390, 14}, {10, 5, 2, 420, 16},
            {12, 4, 2, 450, 16}, {12, 5, 2, 480, 18}, {12, 6, 2, 510, 20},
            {12, 6, 2, 490, 22}, {12, 6, 2, 470, 24}, {12, 6, 2, 450, 26},
            {14, 5, 2, 630, 24}, {14, 6, 2, 690, 26}, {14, 7, 2, 750, 28},
            {14, 6, 3, 810, 30}, {14, 7, 3, 870, 32}
    };
    private static final List<String> POOL = List.of(
            "pikachu", "eevee", "poke-ball", "great-ball", "ultra-ball", "potion", "super-potion", "hyper-potion",
            "bulbasaur", "charmander", "squirtle", "jigglypuff", "psyduck", "piplup", "gengar", "snorlax",
            "mew", "umbreon", "mimikyu", "torchic", "fuecoco", "rowlet"
    );
    private static final Duration SESSION_LIFETIME = Duration.ofMinutes(30);

    public record Move(int sourceShelf, int sourceSlot, int targetShelf) {}
    public record ShelfView(List<String> items, List<List<String>> layers) {}
    public record StartResult(String partidaId, int level, int seconds, int totalMatches, List<ShelfView> shelves) {}
    public record WinResult(boolean saved, int experience, int level, int nextLevel) {}
    public record PauseResult(int remainingSeconds) {}
    private record Config(int types, int hiddenShelves, int layers, int seconds, int scrambleMoves) {
        int totalMatches() { return types + hiddenShelves * layers; }
    }
    private record Candidate(int sourceShelf, int sourceSlot, int targetShelf) {}

    private static final class Shelf {
        private List<String> items;
        private final List<List<String>> layers = new ArrayList<>();

        Shelf(String first, String second) {
            items = new ArrayList<>(Arrays.asList(first, second, null));
        }

        Shelf(Shelf original) {
            items = new ArrayList<>(original.items);
            original.layers.forEach(layer -> layers.add(new ArrayList<>(layer)));
        }

        int count() { return (int) items.stream().filter(Objects::nonNull).count(); }
        int firstEmpty() { return items.indexOf(null); }
        boolean empty() { return count() == 0; }

        void revealIfEmpty() {
            if (empty() && !layers.isEmpty()) items = layers.removeFirst();
        }

        ShelfView view() {
            List<List<String>> hidden = new ArrayList<>();
            layers.forEach(layer -> hidden.add(new ArrayList<>(layer)));
            return new ShelfView(new ArrayList<>(items), hidden);
        }
    }

    private static final class Session {
        private final String token;
        private final int level;
        private final Config config;
        private final Instant started;
        private final List<Shelf> shelves;
        private Instant pausedAt;
        private Duration pausedDuration = Duration.ZERO;

        Session(String token, int level, Config config, Instant started, List<Shelf> shelves) {
            this.token = token;
            this.level = level;
            this.config = config;
            this.started = started;
            this.shelves = shelves;
        }

        Duration elapsed(Instant now) {
            return Duration.between(started, pausedAt == null ? now : pausedAt).minus(pausedDuration);
        }

        int remaining(Instant now) {
            return Math.max(0, config.seconds() - (int) elapsed(now).toSeconds());
        }
    }

    private final ConcurrentMap<String, Session> sessions = new ConcurrentHashMap<>();
    private final RankingGlobalService rankingService;
    private final LogrosService logrosService;

    public PokeSortService(RankingGlobalService rankingService, LogrosService logrosService) {
        this.rankingService = rankingService;
        this.logrosService = logrosService;
    }

    public StartResult start(int level, String token) {
        if (level < 1 || level > LEVELS.length) throw new IllegalArgumentException("Nivel no válido");
        Instant now = Instant.now();
        sessions.entrySet().removeIf(entry -> Duration.between(entry.getValue().started, now).compareTo(SESSION_LIFETIME) > 0);
        Config config = config(level);
        List<Shelf> shelves = generate(level, config, ThreadLocalRandom.current());
        String id = UUID.randomUUID().toString();
        sessions.put(id, new Session(token, level, config, now, shelves));
        return new StartResult(id, level, config.seconds(), config.totalMatches(), shelves.stream().map(Shelf::view).toList());
    }

    public synchronized PauseResult setPaused(String id, String token, boolean paused) {
        if (id == null || id.isBlank()) throw new IllegalArgumentException("La partida ya no está disponible.");
        Session session = sessions.get(id);
        if (session == null || !Objects.equals(session.token, token)) {
            throw new IllegalArgumentException("La partida ya no está disponible.");
        }
        Instant now = Instant.now();
        if (paused && session.pausedAt == null) {
            session.pausedAt = now;
        } else if (!paused && session.pausedAt != null) {
            session.pausedDuration = session.pausedDuration.plus(Duration.between(session.pausedAt, now));
            session.pausedAt = null;
        }
        return new PauseResult(session.remaining(now));
    }

    @Transactional
    public synchronized WinResult complete(String id, String token, List<Move> moves) {
        if (id == null || id.isBlank()) throw new IllegalArgumentException("La partida ya no está disponible. Comienza una nueva.");
        Session session = sessions.get(id);
        if (session == null || !Objects.equals(session.token, token)) {
            throw new IllegalArgumentException("La partida ya no está disponible. Comienza una nueva.");
        }
        if (session.pausedAt != null) throw new IllegalArgumentException("Continúa la partida antes de terminarla.");
        long elapsed = session.elapsed(Instant.now()).toSeconds();
        if (elapsed > session.config.seconds() + 5L) {
            sessions.remove(id);
            throw new IllegalArgumentException("Se agotó el tiempo de esta partida.");
        }
        if (moves == null || moves.isEmpty() || moves.size() > 3000) {
            throw new IllegalArgumentException("La partida no tiene movimientos válidos.");
        }

        List<Shelf> board = session.shelves.stream().map(Shelf::new).toList();
        int matches = 0;
        for (Move move : moves) {
            if (move == null || move.sourceShelf() < 0 || move.sourceShelf() >= board.size()
                    || move.targetShelf() < 0 || move.targetShelf() >= board.size()
                    || move.sourceShelf() == move.targetShelf() || move.sourceSlot() < 0 || move.sourceSlot() > 2) {
                throw new IllegalArgumentException("La partida contiene un movimiento no válido.");
            }
            Shelf source = board.get(move.sourceShelf());
            Shelf target = board.get(move.targetShelf());
            String item = source.items.get(move.sourceSlot());
            int empty = target.firstEmpty();
            if (item == null || empty < 0) throw new IllegalArgumentException("La partida contiene un movimiento no válido.");

            source.items.set(move.sourceSlot(), null);
            target.items.set(empty, item);
            source.revealIfEmpty();
            if (target.items.stream().allMatch(item::equals)) {
                Collections.fill(target.items, null);
                target.revealIfEmpty();
                matches++;
            }
        }
        boolean cleared = board.stream().allMatch(shelf -> shelf.empty() && shelf.layers.isEmpty());
        if (!cleared || matches != session.config.totalMatches()) {
            throw new IllegalArgumentException("La partida todavía no está completa.");
        }
        if (!sessions.remove(id, session)) throw new IllegalArgumentException("Esta partida ya fue registrada.");

        int remaining = Math.max(0, session.config.seconds() - (int) elapsed);
        int experience = 100 + session.level * 50 + remaining / 5;
        boolean saved = rankingService.buscarJugador(token) != null;
        if (saved) {
            rankingService.registrarMejor(token, "pokesort", experience);
            logrosService.incrementar(token, "partidas", 1);
            logrosService.incrementar(token, "victorias", 1);
            logrosService.incrementar(token, "pokesort-victorias", 1);
            logrosService.actualizarMaximo(token, "pokesort-nivel", session.level);
        }
        return new WinResult(saved, saved ? experience : 0, session.level, Math.min(LEVELS.length, session.level + 1));
    }

    private Config config(int level) {
        int[] row = LEVELS[level - 1];
        return new Config(row[0], row[1], row[2], row[3], row[4]);
    }

    private List<Shelf> generate(int level, Config config, Random random) {
        int half = config.types() / 2;
        int eligibleCount = Math.min(POOL.size(), Math.max(config.types(), 8 + (int) Math.floor((level - 1) * 0.8)));
        List<String> eligible = new ArrayList<>(POOL.subList(0, eligibleCount));
        List<String> chosen = new ArrayList<>(eligible);
        Collections.shuffle(chosen, random);
        chosen = new ArrayList<>(chosen.subList(0, config.types()));
        List<Shelf> shelves = new ArrayList<>();
        for (int i = 0; i < half; i++) shelves.add(new Shelf(chosen.get(i), chosen.get(i)));
        for (int i = 0; i < half; i++) shelves.add(new Shelf(chosen.get(i), chosen.get(half + i)));
        for (int i = 0; i < half; i++) shelves.add(new Shelf(chosen.get(half + i), chosen.get(half + (i + 1) % half)));

        List<Integer> hiddenIndices = new ArrayList<>();
        for (int i = 0; i < half; i++) hiddenIndices.add(i);
        Collections.shuffle(hiddenIndices, random);
        hiddenIndices = hiddenIndices.subList(0, config.hiddenShelves());
        for (int wave = 0; wave < config.layers(); wave++) {
            List<String> hiddenTypes = new ArrayList<>(eligible);
            hiddenTypes.removeAll(chosen);
            Collections.shuffle(hiddenTypes, random);
            List<String> repeated = new ArrayList<>(chosen);
            Collections.shuffle(repeated, random);
            hiddenTypes.addAll(repeated);
            hiddenTypes = hiddenTypes.subList(0, config.hiddenShelves());
            List<List<String>> waveShelves = new ArrayList<>();
            for (int i = 0; i < config.hiddenShelves(); i++) waveShelves.add(new ArrayList<>());
            for (int i = 0; i < hiddenTypes.size(); i++) {
                for (int offset = 0; offset < 3; offset++) {
                    waveShelves.get((i + offset) % hiddenIndices.size()).add(hiddenTypes.get(i));
                }
            }
            for (int i = 0; i < hiddenIndices.size(); i++) {
                List<String> layer = waveShelves.get(i);
                Collections.shuffle(layer, random);
                shelves.get(hiddenIndices.get(i)).layers.add(layer);
            }
        }

        int splitCount = Math.min(half, Math.max(1, config.scrambleMoves() / 3));
        List<Integer> splitIndices = new ArrayList<>();
        for (int i = 0; i < half; i++) splitIndices.add(i);
        Collections.shuffle(splitIndices, random);
        for (int i = 0; i < splitCount; i++) {
            int pairIndex = splitIndices.get(i);
            Shelf source = shelves.get(pairIndex);
            Shelf target = shelves.get(half * 2 + pairIndex);
            int sourceSlot = source.items.indexOf(chosen.get(pairIndex));
            target.items.set(target.firstEmpty(), source.items.get(sourceSlot));
            source.items.set(sourceSlot, null);
        }

        for (int step = splitCount; step < config.scrambleMoves(); step++) {
            List<Candidate> candidates = new ArrayList<>();
            for (int sourceIndex = 0; sourceIndex < shelves.size(); sourceIndex++) {
                Shelf source = shelves.get(sourceIndex);
                if (source.count() < 2) continue;
                for (int slot = 0; slot < 3; slot++) {
                    String item = source.items.get(slot);
                    if (item == null) continue;
                    for (int targetIndex = 0; targetIndex < shelves.size(); targetIndex++) {
                        Shelf target = shelves.get(targetIndex);
                        if (sourceIndex == targetIndex || target.firstEmpty() < 0) continue;
                        if (Collections.frequency(target.items, item) == 2) continue;
                        candidates.add(new Candidate(sourceIndex, slot, targetIndex));
                    }
                }
            }
            if (candidates.isEmpty()) break;
            Candidate move = candidates.get(random.nextInt(candidates.size()));
            Shelf source = shelves.get(move.sourceShelf());
            Shelf target = shelves.get(move.targetShelf());
            target.items.set(target.firstEmpty(), source.items.get(move.sourceSlot()));
            source.items.set(move.sourceSlot(), null);
        }
        shelves.forEach(shelf -> Collections.shuffle(shelf.items, random));
        Collections.shuffle(shelves, random);
        return shelves;
    }
}
