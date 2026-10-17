package com.github.melobreno.backend.service;

import com.github.melobreno.backend.dto.ClubeDto;
import com.github.melobreno.backend.dto.ContratoDto;
import com.github.melobreno.backend.dto.CriarClubeRequestDto;
import com.github.melobreno.backend.dto.JogadorDto;
import com.github.melobreno.backend.exceptions.BadRequestException;
import com.github.melobreno.backend.exceptions.BusinessException;
import com.github.melobreno.backend.model.Clube;
import com.github.melobreno.backend.model.Contrato;
import com.github.melobreno.backend.model.Jogador;
import com.github.melobreno.backend.model.PosicaoJogador;
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
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
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

    /**
     * RN10 - Cria um clube com caixa inicial de 300,00 e sem jogadores.
     * Valida nome único (sensível a acentos, insensível a maiúsculas/minúsculas),
     * sigla de 3 letras única correspondente e limite de 20 clubes.
     */
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

    /**
     * RN11 - Lista os clubes com caixa, valor do elenco e patrimônio calculados.
     * Ordenação opcional por nome (padrão) ou patrimônio, com desempate por nome e id.
     */
    @Transactional(readOnly = true)
    public List<ClubeDto> listarClubes(String sort) {
        validarParametroSort(sort);

        List<Clube> clubes = clubeRepository.findAll();
        List<ClubeDto> dtos = new ArrayList<>(clubes.size());

        for (Clube clube : clubes) {
            List<Jogador> elenco = jogadorRepository.findAllByClube_IdAndExcluidoEmIsNull(clube.getId());
            BigDecimal squadValue = calcularValorElenco(elenco);
            BigDecimal netWorth = clube.getCaixa().add(squadValue).setScale(2, RoundingMode.HALF_UP);
            dtos.add(new ClubeDto(clube.getId(), clube.getNome(), clube.getSigla(), clube.getCaixa(), squadValue, netWorth));
        }

        Comparator<ClubeDto> comparadorNome = Comparator
                .comparing((ClubeDto c) -> ValidacoesGeraisUtils.normalizarParaOrdenacao(c.name()))
                .thenComparing(ClubeDto::id);

        if (sort == null || "name".equals(sort)) {
            dtos.sort(comparadorNome);
        } else if ("net_worth_asc".equals(sort)) {
            dtos.sort(Comparator.comparing(ClubeDto::netWorth).thenComparing(comparadorNome));
        } else if ("net_worth_desc".equals(sort)) {
            dtos.sort(Comparator.comparing(ClubeDto::netWorth).reversed().thenComparing(comparadorNome));
        }

        return dtos;
    }

    /**
     * RN11 - Consulta os detalhes de um clube, incluindo o elenco ordenado por
     * posição (GOL, ZAG, LAT, MEI, ATA), nome e id, além dos contratos ativos.
     */
    @Transactional(readOnly = true)
    public ClubeDto buscaClube(Integer idClub) {
        if (idClub == null || idClub < 1) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "Clube não encontrado.");
        }

        Clube clube = clubeRepository.findById(idClub)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Clube não encontrado."));

        List<Jogador> elenco = new ArrayList<>(jogadorRepository.findAllByClube_IdAndExcluidoEmIsNull(idClub));
        elenco.sort(comparadorElenco());

        OffsetDateTime agora = ValidacoesGeraisUtils.agoraBrasilia();
        List<JogadorDto> jogadoresDto = new ArrayList<>(elenco.size());
        BigDecimal squadValue = ZERO_MOEDAS;

        for (Jogador jogador : elenco) {
            BigDecimal marketValue = jogadorService.calcularValorMercado(jogador);
            squadValue = squadValue.add(marketValue);

            Optional<Contrato> contratoOpt = contratoRepository
                    .findFirstByJogador_IdAndSituacaoOrderByIniciadoEmDesc(jogador.getId(), "ATIVO");

            ContratoDto contratoDto = contratoOpt.map(contrato -> {
                int remainingDays = 0;
                if (contrato.getFidelidadeAte().isAfter(agora)) {
                    long segundos = Duration.between(agora, contrato.getFidelidadeAte()).getSeconds();
                    remainingDays = (int) Math.ceil(segundos / 86400.0);
                }
                int penaltyRate;
                if (remainingDays == 0) {
                    penaltyRate = 0;
                } else if (remainingDays <= 30) {
                    penaltyRate = 5;
                } else if (remainingDays <= 180) {
                    penaltyRate = 10;
                } else {
                    penaltyRate = 20;
                }
                return new ContratoDto(contrato.getValorCompra(), contrato.getFidelidadeAte(), remainingDays, penaltyRate);
            }).orElse(null);

            jogadoresDto.add(jogadorService.paraDto(jogador, contratoDto));
        }

        squadValue = squadValue.setScale(2, RoundingMode.HALF_UP);
        BigDecimal netWorth = clube.getCaixa().add(squadValue).setScale(2, RoundingMode.HALF_UP);

        return new ClubeDto(clube.getId(), clube.getNome(), clube.getSigla(), clube.getCaixa(), squadValue, netWorth, jogadoresDto);
    }

    private BigDecimal calcularValorElenco(List<Jogador> elenco) {
        BigDecimal total = BigDecimal.ZERO;
        for (Jogador jogador : elenco) {
            total = total.add(jogadorService.calcularValorMercado(jogador));
        }
        return total.setScale(2, RoundingMode.HALF_UP);
    }

    private Comparator<Jogador> comparadorElenco() {
        return Comparator.comparing((Jogador j) -> ordemPosicaoElenco(j.getPosicao()))
                .thenComparing(j -> ValidacoesGeraisUtils.normalizarParaOrdenacao(j.getNome()))
                .thenComparing(Jogador::getId);
    }

    private int ordemPosicaoElenco(PosicaoJogador posicao) {
        return switch (posicao) {
            case GOL -> 1;
            case ZAG -> 2;
            case LAT -> 3;
            case MEI -> 4;
            case ATA -> 5;
        };
    }

    private void validarParametroSort(String sort) {
        if (sort != null && !List.of("name", "net_worth_asc", "net_worth_desc").contains(sort)) {
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

    private String validarSiglaClube(String acronym, String nomeValido) {
        if (acronym == null || !SIGLA_PATTERN.matcher(acronym).matches()) {
            throw new BadRequestException("A sigla deve conter exatamente 3 letras maiúsculas de A a Z sem acento.");
        }

        if (acronym.charAt(0) == acronym.charAt(1) && acronym.charAt(1) == acronym.charAt(2)) {
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

        if (primeiraLetra != acronym.charAt(0)) {
            throw new BadRequestException("A primeira letra da sigla deve corresponder à primeira letra do nome do clube.");
        }

        int pos1 = nomeNormalizado.indexOf(acronym.charAt(0));
        int pos2 = nomeNormalizado.indexOf(acronym.charAt(1), pos1 + 1);
        int pos3 = pos2 != -1 ? nomeNormalizado.indexOf(acronym.charAt(2), pos2 + 1) : -1;

        if (pos2 == -1 || pos3 == -1) {
            throw new BadRequestException("As letras da sigla devem aparecer no nome do clube na mesma ordem.");
        }

        return acronym;
    }
}
