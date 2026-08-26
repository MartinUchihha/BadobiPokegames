package com.badobi.badobipokegames.controller;

import com.badobi.badobipokegames.model.PartidaSilueta;
import com.badobi.badobipokegames.model.RondaSiluetaTiempo;
import com.badobi.badobipokegames.service.SiluetaService;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import java.util.LinkedHashMap;
import java.util.Map;

@Controller
public class SiluetaController {

    private static final String SESSION_CLASSIC =
            "siluetaPartida";

    private static final String SESSION_TIME =
            "siluetaRondaTiempo";

    private final SiluetaService siluetaService;

    public SiluetaController(
            SiluetaService siluetaService
    ) {
        this.siluetaService = siluetaService;
    }

    @GetMapping("/silueta")
    public String mostrarSilueta() {
        return "silueta";
    }

    /*
     * MODO CLÁSICO
     */

    @PostMapping("/silueta/nueva-partida")
    @ResponseBody
    public Map<String, Object> nuevaPartidaClasica(
            @RequestParam String generacion,
            HttpSession session
    ) {
        PartidaSilueta partida =
                siluetaService.crearPartida(generacion);

        session.setAttribute(
                SESSION_CLASSIC,
                partida
        );

        return Map.of(
                "iniciada", true,
                "intento", 1,
                "maxIntentos", PartidaSilueta.MAX_INTENTOS,
                "generacion", partida.getGeneracion()
        );
    }

    @GetMapping(
            value = "/silueta/imagen",
            produces = MediaType.IMAGE_PNG_VALUE
    )
    @ResponseBody
    public ResponseEntity<byte[]> imagenClasica(
            HttpSession session
    ) {
        PartidaSilueta partida =
                obtenerPartidaClasica(session);

        if (partida == null) {
            return ResponseEntity.notFound().build();
        }

        byte[] imagen = partida.isTerminada()
                ? siluetaService.obtenerArtwork(
                partida.getPokemonId()
        )
                : siluetaService.obtenerSilueta(
                partida.getPokemonId()
        );

        return respuestaImagen(imagen);
    }

    @PostMapping("/silueta/intento")
    @ResponseBody
    public Map<String, Object> intentoClasico(
            @RequestParam String pokemonName,
            HttpSession session
    ) {
        PartidaSilueta partida =
                obtenerPartidaClasica(session);

        if (partida == null) {
            return Map.of(
                    "estado", "sin-partida"
            );
        }

        if (partida.isTerminada()) {
            return resultadoClasico(partida, false);
        }

        if (partida.yaFueIntentado(pokemonName)) {
            return Map.of(
                    "estado", "repetido"
            );
        }

        boolean correcto =
                partida.registrarIntento(pokemonName);

        return resultadoClasico(
                partida,
                correcto
        );
    }

    /*
     * MODO CONTRARRELOJ
     */

    @PostMapping("/silueta/tiempo/nueva-ronda")
    @ResponseBody
    public Map<String, Object> nuevaRondaTiempo(
            @RequestParam String generacion,
            HttpSession session
    ) {
        RondaSiluetaTiempo ronda =
                siluetaService.crearRondaTiempo(
                        generacion
                );

        session.setAttribute(
                SESSION_TIME,
                ronda
        );

        return Map.of(
                "iniciada", true,
                "tiempo", ronda.getTiempoRestante(),
                "puntos", ronda.getPuntos(),
                "mejorRacha", ronda.getMejorRacha(),
                "generacion", ronda.getGeneracion()
        );
    }

    @PostMapping("/silueta/tiempo/iniciar-reloj")
    @ResponseBody
    public Map<String, Object> iniciarReloj(
            HttpSession session
    ) {
        RondaSiluetaTiempo ronda =
                obtenerRondaTiempo(session);

        if (ronda == null) {
            return Map.of(
                    "estado", "sin-ronda"
            );
        }

        ronda.iniciarReloj();

        return Map.of(
                "estado", "iniciada",
                "tiempo", ronda.getTiempoRestante()
        );
    }

    @GetMapping(
            value = "/silueta/tiempo/imagen",
            produces = MediaType.IMAGE_PNG_VALUE
    )
    @ResponseBody
    public ResponseEntity<byte[]> imagenTiempo(
            HttpSession session
    ) {
        RondaSiluetaTiempo ronda =
                obtenerRondaTiempo(session);

        if (ronda == null) {
            return ResponseEntity.notFound().build();
        }

        byte[] imagen = ronda.isTerminada()
                ? siluetaService.obtenerArtwork(
                ronda.getPokemonId()
        )
                : siluetaService.obtenerSilueta(
                ronda.getPokemonId()
        );

        return respuestaImagen(imagen);
    }

    @PostMapping("/silueta/tiempo/intento")
    @ResponseBody
    public Map<String, Object> intentoTiempo(
            @RequestParam String pokemonName,
            HttpSession session
    ) {
        RondaSiluetaTiempo ronda =
                obtenerRondaTiempo(session);

        if (ronda == null) {
            return Map.of(
                    "estado", "sin-ronda"
            );
        }

        ronda.pausarReloj();

        if (ronda.isTerminada()) {
            return resultadoFinalTiempo(ronda);
        }

        if (ronda.yaFueIntentado(pokemonName)) {
            return Map.of(
                    "estado", "repetido",
                    "tiempo", ronda.getTiempoRestante()
            );
        }

        String pokemonActual =
                ronda.getPokemonNombre();

        boolean correcto =
                ronda.registrarIntento(pokemonName);

        if (correcto && !ronda.isTerminada()) {
            siluetaService.prepararSiguientePokemon(
                    ronda
            );
        }

        Map<String, Object> resultado =
                new LinkedHashMap<>();

        resultado.put(
                "estado",
                correcto ? "correcto" : "incorrecto"
        );
        resultado.put("correcto", correcto);
        resultado.put(
                "terminada",
                ronda.isTerminada()
        );
        resultado.put(
                "tiempo",
                ronda.getTiempoRestante()
        );
        resultado.put(
                "puntos",
                ronda.getPuntos()
        );
        resultado.put(
                "racha",
                ronda.getRachaActual()
        );
        resultado.put(
                "mejorRacha",
                ronda.getMejorRacha()
        );
        resultado.put(
                "historial",
                ronda.getIntentosActuales()
        );

        if (correcto) {
            resultado.put(
                    "pokemonResuelto",
                    pokemonActual
            );
            resultado.put(
                    "nuevaSilueta",
                    true
            );
        }

        return resultado;
    }

    @PostMapping("/silueta/tiempo/saltar")
    @ResponseBody
    public Map<String, Object> saltarPokemon(
            HttpSession session
    ) {
        RondaSiluetaTiempo ronda =
                obtenerRondaTiempo(session);

        if (ronda == null) {
            return Map.of(
                    "estado", "sin-ronda"
            );
        }

        ronda.pausarReloj();

        String pokemonSaltado =
                ronda.getPokemonNombre();

        ronda.saltarPokemon();

        if (!ronda.isTerminada()) {
            siluetaService.prepararSiguientePokemon(
                    ronda
            );
        }

        Map<String, Object> resultado =
                new LinkedHashMap<>();

        resultado.put("estado", "saltado");
        resultado.put(
                "terminada",
                ronda.isTerminada()
        );
        resultado.put(
                "tiempo",
                ronda.getTiempoRestante()
        );
        resultado.put(
                "puntos",
                ronda.getPuntos()
        );
        resultado.put(
                "racha",
                ronda.getRachaActual()
        );
        resultado.put(
                "mejorRacha",
                ronda.getMejorRacha()
        );
        resultado.put(
                "pokemonSaltado",
                pokemonSaltado
        );

        return resultado;
    }

    @PostMapping("/silueta/tiempo/finalizar")
    @ResponseBody
    public Map<String, Object> finalizarTiempo(
            HttpSession session
    ) {
        RondaSiluetaTiempo ronda =
                obtenerRondaTiempo(session);

        if (ronda == null) {
            return Map.of(
                    "estado", "sin-ronda"
            );
        }

        ronda.finalizar();

        return resultadoFinalTiempo(ronda);
    }

    private Map<String, Object> resultadoClasico(
            PartidaSilueta partida,
            boolean correcto
    ) {
        Map<String, Object> resultado =
                new LinkedHashMap<>();

        resultado.put(
                "estado",
                correcto ? "correcto" : "incorrecto"
        );
        resultado.put("correcto", correcto);
        resultado.put(
                "terminada",
                partida.isTerminada()
        );
        resultado.put(
                "victoria",
                partida.isVictoria()
        );
        resultado.put(
                "intentos",
                partida.getNumeroIntentos()
        );
        resultado.put(
                "restantes",
                partida.getIntentosRestantes()
        );
        resultado.put(
                "historial",
                partida.getIntentos()
        );

        if (partida.isTerminada()) {
            resultado.put(
                    "pokemon",
                    partida.getPokemonNombre()
            );
        }

        return resultado;
    }

    private Map<String, Object> resultadoFinalTiempo(
            RondaSiluetaTiempo ronda
    ) {
        return Map.of(
                "estado", "terminada",
                "terminada", true,
                "tiempo", ronda.getTiempoRestante(),
                "puntos", ronda.getPuntos(),
                "mejorRacha", ronda.getMejorRacha(),
                "pokemon", ronda.getPokemonNombre()
        );
    }

    private ResponseEntity<byte[]> respuestaImagen(
            byte[] imagen
    ) {
        return ResponseEntity
                .ok()
                .cacheControl(CacheControl.noStore())
                .contentType(MediaType.IMAGE_PNG)
                .body(imagen);
    }

    private PartidaSilueta obtenerPartidaClasica(
            HttpSession session
    ) {
        Object partida =
                session.getAttribute(SESSION_CLASSIC);

        if (partida instanceof PartidaSilueta silueta) {
            return silueta;
        }

        return null;
    }

    private RondaSiluetaTiempo obtenerRondaTiempo(
            HttpSession session
    ) {
        Object ronda =
                session.getAttribute(SESSION_TIME);

        if (
                ronda instanceof
                        RondaSiluetaTiempo rondaTiempo
        ) {
            return rondaTiempo;
        }

        return null;
    }
}