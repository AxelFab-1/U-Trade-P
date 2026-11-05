package com.example.umarket.security;

import com.example.umarket.model.Usuario;
import com.example.umarket.repository.UsuarioRepository;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UsuarioRepository repository;

    public UserDetailsServiceImpl(UsuarioRepository repository) {
        this.repository = repository;
    }

    @Override
    public UserDetails loadUserByUsername(String correo) throws UsernameNotFoundException {
        String correoNormalizado = correo != null ? correo.trim().toLowerCase() : "";
        Usuario u = repository.findByCorreoIgnoreCase(correoNormalizado)
                .or(() -> repository.findByCorreo(correoNormalizado))
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado con correo: " + correo));
        
        return User.builder()
                .username(u.getCorreo())
                .password(u.getPassword())
                .roles(u.getRol() != null ? u.getRol() : "ESTUDIANTE")
                .build();
    }
}
