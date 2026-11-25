package com.example.umarket.controller;

import com.example.umarket.service.StockSseService;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/stock")
public class StockController {

    private final StockSseService stockSseService;

    public StockController(StockSseService stockSseService) {
        this.stockSseService = stockSseService;
    }

    @GetMapping(value = "/eventos/{productoId}", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter suscribirEventosStock(@PathVariable Long productoId) {
        return stockSseService.suscribir(productoId);
    }
}
