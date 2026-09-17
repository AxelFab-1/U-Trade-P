package com.example.umarket.repository;

import com.example.umarket.model.Producto;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Repository;

import java.io.File;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Repository 
public class ProductoRepository {
    private final ObjectMapper objectMapper;
    private final File archivo = new File("data/productos.json");
    private List<Producto> productos = new ArrayList<>();

    public ProductoRepository(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    public void cargarDatos() throws Exception {
        if (archivo.exists()) {
            productos = objectMapper.readValue(archivo, new TypeReference<List<Producto>>() {});
        } else {
            archivo.getParentFile().mkdirs();
            persistir();
        }
    }

    private void persistir() {
        try {
            objectMapper.writerWithDefaultPrettyPrinter().writeValue(archivo, productos);
        } catch (Exception e) {
            throw new RuntimeException("Error al guardar el JSON", e);
        }
    }

    public List<Producto> findAll() {
        return productos;
    }

    public Optional<Producto> findById(Long id) {
        return productos.stream().filter(p -> p.id().equals(id)).findFirst();
    }

    public List<Producto> findByCategoria(String categoria) {
        return productos.stream()
                .filter(p -> p.categoria().equalsIgnoreCase(categoria))
                .toList();
    }

    public Producto save(Producto p) {
        long nuevoId = productos.stream().mapToLong(Producto::id).max().orElse(0L) + 1;
        
        Producto nuevoProducto = new Producto(nuevoId, p.nombre(), p.precio(), p.categoria(), p.descripcion(), p.foto());
        productos.add(nuevoProducto);
        persistir();
        return nuevoProducto;
    }

    public Producto update(Long id, Producto p) {
        boolean eliminado = productos.removeIf(prod -> prod.id().equals(id));
        if (eliminado) {
            Producto actualizado = new Producto(id, p.nombre(), p.precio(), p.categoria(), p.descripcion(), p.foto());
            productos.add(actualizado);
            persistir();
            return actualizado;
        }
        return null;
    }

    public boolean deleteById(Long id) {
        boolean eliminado = productos.removeIf(p -> p.id().equals(id));
        if (eliminado) persistir();
        return eliminado;
    }
}