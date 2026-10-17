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
import java.time.Duration;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
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

    /**
     * RN12, RN13, RN14, RN01, RN05, RN09 - Compra de jogador livre para um clube.
     * - RN09 / V08: O jogador deve existir e não estar excluído logicamente (404).
     * - V08: O clube deve existir (404).
     * - RN01: Valida estritamente a data loyalty_until no fuso de Brasília (400).
     * - Limites: loyalty_until deve ser posterior ao momento da compra e até 1.095 dias depois dele (400).
     * - RN12: O jogador deve estar livre (sem clube) (409).
     * - RN12: Um clube não pode comprar um jogador que ele mesmo já vendeu (409).
     * - RN14: Limite de no máximo 12 jogadores no elenco do clube (409).
     * - RN05: O preço pago é o valor de mercado no momento, nunca o valor base.
     * - RN13: Taxa de compra de 5% cobrada apenas se o valor de mercado for maior que 30,00.
     * - RN13: Custo total (valor + taxa) não pode passar de 50% do caixa antes da compra (sem arredondar) (409).
     * - Operação atômica: desconta o custo do caixa, vincula o jogador, gera o contrato ATIVO e grava a transação COMPRA.
     */
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
        OffsetDateTime loyaltyUntil = ValidacoesGeraisUtils.validarDateTime(request.loyaltyUntil());

        if (!loyaltyUntil.isAfter(agora)) {
            throw new BadRequestException("O fim da fidelidade deve ser posterior ao momento da compra.");
        }
        if (loyaltyUntil.isAfter(agora.plusDays(1095))) {
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
        contrato.setFidelidadeAte(loyaltyUntil);
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

        ContratoDto contratoDto = new ContratoDto(valorMercado, loyaltyUntil, null, null, "ATIVO");

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

    /**
     * RN15, RN16, RN19 item 5, RN05, RN09 - Venda de jogador pelo clube atual.
     * - RN09 / V08: O jogador deve existir e não estar excluído logicamente (404).
     * - RN16 item 6: Jogador livre (sem clube) não pode ser vendido (409).
     * - RN16 item 1: O valor de compra é obtido do contrato ATIVO (sem a taxa de compra).
     * - RN05: O valor de venda é o valor de mercado no momento da venda.
     * - RN15: Multa por fidelidade calculada com base nos dias restantes (arredondados para cima),
     *         limitada ao teto de 10,00. Contrato vira RESCINDIDO com multa ou ENCERRADO sem multa.
     * - RN16: Lucro = valor na venda - valor de compra.
     * - RN16: Comissão progressiva se lucro > 0: 10% até 10,00 e 20% sobre o excedente, somadas e arredondadas.
     * - RN16: Crédito no caixa = valor na venda - multa - comissão.
     * - RN19 item 5: Se o jogador estiver na escalação titular do clube, é removido na mesma operação.
     * - Operação atômica: jogador volta a livre, contrato é encerrado/rescindido, transação VENDA é gravada.
     */
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

        int diasRestantes = 0;
        if (contrato.getFidelidadeAte().isAfter(agora)) {
            long segundos = Duration.between(agora, contrato.getFidelidadeAte()).getSeconds();
            diasRestantes = (int) Math.ceil(segundos / 86400.0);
        }

        int penaltyRate;
        if (diasRestantes == 0) {
            penaltyRate = 0;
        } else if (diasRestantes <= 30) {
            penaltyRate = 5;
        } else if (diasRestantes <= 180) {
            penaltyRate = 10;
        } else {
            penaltyRate = 20;
        }

        BigDecimal multaCalculada = valorVenda.multiply(BigDecimal.valueOf(penaltyRate))
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
                penaltyRate,
                situacaoContrato,
                novoCaixa
        );
    }

    /**
     * RN17 - Consulta o histórico de transações de um clube com resumo de totais (summary).
     * - V08: Clube inexistente -> 404 Not Found.
     * - Filtro player_id: se inexistente ou excluído logicamente -> 404 Not Found.
     * - Filtro type: aceita COMPRA, VENDA ou combinação separada por vírgula sem repetição (400 se inválido).
     * - Ordenação: da mais recente para a mais antiga (criado_em decrescente, empate por id decrescente).
     * - Summary: calcula totais gastos, recebidos, taxas, multas e lucro das transações filtradas.
     */
    @Transactional(readOnly = true)
    public HistoricoTransacoesDto listarTransacoes(Integer clubeId, String type, Integer playerId) {
        if (clubeId == null || clubeId < 1) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "Clube não encontrado.");
        }
        if (!clubeRepository.existsById(clubeId)) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "Clube não encontrado.");
        }

        if (playerId != null) {
            if (playerId < 1) {
                throw new BadRequestException("O player_id deve ser um inteiro positivo.");
            }
            if (!jogadorRepository.existsById(playerId)
                    || jogadorRepository.findByIdAndExcluidoEmIsNull(playerId).isEmpty()) {
                throw new BusinessException(HttpStatus.NOT_FOUND, "Jogador não encontrado.");
            }
        }

        Set<String> tiposFiltrados = validarEFiltraTipos(type);

        List<Transacao> todas = transacaoRepository.findAllByClube_IdOrderByCriadoEmDescIdDesc(clubeId);

        List<Transacao> filtradas = todas.stream()
                .filter(t -> tiposFiltrados == null || tiposFiltrados.contains(t.getTipo()))
                .filter(t -> playerId == null || playerId.equals(t.getJogador().getId()))
                .toList();

        BigDecimal totalSpent = BigDecimal.ZERO;
        BigDecimal totalReceived = BigDecimal.ZERO;
        BigDecimal totalFees = BigDecimal.ZERO;
        BigDecimal totalPenalties = BigDecimal.ZERO;
        BigDecimal totalProfit = BigDecimal.ZERO;

        List<TransacaoDto> itens = new ArrayList<>(filtradas.size());

        for (Transacao t : filtradas) {
            if ("COMPRA".equals(t.getTipo())) {
                totalSpent = totalSpent.add(t.getValor()).add(t.getTaxa());
            } else if ("VENDA".equals(t.getTipo())) {
                totalReceived = totalReceived.add(t.getVariacaoCaixa());
                totalPenalties = totalPenalties.add(t.getMulta());
                if (t.getLucro() != null) {
                    totalProfit = totalProfit.add(t.getLucro());
                }
            }
            totalFees = totalFees.add(t.getTaxa());

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

        ResumoTransacoesDto summary = new ResumoTransacoesDto(
                totalSpent.setScale(2, RoundingMode.HALF_UP),
                totalReceived.setScale(2, RoundingMode.HALF_UP),
                totalFees.setScale(2, RoundingMode.HALF_UP),
                totalPenalties.setScale(2, RoundingMode.HALF_UP),
                totalProfit.setScale(2, RoundingMode.HALF_UP)
        );

        return new HistoricoTransacoesDto(itens, summary);
    }

    /**
     * RN18 - Exportação do histórico de transações em formato CSV (text/csv).
     * - Utiliza os mesmos filtros e validações de RN17.
     * - Cabeçalho: data_hora;tipo;jogador;valor;taxa_ou_comissao;multa;lucro;variacao_caixa
     * - Separador ';', números com 2 casas e vírgula decimal, negativo com '-'.
     * - Se o nome do jogador contiver ';' ou aspas, vai entre aspas duplas com aspas internas duplicadas.
     * - UTF-8 sem BOM, LF no final de cada linha.
     */
    @Transactional(readOnly = true)
    public byte[] exportarTransacoesCsv(Integer clubeId, String type, Integer playerId) {
        HistoricoTransacoesDto historico = listarTransacoes(clubeId, type, playerId);

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

    private Set<String> validarEFiltraTipos(String type) {
        if (type == null) {
            return null;
        }
        if (type.isBlank()) {
            throw new BadRequestException("O parâmetro type não pode ser vazio.");
        }
        String[] partes = type.split(",");
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
