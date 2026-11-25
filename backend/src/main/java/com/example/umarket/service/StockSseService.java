package com.example.umarket.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class StockSseService {

    private static final Logger log = LoggerFactory.getLogger(StockSseService.class);
    private static final Long EMITTER_TIMEOUT = 30 * 60 * 1000L; // 30 minutos

    private final Map<Long, CopyOnWriteArrayList<SseEmitter>> emisoresPorProducto = new ConcurrentHashMap<>();

    public SseEmitter suscribir(Long productoId) {
        SseEmitter emitter = new SseEmitter(EMITTER_TIMEOUT);
        emisoresPorProducto.computeIfAbsent(productoId, k -> new CopyOnWriteArrayList<>()).add(emitter);

        Runnable eliminar = () -> {
            CopyOnWriteArrayList<SseEmitter> lista = emisoresPorProducto.get(productoId);
            if (lista != null) {
                lista.remove(emitter);
                if (lista.isEmpty()) {
                    emisoresPorProducto.remove(productoId);
                }
            }
        };

        emitter.onCompletion(eliminar);
        emitter.onTimeout(eliminar);
        emitter.onError(e -> eliminar.run());

        try {
            emitter.send(SseEmitter.event()
                    .name("conectado")
                    .data(Map.of("mensaje", "Conectado al stream de stock del producto " + productoId)));
        } catch (IOException e) {
            log.warn("No se pudo enviar evento inicial SSE para producto {}: {}", productoId, e.getMessage());
            eliminar.run();
        }

        return emitter;
    }

    public void publicarCambio(Long productoId, Integer nuevoStock, Boolean disponible) {
        List<SseEmitter> lista = emisoresPorProducto.get(productoId);
        if (lista == null || lista.isEmpty()) {
            return;
        }

        Map<String, Object> payload = Map.of(
                "productoId", productoId,
                "stock", nuevoStock != null ? nuevoStock : 0,
                "disponible", disponible != null ? disponible : false
        );

        for (SseEmitter emitter : lista) {
            try {
                emitter.send(SseEmitter.event()
                        .name("stock-update")
                        .data(payload));
            } catch (Exception e) {
                log.debug("Emisor SSE desconectado para producto {}, eliminando: {}", productoId, e.getMessage());
                lista.remove(emitter);
            }
        }

        if (lista.isEmpty()) {
            emisoresPorProducto.remove(productoId);
        }
    }
}
