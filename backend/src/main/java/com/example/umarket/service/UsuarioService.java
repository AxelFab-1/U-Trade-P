package com.example.umarket.service;

import com.example.umarket.model.Pedido;
import com.example.umarket.model.Producto;
import com.example.umarket.model.Usuario;
import com.example.umarket.repository.PedidoRepository;
import com.example.umarket.repository.ProductoRepository;
import com.example.umarket.repository.UsuarioRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UsuarioService {
    
    private final UsuarioRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final ProductoRepository productoRepository;
    private final PedidoRepository pedidoRepository;

    public UsuarioService(UsuarioRepository repository, 
                          PasswordEncoder passwordEncoder,
                          ProductoRepository productoRepository,
                          PedidoRepository pedidoRepository) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
        this.productoRepository = productoRepository;
        this.pedidoRepository = pedidoRepository;
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

        // 1. Eliminar compras realizadas por el usuario sancionado (su historial de compras)
        pedidoRepository.deleteByCompradorId(id);

        // 2. Liberar compras de productos ajenos donde el sancionado figuraba como comprador
        List<Producto> productosComprados = productoRepository.findByCompradorId(id);
        for (Producto p : productosComprados) {
            p.setComprador(null);
            p.setDisponible(true);
            productoRepository.save(p);
        }

        // 3. Proteger el historial de los compradores legítimos:
        //    Si otros estudiantes le compraron productos a este vendedor sancionado,
        //    conservamos el Pedido en "Mis Compras" pero desvinculamos la FK al vendedor sancionado.
        List<Pedido> ventasComoVendedor = pedidoRepository.findByVendedorId(id);
        for (Pedido pedido : ventasComoVendedor) {
            pedido.setVendedor(null);
            pedidoRepository.save(pedido);
        }

        // 4. Gestionar las publicaciones del usuario sancionado:
        List<Producto> publicacionesUsuario = productoRepository.findByVendedorId(id);
        for (Producto p : publicacionesUsuario) {
            boolean tieneVentasHistoricas = pedidoRepository.existsByProductoId(p.getId());
            if (tieneVentasHistoricas) {
                // Si el producto fue comprado por un alumno, lo conservamos como histórico vendido
                // (desvinculamos vendedor, stock en 0 y no disponible), para que el voucher mantenga foto y título.
                p.setVendedor(null);
                p.setDisponible(false);
                p.setStock(0);
                productoRepository.save(p);
            } else {
                // Si nadie lo compró (publicación indebida sin ventas), se elimina definitivamente del catálogo
                productoRepository.delete(p);
            }
        }

        // 5. Con todas las claves foráneas resueltas y los pedidos de los compradores protegidos, eliminar al usuario
        repository.delete(usuario);
        return true;
    }
}
