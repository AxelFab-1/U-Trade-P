package com.example.umarket.service;

import com.example.umarket.model.Pedido;
import com.example.umarket.model.Producto;
import com.example.umarket.model.Usuario;
import com.example.umarket.repository.FavoritoRepository;
import com.example.umarket.repository.PedidoRepository;
import com.example.umarket.repository.ProductoRepository;
import com.example.umarket.repository.ReporteRepository;
import com.example.umarket.repository.UsuarioRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.Authentication;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UsuarioService {
    
    private final UsuarioRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final ProductoRepository productoRepository;
    private final PedidoRepository pedidoRepository;
    private final FavoritoRepository favoritoRepository;
    private final ReporteRepository reporteRepository;

    public UsuarioService(UsuarioRepository repository, 
                          PasswordEncoder passwordEncoder,
                          ProductoRepository productoRepository,
                          PedidoRepository pedidoRepository,
                          FavoritoRepository favoritoRepository,
                          ReporteRepository reporteRepository) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
        this.productoRepository = productoRepository;
        this.pedidoRepository = pedidoRepository;
        this.favoritoRepository = favoritoRepository;
        this.reporteRepository = reporteRepository;
    }

    public List<Usuario> listarTodos() {
        return repository.findAll();
    }

    public Usuario buscarPorId(Long id) {
        return repository.findById(id).orElse(null);
    }

    public boolean existePorCorreo(String correo) {
        return repository.findByCorreoIgnoreCase(correo).isPresent();
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
        Usuario usuario = repository.findById(id).orElse(null);
        if (usuario == null) {
            return false;
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()) {
            String correoAutenticado = auth.getName();
            if (usuario.getCorreo() != null && usuario.getCorreo().equalsIgnoreCase(correoAutenticado)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No puedes eliminar tu propia cuenta de administrador.");
            }
        }

        favoritoRepository.deleteByUsuarioId(id);
        reporteRepository.deleteByUsuarioDenuncianteId(id);

        pedidoRepository.deleteByCompradorId(id);

        List<Producto> productosComprados = productoRepository.findByCompradorId(id);
        for (Producto p : productosComprados) {
            p.setComprador(null);
            p.setDisponible(true);
            productoRepository.save(p);
        }

        List<Pedido> ventasComoVendedor = pedidoRepository.findByVendedorId(id);
        for (Pedido pedido : ventasComoVendedor) {
            pedido.setVendedor(null);
            pedidoRepository.save(pedido);
        }

        List<Producto> publicacionesUsuario = productoRepository.findByVendedorId(id);
        for (Producto p : publicacionesUsuario) {
            favoritoRepository.deleteByProductoId(p.getId());
            reporteRepository.deleteByProductoId(p.getId());
            boolean tieneVentasHistoricas = pedidoRepository.existsByProductoId(p.getId());
            if (tieneVentasHistoricas) {
                p.setVendedor(null);
                p.setDisponible(false);
                p.setStock(0);
                productoRepository.save(p);
            } else {
                productoRepository.delete(p);
            }
        }

        repository.delete(usuario);
        return true;
    }

    @Transactional
    public Usuario suspenderUsuario(Long id, Integer dias, String motivo) {
        Usuario usuario = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()) {
            String correoAutenticado = auth.getName();
            if (usuario.getCorreo() != null && usuario.getCorreo().equalsIgnoreCase(correoAutenticado)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No puedes suspender tu propia cuenta de administrador.");
            }
        }

        if (dias == null || dias <= 0) {
            // Indefinido: 100 años
            usuario.setSuspendidoHasta(java.time.LocalDateTime.now().plusYears(100));
        } else if (dias == 1) {
            // 24 horas exactas
            usuario.setSuspendidoHasta(java.time.LocalDateTime.now().plusHours(24));
        } else {
            usuario.setSuspendidoHasta(java.time.LocalDateTime.now().plusDays(dias));
        }

        usuario.setMotivoSuspension(motivo != null && !motivo.isBlank() ? motivo.trim() : "Infracción a las normas de convivencia");
        return repository.save(usuario);
    }

    @Transactional
    public Usuario reactivarUsuario(Long id) {
        Usuario usuario = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));

        usuario.setSuspendidoHasta(null);
        usuario.setMotivoSuspension(null);
        return repository.save(usuario);
    }
}
