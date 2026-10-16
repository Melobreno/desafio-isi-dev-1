package com.github.melobreno.backend.service;

import com.github.melobreno.backend.dto.AlterarCondicaoRequestDto;
import com.github.melobreno.backend.dto.AtualizarJogadorRequestDto;
import com.github.melobreno.backend.dto.CriarJogadorRequestDto;
import com.github.melobreno.backend.dto.CriarJogadorResponseDto;
import com.github.melobreno.backend.dto.JogadorDto;
import com.github.melobreno.backend.dto.MetadadosPaginaDto;
import com.github.melobreno.backend.dto.PaginaJogadoresDto;
import com.github.melobreno.backend.exceptions.BusinessException;
import com.github.melobreno.backend.model.CondicaoJogador;
import com.github.melobreno.backend.model.Jogador;
import com.github.melobreno.backend.model.PosicaoJogador;
import com.github.melobreno.backend.repository.ClubeRepository;
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

    /**
     * RN06 - Cadastra um jogador livre e APTO, valida seus indicadores e grava
     * o valor base calculado uma única vez a partir do overall, potencial e idade.
     */
    @Transactional
    public CriarJogadorResponseDto criarJogador(CriarJogadorRequestDto request) {
        if (request == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "O corpo da requisição é obrigatório.");
        }

        String nome = validarNome(request.name());
        PosicaoJogador posicao = ValidacoesGeraisUtils.validaEnum("position", PosicaoJogador.class, request.position());
        validarAgilidade(request.agility(), request.age());
        validarIdade(request.age());
        validarAtributos(request.pace(), request.shooting(), request.passing(),request.dribbling(), request.defending(), request.physical());
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

    /**
     * RN05, RN06 e RN09 - Consulta somente jogadores ativos e retorna os valores
     * de mercado e overall calculados para o momento da consulta.
     */
    @Transactional(readOnly = true)
    public JogadorDto buscarJogadorId(Integer id) {
        return paraDto(buscarAtivo(id));
    }

    /**
     * RN08 e RN09 - Altera apenas nome, posição, agilidade e idade de um jogador
     * ativo; não reduz a idade nem permite mudar a posição enquanto estiver em clube.
     */
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

    /**
     * RN09 - A alteração só pode localizar jogadores ativos. Regra de transição
     * da condição: um jogador DOENTE não pode voltar diretamente para APTO.
     */
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
        jogador.setAtualizadoEm(ValidacoesGeraisUtils.agoraBrasilia());
        return paraDto(jogadorRepository.save(jogador));
    }

    /**
     * RN09 - Faz exclusão lógica somente de jogador livre; os dados permanecem
     * armazenados e deixam de ser considerados em consultas de jogadores ativos.
     */
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

    /**
     * RN05, RN06, RN07 e RN09 - Busca, filtra, ordena e pagina jogadores ativos.
     * Filtros por valor usam valor de mercado; a paginação ocorre após a ordenação.
     */
    @Transactional(readOnly = true)
    public PaginaJogadoresDto listarJogadores(
            String search,
            String position,
            String condition,
            Boolean free,
            Integer clubId,
            Integer minAge,
            Integer maxAge,
            BigDecimal minValue,
            BigDecimal maxValue,
            String sort,
            Integer page,
            Integer limit
    ) {
        validarFiltros(position, condition, free, clubId, minAge, maxAge, minValue, maxValue, page, limit);
        String buscaNormalizada = validarBusca(search);
        List<String> criteriosOrdenacao = validarOrdenacao(sort);

        if (clubId != null && !clubeRepository.existsById(clubId)) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "Clube não encontrado.");
        }

        int pagina = page == null ? 1 : page;
        int tamanhoPagina = limit == null ? 10 : limit;
        List<Jogador> filtrados = jogadorRepository.findAllByExcluidoEmIsNull().stream()
                .filter(jogador -> position == null || jogador.getPosicao().name().equals(position))
                .filter(jogador -> condition == null || jogador.getCondicao().name().equals(condition))
                .filter(jogador -> free == null
                        || free == (jogador.getClube() == null))
                .filter(jogador -> clubId == null
                        || jogador.getClube() != null && clubId.equals(jogador.getClube().getId()))
                .filter(jogador -> minAge == null || jogador.getIdade() >= minAge)
                .filter(jogador -> maxAge == null || jogador.getIdade() <= maxAge)
                .filter(jogador -> buscaNormalizada == null
                        || normalizarBusca(jogador.getNome()).contains(buscaNormalizada))
                .filter(jogador -> minValue == null
                        || calcularValorMercado(jogador).compareTo(minValue) >= 0)
                .filter(jogador -> maxValue == null
                        || calcularValorMercado(jogador).compareTo(maxValue) <= 0)
                .toList();

        filtrados = new ArrayList<>(filtrados);
        filtrados.sort(comparador(criteriosOrdenacao));

        long total = filtrados.size();
        int totalPaginas = total == 0 ? 0 : (int) ((total + tamanhoPagina - 1) / tamanhoPagina);
        long inicioInteger = (long) (pagina - 1) * tamanhoPagina;
        List<JogadorDto> dados = inicioInteger >= total
                ? List.of()
                : filtrados.subList((int) inicioInteger, (int) Math.min(inicioInteger + tamanhoPagina, total))
                        .stream()
                        .map(this::paraDto)
                        .toList();

        return new PaginaJogadoresDto(dados,
                new MetadadosPaginaDto(pagina, tamanhoPagina, total, totalPaginas));
    }

    /**
     * RN09 - Resolve somente jogadores ativos; jogador ausente ou excluído
     * é tratado como inexistente.
     */
    private Jogador buscarAtivo(Integer id) {
        if (id == null || id < 1) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "Jogador não encontrado.");
        }
        return jogadorRepository.findByIdAndExcluidoEmIsNull(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Jogador não encontrado."));
    }

    /**
     * Valida o nome obrigatório do jogador, seus caracteres, comprimento,
     * ausência de dígitos e presença de pelo menos duas palavras.
     */
    private String validarNome(String nome) {
        if (nome == null || nome.codePoints().anyMatch(Character::isISOControl)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "O nome do jogador é obrigatório e não pode conter caracteres de controle.");
        }
        String normalizado = nome.trim().replaceAll(" {2,}", " ");
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

    /**
     * Valida o limite de idade aceito para cadastro e edição do jogador.
     */
    private void validarIdade(Integer age) {
        if (age == null || age < 16 || age > 45) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "A idade deve estar entre 16 e 45 anos.");
        }
    }

    /**
     * Valida o limite de agilidade e a restrição aplicada a jogadores com 35 anos ou mais.
     */
    private void validarAgilidade(Integer agility, Integer age) {
        if (agility == null || agility < 1 || agility > 100
                || age != null && age >= 35 && agility > 85) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "A agilidade está fora do limite permitido para a idade.");
        }
    }

    /**
     * RN06 - Valida que os seis atributos estejam entre 1 e 99 e que sua soma
     * não ultrapasse 480.
     */
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

    /**
     * RN06 - Valida o potencial e sua relação com o maior atributo; a partir
     * dos 33 anos, potencial e maior atributo devem ser iguais.
     */
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

    /**
     * RN07 - Valida a busca pelo nome e normaliza o texto para ignorar caixa e acentos.
     */
    private String validarBusca(String search) {
        if (search == null) {
            return null;
        }
        if (search.codePoints().anyMatch(Character::isISOControl)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "A busca não pode conter caracteres de controle.");
        }
        String normalizada = normalizarBusca(search.trim().replaceAll(" {2,}", " "));
        int tamanho = normalizada.codePointCount(0, normalizada.length());
        if (tamanho < 2 || tamanho > 100) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "A busca deve ter entre 2 e 100 caracteres.");
        }
        return normalizada;
    }

    /**
     * RN07 - Valida enums, combinações de filtros, faixas de idade e valor,
     * além dos limites de paginação.
     */
    private void validarFiltros(
            String position,
            String condition,
            Boolean free,
            Integer clubId,
            Integer minAge,
            Integer maxAge,
            BigDecimal minValue,
            BigDecimal maxValue,
            Integer page,
            Integer limit
    ) {
        if (position != null) {
            ValidacoesGeraisUtils.validaEnum("position", PosicaoJogador.class, position);
        }
        if (condition != null) {
            ValidacoesGeraisUtils.validaEnum("condition", CondicaoJogador.class, condition);
        }
        if (clubId != null && clubId < 1 || free != null && free && clubId != null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "A combinação dos filtros free e club_id é inválida.");
        }
        if (minAge != null && (minAge < 16 || minAge > 45)
                || maxAge != null && (maxAge < 16 || maxAge > 45)
                || minAge != null && maxAge != null && minAge > maxAge) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "A faixa de idade informada é inválida.");
        }
        BigDecimal limiteValor = new BigDecimal("550");
        if (minValue != null && (minValue.signum() < 0 || minValue.compareTo(limiteValor) > 0
                || minValue.scale() > 2)
                || maxValue != null && (maxValue.signum() < 0 || maxValue.compareTo(limiteValor) > 0
                || maxValue.scale() > 2)
                || minValue != null && maxValue != null && minValue.compareTo(maxValue) > 0) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "A faixa de valor de mercado informada é inválida.");
        }
        if (page != null && page < 1 || limit != null && (limit < 1 || limit > 50)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "A paginação informada é inválida.");
        }
    }

    /**
     * RN07 - Aceita até dois critérios de ordenação permitidos, sem repetição;
     * sem critério informado, usa nome.
     */
    private List<String> validarOrdenacao(String sort) {
        if (sort == null) {
            return List.of("name");
        }
        String[] criterios = sort.split(",", -1);
        if (criterios.length > 2 || sort.isEmpty()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "O parâmetro sort aceita no máximo dois critérios.");
        }
        List<String> permitidos = List.of("name", "value_asc", "value_desc",
                "age_asc", "age_desc", "position");
        List<String> resultado = List.of(criterios);
        if (resultado.stream().anyMatch(criterio -> !permitidos.contains(criterio))
                || resultado.stream().distinct().count() != resultado.size()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "O parâmetro sort contém um critério inválido ou repetido.");
        }
        return resultado;
    }

    /**
     * RN07 - Compõe os critérios informados e desempata sempre por nome e id crescente.
     */
    private Comparator<Jogador> comparador(List<String> criterios) {
        Comparator<Jogador> comparator = (primeiro, segundo) -> 0;
        for (String criterio : criterios) {
            Comparator<Jogador> criterioComparator = switch (criterio) {
                case "value_asc" -> Comparator.comparing(this::calcularValorMercado);
                case "value_desc" -> Comparator.comparing(
                        this::calcularValorMercado).reversed();
                case "age_asc" -> Comparator.comparing(Jogador::getIdade);
                case "age_desc" -> Comparator.comparing(Jogador::getIdade).reversed();
                case "position" -> Comparator.comparing(Jogador::getPosicao);
                default -> this::compararNomes;
            };
            comparator = comparator.thenComparing(criterioComparator);
        }
        return comparator.thenComparing(this::compararNomes)
                .thenComparing(Jogador::getId);
    }

    /**
     * RN07 - Compara nomes sem diferenciar acentos ou maiúsculas e minúsculas.
     */
    private int compararNomes(Jogador primeiro, Jogador segundo) {
        return compararUnicode(normalizarBusca(primeiro.getNome()), normalizarBusca(segundo.getNome()));
    }

    /**
     * RN07 - Compara nomes por pontos de código Unicode para obter uma ordem
     * consistente também com caracteres fora do conjunto ASCII.
     */
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

    /**
     * RN06 - Calcula e arredonda o valor base a partir do overall, aplicando
     * o bônus de jovem promessa e o piso de 1,00.
     */
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

    /**
     * RN06 - Calcula o overall pela soma ponderada dos atributos conforme
     * a posição, arredondando para o inteiro mais próximo com meio para cima.
     */
    private int calcularOverall(Jogador jogador) {
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

    /**
     * RN02 a RN05 - Calcula o valor de mercado usando condição, ajuste de
     * agilidade, idade, teto de desconto, arredondamento e piso.
     */
    private BigDecimal calcularValorMercado(Jogador jogador) {
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

    /**
     * RN05 e RN06 - Constrói a resposta com valor de mercado e overall
     * calculados, sem persistir esses valores calculados.
     */
    private JogadorDto paraDto(Jogador jogador) {
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
                jogador.getClube() == null ? null : jogador.getClube().getId()
        );
    }

    /**
     * RN06 - Monta a resposta do cadastro a partir dos dados salvos e dos
     * valores calculados para apresentação.
     */
    private CriarJogadorResponseDto paraRespostaCriacao(Jogador jogador) {
        JogadorDto dto = paraDto(jogador);
        return new CriarJogadorResponseDto(
                dto.id(), dto.name(), dto.position(), dto.agility(), dto.age(), dto.condition(),
                dto.baseValue(), dto.marketValue(), dto.pace(), dto.shooting(), dto.passing(),
                dto.dribbling(), dto.defending(), dto.physical(), dto.potential(), dto.overall(),
                dto.clubId()
        );
    }

    /**
     * RN07 - Normaliza texto de busca e comparação, removendo acentos e
     * ignorando diferenças entre maiúsculas e minúsculas.
     */
    private String normalizarBusca(String valor) {
        return Normalizer.normalize(valor, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .toLowerCase(Locale.ROOT);
    }
}
