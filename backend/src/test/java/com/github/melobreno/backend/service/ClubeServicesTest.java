package com.github.melobreno.backend.service;

import com.github.melobreno.backend.dto.ClubeDto;
import com.github.melobreno.backend.dto.CriarClubeRequestDto;
import com.github.melobreno.backend.exceptions.BadRequestException;
import com.github.melobreno.backend.exceptions.BusinessException;
import com.github.melobreno.backend.model.Clube;
import com.github.melobreno.backend.repository.ClubeRepository;
import com.github.melobreno.backend.repository.ContratoRepository;
import com.github.melobreno.backend.repository.JogadorRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ClubeServicesTest {

    @Mock
    private ClubeRepository clubeRepository;

    @Mock
    private JogadorRepository jogadorRepository;

    @Mock
    private ContratoRepository contratoRepository;

    @Mock
    private JogadorService jogadorService;

    @InjectMocks
    private ClubeServices clubeServices;

    @Test
    void criarClubeComSucesso() {
        when(clubeRepository.count()).thenReturn(0L);
        when(clubeRepository.findAll()).thenReturn(List.of());
        when(clubeRepository.save(any(Clube.class))).thenAnswer(invocation -> {
            Clube c = invocation.getArgument(0);
            c.setId(1);
            return c;
        });

        ClubeDto resultado = clubeServices.criaClube(new CriarClubeRequestDto("  Águias   FC  ", "AGU"));

        assertNotNull(resultado);
        assertEquals(1, resultado.id());
        assertEquals("Águias FC", resultado.name());
        assertEquals("AGU", resultado.acronym());
        assertEquals(new BigDecimal("300.00"), resultado.cash());
        assertEquals(new BigDecimal("0.00"), resultado.squadValue());
        assertEquals(new BigDecimal("300.00"), resultado.netWorth());
    }

    @Test
    void rejeitaCriacaoSeNomeNaoAtenderRegras() {
        // Caracteres de controle
        assertThrows(BadRequestException.class,
                () -> clubeServices.criaClube(new CriarClubeRequestDto("Águias\tFC", "AGU")));

        // Menos de 2 palavras
        assertThrows(BadRequestException.class,
                () -> clubeServices.criaClube(new CriarClubeRequestDto("Águias", "AGU")));

        // Mais de 5 palavras
        assertThrows(BadRequestException.class,
                () -> clubeServices.criaClube(new CriarClubeRequestDto("Um Dois Tres Quatro Cinco Seis", "UDT")));

        // Dígitos ou caracteres inválidos
        assertThrows(BadRequestException.class,
                () -> clubeServices.criaClube(new CriarClubeRequestDto("Águias 10 FC", "AGU")));
    }

    @Test
    void rejeitaSiglaInvalida() {
        // Letras minúsculas
        assertThrows(BadRequestException.class,
                () -> clubeServices.criaClube(new CriarClubeRequestDto("Águias FC", "agu")));

        // 3 letras iguais
        assertThrows(BadRequestException.class,
                () -> clubeServices.criaClube(new CriarClubeRequestDto("Águias FC", "AAA")));

        // Primeira letra não corresponde à primeira letra do nome
        assertThrows(BadRequestException.class,
                () -> clubeServices.criaClube(new CriarClubeRequestDto("Águias FC", "GUA")));

        // Letras fora de ordem
        assertThrows(BadRequestException.class,
                () -> clubeServices.criaClube(new CriarClubeRequestDto("Águias FC", "AUG")));
    }

    @Test
    void rejeitaSeUltrapassarLimiteDe20Clubes() {
        when(clubeRepository.count()).thenReturn(20L);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> clubeServices.criaClube(new CriarClubeRequestDto("Águias FC", "AGU")));
        assertEquals(HttpStatus.CONFLICT, ex.getStatusCode());
    }

    @Test
    void validaUnicidadeSensivelAAcentosEInsensivelACaixa() {
        Clube existente = new Clube();
        existente.setId(1);
        existente.setNome("Águias FC");
        existente.setSigla("AGU");

        when(clubeRepository.count()).thenReturn(1L);
        when(clubeRepository.findAll()).thenReturn(List.of(existente));

        // "águias fc" é o mesmo nome ignorando case -> CONFLICT 409
        BusinessException ex1 = assertThrows(BusinessException.class,
                () -> clubeServices.criaClube(new CriarClubeRequestDto("  águias   fc ", "AGU")));
        assertEquals(HttpStatus.CONFLICT, ex1.getStatusCode());

        // Sigla duplicada -> CONFLICT 409
        BusinessException ex2 = assertThrows(BusinessException.class,
                () -> clubeServices.criaClube(new CriarClubeRequestDto("Aguias FC", "AGU")));
        assertEquals(HttpStatus.CONFLICT, ex2.getStatusCode());
    }
}
