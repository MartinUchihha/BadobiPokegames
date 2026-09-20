package com.badobi.badobipokegames.service;

import com.badobi.badobipokegames.model.FichaPareja;
import com.badobi.badobipokegames.model.PartidaParejas;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class ParejasService {

    private static final int TAMANO_PREDETERMINADO = 48;

    private static final Map<Integer, ConfiguracionTablero> CONFIGURACIONES =
            Map.of(
                    24,
                    new ConfiguracionTablero(
                            24, 90, 19.0, 15.8, 2.0, 3.0,
                            List.of(
                                    new CapaTablero(16, 4),
                                    new CapaTablero(6, 3),
                                    new CapaTablero(2, 2)
                            )
                    ),
                    48,
                    new ConfiguracionTablero(
                            48, 180, 13.8, 11.5, 2.0, 3.2,
                            List.of(
                                    new CapaTablero(30, 6),
                                    new CapaTablero(12, 4),
                                    new CapaTablero(6, 3)
                            )
                    ),
                    72,
                    new ConfiguracionTablero(
                            72, 300, 11.3, 9.4, 1.7, 2.8,
                            List.of(
                                    new CapaTablero(42, 7),
                                    new CapaTablero(20, 5),
                                    new CapaTablero(8, 4),
                                    new CapaTablero(2, 2)
                            )
                    ),
                    144,
                    new ConfiguracionTablero(
                            144, 600, 8.2, 6.8, 1.1, 2.0,
                            List.of(
                                    new CapaTablero(80, 10),
                                    new CapaTablero(40, 8),
                                    new CapaTablero(18, 6),
                                    new CapaTablero(6, 3)
                            )
                    )
            );

    private static final List<PokemonBase> POKEMON_DISPONIBLES =
            List.of(
                    new PokemonBase(1, "Bulbasaur"),
                    new PokemonBase(4, "Charmander"),
                    new PokemonBase(7, "Squirtle"),
                    new PokemonBase(25, "Pikachu"),
                    new PokemonBase(26, "Raichu"),
                    new PokemonBase(35, "Clefairy"),
                    new PokemonBase(37, "Vulpix"),
                    new PokemonBase(39, "Jigglypuff"),
                    new PokemonBase(52, "Meowth"),
                    new PokemonBase(54, "Psyduck"),
                    new PokemonBase(58, "Growlithe"),
                    new PokemonBase(63, "Abra"),
                    new PokemonBase(66, "Machop"),
                    new PokemonBase(74, "Geodude"),
                    new PokemonBase(77, "Ponyta"),
                    new PokemonBase(79, "Slowpoke"),
                    new PokemonBase(81, "Magnemite"),
                    new PokemonBase(92, "Gastly"),
                    new PokemonBase(94, "Gengar"),
                    new PokemonBase(104, "Cubone"),
                    new PokemonBase(113, "Chansey"),
                    new PokemonBase(120, "Staryu"),
                    new PokemonBase(129, "Magikarp"),
                    new PokemonBase(131, "Lapras"),
                    new PokemonBase(133, "Eevee"),
                    new PokemonBase(134, "Vaporeon"),
                    new PokemonBase(135, "Jolteon"),
                    new PokemonBase(136, "Flareon"),
                    new PokemonBase(143, "Snorlax"),
                    new PokemonBase(147, "Dratini"),
                    new PokemonBase(149, "Dragonite"),
                    new PokemonBase(150, "Mewtwo"),
                    new PokemonBase(151, "Mew"),
                    new PokemonBase(152, "Chikorita"),
                    new PokemonBase(155, "Cyndaquil"),
                    new PokemonBase(158, "Totodile"),
                    new PokemonBase(172, "Pichu"),
                    new PokemonBase(175, "Togepi"),
                    new PokemonBase(179, "Mareep"),
                    new PokemonBase(196, "Espeon"),
                    new PokemonBase(197, "Umbreon"),
                    new PokemonBase(200, "Misdreavus"),
                    new PokemonBase(212, "Scizor"),
                    new PokemonBase(215, "Sneasel"),
                    new PokemonBase(246, "Larvitar"),
                    new PokemonBase(248, "Tyranitar"),
                    new PokemonBase(252, "Treecko"),
                    new PokemonBase(255, "Torchic"),
                    new PokemonBase(258, "Mudkip"),
                    new PokemonBase(280, "Ralts"),
                    new PokemonBase(282, "Gardevoir"),
                    new PokemonBase(302, "Sableye"),
                    new PokemonBase(303, "Mawile"),
                    new PokemonBase(304, "Aron"),
                    new PokemonBase(315, "Roselia"),
                    new PokemonBase(333, "Swablu"),
                    new PokemonBase(359, "Absol"),
                    new PokemonBase(371, "Bagon"),
                    new PokemonBase(376, "Metagross"),
                    new PokemonBase(387, "Turtwig"),
                    new PokemonBase(390, "Chimchar"),
                    new PokemonBase(393, "Piplup"),
                    new PokemonBase(403, "Shinx"),
                    new PokemonBase(425, "Drifloon"),
                    new PokemonBase(427, "Buneary"),
                    new PokemonBase(443, "Gible"),
                    new PokemonBase(447, "Riolu"),
                    new PokemonBase(448, "Lucario"),
                    new PokemonBase(470, "Leafeon"),
                    new PokemonBase(471, "Glaceon"),
                    new PokemonBase(478, "Froslass"),
                    new PokemonBase(495, "Snivy"),
                    new PokemonBase(498, "Tepig"),
                    new PokemonBase(501, "Oshawott"),
                    new PokemonBase(517, "Munna"),
                    new PokemonBase(529, "Drilbur"),
                    new PokemonBase(570, "Zorua"),
                    new PokemonBase(571, "Zoroark"),
                    new PokemonBase(607, "Litwick"),
                    new PokemonBase(610, "Axew"),
                    new PokemonBase(633, "Deino"),
                    new PokemonBase(650, "Chespin"),
                    new PokemonBase(653, "Fennekin"),
                    new PokemonBase(656, "Froakie"),
                    new PokemonBase(658, "Greninja"),
                    new PokemonBase(700, "Sylveon"),
                    new PokemonBase(704, "Goomy"),
                    new PokemonBase(722, "Rowlet"),
                    new PokemonBase(725, "Litten"),
                    new PokemonBase(728, "Popplio"),
                    new PokemonBase(744, "Rockruff"),
                    new PokemonBase(778, "Mimikyu"),
                    new PokemonBase(810, "Grookey"),
                    new PokemonBase(813, "Scorbunny"),
                    new PokemonBase(816, "Sobble"),
                    new PokemonBase(848, "Toxel"),
                    new PokemonBase(906, "Sprigatito"),
                    new PokemonBase(909, "Fuecoco"),
                    new PokemonBase(912, "Quaxly"),
                    new PokemonBase(915, "Lechonk"),
                    new PokemonBase(921, "Pawmi"),
                    new PokemonBase(935, "Charcadet")
            );

    private static final List<RivalBase> RIVALES =
            List.of(
                    new RivalBase("Ash", "/images/entrenadores/ash.png", "Normal", 0.83, 0.80),
                    new RivalBase("Red", "/images/entrenadores/red.png", "Maestro", 0.50, 0.97),
                    new RivalBase("Azul", "/images/entrenadores/azul.png", "Normal", 0.83, 0.82),
                    new RivalBase("Misty", "/images/entrenadores/misty.png", "Fácil", 1.05, 0.68),
                    new RivalBase("Brock", "/images/entrenadores/brock.png", "Fácil", 1.05, 0.70),
                    new RivalBase("Maya", "/images/entrenadores/maya.png", "Fácil", 1.00, 0.72),
                    new RivalBase("Serena", "/images/entrenadores/serena.png", "Normal", 0.86, 0.78),
                    new RivalBase("Alain", "/images/entrenadores/alain.png", "Difícil", 0.65, 0.90),
                    new RivalBase("Cynthia", "/images/entrenadores/cynthia.png", "Maestro", 0.50, 0.98),
                    new RivalBase("Iris", "/images/entrenadores/iris.png", "Normal", 0.80, 0.83),
                    new RivalBase("Lance", "/images/entrenadores/lance.png", "Difícil", 0.62, 0.92),
                    new RivalBase("Leon", "/images/entrenadores/leon.png", "Maestro", 0.52, 0.96),
                    new RivalBase("N", "/images/entrenadores/n.png", "Difícil", 0.68, 0.89),
                    new RivalBase("Giovanni", "/images/entrenadores/giovanni.png", "Normal", 0.78, 0.84),
                    new RivalBase("Máximo", "/images/entrenadores/maximo.png", "Difícil", 0.66, 0.91)
            );

    public PartidaParejas crearPartida(String modoSolicitado) {
        return crearPartida(modoSolicitado, TAMANO_PREDETERMINADO);
    }

    public PartidaParejas crearPartida(
            String modoSolicitado,
            int totalFichasSolicitado
    ) {
        String modo = normalizarModo(modoSolicitado);

        ConfiguracionTablero configuracion =
                CONFIGURACIONES.getOrDefault(
                        totalFichasSolicitado,
                        CONFIGURACIONES.get(TAMANO_PREDETERMINADO)
                );

        long semilla = ThreadLocalRandom.current().nextLong();
        Random random = new Random(semilla);

        List<PokemonBase> seleccionados =
                new ArrayList<>(POKEMON_DISPONIBLES);

        Collections.shuffle(seleccionados, random);

        int totalParejas = configuracion.totalFichas() / 2;

        seleccionados =
                new ArrayList<>(
                        seleccionados.subList(0, totalParejas)
                );

        List<FichaPareja> fichas =
                generarFichas(seleccionados, configuracion, random);

        RivalBase rival =
                modo.equals("VERSUS_IA")
                        ? RIVALES.get(random.nextInt(RIVALES.size()))
                        : null;

        return new PartidaParejas(
                UUID.randomUUID().toString(),
                modo,
                semilla,
                configuracion.totalFichas(),
                totalParejas,
                configuracion.duracionSegundos(),
                configuracion.anchoFicha(),
                configuracion.altoFicha(),
                rival != null ? rival.nombre() : "",
                rival != null ? rival.imagenUrl() : "",
                rival != null ? rival.nivel() : "",
                rival != null ? rival.velocidad() : 0.0,
                rival != null ? rival.precision() : 0.0,
                fichas
        );
    }

    private String normalizarModo(String modoSolicitado) {
        if (
                modoSolicitado != null
                        && (
                        modoSolicitado.equalsIgnoreCase("versus")
                                || modoSolicitado.equalsIgnoreCase("versus_ia")
                )
        ) {
            return "VERSUS_IA";
        }

        return "INDIVIDUAL";
    }

    private List<FichaPareja> generarFichas(
            List<PokemonBase> pokemon,
            ConfiguracionTablero configuracion,
            Random random
    ) {
        List<FichaPareja> fichas = new ArrayList<>();
        int siguienteId = 1;
        int indicePokemon = 0;

        for (
                int capa = configuracion.capas().size() - 1;
                capa >= 0;
                capa--
        ) {
            CapaTablero configuracionCapa = configuracion.capas().get(capa);

            List<PosicionFicha> posiciones =
                    crearPosiciones(
                            configuracionCapa,
                            capa,
                            configuracion,
                            random
                    );

            Collections.shuffle(posiciones, random);

            siguienteId = agregarCapa(
                    fichas,
                    pokemon,
                    indicePokemon,
                    posiciones,
                    siguienteId
            );

            indicePokemon += posiciones.size() / 2;
        }

        Collections.shuffle(fichas, random);
        return fichas;
    }

    private List<PosicionFicha> crearPosiciones(
            CapaTablero capa,
            int indiceCapa,
            ConfiguracionTablero configuracion,
            Random random
    ) {
        List<PosicionFicha> posiciones = new ArrayList<>();
        int filas = capa.totalFichas() / capa.columnas();

        double anchoCuadricula =
                capa.columnas() * configuracion.anchoFicha()
                        + (capa.columnas() - 1) * configuracion.separacionX();

        double altoCuadricula =
                filas * configuracion.altoFicha()
                        + (filas - 1) * configuracion.separacionY();

        double inicioX = (100.0 - anchoCuadricula) / 2.0;
        double inicioY = (100.0 - altoCuadricula) / 2.0;

        for (int fila = 0; fila < filas; fila++) {
            for (int columna = 0; columna < capa.columnas(); columna++) {
                double variacionX =
                        (random.nextDouble() - 0.5)
                                * Math.min(
                                0.9,
                                configuracion.separacionX() * 0.45
                        );

                double variacionY =
                        (random.nextDouble() - 0.5)
                                * Math.min(
                                0.9,
                                configuracion.separacionY() * 0.35
                        );

                double posicionX =
                        inicioX
                                + columna * (
                                configuracion.anchoFicha()
                                        + configuracion.separacionX()
                        )
                                + variacionX;

                double posicionY =
                        inicioY
                                + fila * (
                                configuracion.altoFicha()
                                        + configuracion.separacionY()
                        )
                                + variacionY;

                posiciones.add(
                        new PosicionFicha(
                                redondear(posicionX),
                                redondear(posicionY),
                                indiceCapa
                        )
                );
            }
        }

        return posiciones;
    }

    private int agregarCapa(
            List<FichaPareja> fichas,
            List<PokemonBase> pokemon,
            int indicePokemonInicial,
            List<PosicionFicha> posiciones,
            int siguienteId
    ) {
        int cantidadParejas = posiciones.size() / 2;

        for (
                int indicePareja = 0;
                indicePareja < cantidadParejas;
                indicePareja++
        ) {
            PokemonBase pokemonActual =
                    pokemon.get(indicePokemonInicial + indicePareja);

            PosicionFicha primeraPosicion = posiciones.get(indicePareja * 2);
            PosicionFicha segundaPosicion = posiciones.get(indicePareja * 2 + 1);
            String imagenUrl = crearImagenUrl(pokemonActual.id());

            fichas.add(
                    crearFicha(
                            siguienteId++,
                            pokemonActual,
                            imagenUrl,
                            primeraPosicion
                    )
            );

            fichas.add(
                    crearFicha(
                            siguienteId++,
                            pokemonActual,
                            imagenUrl,
                            segundaPosicion
                    )
            );
        }

        return siguienteId;
    }

    private FichaPareja crearFicha(
            int id,
            PokemonBase pokemon,
            String imagenUrl,
            PosicionFicha posicion
    ) {
        return new FichaPareja(
                id,
                pokemon.id(),
                pokemon.nombre(),
                imagenUrl,
                posicion.x(),
                posicion.y(),
                posicion.capa()
        );
    }

    private String crearImagenUrl(int pokemonId) {
        return "https://raw.githubusercontent.com/"
                + "PokeAPI/sprites/master/sprites/pokemon/"
                + pokemonId
                + ".png";
    }

    private double redondear(double valor) {
        return Math.round(valor * 100.0) / 100.0;
    }

    private record ConfiguracionTablero(
            int totalFichas,
            int duracionSegundos,
            double anchoFicha,
            double altoFicha,
            double separacionX,
            double separacionY,
            List<CapaTablero> capas
    ) {
    }

    private record CapaTablero(
            int totalFichas,
            int columnas
    ) {
    }

    private record RivalBase(
            String nombre,
            String imagenUrl,
            String nivel,
            double velocidad,
            double precision
    ) {
    }

    private record PokemonBase(int id, String nombre) {
    }

    private record PosicionFicha(double x, double y, int capa) {
    }
}
