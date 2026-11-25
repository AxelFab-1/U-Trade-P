package com.example.umarket.service;

import com.example.umarket.model.Favorito;
import com.example.umarket.model.Producto;
import com.example.umarket.model.Usuario;
import com.example.umarket.repository.FavoritoRepository;
import com.example.umarket.repository.ProductoRepository;
import com.example.umarket.repository.UsuarioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@Service
public class FavoritoService {

    private final FavoritoRepository favoritoRepository;
    private final ProductoRepository productoRepository;
    private final UsuarioRepository usuarioRepository;

    public FavoritoService(FavoritoRepository favoritoRepository,
                           ProductoRepository productoRepository,
                           UsuarioRepository usuarioRepository) {
        this.favoritoRepository = favoritoRepository;
        this.productoRepository = productoRepository;
        this.usuarioRepository = usuarioRepository;
    }

    private Usuario obtenerUsuarioAutenticado() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Debes iniciar sesión para gestionar favoritos.");
        }
        return usuarioRepository.findByCorreoIgnoreCase(auth.getName())
                .or(() -> usuarioRepository.findByCorreo(auth.getName()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado en la base de datos."));
    }

    @Transactional(readOnly = true)
    public List<Producto> obtenerProductosFavoritos() {
        Usuario usuario = obtenerUsuarioAutenticado();
        return favoritoRepository.findProductosFavoritosByUsuarioId(usuario.getId());
    }

    @Transactional(readOnly = true)
    public List<Long> obtenerFavoritoIds() {
        Usuario usuario = obtenerUsuarioAutenticado();
        return favoritoRepository.findProductoIdsFavoritosByUsuarioId(usuario.getId());
    }

    @Transactional
    public Map<String, Object> toggleFavorito(Long productoId) {
        Usuario usuario = obtenerUsuarioAutenticado();

        Producto producto = productoRepository.findById(productoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "El producto no existe."));

        boolean existe = favoritoRepository.existsByUsuarioIdAndProductoId(usuario.getId(), producto.getId());

        if (existe) {
            favoritoRepository.deleteByUsuarioIdAndProductoId(usuario.getId(), producto.getId());
            return Map.of(
                    "favorito", false,
                    "productoId", productoId,
                    "mensaje", "Producto eliminado de tus guardados"
            );
        } else {
            Favorito nuevoFavorito = new Favorito(usuario, producto);
            favoritoRepository.save(nuevoFavorito);
            return Map.of(
                    "favorito", true,
                    "productoId", productoId,
                    "mensaje", "Producto guardado en tus favoritos"
            );
        }
    }

    @Transactional(readOnly = true)
    public boolean esFavorito(Long productoId) {
        Usuario usuario = obtenerUsuarioAutenticado();
        return favoritoRepository.existsByUsuarioIdAndProductoId(usuario.getId(), productoId);
    }
}
