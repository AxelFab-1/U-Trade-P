package com.example.umarket.service;

import com.example.umarket.model.Producto;
import com.example.umarket.model.Usuario;
import com.example.umarket.repository.FavoritoRepository;
import com.example.umarket.repository.PedidoRepository;
import com.example.umarket.repository.ProductoRepository;
import com.example.umarket.repository.ReporteRepository;
import com.example.umarket.repository.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.Authentication;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Set;

@Service
public class ProductoService {
    
    private final ProductoRepository repository;
    private final UsuarioRepository usuarioRepository; 
    private final PedidoRepository pedidoRepository;
    private final FavoritoRepository favoritoRepository;
    private final ReporteRepository reporteRepository;
    private final StockSseService stockSseService;

    public static final Set<String> CATEGORIAS_VALIDAS = Set.of("Producto", "Comida", "Servicios");

    public ProductoService(ProductoRepository repository, 
                           UsuarioRepository usuarioRepository,
                           PedidoRepository pedidoRepository,
                           FavoritoRepository favoritoRepository,
                           ReporteRepository reporteRepository,
                           StockSseService stockSseService) {
        this.repository = repository;
        this.usuarioRepository = usuarioRepository;
        this.pedidoRepository = pedidoRepository;
        this.favoritoRepository = favoritoRepository;
        this.reporteRepository = reporteRepository;
        this.stockSseService = stockSseService;
    }

    private String normalizarCategoria(String cat) {
        if (cat == null) return null;
        String trimmed = cat.trim();
        for (String valid : CATEGORIAS_VALIDAS) {
            if (valid.equalsIgnoreCase(trimmed)) {
                return valid;
            }
        }
        return null;
    }

    public List<Producto> listarTodos() {
        List<Producto> lista = repository.findAll();
        if (esUsuarioAdmin()) {
            return lista;
        }
        return lista.stream()
                .filter(p -> p.getVendedor() == null || !p.getVendedor().isSuspendido())
                .toList();
    }

    public Producto buscarPorId(Long id) {
        Producto producto = repository.findById(id).orElse(null);
        if (producto != null && !esUsuarioAdmin() && producto.getVendedor() != null && producto.getVendedor().isSuspendido()) {
            producto.setDisponible(false);
        }
        return producto;
    }

    public List<Producto> buscarPorCategoria(String categoria) {
        List<Producto> lista = repository.findByCategoria(categoria);
        if (esUsuarioAdmin()) {
            return lista;
        }
        return lista.stream()
                .filter(p -> p.getVendedor() == null || !p.getVendedor().isSuspendido())
                .toList();
    }

    public List<Producto> buscar(String termino, String categoria) {
        boolean tieneTermino = termino != null && !termino.trim().isEmpty();
        boolean tieneCategoria = categoria != null && !categoria.trim().isEmpty() && !"TODAS".equalsIgnoreCase(categoria.trim());

        List<Producto> resultados;
        if (tieneTermino && tieneCategoria) {
            resultados = repository.buscarPorCategoriaYTermino(categoria.trim(), termino.trim());
        } else if (tieneTermino) {
            resultados = repository.buscarPorTermino(termino.trim());
        } else if (tieneCategoria) {
            resultados = repository.listarPorCategoriaDisponibles(categoria.trim());
        } else {
            resultados = repository.listarTodosDisponibles();
        }

        if (esUsuarioAdmin()) {
            return resultados;
        }

        return resultados.stream()
                .filter(p -> p.getVendedor() == null || !p.getVendedor().isSuspendido())
                .toList();
    }

    public List<Producto> buscarPorVendedor(Long usuarioId) {
        List<Producto> lista = repository.findByVendedorId(usuarioId);
        if (esUsuarioAdmin()) {
            return lista;
        }
        return lista.stream()
                .filter(p -> p.getVendedor() == null || !p.getVendedor().isSuspendido())
                .toList();
    }

    private boolean esUsuarioAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
            return false;
        }
        return auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }

    /**
     * Valida de forma estricta que el usuario autenticado sea el dueño de la publicación
     * o posea el rol ROLE_ADMIN. Si la publicación no tiene vendedor asociado, solo ADMIN puede gestionarla.
     */
    private void validarPropiedadOAdmin(Producto producto, String accion) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Debes iniciar sesión para realizar esta acción.");
        }

        boolean esAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (esAdmin) {
            return;
        }

        String correoAutenticado = auth.getName();
        if (producto.getVendedor() == null || producto.getVendedor().getCorreo() == null ||
                !producto.getVendedor().getCorreo().equalsIgnoreCase(correoAutenticado)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No tienes permisos para " + accion + " una publicación que no te pertenece.");
        }
    }

    @Transactional
    public Producto guardarProducto(Producto p) {
        if (p == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Los datos del producto son obligatorios.");
        }
        if (p.getNombre() == null || p.getNombre().trim().length() < 3) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El título del producto es obligatorio (mínimo 3 caracteres).");
        }
        if (p.getPrecio() == null || p.getPrecio() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El precio debe ser mayor a 0.");
        }
        if (p.getStock() == null || p.getStock() < 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El stock inicial debe ser al menos 1 unidad.");
        }
        String catNorm = normalizarCategoria(p.getCategoria());
        if (catNorm == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La categoría es inválida. Debe ser: Producto, Comida o Servicios.");
        }
        p.setCategoria(catNorm);

        if (p.getFoto() != null && !p.getFoto().trim().isEmpty()) {
            String fotoLower = p.getFoto().trim().toLowerCase();
            if (!fotoLower.startsWith("http://") && !fotoLower.startsWith("https://")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La URL de la foto debe comenzar con http:// o https://");
            }
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName())) {
            Usuario vendedor = usuarioRepository.findByCorreoIgnoreCase(auth.getName()).orElse(null);
            if (vendedor != null) {
                p.setVendedor(vendedor);
            }
        }
        if (p.getDisponible() == null) {
            p.setDisponible(true);
        }
        return repository.save(p);
    }
    
    @Transactional
    public Producto actualizarProducto(Long id, Producto p) {
        return repository.findById(id).map(productoExistente -> {
            validarPropiedadOAdmin(productoExistente, "modificar");

            if (p.getNombre() != null) {
                if (p.getNombre().trim().length() < 3) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El nombre del producto debe tener al menos 3 caracteres.");
                }
                productoExistente.setNombre(p.getNombre().trim());
            }
            if (p.getPrecio() != null) {
                if (p.getPrecio() <= 0) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El precio debe ser mayor a 0.");
                }
                productoExistente.setPrecio(p.getPrecio());
            }
            if (p.getCategoria() != null) {
                String catNorm = normalizarCategoria(p.getCategoria());
                if (catNorm == null) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La categoría es inválida. Debe ser: Producto, Comida o Servicios.");
                }
                productoExistente.setCategoria(catNorm);
            }
            if (p.getDescripcion() != null && !p.getDescripcion().trim().isEmpty()) {
                productoExistente.setDescripcion(p.getDescripcion().trim());
            }
            if (p.getFoto() != null && !p.getFoto().trim().isEmpty()) {
                String fotoLower = p.getFoto().trim().toLowerCase();
                if (!fotoLower.startsWith("http://") && !fotoLower.startsWith("https://")) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La URL de la foto debe comenzar con http:// o https://");
                }
                productoExistente.setFoto(p.getFoto().trim());
            }
            if (p.getStock() != null) {
                if (p.getStock() < 0) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El stock no puede ser negativo.");
                }
                productoExistente.setStock(p.getStock());
                if (p.getStock() > 0) {
                    productoExistente.setComprador(null);
                }
            }
            if (p.getDisponible() != null) {
                productoExistente.setDisponible(p.getDisponible());
            }

            Producto guardado = repository.save(productoExistente);
            stockSseService.publicarCambio(guardado.getId(), guardado.getStock(), guardado.getDisponible());
            return guardado;
        }).orElse(null); 
    }

    @Transactional
    public boolean eliminarProducto(Long id) {
        Producto producto = repository.findById(id).orElse(null);
        if (producto == null) {
            return false;
        }

        validarPropiedadOAdmin(producto, "eliminar");

        favoritoRepository.deleteByProductoId(id);
        pedidoRepository.deleteByProductoId(id);
        reporteRepository.deleteByProductoId(id);

        repository.delete(producto);
        return true;
    }

    @Transactional
    public Producto cambiarDisponibilidad(Long id, Boolean estadoDeseado) {
        Producto producto = repository.findById(id).orElse(null);
        if (producto == null) {
            return null;
        }

        validarPropiedadOAdmin(producto, "cambiar la disponibilidad de");

        boolean nuevoEstado = (estadoDeseado != null) ? estadoDeseado : (producto.getDisponible() == null || !producto.getDisponible());
        if (nuevoEstado && ((producto.getStock() != null && producto.getStock() <= 0) || producto.getComprador() != null)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No puedes activar un producto agotado o vendido. Repón stock primero.");
        }
        producto.setDisponible(nuevoEstado);
        Producto guardado = repository.save(producto);
        stockSseService.publicarCambio(guardado.getId(), guardado.getStock(), guardado.getDisponible());
        return guardado;
    }

    @Transactional
    public Producto comprarProducto(Long id) {
        Producto producto = repository.findByIdWithLock(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Producto no encontrado"));

        if ((producto.getDisponible() != null && !producto.getDisponible()) ||
                (producto.getStock() != null && producto.getStock() <= 0)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Lo sentimos, esta publicación ya fue adquirida o se encuentra agotada.");
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Debes iniciar sesión para realizar una compra.");
        }
        String correoComprador = auth.getName();

        if (producto.getVendedor() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La publicación no cuenta con un vendedor válido.");
        }

        if (producto.getVendedor().isSuspendido()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Esta publicación no está disponible actualmente.");
        }

        if (producto.getVendedor().getCorreo() != null && producto.getVendedor().getCorreo().equalsIgnoreCase(correoComprador)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No puedes comprar tu propia publicación.");
        }

        Usuario comprador = usuarioRepository.findByCorreoIgnoreCase(correoComprador)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comprador no encontrado en la base de datos"));

        producto.setDisponible(false); 
        producto.setStock(0);
        producto.setComprador(comprador); 

        Producto guardado = repository.saveAndFlush(producto);
        stockSseService.publicarCambio(guardado.getId(), 0, false);

        return guardado;
    }
}
