package com.badobi.badobipokegames.service;

import com.badobi.badobipokegames.model.CartaPokePrice;
import com.badobi.badobipokegames.model.PartidaPokePrice;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import tools.jackson.databind.JsonNode;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class PokePriceService {
    private static final int TAMANO_PAGINA = 100;
    private final RestClient api;
    private final List<CartaPokePrice> cartasDisponibles = new ArrayList<>();
    private int totalCartas;

    public PokePriceService(@Value("${POKEMON_TCG_API_KEY:}") String apiKey) {
        RestClient.Builder builder = RestClient.builder()
                .baseUrl("https://api.pokemontcg.io/v2");
        if (apiKey != null && !apiKey.isBlank()) {
            builder.defaultHeader("X-Api-Key", apiKey.trim());
        }
        api = builder.build();
    }

    public PartidaPokePrice crearPartida(String modo) {
        String modoSeguro = "locura".equals(modo) ? "locura" : "todas";
        CartaPokePrice izquierda = obtenerCarta(null, null, modoSeguro);
        CartaPokePrice derecha = obtenerCarta(null, izquierda, modoSeguro);
        return new PartidaPokePrice(modoSeguro, izquierda, derecha);
    }

    public void prepararSiguiente(PartidaPokePrice partida) {
        CartaPokePrice siguiente = obtenerCarta(
                partida,
                partida.getCartaDerecha(),
                partida.getModo()
        );
        partida.avanzar(siguiente);
    }

    private synchronized CartaPokePrice obtenerCarta(
            PartidaPokePrice partida,
            CartaPokePrice referencia,
            String modo
    ) {
        for (int intento = 0; intento < 6; intento++) {
            if (cartasDisponibles.size() < 25 || intento > 0) {
                cargarPaginaAleatoria();
            }

            List<CartaPokePrice> candidatas = new ArrayList<>(cartasDisponibles);
            Collections.shuffle(candidatas);
            for (CartaPokePrice carta : candidatas) {
                if (!perteneceAlModo(carta, modo)) continue;
                if (partida != null && partida.fueUsada(carta.getVarianteId())) continue;
                if (referencia != null && referencia.getId().equals(carta.getId())) continue;
                if (referencia != null && preciosDemasiadoParecidos(referencia, carta)) continue;
                return carta;
            }
        }
        throw new IllegalStateException("No encontramos suficientes cartas con precios comparables");
    }

    private boolean perteneceAlModo(CartaPokePrice carta, String modo) {
        if (!"locura".equals(modo)) return true;

        String rareza = carta.getRareza().toLowerCase();
        boolean rarezaComun = rareza.equals("common")
                || rareza.equals("uncommon")
                || rareza.equals("común")
                || rareza.equals("poco común");

        return !rarezaComun
                && carta.getPrecio().compareTo(new BigDecimal("10.00")) >= 0;
    }

    private boolean preciosDemasiadoParecidos(CartaPokePrice primera, CartaPokePrice segunda) {
        BigDecimal diferencia = primera.getPrecio().subtract(segunda.getPrecio()).abs();
        BigDecimal minimo = primera.getPrecio()
                .multiply(new BigDecimal("0.03"))
                .max(new BigDecimal("0.10"));
        return diferencia.compareTo(minimo) < 0;
    }

    private void cargarPaginaAleatoria() {
        if (totalCartas == 0) {
            JsonNode resumen = consultarPagina(1, 1);
            totalCartas = resumen.path("totalCount").asInt();
            if (totalCartas <= 0) {
                throw new IllegalStateException("La API de cartas no informó resultados");
            }
        }

        int paginas = Math.max(1, (int) Math.ceil(totalCartas / (double) TAMANO_PAGINA));
        int pagina = ThreadLocalRandom.current().nextInt(1, paginas + 1);
        JsonNode respuesta = consultarPagina(pagina, TAMANO_PAGINA);
        List<CartaPokePrice> nuevas = convertirCartas(respuesta.path("data"));
        if (nuevas.isEmpty()) return;

        cartasDisponibles.addAll(nuevas);
        if (cartasDisponibles.size() > 800) {
            cartasDisponibles.subList(0, cartasDisponibles.size() - 600).clear();
        }
    }

    private JsonNode consultarPagina(int pagina, int tamano) {
        JsonNode respuesta = api.get()
                .uri(uri -> uri
                        .path("/cards")
                        .queryParam("q", "supertype:Pokémon")
                        .queryParam("page", pagina)
                        .queryParam("pageSize", tamano)
                        .build())
                .retrieve()
                .body(JsonNode.class);
        if (respuesta == null) {
            throw new IllegalStateException("No se pudo consultar Pokémon TCG");
        }
        return respuesta;
    }

    private List<CartaPokePrice> convertirCartas(JsonNode datos) {
        List<CartaPokePrice> resultado = new ArrayList<>();
        for (JsonNode carta : datos) {
            JsonNode tcgplayer = carta.path("tcgplayer");
            JsonNode precios = tcgplayer.path("prices");
            if (precios.isMissingNode() || precios.isEmpty()) continue;

            agregarVariante(resultado, carta, tcgplayer, precios, "normal", "Normal");
            agregarVariante(resultado, carta, tcgplayer, precios, "holofoil", "Holofoil");
            agregarVariante(resultado, carta, tcgplayer, precios, "reverseHolofoil", "Reverse Holofoil");
            agregarVariante(resultado, carta, tcgplayer, precios, "1stEditionNormal", "Primera edición · Normal");
            agregarVariante(resultado, carta, tcgplayer, precios, "1stEditionHolofoil", "Primera edición · Holofoil");
        }
        return resultado;
    }

    private void agregarVariante(
            List<CartaPokePrice> resultado,
            JsonNode carta,
            JsonNode tcgplayer,
            JsonNode precios,
            String clave,
            String acabado
    ) {
        JsonNode mercado = precios.path(clave).path("market");
        if (!mercado.isNumber()) return;
        double valor = mercado.asDouble();
        if (valor < 0.05 || valor > 10000) return;

        String id = carta.path("id").asText();
        String imagen = carta.path("images").path("large").asText();
        if (id.isBlank() || imagen.isBlank()) return;

        resultado.add(new CartaPokePrice(
                id,
                id + ":" + clave,
                carta.path("name").asText("Carta Pokémon"),
                imagen,
                carta.path("set").path("name").asText("Colección desconocida"),
                carta.path("number").asText("?"),
                carta.path("rarity").asText("Rareza no indicada"),
                acabado,
                BigDecimal.valueOf(valor).setScale(2, RoundingMode.HALF_UP),
                tcgplayer.path("url").asText(""),
                tcgplayer.path("updatedAt").asText("")
        ));
    }
}
