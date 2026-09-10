package com.badobi.badobipokegames.controller;

import com.badobi.badobipokegames.model.CartaPokePrice;
import com.badobi.badobipokegames.model.PartidaPokePrice;
import com.badobi.badobipokegames.service.PokePriceService;
import com.badobi.badobipokegames.service.RankingGlobalService;
import com.badobi.badobipokegames.service.LogrosService;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

@Controller
public class PokePriceController {
    private static final String PARTIDA = "partidaPokePrice";
    private static final Set<String> RESPUESTAS = Set.of("mayor", "menor");
    private final PokePriceService service;
    private final RankingGlobalService rankingService;
    private final LogrosService logrosService;

    public PokePriceController(
            PokePriceService service,
            RankingGlobalService rankingService,
            LogrosService logrosService
    ) {
        this.service = service;
        this.rankingService = rankingService;
        this.logrosService = logrosService;
    }

    @GetMapping("/pokeprice")
    public String mostrarJuego() {
        return "pokeprice";
    }

    @PostMapping("/pokeprice/nueva-partida")
    @ResponseBody
    public Map<String, Object> nuevaPartida(
            @RequestParam(defaultValue = "locura") String modo,
            HttpSession session
    ) {
        PartidaPokePrice partida = service.crearPartida(modo);
        session.setAttribute(PARTIDA, partida);
        return crearEstado(partida);
    }

    @PostMapping("/pokeprice/responder")
    @ResponseBody
    public Map<String, Object> responder(
            @RequestParam String respuesta,
            @CookieValue(name = RankingGlobalService.COOKIE, required = false) String jugadorToken,
            HttpSession session
    ) {
        PartidaPokePrice partida = (PartidaPokePrice) session.getAttribute(PARTIDA);
        if (partida == null || !partida.isActiva()) return Map.of("estado", "sin-partida");
        if (!RESPUESTAS.contains(respuesta)) return Map.of("estado", "respuesta-invalida");

        CartaPokePrice izquierdaResuelta = partida.getCartaIzquierda();
        CartaPokePrice derechaResuelta = partida.getCartaDerecha();
        boolean correcto = partida.comprobar(respuesta);

        Map<String, Object> resultado = new LinkedHashMap<>();
        resultado.put("correcto", correcto);
        resultado.put("izquierdaResuelta", crearCarta(izquierdaResuelta, true));
        resultado.put("derechaResuelta", crearCarta(derechaResuelta, true));

        if (!correcto) {
            partida.finalizar();
            logrosService.incrementar(jugadorToken, "partidas", 1);
            logrosService.actualizarMaximo(jugadorToken, "pokeprice-racha", partida.getPuntuacion());
            rankingService.registrarMejor(
                    jugadorToken,
                    "pokeprice",
                    partida.getPuntuacion()
            );
            resultado.put("estado", "terminada");
            resultado.put("puntuacion", partida.getPuntuacion());
            return resultado;
        }

        service.prepararSiguiente(partida);
        logrosService.actualizarMaximo(jugadorToken, "pokeprice-racha", partida.getPuntuacion());
        resultado.put("estado", "continua");
        resultado.put("puntuacion", partida.getPuntuacion());
        resultado.put("siguiente", crearEstado(partida));
        return resultado;
    }

    private Map<String, Object> crearEstado(PartidaPokePrice partida) {
        Map<String, Object> estado = new LinkedHashMap<>();
        estado.put("estado", "activa");
        estado.put("puntuacion", partida.getPuntuacion());
        estado.put("izquierda", crearCarta(partida.getCartaIzquierda(), true));
        estado.put("derecha", crearCarta(partida.getCartaDerecha(), false));
        return estado;
    }

    private Map<String, Object> crearCarta(CartaPokePrice carta, boolean revelarPrecio) {
        Map<String, Object> datos = new LinkedHashMap<>();
        datos.put("id", carta.getId());
        datos.put("nombre", carta.getNombre());
        datos.put("imagen", carta.getImagen());
        datos.put("coleccion", carta.getColeccion());
        datos.put("numero", carta.getNumero());
        datos.put("rareza", carta.getRareza());
        datos.put("acabado", carta.getAcabado());
        datos.put("fechaPrecio", carta.getFechaPrecio());
        if (revelarPrecio) {
            datos.put("precio", carta.getPrecio());
            datos.put("enlace", carta.getEnlace());
        }
        return datos;
    }
}
