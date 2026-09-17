package com.example.umarket;

import com.example.umarket.controller.ProductoController;
import com.example.umarket.model.Producto;
import com.example.umarket.service.ProductoService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class) 
class ProductoControllerTest {

    @Mock
    private ProductoService service; 

    @InjectMocks
    private ProductoController controller; 

    @Test
    void listar_devuelveLosProductosDelServicio() {
        List<Producto> datos = List.of(
            new Producto(1L, "Apuntes de Sistemas", 15.0, "Servicios", "Resumen del ciclo", "apuntes.jpg")
        );
        when(service.listarTodos()).thenReturn(datos);

        ResponseEntity<List<Producto>> respuesta = controller.listar();

        assertThat(respuesta.getBody()).hasSize(1);
        assertThat(respuesta.getBody().get(0).nombre()).isEqualTo("Apuntes de Sistemas");
    }
}