package com.github.melobreno.backend.service;

import com.github.melobreno.backend.dto.ClubeDto;
import com.github.melobreno.backend.dto.ContratoDto;
import com.github.melobreno.backend.dto.CriarClubeRequestDto;
import com.github.melobreno.backend.dto.JogadorDto;
import com.github.melobreno.backend.exceptions.BadRequestException;
import com.github.melobreno.backend.exceptions.BusinessException;
import com.github.melobreno.backend.model.Clube;
import com.github.melobreno.backend.model.Jogador;
import com.github.melobreno.backend.repository.ClubeRepository;
import com.github.melobreno.backend.repository.ContratoRepository;
import com.github.melobreno.backend.repository.JogadorRepository;
import com.github.melobreno.backend.util.ValidacoesGeraisUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class ClubeServices {

    private static final BigDecimal CAIXA_INICIAL = BigDecimal.valueOf(300).setScale(2, RoundingMode.HALF_UP);
    private static final BigDecimal ZERO_MOEDAS = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
    private static final Pattern SIGLA_PATTERN = Pattern.compile("^[A-Z]{3}$");

    private final ClubeRepository clubeRepository;
    private final JogadorRepository jogadorRepository;
    private final ContratoRepository contratoRepository;
    private final JogadorService jogadorService;

    @Transactional
    public ClubeDto criaClube(CriarClubeRequestDto request) {
        if (request == null) {
            throw new BadRequestException("O corpo da requisição é obrigatório.");
        }

        String nome = validarNomeClube(request.name());
        String sigla = validarSiglaClube(request.acronym(), nome);

        if (clubeRepository.count() >= 20) {
            throw new BusinessException(HttpStatus.CONFLICT, "A liga aceita no máximo 20 clubes.");
        }

        List<Clube> todosClubes = clubeRepository.findAll();
        boolean nomeExiste = todosClubes.stream().anyMatch(c -> c.getNome().equalsIgnoreCase(nome));
        if (nomeExiste) {
            throw new BusinessException(HttpStatus.CONFLICT, "Já existe um clube cadastrado com este nome.");
        }

        boolean siglaExiste = todosClubes.stream().anyMatch(c -> c.getSigla().equalsIgnoreCase(sigla));
        if (siglaExiste) {
            throw new BusinessException(HttpStatus.CONFLICT, "Já existe um clube cadastrado com esta sigla.");
        }

        Clube clube = new Clube();
        clube.setNome(nome);
        clube.setSigla(sigla);
        clube.setCaixa(CAIXA_INICIAL);
        clube.setCriadoEm(ValidacoesGeraisUtils.agoraBrasilia());

        Clube salvo = clubeRepository.save(clube);
        return new ClubeDto(salvo.getId(), salvo.getNome(), salvo.getSigla(), salvo.getCaixa(), ZERO_MOEDAS, salvo.getCaixa());
    }

    @Transactional(readOnly = true)
    public List<ClubeDto> listarClubes(String ordenacao) {
        validarParametroOrdenacao(ordenacao);

        List<Clube> clubes = clubeRepository.findAll();
        List<ClubeDto> dtos = new ArrayList<>(clubes.size());

        for (Clube clube : clubes) {
            List<Jogador> elenco = jogadorRepository.findAllByClube_IdAndExcluidoEmIsNull(clube.getId());
            BigDecimal valorElenco = calcularValorElenco(elenco);
            BigDecimal patrimonioLiquido = clube.getCaixa().add(valorElenco).setScale(2, RoundingMode.HALF_UP);
            dtos.add(new ClubeDto(clube.getId(), clube.getNome(), clube.getSigla(), clube.getCaixa(), valorElenco, patrimonioLiquido));
        }

        Comparator<ClubeDto> comparadorNome = Comparator
                .comparing((ClubeDto c) -> ValidacoesGeraisUtils.normalizarParaOrdenacao(c.name()))
                .thenComparing(ClubeDto::id);

        if (ordenacao == null || "name".equals(ordenacao)) {
            dtos.sort(comparadorNome);
        } else if ("net_worth_asc".equals(ordenacao)) {
            dtos.sort(Comparator.comparing(ClubeDto::netWorth).thenComparing(comparadorNome));
        } else if ("net_worth_desc".equals(ordenacao)) {
            dtos.sort(Comparator.comparing(ClubeDto::netWorth).reversed().thenComparing(comparadorNome));
        }

        return dtos;
    }

    @Transactional(readOnly = true)
    public ClubeDto buscaClube(Integer clubeId) {
        if (clubeId == null || clubeId < 1) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "Clube não encontrado.");
        }

        Clube clube = clubeRepository.findById(clubeId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Clube não encontrado."));

        List<Jogador> elenco = new ArrayList<>(jogadorRepository.findAllByClube_IdAndExcluidoEmIsNull(clubeId));
        elenco.sort(JogadorService.comparadorElenco());

        OffsetDateTime agora = ValidacoesGeraisUtils.agoraBrasilia();
        List<JogadorDto> jogadoresDto = new ArrayList<>(elenco.size());
        BigDecimal valorElenco = ZERO_MOEDAS;

        for (Jogador jogador : elenco) {
            BigDecimal valorMercado = jogadorService.calcularValorMercado(jogador);
            valorElenco = valorElenco.add(valorMercado);

            ContratoDto contratoDto = contratoRepository
                    .findFirstByJogador_IdAndSituacaoOrderByIniciadoEmDesc(jogador.getId(), "ATIVO")
                    .map(contrato -> {
                        int diasRestantes = MercadoService.calcularDiasRestantesFidelidade(contrato.getFidelidadeAte(), agora);
                        int percentualMulta = MercadoService.calcularPercentualMulta(diasRestantes);
                        return new ContratoDto(contrato.getValorCompra(), contrato.getFidelidadeAte(), diasRestantes, percentualMulta);
                    })
                    .orElse(null);

            jogadoresDto.add(jogadorService.paraDto(jogador, contratoDto));
        }

        valorElenco = valorElenco.setScale(2, RoundingMode.HALF_UP);
        BigDecimal patrimonioLiquido = clube.getCaixa().add(valorElenco).setScale(2, RoundingMode.HALF_UP);

        return new ClubeDto(clube.getId(), clube.getNome(), clube.getSigla(), clube.getCaixa(), valorElenco, patrimonioLiquido, jogadoresDto);
    }

    private BigDecimal calcularValorElenco(List<Jogador> elenco) {
        BigDecimal total = BigDecimal.ZERO;
        for (Jogador jogador : elenco) {
            total = total.add(jogadorService.calcularValorMercado(jogador));
        }
        return total.setScale(2, RoundingMode.HALF_UP);
    }

    private void validarParametroOrdenacao(String ordenacao) {
        if (ordenacao != null && !List.of("name", "net_worth_asc", "net_worth_desc").contains(ordenacao)) {
            throw new BadRequestException("O parâmetro sort deve ser name, net_worth_asc ou net_worth_desc.");
        }
    }

    private String validarNomeClube(String nome) {
        String normalizado = ValidacoesGeraisUtils.aplicarV4(nome, "name");
        int tamanho = normalizado.codePointCount(0, normalizado.length());
        if (tamanho < 3 || tamanho > 60) {
            throw new BadRequestException("O nome do clube deve ter entre 3 e 60 caracteres.");
        }

        for (int i = 0; i < normalizado.length(); ) {
            int cp = normalizado.codePointAt(i);
            if (!Character.isLetter(cp) && cp != ' ' && cp != '-' && cp != '.') {
                throw new BadRequestException("O nome do clube deve conter apenas letras, espaços, hífen e ponto.");
            }
            i += Character.charCount(cp);
        }

        String[] palavras = normalizado.split(" ");
        if (palavras.length < 2 || palavras.length > 5) {
            throw new BadRequestException("O nome do clube deve conter entre 2 e 5 palavras.");
        }

        for (String palavra : palavras) {
            if (palavra.codePoints().noneMatch(Character::isLetter)) {
                throw new BadRequestException("Cada palavra do nome do clube deve conter pelo menos uma letra.");
            }
        }

        return normalizado;
    }

    private String validarSiglaClube(String sigla, String nomeValido) {
        if (sigla == null || !SIGLA_PATTERN.matcher(sigla).matches()) {
            throw new BadRequestException("A sigla deve conter exatamente 3 letras maiúsculas de A a Z sem acento.");
        }

        if (sigla.charAt(0) == sigla.charAt(1) && sigla.charAt(1) == sigla.charAt(2)) {
            throw new BadRequestException("As três letras da sigla não podem ser todas iguais.");
        }

        String nomeNormalizado = ValidacoesGeraisUtils.removerAcentos(nomeValido).toUpperCase(Locale.ROOT);
        int primeiraLetra = -1;
        for (int i = 0; i < nomeNormalizado.length(); ) {
            int cp = nomeNormalizado.codePointAt(i);
            if (Character.isLetter(cp)) {
                primeiraLetra = cp;
                break;
            }
            i += Character.charCount(cp);
        }

        if (primeiraLetra != sigla.charAt(0)) {
            throw new BadRequestException("A primeira letra da sigla deve corresponder à primeira letra do nome do clube.");
        }

        int pos1 = nomeNormalizado.indexOf(sigla.charAt(0));
        int pos2 = nomeNormalizado.indexOf(sigla.charAt(1), pos1 + 1);
        int pos3 = pos2 != -1 ? nomeNormalizado.indexOf(sigla.charAt(2), pos2 + 1) : -1;

        if (pos2 == -1 || pos3 == -1) {
            throw new BadRequestException("As letras da sigla devem aparecer no nome do clube na mesma ordem.");
        }

        return sigla;
    }
}
