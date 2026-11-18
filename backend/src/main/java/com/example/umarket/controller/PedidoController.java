package com.example.umarket.controller;

import com.example.umarket.model.Pedido;
import com.example.umarket.service.PagoYapeService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pedidos")
public class PedidoController {

    private final PagoYapeService pagoYapeService;

    public PedidoController(PagoYapeService pagoYapeService) {
        this.pagoYapeService = pagoYapeService;
    }

    @GetMapping("/mis-compras")
    public ResponseEntity<List<Pedido>> obtenerMisCompras() {
        return ResponseEntity.ok(pagoYapeService.obtenerMisCompras());
    }

    @GetMapping("/mis-ventas")
    public ResponseEntity<List<Pedido>> obtenerMisVentas() {
        return ResponseEntity.ok(pagoYapeService.obtenerMisVentas());
    }
}
