package com.example.umarket.controller;

import com.example.umarket.model.Producto;
import com.example.umarket.model.Reporte;
import com.example.umarket.model.Usuario;
import com.example.umarket.repository.ProductoRepository;
import com.example.umarket.repository.ReporteRepository;
import com.example.umarket.repository.UsuarioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reportes")
public class ReporteController {

    private final ReporteRepository reporteRepository;
    private final ProductoRepository productoRepository;
    private final UsuarioRepository usuarioRepository;

    public ReporteController(ReporteRepository reporteRepository, 
                             ProductoRepository productoRepository, 
                             UsuarioRepository usuarioRepository) {
        this.reporteRepository = reporteRepository;
        this.productoRepository = productoRepository;
        this.usuarioRepository = usuarioRepository;
    }

    @PostMapping
    public ResponseEntity<?> crearReporte(@RequestBody Map<String, Object> req, Authentication auth) {
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Debes iniciar sesión para reportar una publicación."));
        }

        Object prodIdObj = req.get("productoId");
        if (prodIdObj == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "El identificador del producto es obligatorio."));
        }
        Long productoId;
        try {
            productoId = Long.valueOf(prodIdObj.toString());
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Identificador de producto inválido."));
        }

        String motivo = req.get("motivo") != null ? req.get("motivo").toString().trim() : "";
        if (motivo.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Debes seleccionar un motivo para el reporte."));
        }

        String detalle = req.get("detalle") != null ? req.get("detalle").toString().trim() : null;

        Producto producto = productoRepository.findById(productoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "La publicación no existe."));

        Usuario denunciante = usuarioRepository.findByCorreoIgnoreCase(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario denunciante no encontrado."));

        if (producto.getVendedor() != null && producto.getVendedor().getId() != null &&
                producto.getVendedor().getId().equals(denunciante.getId())) {
            return ResponseEntity.badRequest().body(Map.of("message", "No puedes reportar tu propia publicación."));
        }

        boolean yaReportado = reporteRepository.existsByProductoIdAndUsuarioDenuncianteIdAndEstado(productoId, denunciante.getId(), "PENDIENTE");
        if (yaReportado) {
            return ResponseEntity.badRequest().body(Map.of("message", "Ya has enviado un reporte para esta publicación que está pendiente de revisión."));
        }

        Reporte nuevoReporte = new Reporte(producto, denunciante, motivo, detalle);
        Reporte guardado = reporteRepository.save(nuevoReporte);

        return ResponseEntity.status(HttpStatus.CREATED).body(guardado);
    }

    @GetMapping
    public ResponseEntity<List<Reporte>> listarReportes() {
        return ResponseEntity.ok(reporteRepository.findAllByOrderByFechaCreacionDesc());
    }

    @PutMapping("/{id:[0-9]+}/revisar")
    public ResponseEntity<?> marcarRevisado(@PathVariable Long id) {
        Reporte reporte = reporteRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reporte no encontrado."));

        reporte.setEstado("REVISADO");
        Reporte actualizado = reporteRepository.save(reporte);
        return ResponseEntity.ok(actualizado);
    }

    @PutMapping("/{id:[0-9]+}/descartar")
    public ResponseEntity<?> marcarDescartado(@PathVariable Long id) {
        Reporte reporte = reporteRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reporte no encontrado."));

        reporte.setEstado("DESCARTADO");
        Reporte actualizado = reporteRepository.save(reporte);
        return ResponseEntity.ok(actualizado);
    }

    @DeleteMapping("/{id:[0-9]+}")
    public ResponseEntity<Void> eliminarReporte(@PathVariable Long id) {
        if (reporteRepository.existsById(id)) {
            reporteRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
