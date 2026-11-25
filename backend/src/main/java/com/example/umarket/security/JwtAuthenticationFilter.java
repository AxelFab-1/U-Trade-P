package com.example.umarket.security;

import com.example.umarket.repository.UsuarioRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UsuarioRepository usuarioRepository;

    public JwtAuthenticationFilter(JwtService jwtService, UsuarioRepository usuarioRepository) {
        this.jwtService = jwtService;
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        
        String cabecera = request.getHeader("Authorization");

        if (cabecera != null && cabecera.startsWith("Bearer ")) {
            String token = cabecera.substring(7);

            if (jwtService.esValido(token)) {
                String correo = jwtService.extraerCorreo(token);
                String rol = jwtService.extraerRol(token);

                // Revocación inmediata: validar existencia en BD y que no esté suspendido antes de autorizar la sesión
                if (correo != null) {
                    var uOpt = usuarioRepository.findByCorreoIgnoreCase(correo.trim());
                    if (uOpt.isPresent() && !uOpt.get().isSuspendido()) {
                        var autoridades = List.of(new SimpleGrantedAuthority("ROLE_" + rol));
                        
                        var auth = new UsernamePasswordAuthenticationToken(correo, null, autoridades);
                        SecurityContextHolder.getContext().setAuthentication(auth);
                    }
                }
            }
        }
        
        filterChain.doFilter(request, response);
    }
}
