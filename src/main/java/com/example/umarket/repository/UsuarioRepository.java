package com.example.umarket.repository;

import com.example.umarket.model.Usuario;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Repository;

import java.io.File;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Repository
public class UsuarioRepository {
    private final ObjectMapper objectMapper;
    private final File archivo = new File("data/usuarios.json");
    private List<Usuario> usuarios = new ArrayList<>();

    public UsuarioRepository(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    public void cargarDatos() throws Exception {
        if (archivo.exists()) {
            usuarios = objectMapper.readValue(archivo, new TypeReference<List<Usuario>>() {});
        } else {
            archivo.getParentFile().mkdirs();
            persistir();
        }
    }

    private void persistir() {
        try {
            objectMapper.writerWithDefaultPrettyPrinter().writeValue(archivo, usuarios);
        } catch (Exception e) {
            throw new RuntimeException("Error al guardar el JSON de usuarios", e);
        }
    }

    public List<Usuario> findAll() {
        return usuarios;
    }

    public Optional<Usuario> findById(Long id) {
        return usuarios.stream().filter(u -> u.id().equals(id)).findFirst();
    }

    public Usuario save(Usuario u) {
        long nuevoId = usuarios.stream().mapToLong(Usuario::id).max().orElse(0L) + 1;
        Usuario nuevoUsuario = new Usuario(nuevoId, u.nombre(), u.correo(), u.password());
        usuarios.add(nuevoUsuario);
        persistir();
        return nuevoUsuario;
    }

        public Usuario update(Long id, Usuario u) {
        boolean eliminado = usuarios.removeIf(prod -> prod.id().equals(id));
        if (eliminado) {
            Usuario actualizado = new Usuario(id, u.nombre(), u.correo(), u.password());
            usuarios.add(actualizado);
            persistir();
            return actualizado;
        }
        return null;
    }

    public boolean deleteById(Long id) {
        boolean eliminado = usuarios.removeIf(u -> u.id().equals(id));
        if (eliminado) persistir();
        return eliminado;
    }
}