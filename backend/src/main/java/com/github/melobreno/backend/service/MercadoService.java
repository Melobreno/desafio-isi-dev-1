package com.github.melobreno.backend.service;

import com.github.melobreno.backend.dto.ComprarJogadorRequestDto;
import com.github.melobreno.backend.dto.ContratoDto;
import com.github.melobreno.backend.dto.HistoricoTransacoesDto;
import com.github.melobreno.backend.dto.ResumoTransacoesDto;
import com.github.melobreno.backend.dto.TransacaoDto;
import com.github.melobreno.backend.exceptions.BadRequestException;
import com.github.melobreno.backend.exceptions.BusinessException;
import com.github.melobreno.backend.model.Clube;
import com.github.melobreno.backend.model.Contrato;
import com.github.melobreno.backend.model.Jogador;
import com.github.melobreno.backend.model.Transacao;
import com.github.melobreno.backend.repository.ClubeRepository;
import com.github.melobreno.backend.repository.ContratoRepository;
import com.github.melobreno.backend.repository.EscalacaoRepository;
import com.github.melobreno.backend.repository.JogadorRepository;
import com.github.melobreno.backend.repository.TransacaoRepository;
import com.github.melobreno.backend.util.ValidacoesGeraisUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class MercadoService {

    private static final BigDecimal LIMITE_TAXA = new BigDecimal("30.00");
    private static final BigDecimal TAXA_PERCENTUAL = new BigDecimal("0.05");
    private static final BigDecimal TETO_MULTA = new BigDecimal("10.00");
    private static final BigDecimal FAIXA_LUCRO_10 = new BigDecimal("10.00");
    private static final BigDecimal COMISSAO_FAIXA1 = new BigDecimal("0.10");
    private static final BigDecimal COMISSAO_FAIXA2 = new BigDecimal("0.20");
    private static final DateTimeFormatter FORMATO_RESPOSTA_DATA_HORA = DateTimeFormatter.ofPattern("uuuu-MM-dd'T'HH:mm:ss-03:00");

    private final JogadorRepository jogadorRepository;
    private final ClubeRepository clubeRepository;
    private final ContratoRepository contratoRepository;
    private final TransacaoRepository transacaoRepository;
    private final EscalacaoRepository escalacaoRepository;
    private final JogadorService jogadorService;

    @Transactional
    public TransacaoDto comprarJogador(Integer jogadorId, ComprarJogadorRequestDto request) {
        if (jogadorId == null || jogadorId < 1) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "Jogador não encontrado.");
        }

        Jogador jogador = jogadorRepository.findByIdAndExcluidoEmIsNull(jogadorId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Jogador não encontrado."));

        if (request == null || request.clubId() == null) {
            throw new BadRequestException("O club_id é obrigatório.");
        }
        if (request.clubId() <= 0) {
            throw new BadRequestException("O club_id deve ser um inteiro positivo.");
        }

        Clube clube = clubeRepository.findById(request.clubId())
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Clube não encontrado."));

        if (request.loyaltyUntil() == null) {
            throw new BadRequestException("O campo loyalty_until é obrigatório.");
        }

        OffsetDateTime agora = ValidacoesGeraisUtils.agoraBrasilia();
        OffsetDateTime fidelidadeAte = ValidacoesGeraisUtils.validarDateTime(request.loyaltyUntil());

        if (!fidelidadeAte.isAfter(agora)) {
            throw new BadRequestException("O fim da fidelidade deve ser posterior ao momento da compra.");
        }
        if (fidelidadeAte.isAfter(agora.plusDays(1095))) {
            throw new BadRequestException("O fim da fidelidade não pode ultrapassar 1.095 dias a partir da compra.");
        }

        if (jogador.getClube() != null) {
            throw new BusinessException(HttpStatus.CONFLICT, "O jogador já pertence a um clube.");
        }

        List<Transacao> vendasAnteriores = transacaoRepository
                .findAllByClube_IdAndTipoAndJogador_IdOrderByCriadoEmDescIdDesc(clube.getId(), "VENDA", jogador.getId());
        if (!vendasAnteriores.isEmpty()) {
            throw new BusinessException(HttpStatus.CONFLICT, "O clube não pode recomprar um jogador que ele mesmo já vendeu.");
        }

        long tamanhoElenco = jogadorRepository.findAllByClube_IdAndExcluidoEmIsNull(clube.getId()).size();
        if (tamanhoElenco >= 12) {
            throw new BusinessException(HttpStatus.CONFLICT, "O clube já atingiu o limite de 12 jogadores no elenco.");
        }

        BigDecimal valorMercado = jogadorService.calcularValorMercado(jogador);

        BigDecimal taxa = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        if (valorMercado.compareTo(LIMITE_TAXA) > 0) {
            taxa = valorMercado.multiply(TAXA_PERCENTUAL).setScale(2, RoundingMode.HALF_UP);
        }

        BigDecimal custoTotal = valorMercado.add(taxa);

        if (custoTotal.multiply(BigDecimal.valueOf(2)).compareTo(clube.getCaixa()) > 0) {
            throw new BusinessException(HttpStatus.CONFLICT, "O custo da compra passa do limite de 50% do caixa.");
        }

        BigDecimal novoCaixa = clube.getCaixa().subtract(custoTotal).setScale(2, RoundingMode.HALF_UP);
        clube.setCaixa(novoCaixa);
        clubeRepository.save(clube);

        jogador.setClube(clube);
        jogador.setAtualizadoEm(agora);
        jogadorRepository.save(jogador);

        Contrato contrato = new Contrato();
        contrato.setJogador(jogador);
        contrato.setClube(clube);
        contrato.setValorCompra(valorMercado);
        contrato.setFidelidadeAte(fidelidadeAte);
        contrato.setSituacao("ATIVO");
        contrato.setIniciadoEm(agora);
        contratoRepository.save(contrato);

        Transacao transacao = new Transacao();
        transacao.setClube(clube);
        transacao.setJogador(jogador);
        transacao.setNomeJogador(jogador.getNome());
        transacao.setTipo("COMPRA");
        transacao.setValor(valorMercado);
        transacao.setTaxa(taxa);
        transacao.setMulta(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
        transacao.setLucro(null);
        transacao.setVariacaoCaixa(custoTotal.negate());
        transacao.setCriadoEm(agora);
        Transacao transacaoSalva = transacaoRepository.save(transacao);

        ContratoDto contratoDto = new ContratoDto(valorMercado, fidelidadeAte, null, null, "ATIVO");

        return new TransacaoDto(
                transacaoSalva.getId(),
                clube.getId(),
                jogador.getId(),
                jogador.getNome(),
                "COMPRA",
                valorMercado,
                taxa,
                BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP),
                null,
                custoTotal.negate(),
                agora,
                contratoDto,
                null,
                null,
                null,
                null,
                novoCaixa
        );
    }

    @Transactional
    public TransacaoDto venderJogador(Integer jogadorId) {
        if (jogadorId == null || jogadorId < 1) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "Jogador não encontrado.");
        }

        Jogador jogador = jogadorRepository.findByIdAndExcluidoEmIsNull(jogadorId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Jogador não encontrado."));

        if (jogador.getClube() == null) {
            throw new BusinessException(HttpStatus.CONFLICT, "Jogador livre não pode ser vendido.");
        }

        Clube clube = jogador.getClube();

        Contrato contrato = contratoRepository
                .findFirstByJogador_IdAndSituacaoOrderByIniciadoEmDesc(jogador.getId(), "ATIVO")
                .orElseThrow(() -> new BusinessException(HttpStatus.CONFLICT, "Contrato ativo do jogador não encontrado."));

        OffsetDateTime agora = ValidacoesGeraisUtils.agoraBrasilia();
        BigDecimal valorCompra = contrato.getValorCompra();
        BigDecimal valorVenda = jogadorService.calcularValorMercado(jogador);

        int diasRestantes = calcularDiasRestantesFidelidade(contrato.getFidelidadeAte(), agora);
        int percentualMulta = calcularPercentualMulta(diasRestantes);

        BigDecimal multaCalculada = valorVenda.multiply(BigDecimal.valueOf(percentualMulta))
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        BigDecimal multa = multaCalculada.compareTo(TETO_MULTA) > 0 ? TETO_MULTA : multaCalculada;

        boolean houveMulta = multa.compareTo(BigDecimal.ZERO) > 0;
        String situacaoContrato = houveMulta ? "RESCINDIDO" : "ENCERRADO";

        BigDecimal lucro = valorVenda.subtract(valorCompra).setScale(2, RoundingMode.HALF_UP);

        BigDecimal comissao = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        if (lucro.compareTo(BigDecimal.ZERO) > 0) {
            if (lucro.compareTo(FAIXA_LUCRO_10) <= 0) {
                comissao = lucro.multiply(COMISSAO_FAIXA1).setScale(2, RoundingMode.HALF_UP);
            } else {
                BigDecimal parteAte10 = FAIXA_LUCRO_10.multiply(COMISSAO_FAIXA1);
                BigDecimal parteAcima10 = lucro.subtract(FAIXA_LUCRO_10).multiply(COMISSAO_FAIXA2);
                comissao = parteAte10.add(parteAcima10).setScale(2, RoundingMode.HALF_UP);
            }
        }

        BigDecimal creditoNoCaixa = valorVenda.subtract(multa).subtract(comissao).setScale(2, RoundingMode.HALF_UP);
        BigDecimal novoCaixa = clube.getCaixa().add(creditoNoCaixa).setScale(2, RoundingMode.HALF_UP);
        clube.setCaixa(novoCaixa);
        clubeRepository.save(clube);

        escalacaoRepository.deleteById_JogadorId(jogador.getId());

        contrato.setSituacao(situacaoContrato);
        contrato.setEncerradoEm(agora);
        contratoRepository.save(contrato);

        jogador.setClube(null);
        jogador.setAtualizadoEm(agora);
        jogadorRepository.save(jogador);

        Transacao transacao = new Transacao();
        transacao.setClube(clube);
        transacao.setJogador(jogador);
        transacao.setNomeJogador(jogador.getNome());
        transacao.setTipo("VENDA");
        transacao.setValor(valorVenda);
        transacao.setTaxa(comissao);
        transacao.setMulta(multa);
        transacao.setLucro(lucro);
        transacao.setVariacaoCaixa(creditoNoCaixa);
        transacao.setCriadoEm(agora);
        Transacao transacaoSalva = transacaoRepository.save(transacao);

        return new TransacaoDto(
                transacaoSalva.getId(),
                clube.getId(),
                jogador.getId(),
                jogador.getNome(),
                "VENDA",
                valorVenda,
                comissao,
                multa,
                lucro,
                creditoNoCaixa,
                agora,
                null,
                valorCompra,
                diasRestantes,
                percentualMulta,
                situacaoContrato,
                novoCaixa
        );
    }

    @Transactional(readOnly = true)
    public HistoricoTransacoesDto listarTransacoes(Integer clubeId, String tipo, Integer jogadorId) {
        if (clubeId == null || clubeId < 1) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "Clube não encontrado.");
        }
        if (!clubeRepository.existsById(clubeId)) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "Clube não encontrado.");
        }

        if (jogadorId != null) {
            if (jogadorId < 1) {
                throw new BadRequestException("O player_id deve ser um inteiro positivo.");
            }
            if (!jogadorRepository.existsById(jogadorId)
                    || jogadorRepository.findByIdAndExcluidoEmIsNull(jogadorId).isEmpty()) {
                throw new BusinessException(HttpStatus.NOT_FOUND, "Jogador não encontrado.");
            }
        }

        Set<String> tiposFiltrados = validarEFiltraTipos(tipo);

        List<Transacao> todas = transacaoRepository.findAllByClube_IdOrderByCriadoEmDescIdDesc(clubeId);

        List<Transacao> filtradas = todas.stream()
                .filter(t -> tiposFiltrados == null || tiposFiltrados.contains(t.getTipo()))
                .filter(t -> jogadorId == null || jogadorId.equals(t.getJogador().getId()))
                .toList();

        BigDecimal totalGasto = BigDecimal.ZERO;
        BigDecimal totalRecebido = BigDecimal.ZERO;
        BigDecimal totalTaxas = BigDecimal.ZERO;
        BigDecimal totalMultas = BigDecimal.ZERO;
        BigDecimal totalLucro = BigDecimal.ZERO;

        List<TransacaoDto> itens = new ArrayList<>(filtradas.size());

        for (Transacao t : filtradas) {
            if ("COMPRA".equals(t.getTipo())) {
                totalGasto = totalGasto.add(t.getValor()).add(t.getTaxa());
            } else if ("VENDA".equals(t.getTipo())) {
                totalRecebido = totalRecebido.add(t.getVariacaoCaixa());
                totalMultas = totalMultas.add(t.getMulta());
                if (t.getLucro() != null) {
                    totalLucro = totalLucro.add(t.getLucro());
                }
            }
            totalTaxas = totalTaxas.add(t.getTaxa());

            itens.add(new TransacaoDto(
                    t.getId(),
                    t.getClube().getId(),
                    t.getJogador().getId(),
                    t.getNomeJogador(),
                    t.getTipo(),
                    t.getValor(),
                    t.getTaxa(),
                    t.getMulta(),
                    t.getLucro(),
                    t.getVariacaoCaixa(),
                    t.getCriadoEm(),
                    null,
                    null,
                    null,
                    null,
                    null,
                    null
            ));
        }

        ResumoTransacoesDto resumo = new ResumoTransacoesDto(
                totalGasto.setScale(2, RoundingMode.HALF_UP),
                totalRecebido.setScale(2, RoundingMode.HALF_UP),
                totalTaxas.setScale(2, RoundingMode.HALF_UP),
                totalMultas.setScale(2, RoundingMode.HALF_UP),
                totalLucro.setScale(2, RoundingMode.HALF_UP)
        );

        return new HistoricoTransacoesDto(itens, resumo);
    }

    @Transactional(readOnly = true)
    public byte[] exportarTransacoesCsv(Integer clubeId, String tipo, Integer jogadorId) {
        HistoricoTransacoesDto historico = listarTransacoes(clubeId, tipo, jogadorId);

        StringBuilder csv = new StringBuilder();
        csv.append("data_hora;tipo;jogador;valor;taxa_ou_comissao;multa;lucro;variacao_caixa\n");

        for (TransacaoDto item : historico.data()) {
            csv.append(item.createdAt().format(FORMATO_RESPOSTA_DATA_HORA)).append(';');
            csv.append(item.type()).append(';');
            csv.append(escaparCampoCsv(item.playerName())).append(';');
            csv.append(formatarMoedaCsv(item.value())).append(';');
            csv.append(formatarMoedaCsv(item.fee())).append(';');
            csv.append(formatarMoedaCsv(item.penalty())).append(';');
            csv.append(item.profit() == null ? "" : formatarMoedaCsv(item.profit())).append(';');
            csv.append(formatarMoedaCsv(item.cashChange())).append('\n');
        }

        return csv.toString().getBytes(StandardCharsets.UTF_8);
    }

    public static int calcularDiasRestantesFidelidade(OffsetDateTime fidelidadeAte, OffsetDateTime referencia) {
        if (fidelidadeAte == null || !fidelidadeAte.isAfter(referencia)) {
            return 0;
        }
        long segundos = java.time.Duration.between(referencia, fidelidadeAte).getSeconds();
        return (int) Math.ceil(segundos / 86400.0);
    }

    public static int calcularPercentualMulta(int diasRestantes) {
        if (diasRestantes <= 0) {
            return 0;
        }
        if (diasRestantes <= 30) {
            return 5;
        }
        if (diasRestantes <= 180) {
            return 10;
        }
        return 20;
    }

    private Set<String> validarEFiltraTipos(String tipo) {
        if (tipo == null) {
            return null;
        }
        if (tipo.isBlank()) {
            throw new BadRequestException("O parâmetro type não pode ser vazio.");
        }
        String[] partes = tipo.split(",");
        Set<String> permitidos = Set.of("COMPRA", "VENDA");
        Set<String> resultado = new HashSet<>();

        for (String parte : partes) {
            if (!permitidos.contains(parte) || !resultado.add(parte)) {
                throw new BadRequestException("O parâmetro type contém valor inválido ou repetido.");
            }
        }
        return resultado;
    }

    private String formatarMoedaCsv(BigDecimal valor) {
        if (valor == null) {
            return "";
        }
        return String.format(Locale.of("pt", "BR"), "%.2f", valor);
    }

    private String escaparCampoCsv(String texto) {
        if (texto == null) {
            return "";
        }
        if (texto.contains(";") || texto.contains("\"")) {
            return "\"" + texto.replace("\"", "\"\"") + "\"";
        }
        return texto;
    }
}
