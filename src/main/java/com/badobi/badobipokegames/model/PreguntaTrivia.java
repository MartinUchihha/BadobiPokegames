package com.badobi.badobipokegames.model;

import java.util.List;

public class PreguntaTrivia {

    private final String id;
    private final String categoria;
    private final String enunciado;
    private final List<String> opciones;
    private final String respuestaCorrecta;
    private final String explicacion;

    public PreguntaTrivia(
            String id,
            String categoria,
            String enunciado,
            List<String> opciones,
            String respuestaCorrecta,
            String explicacion
    ) {
        this.id = id;
        this.categoria = categoria;
        this.enunciado = enunciado;
        this.opciones = List.copyOf(opciones);
        this.respuestaCorrecta = respuestaCorrecta;
        this.explicacion = explicacion;
    }

    public boolean comprobarRespuesta(String respuesta) {
        if (respuesta == null) {
            return false;
        }

        return respuestaCorrecta.equalsIgnoreCase(
                respuesta.trim()
        );
    }

    public String getId() {
        return id;
    }

    public String getCategoria() {
        return categoria;
    }

    public String getEnunciado() {
        return enunciado;
    }

    public List<String> getOpciones() {
        return opciones;
    }

    public String getRespuestaCorrecta() {
        return respuestaCorrecta;
    }

    public String getExplicacion() {
        return explicacion;
    }
}