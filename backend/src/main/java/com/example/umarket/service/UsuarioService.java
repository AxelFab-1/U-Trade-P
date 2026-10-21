package com.example.umarket.service;

import com.example.umarket.model.Usuario;
import com.example.umarket.repository.UsuarioRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class UsuarioService {
    
    private final UsuarioRepository repository;
    private final PasswordEncoder passwordEncoder;

    public UsuarioService(UsuarioRepository repository, PasswordEncoder passwordEncoder) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<Usuario> listarTodos() {
        return repository.findAll();
    }

    public Usuario buscarPorId(Long id) {
        return repository.findById(id).orElse(null);
    }

    @Transactional
    public Usuario guardarUsuario(Usuario u) {
        u.setPassword(passwordEncoder.encode(u.getPassword()));
        return repository.save(u);
    }

    @Transactional
    public Usuario actualizarUsuario(Long id, Usuario u) {
        return repository.findById(id).map(usuarioExistente -> {
            usuarioExistente.setNombre(u.getNombre());
            usuarioExistente.setCorreo(u.getCorreo());
            if (u.getPassword() != null && !u.getPassword().isBlank()) {
                usuarioExistente.setPassword(passwordEncoder.encode(u.getPassword()));
            }
            usuarioExistente.setRol(u.getRol());
            return repository.save(usuarioExistente);
        }).orElse(null);
    }

    @Transactional
    public boolean eliminarUsuario(Long id) {
        if (repository.existsById(id)) {
            repository.deleteById(id);
            return true;
        }
        return false;
    }
}
