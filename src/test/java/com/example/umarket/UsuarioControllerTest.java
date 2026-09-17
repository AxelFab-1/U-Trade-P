package com.example.umarket;

import com.example.umarket.controller.UsuarioController;
import com.example.umarket.model.Usuario;
import com.example.umarket.service.UsuarioService;
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
class UsuarioControllerTest {

    @Mock
    private UsuarioService service;

    @InjectMocks
    private UsuarioController controller;

    @Test
    void listar_devuelveLosUsuariosDelServicio() {
        List<Usuario> datos = List.of(
            new Usuario(1L, "Fabian", "fabian@umarket.com", "123456")
        );
        when(service.listarTodos()).thenReturn(datos);

        ResponseEntity<List<Usuario>> respuesta = controller.listar();

        assertThat(respuesta.getBody()).hasSize(1);
        assertThat(respuesta.getBody().get(0).nombre()).isEqualTo("Fabian");
    }
}