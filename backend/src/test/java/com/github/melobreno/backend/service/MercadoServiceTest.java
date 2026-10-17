package com.github.melobreno.backend.service;

import com.github.melobreno.backend.dto.ComprarJogadorRequestDto;
import com.github.melobreno.backend.dto.HistoricoTransacoesDto;
import com.github.melobreno.backend.dto.TransacaoDto;
import com.github.melobreno.backend.exceptions.BadRequestException;
import com.github.melobreno.backend.exceptions.BusinessException;
import com.github.melobreno.backend.model.Clube;
import com.github.melobreno.backend.model.Contrato;
import com.github.melobreno.backend.model.Jogador;
import com.github.melobreno.backend.model.PosicaoJogador;
import com.github.melobreno.backend.model.Transacao;
import com.github.melobreno.backend.repository.ClubeRepository;
import com.github.melobreno.backend.repository.ContratoRepository;
import com.github.melobreno.backend.repository.EscalacaoRepository;
import com.github.melobreno.backend.repository.JogadorRepository;
import com.github.melobreno.backend.repository.TransacaoRepository;
import com.github.melobreno.backend.util.ValidacoesGeraisUtils;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MercadoServiceTest {

    @Mock
    private JogadorRepository jogadorRepository;

    @Mock
    private ClubeRepository clubeRepository;

    @Mock
    private ContratoRepository contratoRepository;

    @Mock
    private TransacaoRepository transacaoRepository;

    @Mock
    private EscalacaoRepository escalacaoRepository;

    @Mock
    private JogadorService jogadorService;

    @InjectMocks
    private MercadoService mercadoService;

    @Test
    void comprarJogadorComSucessoETaxaAcimaDe30() {
        // RN12 e RN13 - Compra com taxa de 5% sobre 37.00 = 1.85, custo total = 38.85
        Jogador jogador = new Jogador();
        jogador.setId(2);
        jogador.setNome("Meia Lua");
        jogador.setPosicao(PosicaoJogador.MEI);

        Clube clube = new Clube();
        clube.setId(1);
        clube.setNome("Águias FC");
        clube.setCaixa(new BigDecimal("300.00"));

        when(jogadorRepository.findByIdAndExcluidoEmIsNull(2)).thenReturn(Optional.of(jogador));
        when(clubeRepository.findById(1)).thenReturn(Optional.of(clube));
        when(transacaoRepository.findAllByClube_IdAndTipoAndJogador_IdOrderByCriadoEmDescIdDesc(1, "VENDA", 2))
                .thenReturn(List.of());
        when(jogadorRepository.findAllByClube_IdAndExcluidoEmIsNull(1)).thenReturn(List.of());
        when(jogadorService.calcularValorMercado(jogador)).thenReturn(new BigDecimal("37.00"));
        when(transacaoRepository.save(any(Transacao.class))).thenAnswer(invocation -> {
            Transacao t = invocation.getArgument(0);
            t.setId(10);
            return t;
        });

        OffsetDateTime futuro = ValidacoesGeraisUtils.agoraBrasilia().plusDays(120);
        String dataStr = String.format("%04d-%02d-%02dT%02d:%02d-03:00",
                futuro.getYear(), futuro.getMonthValue(), futuro.getDayOfMonth(),
                futuro.getHour(), futuro.getMinute());

        TransacaoDto resultado = mercadoService.comprarJogador(2, new ComprarJogadorRequestDto(1, dataStr));

        assertNotNull(resultado);
        assertEquals(10, resultado.id());
        assertEquals("COMPRA", resultado.type());
        assertEquals(new BigDecimal("37.00"), resultado.value());
        assertEquals(new BigDecimal("1.85"), resultado.fee());
        assertEquals(new BigDecimal("-38.85"), resultado.cashChange());
        assertEquals(new BigDecimal("261.15"), resultado.clubCash());
        verify(contratoRepository).save(any(Contrato.class));
    }

    @Test
    void rejeitaCompraSeCustoUltrapassar50PorCentoDoCaixa() {
        // RN13 - Limite de 50% do caixa sem arredondamento
        Jogador jogador = new Jogador();
        jogador.setId(2);
        jogador.setNome("Meia Lua");

        Clube clube = new Clube();
        clube.setId(1);
        clube.setNome("Águias FC");
        clube.setCaixa(new BigDecimal("100.00")); // Limite = 50.00

        when(jogadorRepository.findByIdAndExcluidoEmIsNull(2)).thenReturn(Optional.of(jogador));
        when(clubeRepository.findById(1)).thenReturn(Optional.of(clube));
        when(transacaoRepository.findAllByClube_IdAndTipoAndJogador_IdOrderByCriadoEmDescIdDesc(1, "VENDA", 2))
                .thenReturn(List.of());
        when(jogadorRepository.findAllByClube_IdAndExcluidoEmIsNull(1)).thenReturn(List.of());
        when(jogadorService.calcularValorMercado(jogador)).thenReturn(new BigDecimal("48.00")); // Taxa = 2.40 -> Custo = 50.40 > 50.00

        OffsetDateTime futuro = ValidacoesGeraisUtils.agoraBrasilia().plusDays(30);
        String dataStr = String.format("%04d-%02d-%02dT%02d:%02d-03:00",
                futuro.getYear(), futuro.getMonthValue(), futuro.getDayOfMonth(),
                futuro.getHour(), futuro.getMinute());

        BusinessException ex = assertThrows(BusinessException.class,
                () -> mercadoService.comprarJogador(2, new ComprarJogadorRequestDto(1, dataStr)));
        assertEquals(HttpStatus.CONFLICT, ex.getStatusCode());
    }

    @Test
    void rejeitaRecompraDeJogadorPeloMesmoClube() {
        // RN12 - Não pode recomprar jogador que já vendeu
        Jogador jogador = new Jogador();
        jogador.setId(2);

        Clube clube = new Clube();
        clube.setId(1);

        when(jogadorRepository.findByIdAndExcluidoEmIsNull(2)).thenReturn(Optional.of(jogador));
        when(clubeRepository.findById(1)).thenReturn(Optional.of(clube));

        Transacao vendaAnterior = new Transacao();
        vendaAnterior.setTipo("VENDA");
        when(transacaoRepository.findAllByClube_IdAndTipoAndJogador_IdOrderByCriadoEmDescIdDesc(1, "VENDA", 2))
                .thenReturn(List.of(vendaAnterior));

        OffsetDateTime futuro = ValidacoesGeraisUtils.agoraBrasilia().plusDays(10);
        String dataStr = String.format("%04d-%02d-%02dT%02d:%02d-03:00",
                futuro.getYear(), futuro.getMonthValue(), futuro.getDayOfMonth(),
                futuro.getHour(), futuro.getMinute());

        BusinessException ex = assertThrows(BusinessException.class,
                () -> mercadoService.comprarJogador(2, new ComprarJogadorRequestDto(1, dataStr)));
        assertEquals(HttpStatus.CONFLICT, ex.getStatusCode());
    }

    @Test
    void venderJogadorComMultaEComissaoSobreLucro() {
        // RN15 e RN16 - Venda de Meia Lua: Compra 37.00, Venda 40.00
        // Multa: 117 dias restantes -> 10% de 40.00 = 4.00
        // Lucro: 40.00 - 37.00 = 3.00
        // Comissão: 10% de 3.00 = 0.30
        // Crédito: 40.00 - 4.00 - 0.30 = 35.70
        Clube clube = new Clube();
        clube.setId(1);
        clube.setNome("Águias FC");
        clube.setCaixa(new BigDecimal("261.15"));

        Jogador jogador = new Jogador();
        jogador.setId(2);
        jogador.setNome("Meia Lua");
        jogador.setClube(clube);

        Contrato contrato = new Contrato();
        contrato.setId(5);
        contrato.setJogador(jogador);
        contrato.setClube(clube);
        contrato.setValorCompra(new BigDecimal("37.00"));
        contrato.setFidelidadeAte(ValidacoesGeraisUtils.agoraBrasilia().plusDays(117));
        contrato.setSituacao("ATIVO");

        when(jogadorRepository.findByIdAndExcluidoEmIsNull(2)).thenReturn(Optional.of(jogador));
        when(contratoRepository.findFirstByJogador_IdAndSituacaoOrderByIniciadoEmDesc(2, "ATIVO"))
                .thenReturn(Optional.of(contrato));
        when(jogadorService.calcularValorMercado(jogador)).thenReturn(new BigDecimal("40.00"));
        when(transacaoRepository.save(any(Transacao.class))).thenAnswer(invocation -> {
            Transacao t = invocation.getArgument(0);
            t.setId(11);
            return t;
        });

        TransacaoDto resultado = mercadoService.venderJogador(2);

        assertNotNull(resultado);
        assertEquals(11, resultado.id());
        assertEquals("VENDA", resultado.type());
        assertEquals(new BigDecimal("40.00"), resultado.value());
        assertEquals(new BigDecimal("4.00"), resultado.penalty());
        assertEquals(new BigDecimal("0.30"), resultado.fee());
        assertEquals(new BigDecimal("3.00"), resultado.profit());
        assertEquals(new BigDecimal("35.70"), resultado.cashChange());
        assertEquals(new BigDecimal("296.85"), resultado.clubCash());
        assertEquals("RESCINDIDO", resultado.contractStatus());
        verify(escalacaoRepository).deleteById_JogadorId(2);
    }

    @Test
    void exportarCsvFormataCamposEValoresComVirgula() {
        // RN18 - Exportação em CSV com delimitador ; e números com vírgula
        Clube clube = new Clube();
        clube.setId(1);
        when(clubeRepository.existsById(1)).thenReturn(true);

        Jogador jogador = new Jogador();
        jogador.setId(2);

        Transacao t1 = new Transacao();
        t1.setId(11);
        t1.setClube(clube);
        t1.setJogador(jogador);
        t1.setNomeJogador("Meia Lua");
        t1.setTipo("VENDA");
        t1.setValor(new BigDecimal("40.00"));
        t1.setTaxa(new BigDecimal("0.30"));
        t1.setMulta(new BigDecimal("4.00"));
        t1.setLucro(new BigDecimal("3.00"));
        t1.setVariacaoCaixa(new BigDecimal("35.70"));
        t1.setCriadoEm(OffsetDateTime.of(2026, 11, 5, 16, 40, 0, 0, ZoneOffset.ofHours(-3)));

        when(transacaoRepository.findAllByClube_IdOrderByCriadoEmDescIdDesc(1)).thenReturn(List.of(t1));

        byte[] bytes = mercadoService.exportarTransacoesCsv(1, "VENDA", null);
        String csv = new String(bytes, StandardCharsets.UTF_8);

        assertTrue(csv.startsWith("data_hora;tipo;jogador;valor;taxa_ou_comissao;multa;lucro;variacao_caixa\n"));
        assertTrue(csv.contains("2026-11-05T16:40:00-03:00;VENDA;Meia Lua;40,00;0,30;4,00;3,00;35,70\n"));
    }
}
