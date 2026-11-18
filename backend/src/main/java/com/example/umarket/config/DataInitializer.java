package com.example.umarket.config;

import com.example.umarket.model.Producto;
import com.example.umarket.model.Usuario;
import com.example.umarket.repository.ProductoRepository;
import com.example.umarket.repository.UsuarioRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final ProductoRepository productoRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UsuarioRepository usuarioRepository, 
                           ProductoRepository productoRepository, 
                           PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.productoRepository = productoRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        // Inicializar usuarios si no existen
        if (usuarioRepository.count() == 0) {
            Usuario admin = new Usuario("Administrador UTP", "admin@utp.edu.pe", passwordEncoder.encode("admin123"), "ADMIN");
            Usuario carlos = new Usuario("Carlos Curo", "carlos@utp.edu.pe", passwordEncoder.encode("utp2024"), "ESTUDIANTE");
            Usuario fabian = new Usuario("Fabian Z. A.", "fabian@utp.edu.pe", passwordEncoder.encode("utp2024"), "ESTUDIANTE");
            Usuario camila = new Usuario("Camila Torres", "camila@utp.edu.pe", passwordEncoder.encode("utp2024"), "ESTUDIANTE");

            usuarioRepository.saveAll(List.of(admin, carlos, fabian, camila));
        }

        // Inicializar productos del mercado universitario si no existen
        if (productoRepository.count() == 0) {
            Usuario carlos = usuarioRepository.findByCorreo("carlos@utp.edu.pe").orElse(null);
            Usuario fabian = usuarioRepository.findByCorreo("fabian@utp.edu.pe").orElse(null);
            Usuario camila = usuarioRepository.findByCorreo("camila@utp.edu.pe").orElse(null);

            List<Producto> productos = List.of(
                new Producto(
                    "MacBook Air M1 (8GB RAM / 256GB)",
                    2100.0,
                    "Producto",
                    "Laptop en impecables condiciones. Batería al 89%. Incluye cargador original y funda protectora.",
                    "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=500&q=80",
                    carlos,
                    1
                ),
                new Producto(
                    "Cargador Carga Rápida 65W USB-C",
                    75.0,
                    "Producto",
                    "Cargador nuevo en caja sellada con soporte Power Delivery, compatible con laptops y celulares.",
                    "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=500&q=80",
                    carlos,
                    1
                ),
                new Producto(
                    "Mochila Antirrobo Impermeable 25L",
                    95.0,
                    "Producto",
                    "Usada por un ciclo, perfecta para llevar laptop de hasta 15.6 pulgadas con puerto USB externo.",
                    "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80",
                    fabian,
                    1
                ),
                new Producto(
                    "Cold Brew Artesanal 500ml + Galleta",
                    12.0,
                    "Comida",
                    "Café de especialidad extraído en frío por 12 horas. Incluye galleta de avena con chispas.",
                    "https://images.unsplash.com/photo-1517701550927-30cf4b1e5dc5?w=500&q=80",
                    camila,
                    8
                ),
                new Producto(
                    "Pack Brownies Proteicos Fudgy (x3)",
                    15.0,
                    "Comida",
                    "Elaborados con proteína de suero y cacao al 70%, sin azúcar añadida. Ideales para el break.",
                    "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&q=80",
                    camila,
                    12
                ),
                new Producto(
                    "Impresión 3D de Maquetas y Planos STL",
                    25.0,
                    "Servicios",
                    "Servicio de impresión 3D en filamentos PLA y ABS de alta precisión para proyectos universitarios.",
                    "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500&q=80",
                    fabian,
                    1
                ),
                new Producto(
                    "Asesoría en Cálculo / Física I y II",
                    35.0,
                    "Servicios",
                    "Clases personalizadas y resolución de exámenes pasados UTP. Modalidad virtual o en campus.",
                    "https://images.unsplash.com/photo-1633613286991-611fe299c4be?w=500&q=80",
                    carlos,
                    1
                )
            );

            productoRepository.saveAll(productos);
        }
    }
}
