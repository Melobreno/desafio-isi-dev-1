package com.github.melobreno.backend.service;

import com.github.melobreno.backend.dto.AlterarCondicaoRequestDto;
import com.github.melobreno.backend.dto.AtualizarJogadorRequestDto;
import com.github.melobreno.backend.dto.ContratoDto;
import com.github.melobreno.backend.dto.CriarJogadorRequestDto;
import com.github.melobreno.backend.dto.CriarJogadorResponseDto;
import com.github.melobreno.backend.dto.JogadorDto;
import com.github.melobreno.backend.dto.MetadadosPaginaDto;
import com.github.melobreno.backend.dto.PaginaJogadoresDto;
import com.github.melobreno.backend.exceptions.BusinessException;
import com.github.melobreno.backend.model.CondicaoJogador;
import com.github.melobreno.backend.model.Contrato;
import com.github.melobreno.backend.model.Jogador;
import com.github.melobreno.backend.model.PosicaoJogador;
import com.github.melobreno.backend.repository.ClubeRepository;
import com.github.melobreno.backend.repository.EscalacaoRepository;
import com.github.melobreno.backend.repository.JogadorRepository;
import com.github.melobreno.backend.util.ValidacoesGeraisUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.Normalizer;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class JogadorService {

    private static final BigDecimal VALOR_MINIMO = new BigDecimal("1.00");
    private final JogadorRepository jogadorRepository;
    private final ClubeRepository clubeRepository;
    private final EscalacaoRepository escalacaoRepository;

    @Transactional
    public CriarJogadorResponseDto criarJogador(CriarJogadorRequestDto request) {
        if (request == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "O corpo da requisição é obrigatório.");
        }

        String nome = validarNome(request.name());
        PosicaoJogador posicao = ValidacoesGeraisUtils.validaEnum("position", PosicaoJogador.class, request.position());
        validarAgilidade(request.agility(), request.age());
        validarIdade(request.age());
        validarAtributos(request.pace(), request.shooting(), request.passing(), request.dribbling(), request.defending(), request.physical());
        validarPotencial(request.potential(), request.age(), request.pace(), request.shooting(), request.passing(), request.dribbling(), request.defending(), request.physical());

        Jogador jogador = new Jogador();
        jogador.setNome(nome);
        jogador.setPosicao(posicao);
        jogador.setAgilidade(request.agility());
        jogador.setIdade(request.age());
        jogador.setVelocidade(request.pace());
        jogador.setFinalizacao(request.shooting());
        jogador.setPasse(request.passing());
        jogador.setDrible(request.dribbling());
        jogador.setDefesa(request.defending());
        jogador.setFisico(request.physical());
        jogador.setPotencial(request.potential());
        jogador.setCondicao(CondicaoJogador.APTO);
        jogador.setValorBase(calcularValorBase(jogador));
        OffsetDateTime agora = ValidacoesGeraisUtils.agoraBrasilia();
        jogador.setCriadoEm(agora);
        jogador.setAtualizadoEm(agora);

        return paraRespostaCriacao(jogadorRepository.save(jogador));
    }

    @Transactional(readOnly = true)
    public JogadorDto buscarJogadorId(Integer id) {
        return paraDto(buscarAtivo(id));
    }

    @Transactional
    public JogadorDto atualizarJogador(Integer id, AtualizarJogadorRequestDto request) {
        if (request == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "O corpo da requisição é obrigatório.");
        }
        Jogador jogador = buscarAtivo(id);
        String nome = validarNome(request.name());
        PosicaoJogador posicao = ValidacoesGeraisUtils.validaEnum("position", PosicaoJogador.class, request.position());
        validarIdade(request.age());
        validarAgilidade(request.agility(), request.age());

        if (request.age() < jogador.getIdade()) {
            throw new BusinessException(HttpStatus.CONFLICT, "A idade do jogador não pode diminuir.");
        }
        if (jogador.getClube() != null && jogador.getPosicao() != posicao) {
            throw new BusinessException(HttpStatus.CONFLICT, "A posição de um jogador com clube não pode ser alterada.");
        }

        jogador.setNome(nome);
        jogador.setPosicao(posicao);
        jogador.setAgilidade(request.agility());
        jogador.setIdade(request.age());
        jogador.setAtualizadoEm(ValidacoesGeraisUtils.agoraBrasilia());
        return paraDto(jogadorRepository.save(jogador));
    }

    @Transactional
    public JogadorDto alterarCondicao(Integer id, AlterarCondicaoRequestDto request) {
        if (request == null || request.condition() == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "A condição informada é inválida.");
        }
        CondicaoJogador condicao = ValidacoesGeraisUtils.validaEnum("condition", CondicaoJogador.class, request.condition());
        Jogador jogador = buscarAtivo(id);
        if (jogador.getCondicao() == CondicaoJogador.DOENTE && condicao == CondicaoJogador.APTO) {
            throw new BusinessException(HttpStatus.CONFLICT, "Um jogador DOENTE não pode voltar diretamente para APTO.");
        }

        jogador.setCondicao(condicao);
        if (condicao == CondicaoJogador.DOENTE) {
            escalacaoRepository.deleteById_JogadorId(jogador.getId());
        }
        jogador.setAtualizadoEm(ValidacoesGeraisUtils.agoraBrasilia());
        return paraDto(jogadorRepository.save(jogador));
    }

    @Transactional
    public void excluirJogador(Integer id) {
        Jogador jogador = buscarAtivo(id);
        if (jogador.getClube() != null) {
            throw new BusinessException(HttpStatus.CONFLICT, "Somente jogadores livres podem ser excluídos.");
        }
        jogador.setExcluidoEm(ValidacoesGeraisUtils.agoraBrasilia());
        jogador.setAtualizadoEm(jogador.getExcluidoEm());
        jogadorRepository.save(jogador);
    }

    @Transactional(readOnly = true)
    public PaginaJogadoresDto listarJogadores(
            String busca,
            String posicao,
            String condicao,
            Boolean livre,
            Integer clubeId,
            Integer idadeMinima,
            Integer idadeMaxima,
            BigDecimal valorMinimo,
            BigDecimal valorMaximo,
            String ordenacao,
            Integer paginaParam,
            Integer limiteParam
    ) {
        validarFiltros(posicao, condicao, livre, clubeId, idadeMinima, idadeMaxima, valorMinimo, valorMaximo, paginaParam, limiteParam);
        String buscaNormalizada = validarBusca(busca);
        List<String> criteriosOrdenacao = validarOrdenacao(ordenacao);

        if (clubeId != null && !clubeRepository.existsById(clubeId)) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "Clube não encontrado.");
        }

        int pagina = paginaParam == null ? 1 : paginaParam;
        int tamanhoPagina = limiteParam == null ? 10 : limiteParam;
        List<Jogador> filtrados = jogadorRepository.findAllByExcluidoEmIsNull().stream()
                .filter(jogador -> posicao == null || jogador.getPosicao().name().equals(posicao))
                .filter(jogador -> condicao == null || jogador.getCondicao().name().equals(condicao))
                .filter(jogador -> livre == null || livre == (jogador.getClube() == null))
                .filter(jogador -> clubeId == null || jogador.getClube() != null && clubeId.equals(jogador.getClube().getId()))
                .filter(jogador -> idadeMinima == null || jogador.getIdade() >= idadeMinima)
                .filter(jogador -> idadeMaxima == null || jogador.getIdade() <= idadeMaxima)
                .filter(jogador -> buscaNormalizada == null || normalizarBusca(jogador.getNome()).contains(buscaNormalizada))
                .filter(jogador -> valorMinimo == null || calcularValorMercado(jogador).compareTo(valorMinimo) >= 0)
                .filter(jogador -> valorMaximo == null || calcularValorMercado(jogador).compareTo(valorMaximo) <= 0)
                .toList();

        filtrados = new ArrayList<>(filtrados);
        filtrados.sort(comparador(criteriosOrdenacao));

        long total = filtrados.size();
        int totalPaginas = total == 0 ? 0 : (int) ((total + tamanhoPagina - 1) / tamanhoPagina);
        long inicioIndice = (long) (pagina - 1) * tamanhoPagina;
        List<JogadorDto> dados = inicioIndice >= total
                ? List.of()
                : filtrados.subList((int) inicioIndice, (int) Math.min(inicioIndice + tamanhoPagina, total))
                        .stream()
                        .map(this::paraDto)
                        .toList();

        return new PaginaJogadoresDto(dados, new MetadadosPaginaDto(pagina, tamanhoPagina, total, totalPaginas));
    }

    private Jogador buscarAtivo(Integer id) {
        if (id == null || id < 1) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "Jogador não encontrado.");
        }
        return jogadorRepository.findByIdAndExcluidoEmIsNull(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Jogador não encontrado."));
    }

    private String validarNome(String nome) {
        String normalizado = ValidacoesGeraisUtils.aplicarV4(nome, "name");
        int tamanho = normalizado.codePointCount(0, normalizado.length());
        if (tamanho < 3 || tamanho > 100) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "O nome do jogador deve ter entre 3 e 100 caracteres.");
        }
        if (normalizado.codePoints().anyMatch(Character::isDigit)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "O nome do jogador não pode conter dígitos.");
        }
        long palavras = List.of(normalizado.split(" "))
                .stream()
                .filter(palavra -> palavra.codePoints().anyMatch(Character::isLetter))
                .count();
        if (palavras < 2) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "O nome do jogador deve conter pelo menos duas palavras.");
        }
        return normalizado;
    }

    private void validarIdade(Integer idade) {
        if (idade == null || idade < 16 || idade > 45) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "A idade deve estar entre 16 e 45 anos.");
        }
    }

    private void validarAgilidade(Integer agilidade, Integer idade) {
        if (agilidade == null || agilidade < 1 || agilidade > 100
                || idade != null && idade >= 35 && agilidade > 85) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "A agilidade está fora do limite permitido para a idade.");
        }
    }

    private void validarAtributos(Integer... atributos) {
        int soma = 0;
        for (Integer atributo : atributos) {
            if (atributo == null || atributo < 1 || atributo > 99) {
                throw new BusinessException(HttpStatus.BAD_REQUEST, "Cada atributo deve estar entre 1 e 99.");
            }
            soma += atributo;
        }
        if (soma > 480) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "A soma dos seis atributos não pode passar de 480.");
        }
    }

    private void validarPotencial(Integer potencial, Integer idade, Integer... atributos) {
        if (potencial == null || potencial < 1 || potencial > 99) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "O potencial deve estar entre 1 e 99.");
        }
        int maiorAtributo = 0;
        for (Integer atributo : atributos) {
            maiorAtributo = Math.max(maiorAtributo, atributo);
        }
        if (potencial < maiorAtributo || idade >= 33 && potencial != maiorAtributo) {
            throw new BusinessException(HttpStatus.BAD_REQUEST,
                    "O potencial deve ser pelo menos o maior atributo e, a partir dos 33 anos, igual a ele.");
        }
    }

    private String validarBusca(String busca) {
        if (busca == null) {
            return null;
        }
        String normalizada = normalizarBusca(ValidacoesGeraisUtils.aplicarV4Search(busca));
        int tamanho = normalizada.codePointCount(0, normalizada.length());
        if (tamanho < 2 || tamanho > 100) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "A busca deve ter entre 2 e 100 caracteres.");
        }
        return normalizada;
    }

    private void validarFiltros(
            String posicao,
            String condicao,
            Boolean livre,
            Integer clubeId,
            Integer idadeMinima,
            Integer idadeMaxima,
            BigDecimal valorMinimo,
            BigDecimal valorMaximo,
            Integer pagina,
            Integer limite
    ) {
        if (posicao != null) {
            ValidacoesGeraisUtils.validaEnum("position", PosicaoJogador.class, posicao);
        }
        if (condicao != null) {
            ValidacoesGeraisUtils.validaEnum("condition", CondicaoJogador.class, condicao);
        }
        if (clubeId != null && clubeId < 1 || livre != null && livre && clubeId != null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "A combinação dos filtros free e club_id é inválida.");
        }
        if (idadeMinima != null && (idadeMinima < 16 || idadeMinima > 45)
                || idadeMaxima != null && (idadeMaxima < 16 || idadeMaxima > 45)
                || idadeMinima != null && idadeMaxima != null && idadeMinima > idadeMaxima) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "A faixa de idade informada é inválida.");
        }
        BigDecimal limiteValor = new BigDecimal("550");
        if (valorMinimo != null && (valorMinimo.signum() < 0 || valorMinimo.compareTo(limiteValor) > 0
                || valorMinimo.scale() > 2)
                || valorMaximo != null && (valorMaximo.signum() < 0 || valorMaximo.compareTo(limiteValor) > 0
                || valorMaximo.scale() > 2)
                || valorMinimo != null && valorMaximo != null && valorMinimo.compareTo(valorMaximo) > 0) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "A faixa de valor de mercado informada é inválida.");
        }
        if (pagina != null && pagina < 1 || limite != null && (limite < 1 || limite > 50)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "A paginação informada é inválida.");
        }
    }

    private List<String> validarOrdenacao(String ordenacao) {
        if (ordenacao == null) {
            return List.of("name");
        }
        String[] criterios = ordenacao.split(",", -1);
        if (criterios.length > 2 || ordenacao.isEmpty()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "O parâmetro sort aceita no máximo dois critérios.");
        }
        List<String> permitidos = List.of("name", "value_asc", "value_desc", "age_asc", "age_desc", "position");
        List<String> resultado = List.of(criterios);
        if (resultado.stream().anyMatch(criterio -> !permitidos.contains(criterio))
                || resultado.stream().distinct().count() != resultado.size()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "O parâmetro sort contém um critério inválido ou repetido.");
        }
        return resultado;
    }

    private Comparator<Jogador> comparador(List<String> criterios) {
        Comparator<Jogador> comparator = (primeiro, segundo) -> 0;
        for (String criterio : criterios) {
            Comparator<Jogador> criterioComparator = switch (criterio) {
                case "value_asc" -> Comparator.comparing(this::calcularValorMercado);
                case "value_desc" -> Comparator.comparing(this::calcularValorMercado).reversed();
                case "age_asc" -> Comparator.comparing(Jogador::getIdade);
                case "age_desc" -> Comparator.comparing(Jogador::getIdade).reversed();
                case "position" -> Comparator.comparing(Jogador::getPosicao);
                default -> this::compararNomes;
            };
            comparator = comparator.thenComparing(criterioComparator);
        }
        return comparator.thenComparing(this::compararNomes).thenComparing(Jogador::getId);
    }

    private int compararNomes(Jogador primeiro, Jogador segundo) {
        return compararUnicode(normalizarBusca(primeiro.getNome()), normalizarBusca(segundo.getNome()));
    }

    private int compararUnicode(String primeiro, String segundo) {
        int[] caracteresPrimeiro = primeiro.codePoints().toArray();
        int[] caracteresSegundo = segundo.codePoints().toArray();
        int limite = Math.min(caracteresPrimeiro.length, caracteresSegundo.length);
        for (int indice = 0; indice < limite; indice++) {
            int comparacao = Integer.compare(caracteresPrimeiro[indice], caracteresSegundo[indice]);
            if (comparacao != 0) {
                return comparacao;
            }
        }
        return Integer.compare(caracteresPrimeiro.length, caracteresSegundo.length);
    }

    private BigDecimal calcularValorBase(Jogador jogador) {
        int overall = calcularOverall(jogador);
        BigDecimal parteOverall;
        if (overall <= 40) {
            parteOverall = BigDecimal.ZERO;
        } else if (overall <= 60) {
            parteOverall = BigDecimal.valueOf(overall - 40L).multiply(new BigDecimal("0.50"));
        } else if (overall <= 75) {
            parteOverall = new BigDecimal("10.00")
                    .add(BigDecimal.valueOf(overall - 60L).multiply(new BigDecimal("2.00")));
        } else {
            parteOverall = new BigDecimal("40.00")
                    .add(BigDecimal.valueOf(overall - 75L).multiply(new BigDecimal("6.00")));
        }
        if (jogador.getIdade() <= 21) {
            parteOverall = parteOverall.multiply(BigDecimal.valueOf(
                    100L + jogador.getPotencial() - overall)).movePointLeft(2);
        }
        BigDecimal valor = parteOverall.setScale(2, RoundingMode.HALF_UP);
        return valor.compareTo(VALOR_MINIMO) < 0 ? VALOR_MINIMO : valor;
    }

    public int calcularOverall(Jogador jogador) {
        int[] atributos = {jogador.getVelocidade(), jogador.getFinalizacao(), jogador.getPasse(),
                jogador.getDrible(), jogador.getDefesa(), jogador.getFisico()};
        int somaPonderada = 0;
        for (int indice = 0; indice < atributos.length; indice++) {
            somaPonderada += atributos[indice] * jogador.getPosicao().pesoDoAtributo(indice);
        }
        return BigDecimal.valueOf(somaPonderada)
                .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP)
                .intValueExact();
    }

    public BigDecimal calcularValorMercado(Jogador jogador) {
        int descontoCondicao = jogador.getCondicao().descontoMercadoEmDecimos();
        if (descontoCondicao > 0) {
            if (jogador.getAgilidade() >= 80) {
                descontoCondicao /= 2;
            } else if (jogador.getAgilidade() <= 30) {
                descontoCondicao += 100;
            }
        }
        int ajusteIdade = jogador.getIdade() <= 21 ? 100 : jogador.getIdade() >= 32 ? -100 : 0;
        int percentualTotal = Math.max(-400, ajusteIdade - descontoCondicao);
        BigDecimal valor = jogador.getValorBase()
                .multiply(BigDecimal.valueOf(1000L + percentualTotal))
                .movePointLeft(3)
                .setScale(2, RoundingMode.HALF_UP);
        return valor.compareTo(VALOR_MINIMO) < 0 ? VALOR_MINIMO : valor;
    }

    public static Comparator<Jogador> comparadorElenco() {
        return Comparator.comparing((Jogador j) -> ordemPosicaoElenco(j.getPosicao()))
                .thenComparing(j -> ValidacoesGeraisUtils.normalizarParaOrdenacao(j.getNome()))
                .thenComparing(Jogador::getId);
    }

    public static int ordemPosicaoElenco(PosicaoJogador posicao) {
        return switch (posicao) {
            case GOL -> 1;
            case ZAG -> 2;
            case LAT -> 3;
            case MEI -> 4;
            case ATA -> 5;
        };
    }

    public JogadorDto paraDto(Jogador jogador) {
        return paraDto(jogador, null);
    }

    public JogadorDto paraDto(Jogador jogador, ContratoDto contrato) {
        return new JogadorDto(
                jogador.getId(),
                jogador.getNome(),
                jogador.getPosicao().name(),
                jogador.getAgilidade(),
                jogador.getIdade(),
                jogador.getCondicao().name(),
                jogador.getValorBase(),
                calcularValorMercado(jogador),
                jogador.getVelocidade(),
                jogador.getFinalizacao(),
                jogador.getPasse(),
                jogador.getDrible(),
                jogador.getDefesa(),
                jogador.getFisico(),
                jogador.getPotencial(),
                calcularOverall(jogador),
                jogador.getClube() == null ? null : jogador.getClube().getId(),
                contrato
        );
    }

    private CriarJogadorResponseDto paraRespostaCriacao(Jogador jogador) {
        JogadorDto dto = paraDto(jogador);
        return new CriarJogadorResponseDto(
                dto.id(), dto.name(), dto.position(), dto.agility(), dto.age(), dto.condition(),
                dto.baseValue(), dto.marketValue(), dto.pace(), dto.shooting(), dto.passing(),
                dto.dribbling(), dto.defending(), dto.physical(), dto.potential(), dto.overall(),
                dto.clubId()
        );
    }

    private String normalizarBusca(String valor) {
        return Normalizer.normalize(valor, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .toLowerCase(Locale.ROOT);
    }
}
