package com.github.melobreno.backend.service;

import com.github.melobreno.backend.dto.AtualizarEscalacaoRequestDto;
import com.github.melobreno.backend.dto.ClassificacaoItemDto;
import com.github.melobreno.backend.dto.CriarPartidaRequestDto;
import com.github.melobreno.backend.dto.DueloPartidaDto;
import com.github.melobreno.backend.dto.EscalacaoDto;
import com.github.melobreno.backend.dto.JogadorDto;
import com.github.melobreno.backend.dto.ParticipanteDueloDto;
import com.github.melobreno.backend.dto.PartidaClubeDto;
import com.github.melobreno.backend.dto.PartidaDto;
import com.github.melobreno.backend.exceptions.BadRequestException;
import com.github.melobreno.backend.exceptions.BusinessException;
import com.github.melobreno.backend.model.Clube;
import com.github.melobreno.backend.model.CondicaoJogador;
import com.github.melobreno.backend.model.DueloPartida;
import com.github.melobreno.backend.model.Escalacao;
import com.github.melobreno.backend.model.EscalacaoId;
import com.github.melobreno.backend.model.Jogador;
import com.github.melobreno.backend.model.Partida;
import com.github.melobreno.backend.model.PosicaoJogador;
import com.github.melobreno.backend.repository.ClubeRepository;
import com.github.melobreno.backend.repository.DueloPartidaRepository;
import com.github.melobreno.backend.repository.EscalacaoRepository;
import com.github.melobreno.backend.repository.JogadorRepository;
import com.github.melobreno.backend.repository.PartidaRepository;
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
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class LigaService {

    private static final Set<String> FORMACOES_VALIDAS = Set.of("3-1", "2-2", "2-1-1", "1-2-1");

    private final ClubeRepository clubeRepository;
    private final JogadorRepository jogadorRepository;
    private final EscalacaoRepository escalacaoRepository;
    private final PartidaRepository partidaRepository;
    private final DueloPartidaRepository dueloPartidaRepository;
    private final JogadorService jogadorService;

    /**
     * RN19 - Escalação de Titulares do Clube (itens 1, 2, 3, 4, 7).
     * - V01/V02: Valida se o request, a formação e a lista de 5 IDs estão íntegros.
     * - V08: Clube ou jogador inexistente -> 404 Not Found.
     * - V09 / RN19 item 4: Titular fora do elenco, jogador DOENTE ou posições que não fecham a formação -> 409 Conflict.
     * - Substitui atomicamente a escalação anterior do clube e atualiza a formação salva.
     */
    @Transactional
    public EscalacaoDto atualizarEscalacao(Integer clubeId, AtualizarEscalacaoRequestDto request) {
        if (request == null) {
            throw new BadRequestException("O corpo da requisição é obrigatório.");
        }
        if (clubeId == null || clubeId < 1) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "Clube não encontrado.");
        }

        Clube clube = clubeRepository.findById(clubeId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Clube não encontrado."));

        String formacao = request.formation();
        if (formacao == null || !FORMACOES_VALIDAS.contains(formacao)) {
            throw new BadRequestException("A formação informada é inválida. Use 3-1, 2-2, 2-1-1 ou 1-2-1.");
        }

        List<Integer> playerIds = request.playerIds();
        if (playerIds == null || playerIds.size() != 5) {
            throw new BadRequestException("A escalação deve conter exatamente 5 jogadores.");
        }

        for (Integer id : playerIds) {
            if (id == null || id < 1) {
                throw new BadRequestException("Os IDs dos jogadores devem ser inteiros positivos.");
            }
        }

        Set<Integer> idsUnicos = new HashSet<>(playerIds);
        if (idsUnicos.size() != 5) {
            throw new BadRequestException("A escalação não pode conter IDs de jogadores repetidos.");
        }

        List<Jogador> titulares = new ArrayList<>(5);
        for (Integer id : playerIds) {
            Jogador jogador = jogadorRepository.findByIdAndExcluidoEmIsNull(id)
                    .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Jogador não encontrado: ID " + id));

            if (jogador.getClube() == null || !jogador.getClube().getId().equals(clubeId)) {
                throw new BusinessException(HttpStatus.CONFLICT, "O jogador " + jogador.getNome() + " não pertence ao elenco do clube.");
            }

            if (jogador.getCondicao() == CondicaoJogador.DOENTE) {
                throw new BusinessException(HttpStatus.CONFLICT, "O jogador " + jogador.getNome() + " está DOENTE e não pode ser escalado.");
            }

            titulares.add(jogador);
        }

        validarFormacao(formacao, titulares);

        clube.setFormacao(formacao);
        clubeRepository.save(clube);

        escalacaoRepository.deleteAllById_ClubeId(clubeId);

        OffsetDateTime agora = ValidacoesGeraisUtils.agoraBrasilia();
        for (Jogador j : titulares) {
            Escalacao esc = new Escalacao();
            esc.setId(new EscalacaoId(clubeId, j.getId()));
            esc.setClube(clube);
            esc.setJogador(j);
            esc.setCriadoEm(agora);
            escalacaoRepository.save(esc);
        }

        titulares.sort(comparadorElenco());
        List<JogadorDto> jogadoresDto = titulares.stream().map(jogadorService::paraDto).toList();

        return new EscalacaoDto(clubeId, formacao, true, jogadoresDto);
    }

    /**
     * RN19 - Consulta a escalação atual do clube (item 6).
     * - V08: Clube inexistente -> 404 Not Found.
     * - Retorna a formação salva, se a escalação está completa (5 jogadores) e a lista na ordem do elenco (RN11).
     * - Sem escalação: formation null, complete false, players vazia.
     */
    @Transactional(readOnly = true)
    public EscalacaoDto obterEscalacao(Integer clubeId) {
        if (clubeId == null || clubeId < 1) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "Clube não encontrado.");
        }

        Clube clube = clubeRepository.findById(clubeId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Clube não encontrado."));

        if (clube.getFormacao() == null) {
            return new EscalacaoDto(clubeId, null, false, List.of());
        }

        List<Escalacao> escalacoes = escalacaoRepository.findAllById_ClubeIdOrderByCriadoEmAsc(clubeId);
        List<Jogador> titulares = new ArrayList<>(escalacoes.stream()
                .map(Escalacao::getJogador)
                .filter(j -> j.getExcluidoEm() == null)
                .toList());

        titulares.sort(comparadorElenco());
        boolean complete = titulares.size() == 5;
        List<JogadorDto> jogadoresDto = titulares.stream().map(jogadorService::paraDto).toList();

        return new EscalacaoDto(clubeId, clube.getFormacao(), complete, jogadoresDto);
    }

    /**
     * RN20 - Simulação determinística de Partida (itens 1 a 8).
     * - V01/V02: home_club_id e away_club_id inteiros positivos e distintos (400).
     * - V08: Mandante ou visitante inexistente -> 404 Not Found.
     * - RN20 item 1: Mandante ou visitante sem escalação completa (5 titulares) -> 409 Conflict.
     * - RN20 item 2: 5 titulares de cada clube ordenados pela ordem do elenco (Goleiro + 4 jogadores de linha).
     * - RN20 item 3: Titular MAL_CONDICIONADO sofre desconto de 15% em cada atributo (arredondamento meio para cima).
     * - RN20 item 4: 6 duelos determinísticos:
     *   - Duelos 1 a 3 (Mandante ataca): D1 (4º vs GOL), D2 (3º vs 1º), D3 (2º vs 2º).
     *   - Duelos 4 a 6 (Visitante ataca): D4 (4º vs GOL), D5 (3º vs 1º), D6 (2º vs 2º).
     * - RN20 item 5: Atributo de ataque conforme posição (ATA: finalização, MEI: passe, ZAG/LAT: drible). Defesa usa sempre defending.
     * - RN20 item 6: Gol se ataque > defesa (empate não é gol). Placar e resultado (MANDANTE, VISITANTE, EMPATE).
     * - RN20 item 7: Grava partida, formações e os 6 duelos atomicamente.
     */
    @Transactional
    public PartidaDto jogarPartida(CriarPartidaRequestDto request) {
        if (request == null || request.homeClubId() == null || request.awayClubId() == null) {
            throw new BadRequestException("Os campos home_club_id e away_club_id são obrigatórios.");
        }

        if (request.homeClubId() < 1 || request.awayClubId() < 1) {
            throw new BadRequestException("Os IDs dos clubes devem ser inteiros positivos.");
        }

        if (request.homeClubId().equals(request.awayClubId())) {
            throw new BadRequestException("O clube mandante deve ser diferente do clube visitante.");
        }

        Clube mandante = clubeRepository.findById(request.homeClubId())
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Clube mandante não encontrado."));

        Clube visitante = clubeRepository.findById(request.awayClubId())
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Clube visitante não encontrado."));

        List<Escalacao> escMandante = escalacaoRepository.findAllById_ClubeIdOrderByCriadoEmAsc(mandante.getId());
        List<Escalacao> escVisitante = escalacaoRepository.findAllById_ClubeIdOrderByCriadoEmAsc(visitante.getId());

        if (escMandante.size() != 5 || mandante.getFormacao() == null) {
            throw new BusinessException(HttpStatus.CONFLICT, "O clube mandante não possui escalação completa.");
        }

        if (escVisitante.size() != 5 || visitante.getFormacao() == null) {
            throw new BusinessException(HttpStatus.CONFLICT, "O clube visitante não possui escalação completa.");
        }

        List<Jogador> mandanteTitulares = new ArrayList<>(escMandante.stream().map(Escalacao::getJogador).toList());
        List<Jogador> visitanteTitulares = new ArrayList<>(escVisitante.stream().map(Escalacao::getJogador).toList());

        mandanteTitulares.sort(comparadorElenco());
        visitanteTitulares.sort(comparadorElenco());

        Jogador mGol = mandanteTitulares.get(0);
        Jogador mL1 = mandanteTitulares.get(1);
        Jogador mL2 = mandanteTitulares.get(2);
        Jogador mL3 = mandanteTitulares.get(3);
        Jogador mL4 = mandanteTitulares.get(4);

        Jogador vGol = visitanteTitulares.get(0);
        Jogador vL1 = visitanteTitulares.get(1);
        Jogador vL2 = visitanteTitulares.get(2);
        Jogador vL3 = visitanteTitulares.get(3);
        Jogador vL4 = visitanteTitulares.get(4);

        List<DueloSimulado> duelos = new ArrayList<>(6);
        duelos.add(simularDuelo(1, mandante, mL4, vGol));
        duelos.add(simularDuelo(2, mandante, mL3, vL1));
        duelos.add(simularDuelo(3, mandante, mL2, vL2));
        duelos.add(simularDuelo(4, visitante, vL4, mGol));
        duelos.add(simularDuelo(5, visitante, vL3, mL1));
        duelos.add(simularDuelo(6, visitante, vL2, mL2));

        int golsMandante = 0;
        int golsVisitante = 0;

        for (int i = 0; i < 3; i++) {
            if (duelos.get(i).gol) {
                golsMandante++;
            }
        }
        for (int i = 3; i < 6; i++) {
            if (duelos.get(i).gol) {
                golsVisitante++;
            }
        }

        String resultado = golsMandante > golsVisitante
                ? "MANDANTE"
                : (golsVisitante > golsMandante ? "VISITANTE" : "EMPATE");

        OffsetDateTime jogadaEm = ValidacoesGeraisUtils.agoraBrasilia();

        Partida partida = new Partida();
        partida.setMandante(mandante);
        partida.setVisitante(visitante);
        partida.setGolsMandante(golsMandante);
        partida.setGolsVisitante(golsVisitante);
        partida.setFormacaoMandante(mandante.getFormacao());
        partida.setFormacaoVisitante(visitante.getFormacao());
        partida.setJogadaEm(jogadaEm);

        Partida partidaSalva = partidaRepository.save(partida);

        List<DueloPartidaDto> duelosDto = new ArrayList<>(6);

        for (DueloSimulado d : duelos) {
            DueloPartida dp = new DueloPartida();
            dp.setPartida(partidaSalva);
            dp.setOrdem(d.ordem);
            dp.setClubeAtacante(d.clubeAtacante);
            dp.setAtacante(d.atacante);
            dp.setDefensor(d.defensor);
            dp.setNomeAtacante(d.atacante.getNome());
            dp.setNomeDefensor(d.defensor.getNome());
            dp.setPosicaoAtacante(d.atacante.getPosicao().name());
            dp.setPosicaoDefensor(d.defensor.getPosicao().name());
            dp.setCondicaoAtacante(d.atacante.getCondicao().name());
            dp.setCondicaoDefensor(d.defensor.getCondicao().name());
            dp.setAtributoAtaque(d.nomeAtributoAtaque);
            dp.setAtributoDefesa(d.nomeAtributoDefesa);
            dp.setValorAtaque(d.valorAtaque);
            dp.setValorDefesa(d.valorDefesa);
            dp.setGol(d.gol);

            dueloPartidaRepository.save(dp);

            ParticipanteDueloDto atacanteDto = new ParticipanteDueloDto(
                    d.atacante.getId(),
                    d.atacante.getNome(),
                    d.atacante.getPosicao().name(),
                    d.atacante.getCondicao().name(),
                    d.nomeAtributoAtaque,
                    d.valorAtaque
            );

            ParticipanteDueloDto defensorDto = new ParticipanteDueloDto(
                    d.defensor.getId(),
                    d.defensor.getNome(),
                    d.defensor.getPosicao().name(),
                    d.defensor.getCondicao().name(),
                    d.nomeAtributoDefesa,
                    d.valorDefesa
            );

            duelosDto.add(new DueloPartidaDto(
                    d.ordem,
                    d.clubeAtacante.getId(),
                    atacanteDto,
                    defensorDto,
                    d.gol
            ));
        }

        PartidaClubeDto homeDto = new PartidaClubeDto(
                mandante.getId(),
                mandante.getNome(),
                mandante.getFormacao(),
                golsMandante
        );

        PartidaClubeDto awayDto = new PartidaClubeDto(
                visitante.getId(),
                visitante.getNome(),
                visitante.getFormacao(),
                golsVisitante
        );

        return new PartidaDto(
                partidaSalva.getId(),
                jogadaEm,
                homeDto,
                awayDto,
                resultado,
                duelosDto
        );
    }

    /**
     * RN21 - Histórico de partidas (item 1).
     * - Lista da mais recente para a mais antiga (empate por id desc).
     * - Sem duels na resposta.
     * - Filtro club_id opcional (404 se clube inexistente, 400 se id <= 0).
     */
    @Transactional(readOnly = true)
    public List<PartidaDto> listarPartidas(Integer clubId) {
        List<Partida> partidas;
        if (clubId != null) {
            if (clubId < 1) {
                throw new BadRequestException("O parâmetro club_id deve ser um inteiro positivo.");
            }
            if (!clubeRepository.existsById(clubId)) {
                throw new BusinessException(HttpStatus.NOT_FOUND, "Clube não encontrado.");
            }
            partidas = partidaRepository.findAllByMandante_IdOrVisitante_IdOrderByJogadaEmDescIdDesc(clubId, clubId);
        } else {
            partidas = partidaRepository.findAllByOrderByJogadaEmDescIdDesc();
        }

        return partidas.stream().map(this::paraPartidaDtoResumida).toList();
    }

    /**
     * RN21 - Consulta detalhe de partida com os 6 duelos (item 2).
     * - V08: Partida inexistente -> 404 Not Found.
     */
    @Transactional(readOnly = true)
    public PartidaDto buscarPartida(Integer partidaId) {
        if (partidaId == null || partidaId < 1) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "Partida não encontrada.");
        }

        Partida partida = partidaRepository.findById(partidaId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Partida não encontrada."));

        List<DueloPartida> duelos = dueloPartidaRepository.findAllByPartida_IdOrderByOrdemAsc(partidaId);

        List<DueloPartidaDto> duelosDto = duelos.stream().map(d -> new DueloPartidaDto(
                d.getOrdem(),
                d.getClubeAtacante().getId(),
                new ParticipanteDueloDto(
                        d.getAtacante().getId(),
                        d.getNomeAtacante(),
                        d.getPosicaoAtacante(),
                        d.getCondicaoAtacante(),
                        d.getAtributoAtaque(),
                        d.getValorAtaque()
                ),
                new ParticipanteDueloDto(
                        d.getDefensor().getId(),
                        d.getNomeDefensor(),
                        d.getPosicaoDefensor(),
                        d.getCondicaoDefensor(),
                        d.getAtributoDefesa(),
                        d.getValorDefesa()
                ),
                d.getGol()
        )).toList();

        String resultado = partida.getGolsMandante() > partida.getGolsVisitante()
                ? "MANDANTE"
                : (partida.getGolsVisitante() > partida.getGolsMandante() ? "VISITANTE" : "EMPATE");

        PartidaClubeDto homeDto = new PartidaClubeDto(
                partida.getMandante().getId(),
                partida.getMandante().getNome(),
                partida.getFormacaoMandante(),
                partida.getGolsMandante()
        );

        PartidaClubeDto awayDto = new PartidaClubeDto(
                partida.getVisitante().getId(),
                partida.getVisitante().getNome(),
                partida.getFormacaoVisitante(),
                partida.getGolsVisitante()
        );

        return new PartidaDto(
                partida.getId(),
                partida.getJogadaEm(),
                homeDto,
                awayDto,
                resultado,
                duelosDto
        );
    }

    /**
     * RN21 - Tabela de Classificação da Liga (itens 3, 4, 5).
     * - Inclui todos os clubes, inclusive os zerados.
     * - Calculada a cada chamada: vitória = 3 pontos, empate = 1 ponto, derrota = 0 pontos.
     * - Desempate estrito:
     *   1) Pontos (decrescente)
     *   2) Saldo de gols (decrescente)
     *   3) Gols marcados (decrescente)
     *   4) Nome do clube em ordem alfabética (normalizado sem acentos)
     *   5) ID do clube (crescente)
     * - Posições numeradas sequencialmente de 1 a N.
     */
    @Transactional(readOnly = true)
    public List<ClassificacaoItemDto> obterClassificacao() {
        List<Clube> clubes = clubeRepository.findAll();
        List<Partida> partidas = partidaRepository.findAll();

        Map<Integer, RegistroClassificacao> mapClubes = new HashMap<>();
        for (Clube c : clubes) {
            mapClubes.put(c.getId(), new RegistroClassificacao(c.getId(), c.getNome()));
        }

        for (Partida p : partidas) {
            RegistroClassificacao mandante = mapClubes.get(p.getMandante().getId());
            RegistroClassificacao visitante = mapClubes.get(p.getVisitante().getId());

            if (mandante != null && visitante != null) {
                int gM = p.getGolsMandante();
                int gV = p.getGolsVisitante();

                mandante.played++;
                mandante.goalsFor += gM;
                mandante.goalsAgainst += gV;

                visitante.played++;
                visitante.goalsFor += gV;
                visitante.goalsAgainst += gM;

                if (gM > gV) {
                    mandante.wins++;
                    mandante.points += 3;
                    visitante.losses++;
                } else if (gV > gM) {
                    visitante.wins++;
                    visitante.points += 3;
                    mandante.losses++;
                } else {
                    mandante.draws++;
                    mandante.points += 1;
                    visitante.draws++;
                    visitante.points += 1;
                }
            }
        }

        List<RegistroClassificacao> lista = new ArrayList<>(mapClubes.values());
        lista.sort(Comparator
                .comparing(RegistroClassificacao::getPoints).reversed()
                .thenComparing(Comparator.comparing(RegistroClassificacao::getGoalDifference).reversed())
                .thenComparing(Comparator.comparing(RegistroClassificacao::getGoalsFor).reversed())
                .thenComparing(r -> ValidacoesGeraisUtils.normalizarParaOrdenacao(r.clubName))
                .thenComparing(RegistroClassificacao::getClubId));

        List<ClassificacaoItemDto> resultado = new ArrayList<>(lista.size());
        for (int i = 0; i < lista.size(); i++) {
            RegistroClassificacao reg = lista.get(i);
            resultado.add(new ClassificacaoItemDto(
                    i + 1,
                    reg.clubId,
                    reg.clubName,
                    reg.played,
                    reg.wins,
                    reg.draws,
                    reg.losses,
                    reg.goalsFor,
                    reg.goalsAgainst,
                    reg.getGoalDifference(),
                    reg.points
            ));
        }

        return resultado;
    }

    private PartidaDto paraPartidaDtoResumida(Partida p) {
        String resultado = p.getGolsMandante() > p.getGolsVisitante()
                ? "MANDANTE"
                : (p.getGolsVisitante() > p.getGolsMandante() ? "VISITANTE" : "EMPATE");

        PartidaClubeDto homeDto = new PartidaClubeDto(
                p.getMandante().getId(),
                p.getMandante().getNome(),
                p.getFormacaoMandante(),
                p.getGolsMandante()
        );

        PartidaClubeDto awayDto = new PartidaClubeDto(
                p.getVisitante().getId(),
                p.getVisitante().getNome(),
                p.getFormacaoVisitante(),
                p.getGolsVisitante()
        );

        return new PartidaDto(
                p.getId(),
                p.getJogadaEm(),
                homeDto,
                awayDto,
                resultado,
                null
        );
    }

    private DueloSimulado simularDuelo(int ordem, Clube clubeAtacante, Jogador atacante, Jogador defensor) {
        String nomeAtributoAtaque;
        int valorAtaqueBase;

        switch (atacante.getPosicao()) {
            case ATA -> {
                nomeAtributoAtaque = "shooting";
                valorAtaqueBase = atacante.getFinalizacao();
            }
            case MEI -> {
                nomeAtributoAtaque = "passing";
                valorAtaqueBase = atacante.getPasse();
            }
            case ZAG, LAT -> {
                nomeAtributoAtaque = "dribbling";
                valorAtaqueBase = atacante.getDrible();
            }
            default -> throw new IllegalStateException("Goleiro não pode ser atacante em duelo.");
        }

        int valorAtaque = aplicarCondicaoPartida(valorAtaqueBase, atacante.getCondicao());
        String nomeAtributoDefesa = "defending";
        int valorDefesa = aplicarCondicaoPartida(defensor.getDefesa(), defensor.getCondicao());

        boolean gol = valorAtaque > valorDefesa;

        return new DueloSimulado(
                ordem,
                clubeAtacante,
                atacante,
                defensor,
                nomeAtributoAtaque,
                valorAtaque,
                nomeAtributoDefesa,
                valorDefesa,
                gol
        );
    }

    /**
     * RN20 item 3 - Redução de 15% para MAL_CONDICIONADO, arredondando com meio para cima.
     */
    private int aplicarCondicaoPartida(int valorOriginal, CondicaoJogador condicao) {
        if (condicao == CondicaoJogador.MAL_CONDICIONADO) {
            return BigDecimal.valueOf(valorOriginal)
                    .multiply(new BigDecimal("0.85"))
                    .setScale(0, RoundingMode.HALF_UP)
                    .intValueExact();
        }
        return valorOriginal;
    }

    /**
     * RN19 item 4 - Validação de formação tática:
     * Exatamente 1 GOL e setorização correta (Defesa = ZAG ou LAT).
     */
    private void validarFormacao(String formacao, List<Jogador> titulares) {
        int gol = 0;
        int defesa = 0;
        int mei = 0;
        int ata = 0;

        for (Jogador j : titulares) {
            switch (j.getPosicao()) {
                case GOL -> gol++;
                case ZAG, LAT -> defesa++;
                case MEI -> mei++;
                case ATA -> ata++;
            }
        }

        if (gol != 1) {
            throw new BusinessException(HttpStatus.CONFLICT, "A escalação deve conter exatamente 1 goleiro.");
        }

        boolean valida = switch (formacao) {
            case "3-1" -> defesa == 3 && mei == 0 && ata == 1;
            case "2-2" -> defesa == 2 && mei == 0 && ata == 2;
            case "2-1-1" -> defesa == 2 && mei == 1 && ata == 1;
            case "1-2-1" -> defesa == 1 && mei == 2 && ata == 1;
            default -> false;
        };

        if (!valida) {
            throw new BusinessException(HttpStatus.CONFLICT, "As posições dos jogadores não atendem à formação " + formacao + ".");
        }
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

    private static class DueloSimulado {
        final int ordem;
        final Clube clubeAtacante;
        final Jogador atacante;
        final Jogador defensor;
        final String nomeAtributoAtaque;
        final int valorAtaque;
        final String nomeAtributoDefesa;
        final int valorDefesa;
        final boolean gol;

        DueloSimulado(int ordem, Clube clubeAtacante, Jogador atacante, Jogador defensor,
                      String nomeAtributoAtaque, int valorAtaque,
                      String nomeAtributoDefesa, int valorDefesa, boolean gol) {
            this.ordem = ordem;
            this.clubeAtacante = clubeAtacante;
            this.atacante = atacante;
            this.defensor = defensor;
            this.nomeAtributoAtaque = nomeAtributoAtaque;
            this.valorAtaque = valorAtaque;
            this.nomeAtributoDefesa = nomeAtributoDefesa;
            this.valorDefesa = valorDefesa;
            this.gol = gol;
        }
    }

    private static class RegistroClassificacao {
        final Integer clubId;
        final String clubName;
        int played = 0;
        int wins = 0;
        int draws = 0;
        int losses = 0;
        int goalsFor = 0;
        int goalsAgainst = 0;
        int points = 0;

        RegistroClassificacao(Integer clubId, String clubName) {
            this.clubId = clubId;
            this.clubName = clubName;
        }

        int getPoints() {
            return points;
        }

        int getGoalDifference() {
            return goalsFor - goalsAgainst;
        }

        int getGoalsFor() {
            return goalsFor;
        }

        Integer getClubId() {
            return clubId;
        }
    }
}
