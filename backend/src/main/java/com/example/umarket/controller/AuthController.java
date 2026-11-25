package com.example.umarket.controller;

import com.example.umarket.repository.UsuarioRepository;
import com.example.umarket.security.JwtService;
import com.example.umarket.service.CodigoVerificacionService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
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
    private final CodigoVerificacionService codigoVerificacionService;
    private final UsuarioRepository usuarioRepository;

    public AuthController(AuthenticationManager authenticationManager, 
                          JwtService jwtService,
                          CodigoVerificacionService codigoVerificacionService,
                          UsuarioRepository usuarioRepository) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.codigoVerificacionService = codigoVerificacionService;
        this.usuarioRepository = usuarioRepository;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req) {
        String correoNormalizado = req.correo() != null ? req.correo().trim().toLowerCase() : "";
        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(correoNormalizado, req.password())
        );

        // Validar si la cuenta está suspendida
        var usuarioOpt = usuarioRepository.findByCorreoIgnoreCase(correoNormalizado);
        if (usuarioOpt.isPresent() && usuarioOpt.get().isSuspendido()) {
            var u = usuarioOpt.get();
            java.time.format.DateTimeFormatter fmt = java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
            String fechaStr = u.getSuspendidoHasta().getYear() > 2090 
                    ? "de forma indefinida" 
                    : "hasta el " + u.getSuspendidoHasta().format(fmt);
            String motivo = (u.getMotivoSuspension() != null && !u.getMotivoSuspension().isBlank())
                    ? u.getMotivoSuspension()
                    : "Infracción a las normas de la comunidad";
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                    "error", "CUENTA_SUSPENDIDA",
                    "mensaje", "Tu cuenta se encuentra suspendida " + fechaStr + ". Motivo: " + motivo
            ));
        }

        String rol = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .findFirst().orElse("ROLE_ESTUDIANTE")
                .replace("ROLE_", "");

        String token = jwtService.generarToken(correoNormalizado, rol);

        return ResponseEntity.ok(Map.of("token", token));
    }

    @PostMapping("/enviar-codigo-verificacion")
    public ResponseEntity<Map<String, Object>> enviarCodigoVerificacion(@RequestBody EnviarCodigoRequest req) {
        String correoNormalizado = req.correo() != null ? req.correo().trim().toLowerCase() : "";
        String nombreNormalizado = req.nombre() != null ? req.nombre().trim() : "";
        codigoVerificacionService.generarYEnviarCodigo(correoNormalizado, nombreNormalizado);
        return ResponseEntity.ok(Map.of(
                "exitoso", true,
                "mensaje", "Código de verificación enviado a tu correo institucional " + correoNormalizado
        ));
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
    public ResponseEntity<?> actualizarPerfil(Authentication auth, @Valid @RequestBody ActualizarPerfilRequest req) {
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

record LoginRequest(
    @NotBlank(message = "El correo es obligatorio")
    String correo,

    @NotBlank(message = "La contraseña es obligatoria")
    String password
) {}

record EnviarCodigoRequest(String correo, String nombre) {}

record ActualizarPerfilRequest(
    @NotBlank(message = "El nombre es obligatorio")
    @Size(min = 3, max = 60, message = "El nombre debe tener entre 3 y 60 caracteres")
    String nombre,

    @Pattern(regexp = "^$|^9\\d{8}$", message = "El celular debe tener 9 dígitos y empezar con 9")
    String telefono,

    @Size(max = 100, message = "El campus no debe exceder 100 caracteres")
    String campus,

    @Size(max = 100, message = "La carrera no debe exceder 100 caracteres")
    String carrera
) {}
