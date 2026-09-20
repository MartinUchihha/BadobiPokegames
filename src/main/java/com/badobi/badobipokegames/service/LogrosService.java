package com.badobi.badobipokegames.service;

import com.badobi.badobipokegames.model.*;
import com.badobi.badobipokegames.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class LogrosService {
    private record Logro(String clave,String nombre,String descripcion,String icono,String dificultad,int medallas,String metrica,int objetivo,boolean secreto) {}
    private record Premio(
            String clave,
            String nombre,
            String descripcion,
            String icono,
            int precio,
            String tipo,
            int pokemonId
    ) {}

    private static final List<Logro> LOGROS=List.of(
            new Logro("crear-perfil","Identidad Pokémon","Crea tu entrenador global.","🪪","Fácil",10,"perfil",1,false),
            new Logro("primera-partida","Primeros pasos","Completa tu primera partida.","🎮","Fácil",10,"partidas",1,false),
            new Logro("primera-victoria","¡Te elijo a ti!","Consigue tu primera victoria.","🏆","Fácil",10,"victorias",1,false),
            new Logro("diez-partidas","Entrenador constante","Completa diez partidas en Badobi Pokégames.","🎲","Media",30,"partidas",10,false),
            new Logro("cincuenta-partidas","Aventurero incansable","Completa cincuenta partidas.","🗺️","Difícil",75,"partidas",50,false),
            new Logro("cien-partidas","Leyenda de Badobi","Completa cien partidas.","🌟","Legendaria",200,"partidas",100,false),
            new Logro("diez-victorias","Racha ganadora","Consigue diez victorias.","🥉","Media",30,"victorias",10,false),
            new Logro("cincuenta-victorias","Campeón Pokémon","Consigue cincuenta victorias.","🏆","Legendaria",200,"victorias",50,false),
            new Logro("cinco-juegos","Explorador","Prueba cinco juegos diferentes.","🧭","Media",30,"juegos",5,false),
            new Logro("siete-dias","Semana Pokémon","Juega durante siete días distintos.","📅","Media",30,"dias",7,false),
            new Logro("pokedle-primero","Pokédex humana","Resuelve un Pokédle al primer intento.","🎯","Difícil",75,"pokedle-mejor",1,false),
            new Logro("pokedle-cinco","Entrenador Pokédle","Gana cinco partidas de Pokédle.","⚡","Media",30,"pokedle-victorias",5,false),
            new Logro("pokedle-veinticinco","Maestro Pokédle","Gana veinticinco partidas de Pokédle.","👑","Difícil",75,"pokedle-victorias",25,false),
            new Logro("fusion-primera","Fusionador novato","Resuelve tu primera PokéFusion.","🧬","Fácil",10,"fusion-victorias",1,false),
            new Logro("fusion-diez","Genio de la fusión","Resuelve diez PokéFusion diferentes.","🧪","Difícil",75,"fusion-victorias",10,false),
            new Logro("price-uno","Tasador novato","Acierta tu primera comparación en PokéPrice.","💵","Fácil",10,"pokeprice-racha",1,false),
            new Logro("price-cinco","Coleccionista","Consigue una racha de 5 en PokéPrice.","✨","Media",30,"pokeprice-racha",5,false),
            new Logro("price-diez","Experto TCG","Consigue una racha de 10 en PokéPrice.","💎","Difícil",75,"pokeprice-racha",10,false),
            new Logro("price-veinte","Magnate TCG","Consigue una racha de 20 en PokéPrice.","💰","Legendaria",200,"pokeprice-racha",20,false),
            new Logro("higher-uno","Primera predicción","Acierta una comparación de estadísticas.","📈","Fácil",10,"higher-racha",1,false),
            new Logro("higher-cinco","Buen ojo","Consigue una racha de 5 en Higher or Lower.","👁️","Media",30,"higher-racha",5,false),
            new Logro("higher-diez","Analista Pokémon","Consigue una racha de 10 en Higher or Lower.","📊","Difícil",75,"higher-racha",10,false),
            new Logro("higher-cincuenta","Oráculo estadístico","Consigue una racha de 50 en Higher or Lower.","🔮","Legendaria",200,"higher-racha",50,false),
            new Logro("stat-primera","Primer combate","Gana una partida de Stat Battle.","⚔️","Fácil",10,"stat-victorias",1,false),
            new Logro("stat-perfecta","Victoria perfecta","Gana un Stat Battle por 4 a 0.","🛡️","Difícil",75,"stat-perfectas",1,false),
            new Logro("stat-cinco","Estratega supremo","Gana cinco Stat Battle consecutivos.","🏅","Legendaria",200,"stat-racha",5,false),
            new Logro("silueta-uno","Ojo de entrenador","Reconoce tu primera silueta.","👤","Fácil",10,"silueta-aciertos",1,false),
            new Logro("silueta-cinco","Vista de Noctowl","Reconoce cinco siluetas seguidas.","🦉","Difícil",75,"silueta-racha",5,false),
            new Logro("sonido-uno","Buen oído","Reconoce tu primer sonido Pokémon.","🔊","Fácil",10,"sonido-aciertos",1,false),
            new Logro("sonido-diez","Oído absoluto","Reconoce diez sonidos seguidos.","🎧","Difícil",75,"sonido-racha",10,false),
            new Logro("trivia-diez","Profesor Pokémon","Responde diez preguntas correctamente.","❓","Media",30,"trivia-aciertos",10,false),
            new Logro("trivia-perfecta","Sabio Pokémon","Termina una trivia perfecta.","🧠","Legendaria",200,"trivia-perfectas",1,false),
            new Logro("zoom-uno","Detalle revelador","Reconoce tu primer Pokémon con zoom.","🔍","Fácil",10,"zoom-victorias",1,false),
            new Logro("movimientos-uno","Maestro de movimientos","Adivina un Pokémon por sus movimientos.","💥","Media",30,"movimientos-victorias",1,false),
            new Logro("match-primera","Primera pareja","Completa tu primera partida de PokéMatch.","🧩","Fácil",10,"pokematch-partidas",1,false),
            new Logro("match-diez","Memoria entrenada","Completa diez partidas de PokéMatch.","🧠","Media",30,"pokematch-partidas",10,false),
            new Logro("match-cincuenta","Memoria prodigiosa","Completa cincuenta partidas de PokéMatch.","🔮","Legendaria",200,"pokematch-partidas",50,false),
            new Logro("match-doce-parejas","Colección inicial","Encuentra doce parejas en PokéMatch.","🎴","Fácil",10,"pokematch-parejas",12,false),
            new Logro("match-cien-parejas","Coleccionista de parejas","Encuentra cien parejas en total.","📚","Media",30,"pokematch-parejas",100,false),
            new Logro("match-quinientas-parejas","Archivo completo","Encuentra quinientas parejas en total.","🗃️","Difícil",75,"pokematch-parejas",500,false),
            new Logro("match-primera-victoria","Duelo de memoria","Gana una partida de PokéMatch.","⚔️","Fácil",10,"pokematch-victorias",1,false),
            new Logro("match-diez-victorias","Especialista en parejas","Gana diez partidas de PokéMatch.","🥇","Difícil",75,"pokematch-victorias",10,false),
            new Logro("match-combo-cinco","Memoria en llamas","Consigue un combo de cinco parejas.","🔥","Media",30,"pokematch-combo",5,false),
            new Logro("match-combo-diez","Cadena perfecta","Consigue un combo de diez parejas.","⛓️","Difícil",75,"pokematch-combo",10,false),
            new Logro("match-vencer-maestro","Derrota a la élite","Vence a un rival de nivel Maestro.","👑","Legendaria",200,"pokematch-maestro-victorias",1,false),
            new Logro("match-144","Mente legendaria","Completa y gana el tablero de 144 fichas.","🌌","Legendaria",200,"pokematch-144-victorias",1,false),
            new Logro("regiones-nueve","Maestro regional","Gana utilizando las nueve generaciones.","🌎","Legendaria",200,"generaciones",9,false),
            new Logro("top-tres","Élite de temporada","Finaliza una temporada entre los tres mejores.","🥇","Legendaria",200,"top-temporada",1,false),
            new Logro("secreto-total","¿Quién es ese Pokémon?","Este logro permanecerá oculto hasta que descubras su condición.","❔","Secreta",150,"secreto",1,true)
    );

    private static final List<Premio> PREMIOS=List.of(
            new Premio("avatar-pikachu","Avatar Pikachu","Equipa a Pikachu como imagen de tu entrenador.","⚡",80,"avatar",25),
            new Premio("avatar-eevee","Avatar Eevee","Equipa a Eevee como imagen de tu entrenador.","✨",100,"avatar",133),
            new Premio("avatar-bulbasaur","Avatar Bulbasaur","Equipa a Bulbasaur como imagen de tu entrenador.","🌿",120,"avatar",1),
            new Premio("avatar-charmander","Avatar Charmander","Equipa a Charmander como imagen de tu entrenador.","🔥",120,"avatar",4),
            new Premio("avatar-squirtle","Avatar Squirtle","Equipa a Squirtle como imagen de tu entrenador.","💧",120,"avatar",7),
            new Premio("avatar-gengar","Avatar Gengar","Equipa a Gengar como imagen de tu entrenador.","👻",200,"avatar",94),
            new Premio("avatar-lucario","Avatar Lucario","Equipa a Lucario como imagen de tu entrenador.","🥋",250,"avatar",448),
            new Premio("avatar-mimikyu","Avatar Mimikyu","Equipa a Mimikyu como imagen de tu entrenador.","🌙",300,"avatar",778),
            new Premio("avatar-greninja","Avatar Greninja","Equipa a Greninja como imagen de tu entrenador.","🥷",350,"avatar",658),
            new Premio("avatar-rayquaza","Avatar Rayquaza","Equipa al legendario Rayquaza.","🐉",500,"avatar",384),
            new Premio("avatar-mewtwo","Avatar Mewtwo","Equipa al poderoso Mewtwo.","🔮",600,"avatar",150),
            new Premio("marco-fuego","Marco Fuego","Un marco ardiente para tu entrenador.","🔥",100,"cosmetico",0),
            new Premio("marco-agua","Marco Agua","Un marco inspirado en el océano.","💧",100,"cosmetico",0),
            new Premio("titulo-tcg","Título Maestro TCG","Presume tu pasión por las cartas.","💎",250,"cosmetico",0),
            new Premio("tema-dorado","Tema dorado","Una apariencia especial para tu perfil.","🌟",400,"cosmetico",0),
            new Premio("confeti-legendario","Confeti legendario","Una celebración de victoria exclusiva.","🎉",600,"cosmetico",0),
            new Premio("marco-campeon","Marco Campeón","La recompensa máxima de la tienda.","👑",1000,"cosmetico",0)
    );

    private final JugadorRankingRepository jugadores;
    private final ProgresoLogroRepository progresos;
    private final RecompensaDesbloqueadaRepository recompensas;

    public LogrosService(JugadorRankingRepository jugadores,ProgresoLogroRepository progresos,RecompensaDesbloqueadaRepository recompensas){
        this.jugadores=jugadores;this.progresos=progresos;this.recompensas=recompensas;
    }

    @Transactional
    public void actualizarMaximo(String token,String metrica,int valor){
        JugadorRanking jugador=buscar(token); if(jugador==null)return;
        for(Logro logro:LOGROS){
            if(!logro.metrica().equals(metrica))continue;
            ProgresoLogro progreso=progresos.findByJugadorAndLogro(jugador,logro.clave()).orElseGet(()->new ProgresoLogro(jugador,logro.clave()));
            if(progreso.actualizar(valor,logro.objetivo())) jugador.sumarMedallas(logro.medallas());
            progresos.save(progreso);
        }
        jugadores.save(jugador);
    }

    @Transactional
    public void incrementar(String token,String metrica,int cantidad){
        JugadorRanking jugador=buscar(token); if(jugador==null||cantidad<=0)return;
        for(Logro logro:LOGROS){
            if(!logro.metrica().equals(metrica))continue;
            ProgresoLogro progreso=progresos.findByJugadorAndLogro(jugador,logro.clave()).orElseGet(()->new ProgresoLogro(jugador,logro.clave()));
            if(progreso.actualizar(progreso.getProgreso()+cantidad,logro.objetivo()))jugador.sumarMedallas(logro.medallas());
            progresos.save(progreso);
        }
        jugadores.save(jugador);
    }

    @Transactional
    public Map<String,Object> resumen(String token){
        JugadorRanking jugador=buscar(token); if(jugador==null)return Map.of("registrado",false);
        Logro logroPerfil=LOGROS.getFirst();
        ProgresoLogro perfil=progresos.findByJugadorAndLogro(jugador,logroPerfil.clave()).orElseGet(()->new ProgresoLogro(jugador,logroPerfil.clave()));
        if(perfil.actualizar(1,logroPerfil.objetivo())){
            jugador.sumarMedallas(logroPerfil.medallas());
            jugadores.save(jugador);
        }
        progresos.save(perfil);
        Map<String,ProgresoLogro> porClave=progresos.findByJugador(jugador).stream().collect(Collectors.toMap(ProgresoLogro::getLogro,Function.identity()));
        Set<String> compradas=recompensas.findByJugador(jugador).stream().map(RecompensaDesbloqueada::getRecompensa).collect(Collectors.toSet());
        List<Map<String,Object>> lista=LOGROS.stream().map(logro->mapearLogro(logro,porClave.get(logro.clave()))).toList();
        long completados=lista.stream().filter(item->Boolean.TRUE.equals(item.get("completado"))).count();
        return Map.of("registrado",true,"medallas",jugador.getMedallas(),"completados",completados,"total",LOGROS.size(),"logros",lista,"avatar",jugador.getAvatar(),"recompensas",PREMIOS.stream().map(p->mapearPremio(p,compradas.contains(p.clave()),jugador.getAvatar())).toList());
    }

    @Transactional
    public Map<String,Object> canjear(String token,String clave){
        JugadorRanking jugador=buscar(token); if(jugador==null)throw new IllegalArgumentException("Primero crea tu entrenador");
        Premio premio=PREMIOS.stream().filter(p->p.clave().equals(clave)).findFirst().orElseThrow(()->new IllegalArgumentException("Recompensa desconocida"));
        if(recompensas.existsByJugadorAndRecompensa(jugador,clave))throw new IllegalArgumentException("Ya tienes esta recompensa");
        jugador.gastarMedallas(premio.precio());
        if(premio.tipo().equals("avatar"))jugador.cambiarAvatar("pokemon-"+premio.pokemonId());
        jugadores.save(jugador);recompensas.save(new RecompensaDesbloqueada(jugador,clave));
        return Map.of("correcto",true,"medallas",jugador.getMedallas(),"recompensa",premio.nombre(),"avatar",jugador.getAvatar());
    }

    @Transactional
    public Map<String,Object> equiparAvatar(String token,String clave){
        JugadorRanking jugador=buscar(token); if(jugador==null)throw new IllegalArgumentException("Primero crea tu entrenador");
        Premio premio=PREMIOS.stream().filter(p->p.clave().equals(clave)&&p.tipo().equals("avatar")).findFirst().orElseThrow(()->new IllegalArgumentException("Avatar desconocido"));
        if(!recompensas.existsByJugadorAndRecompensa(jugador,clave))throw new IllegalArgumentException("Primero debes conseguir este avatar");
        jugador.cambiarAvatar("pokemon-"+premio.pokemonId());
        jugadores.save(jugador);
        return Map.of("correcto",true,"avatar",jugador.getAvatar(),"recompensa",premio.nombre());
    }

    private JugadorRanking buscar(String token){return token==null?null:jugadores.findByToken(token).orElse(null);}
    private Map<String,Object> mapearLogro(Logro l,ProgresoLogro p){
        boolean completo=p!=null&&p.isCompletado(); boolean oculto=l.secreto()&&!completo;
        Map<String,Object> m=new LinkedHashMap<>();m.put("clave",l.clave());m.put("nombre",oculto?"Logro secreto":l.nombre());m.put("descripcion",oculto?"Sigue jugando para descubrirlo.":l.descripcion());m.put("icono",oculto?"❔":l.icono());m.put("dificultad",l.dificultad());m.put("medallas",l.medallas());m.put("progreso",p==null?0:p.getProgreso());m.put("objetivo",l.objetivo());m.put("completado",completo);return m;
    }
    private Map<String,Object> mapearPremio(Premio p,boolean comprada,String avatarActual){
        Map<String,Object> m=new LinkedHashMap<>();
        m.put("clave",p.clave());m.put("nombre",p.nombre());m.put("descripcion",p.descripcion());m.put("icono",p.icono());m.put("precio",p.precio());m.put("comprada",comprada);m.put("tipo",p.tipo());m.put("pokemonId",p.pokemonId());m.put("equipada",p.tipo().equals("avatar")&&avatarActual.equals("pokemon-"+p.pokemonId()));return m;
    }
}
