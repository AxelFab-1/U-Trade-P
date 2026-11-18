package com.example.umarket.controller;

import com.example.umarket.dto.PagoYapeRequest;
import com.example.umarket.dto.PagoYapeResponse;
import com.example.umarket.service.PagoYapeService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/pagos")
public class PagoController {

    private final PagoYapeService pagoYapeService;

    public PagoController(PagoYapeService pagoYapeService) {
        this.pagoYapeService = pagoYapeService;
    }

    @PostMapping("/yape")
    public ResponseEntity<PagoYapeResponse> pagarConYape(@RequestBody PagoYapeRequest request) {
        PagoYapeResponse response = pagoYapeService.procesarPagoYape(request);
        return ResponseEntity.ok(response);
    }
}
