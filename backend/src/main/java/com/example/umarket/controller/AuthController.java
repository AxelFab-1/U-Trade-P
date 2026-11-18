package com.example.umarket.controller;

import com.example.umarket.repository.UsuarioRepository;
import com.example.umarket.security.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UsuarioRepository usuarioRepository;

    public AuthController(AuthenticationManager authenticationManager, 
                          JwtService jwtService,
                          UsuarioRepository usuarioRepository) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.usuarioRepository = usuarioRepository;
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> login(@RequestBody LoginRequest req) {
        String correoNormalizado = req.correo() != null ? req.correo().trim().toLowerCase() : "";
        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(correoNormalizado, req.password())
        );

        String rol = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .findFirst().orElse("ROLE_ESTUDIANTE")
                .replace("ROLE_", "");

        String token = jwtService.generarToken(correoNormalizado, rol);

        return ResponseEntity.ok(Map.of("token", token));
    }

    @GetMapping("/perfil")
    public ResponseEntity<Map<String, Object>> obtenerPerfil(Authentication auth) {
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return usuarioRepository.findByCorreoIgnoreCase(auth.getName())
                .map(u -> {
                    String tel = u.getTelefono() != null ? u.getTelefono() : "";
                    String camp = u.getCampus() != null ? u.getCampus() : "";
                    String carr = u.getCarrera() != null ? u.getCarrera() : "";
                    boolean completo = !tel.trim().isEmpty() && !camp.trim().isEmpty() && !carr.trim().isEmpty();

                    return ResponseEntity.ok(Map.<String, Object>of(
                            "id", u.getId(),
                            "nombre", u.getNombre() != null ? u.getNombre() : "",
                            "correo", u.getCorreo(),
                            "rol", u.getRol() != null ? u.getRol() : "ESTUDIANTE",
                            "telefono", tel,
                            "campus", camp,
                            "carrera", carr,
                            "perfilCompleto", completo
                    ));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/perfil")
    public ResponseEntity<?> actualizarPerfil(Authentication auth, @RequestBody ActualizarPerfilRequest req) {
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return usuarioRepository.findByCorreoIgnoreCase(auth.getName())
                .map(u -> {
                    if (req.nombre() != null && !req.nombre().trim().isEmpty()) {
                        u.setNombre(req.nombre().trim());
                    }
                    if (req.telefono() != null) {
                        u.setTelefono(req.telefono().trim());
                    }
                    if (req.campus() != null) {
                        u.setCampus(req.campus().trim());
                    }
                    if (req.carrera() != null) {
                        u.setCarrera(req.carrera().trim());
                    }
                    usuarioRepository.save(u);

                    String tel = u.getTelefono() != null ? u.getTelefono() : "";
                    String camp = u.getCampus() != null ? u.getCampus() : "";
                    String carr = u.getCarrera() != null ? u.getCarrera() : "";
                    boolean completo = !tel.trim().isEmpty() && !camp.trim().isEmpty() && !carr.trim().isEmpty();

                    return ResponseEntity.ok(Map.<String, Object>of(
                            "id", u.getId(),
                            "nombre", u.getNombre() != null ? u.getNombre() : "",
                            "correo", u.getCorreo(),
                            "rol", u.getRol() != null ? u.getRol() : "ESTUDIANTE",
                            "telefono", tel,
                            "campus", camp,
                            "carrera", carr,
                            "perfilCompleto", completo
                    ));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}

record LoginRequest(String correo, String password) {}
record ActualizarPerfilRequest(String nombre, String telefono, String campus, String carrera) {}
