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
    private final StockSseService stockSseService;

    public PagoYapeService(ProductoRepository productoRepository,
                           PedidoRepository pedidoRepository,
                           UsuarioRepository usuarioRepository,
                           StockSseService stockSseService) {
        this.productoRepository = productoRepository;
        this.pedidoRepository = pedidoRepository;
        this.usuarioRepository = usuarioRepository;
        this.stockSseService = stockSseService;
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

        if (request.getCantidad() == null || request.getCantidad() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La cantidad a comprar debe ser mayor a 0.");
        }
        int cantidadComprar = request.getCantidad();

        String celular = request.getCelular() != null ? request.getCelular().trim() : "";
        if (!celular.matches("^9\\d{8}$")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El número de celular debe tener 9 dígitos y empezar con 9.");
        }

        String codigo = request.getCodigoAprobacion() != null ? request.getCodigoAprobacion().trim() : "";
        if (!codigo.matches("^\\d{6}$")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El código de aprobación de Yape debe tener 6 dígitos numéricos.");
        }

        if ("000000".equals(codigo)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Código de aprobación expirado o inválido. Genera uno nuevo en tu app Yape.");
        }

        Producto producto = productoRepository.findByIdWithLock(request.getProductoId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "La publicación no existe."));

        if ((producto.getDisponible() != null && !producto.getDisponible()) ||
                (producto.getStock() != null && producto.getStock() <= 0)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Lo sentimos, esta publicación ya fue adquirida o se encuentra agotada.");
        }

        if (producto.getVendedor() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La publicación no cuenta con un vendedor válido.");
        }

        if (producto.getVendedor().isSuspendido()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Esta publicación no está disponible actualmente.");
        }

        boolean mismoId = producto.getVendedor().getId() != null && producto.getVendedor().getId().equals(comprador.getId());
        boolean mismoCorreo = producto.getVendedor().getCorreo() != null && producto.getVendedor().getCorreo().equalsIgnoreCase(comprador.getCorreo());
        if (mismoId || mismoCorreo) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No puedes comprar tu propia publicación.");
        }

        int stockActual = (producto.getStock() != null) ? producto.getStock() : 1;
        if (cantidadComprar > stockActual) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, 
                    "Stock insuficiente. Solo quedan " + stockActual + " unidades disponibles.");
        }

        int nuevoStock = stockActual - cantidadComprar;
        producto.setStock(nuevoStock);
        if (nuevoStock <= 0) {
            producto.setDisponible(false);
            producto.setComprador(comprador);
        }

        productoRepository.saveAndFlush(producto);

        if (producto.getPrecio() == null || producto.getPrecio() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El precio de la publicación no es válido.");
        }
        double montoTotal = Math.round(producto.getPrecio() * cantidadComprar * 100.0) / 100.0;

        String numeroTransaccion = "YAPE-TX-" + String.format("%06d", new Random().nextInt(1000000));

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

        stockSseService.publicarCambio(producto.getId(), nuevoStock, producto.getDisponible());

        Usuario vendedor = producto.getVendedor();
        String vendedorNombre = vendedor != null ? vendedor.getNombre() : null;
        String vendedorTelefono = vendedor != null ? vendedor.getTelefono() : null;

        return new PagoYapeResponse(
                true,
                "¡Pago procesado exitosamente por Yape!",
                numeroTransaccion,
                pedido.getId(),
                montoTotal,
                cantidadComprar,
                producto.getNombre(),
                LocalDateTime.now(),
                vendedorNombre,
                vendedorTelefono
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
