package com.example.umarket.service;

import com.example.umarket.model.Usuario;
import com.example.umarket.repository.UsuarioRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UsuarioService {
    
    private final UsuarioRepository repository;

    public UsuarioService(UsuarioRepository repository) {
        this.repository = repository;
    }

    public List<Usuario> listarTodos() {
        return repository.findAll();
    }

    public Usuario guardarUsuario(Usuario u) {
        return repository.save(u);
    }

    public boolean eliminarUsuario(Long id) {
        return repository.deleteById(id);
    }

    public Usuario buscarPorId(Long id) {
    return repository.findById(id).orElse(null);
}

    public Usuario actualizarUsuario(Long id, Usuario u) {
        return repository.update(id, u);
    }
}
