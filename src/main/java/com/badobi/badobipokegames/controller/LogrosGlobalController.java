package com.badobi.badobipokegames.controller;
import com.badobi.badobipokegames.service.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
public class LogrosGlobalController{
    private final LogrosService service;
    public LogrosGlobalController(LogrosService service){this.service=service;}
    @GetMapping("/api/logros")
    public Map<String,Object> resumen(@CookieValue(name=RankingGlobalService.COOKIE,required=false)String token){return service.resumen(token);}
    @PostMapping("/api/logros/canjear")
    public ResponseEntity<Map<String,Object>> canjear(@RequestParam String recompensa,@CookieValue(name=RankingGlobalService.COOKIE,required=false)String token){
        try{return ResponseEntity.ok(service.canjear(token,recompensa));}
        catch(IllegalArgumentException e){return ResponseEntity.badRequest().body(Map.of("error",e.getMessage()));}
    }
    @PostMapping("/api/logros/equipar-avatar")
    public ResponseEntity<Map<String,Object>> equiparAvatar(@RequestParam String recompensa,@CookieValue(name=RankingGlobalService.COOKIE,required=false)String token){
        try{return ResponseEntity.ok(service.equiparAvatar(token,recompensa));}
        catch(IllegalArgumentException e){return ResponseEntity.badRequest().body(Map.of("error",e.getMessage()));}
    }
}
