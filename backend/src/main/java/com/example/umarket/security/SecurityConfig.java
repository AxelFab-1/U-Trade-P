package com.example.umarket.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(); 
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager(); 
    }

    // Configuración explícita de CORS requerida para Spring Security (Requisito Unidad 3 - Semana 14)
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:4200"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, JwtAuthenticationFilter jwtFiltro) throws Exception {
        http
            // Habilitación de CORS mediante el bean corsConfigurationSource()
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable()) 
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**", "/error").permitAll() 
                .requestMatchers("/h2-console/**").permitAll() 
                
                // Catálogo de Productos: GET público para explorar, mutaciones protegidas con RBAC
                .requestMatchers(HttpMethod.GET, "/api/productos/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/productos/**").hasAnyRole("ESTUDIANTE", "ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/productos/**").hasAnyRole("ESTUDIANTE", "ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/productos/**").hasAnyRole("ESTUDIANTE", "ADMIN")                
                
                // Pasarela Yape y Pedidos
                .requestMatchers("/api/pagos/**").hasAnyRole("ESTUDIANTE", "ADMIN")
                .requestMatchers("/api/pedidos/**").hasAnyRole("ESTUDIANTE", "ADMIN")

                // Reglas para Usuarios
                .requestMatchers(HttpMethod.POST, "/api/usuarios").permitAll() 
                .requestMatchers("/api/usuarios/**").hasRole("ADMIN")
                .anyRequest().authenticated() 
            )
            .addFilterBefore(jwtFiltro, UsernamePasswordAuthenticationFilter.class) 
            .headers(h -> h.frameOptions(frame -> frame.sameOrigin())); 

        return http.build();
    }
}
