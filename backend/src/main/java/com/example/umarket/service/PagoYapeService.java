package com.example.umarket.service;

import com.example.umarket.dto.PagoYapeRequest;
import com.example.umarket.dto.PagoYapeResponse;
import com.example.umarket.model.Pedido;
import com.example.umarket.model.Producto;
import com.example.umarket.model.Usuario;
import com.example.umarket.repository.PedidoRepository;
import com.example.umarket.repository.ProductoRepository;
import com.example.umarket.repository.UsuarioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;

@Service
public class PagoYapeService {

    private final ProductoRepository productoRepository;
    private final PedidoRepository pedidoRepository;
    private final UsuarioRepository usuarioRepository;

    public PagoYapeService(ProductoRepository productoRepository,
                           PedidoRepository pedidoRepository,
                           UsuarioRepository usuarioRepository) {
        this.productoRepository = productoRepository;
        this.pedidoRepository = pedidoRepository;
        this.usuarioRepository = usuarioRepository;
    }

    private Usuario obtenerUsuarioAutenticado() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Debes iniciar sesión para realizar compras o consultar pedidos.");
        }
        return usuarioRepository.findByCorreoIgnoreCase(auth.getName())
                .or(() -> usuarioRepository.findByCorreo(auth.getName()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado en la base de datos."));
    }

    @Transactional
    public PagoYapeResponse procesarPagoYape(PagoYapeRequest request) {
        Usuario comprador = obtenerUsuarioAutenticado();

        if (request == null || request.getProductoId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Datos de la compra incompletos.");
        }

        // 1. Validación de número de celular peruano (9 dígitos iniciando con 9)
        String celular = request.getCelular() != null ? request.getCelular().trim() : "";
        if (!celular.matches("^9\\d{8}$")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El número de celular debe tener 9 dígitos y empezar con 9.");
        }

        // 2. Validación de código de aprobación OTP (6 dígitos)
        String codigo = request.getCodigoAprobacion() != null ? request.getCodigoAprobacion().trim() : "";
        if (!codigo.matches("^\\d{6}$")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El código de aprobación de Yape debe tener 6 dígitos numéricos.");
        }

        // Caso de prueba académica para simular excepción
        if ("000000".equals(codigo)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Código de aprobación expirado o inválido. Genera uno nuevo en tu app Yape.");
        }

        // 3. Obtener Producto y validar disponibilidad
        Producto producto = productoRepository.findById(request.getProductoId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "La publicación no existe."));

        if (producto.getDisponible() != null && !producto.getDisponible()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Lo sentimos, esta publicación no está disponible o se encuentra pausada temporalmente por el vendedor.");
        }

        if (producto.getVendedor() != null) {
            boolean mismoId = producto.getVendedor().getId() != null && producto.getVendedor().getId().equals(comprador.getId());
            boolean mismoCorreo = producto.getVendedor().getCorreo() != null && producto.getVendedor().getCorreo().equalsIgnoreCase(comprador.getCorreo());
            if (mismoId || mismoCorreo) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No puedes comprar tu propia publicación.");
            }
        }

        // 4. Lógica de stock según tipo de producto o stock configurado
        int stockActual = (producto.getStock() != null) ? producto.getStock() : 1;
        boolean tieneStockMultiple = stockActual > 1 || "Comida".equalsIgnoreCase(producto.getCategoria());
        int cantidadComprar = (request.getCantidad() != null && request.getCantidad() > 0) ? request.getCantidad() : 1;

        if (tieneStockMultiple) {
            if (cantidadComprar > stockActual) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                        "Stock insuficiente. Solo quedan " + stockActual + " unidades disponibles.");
            }
            int nuevoStock = stockActual - cantidadComprar;
            producto.setStock(nuevoStock);
            if (nuevoStock <= 0) {
                producto.setDisponible(false);
            }
        } else {
            // Producto único o servicio: venta unitaria
            cantidadComprar = 1;
            producto.setStock(0);
            producto.setDisponible(false);
            producto.setComprador(comprador);
        }

        productoRepository.save(producto);

        // 5. Generar código de transacción Yape Sandbox
        String numeroTransaccion = "YAPE-TX-" + String.format("%06d", new Random().nextInt(1000000));
        double montoTotal = producto.getPrecio() * cantidadComprar;

        // 6. Registrar Pedido
        Pedido pedido = new Pedido(
                producto,
                comprador,
                producto.getVendedor(),
                cantidadComprar,
                montoTotal,
                celular,
                numeroTransaccion
        );
        pedidoRepository.save(pedido);

        return new PagoYapeResponse(
                true,
                "¡Pago procesado exitosamente por Yape!",
                numeroTransaccion,
                pedido.getId(),
                montoTotal,
                cantidadComprar,
                producto.getNombre(),
                LocalDateTime.now()
        );
    }

    public List<Pedido> obtenerMisCompras() {
        Usuario comprador = obtenerUsuarioAutenticado();
        return pedidoRepository.findByCompradorOrderByFechaDesc(comprador);
    }

    public List<Pedido> obtenerMisVentas() {
        Usuario vendedor = obtenerUsuarioAutenticado();
        return pedidoRepository.findByVendedorOrderByFechaDesc(vendedor);
    }
}
