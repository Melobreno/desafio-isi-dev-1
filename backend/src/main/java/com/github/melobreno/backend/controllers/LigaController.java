package com.github.melobreno.backend.controllers;

import com.github.melobreno.backend.dto.AtualizarEscalacaoRequestDto;
import com.github.melobreno.backend.dto.ClassificacaoItemDto;
import com.github.melobreno.backend.dto.CriarPartidaRequestDto;
import com.github.melobreno.backend.dto.EscalacaoDto;
import com.github.melobreno.backend.dto.PartidaDto;
import com.github.melobreno.backend.service.LigaService;
import com.github.melobreno.backend.util.ValidacoesGeraisUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1")
@Tag(name = "Liga", description = "Operações relacionadas a escalações, partidas e classificação")
public class LigaController {

    private final LigaService ligaService;

    @PutMapping("/clubs/{id}/lineup")
    @Operation(
            summary = "Define a escalação e formação do clube",
            description = "Substitui a escalação inteira do clube pelos 5 titulares informados na formação escolhida (RN19).",
            requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    required = true,
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = AtualizarEscalacaoRequestDto.class),
                            examples = @ExampleObject(
                                    name = "Atualizar escalação",
                                    value = """
                                            {
                                              "formation": "2-1-1",
                                              "player_ids": [34, 31, 30, 33, 32]
                                            }
                                            """
                            )
                    )
            )
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Escalação definida com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = EscalacaoDto.class))),
            @ApiResponse(responseCode = "400", description = "Formato inválido ou lista de jogadores fora das regras"),
            @ApiResponse(responseCode = "404", description = "Clube ou jogador inexistente"),
            @ApiResponse(responseCode = "409", description = "Jogador fora do elenco, jogador DOENTE ou posições incompatíveis com a formação")
    })
    public ResponseEntity<EscalacaoDto> atualizarEscalacao(
            @Parameter(description = "Identificador do clube", example = "1")
            @PathVariable String id,
            @RequestBody AtualizarEscalacaoRequestDto request
    ) {
        int clubeId = ValidacoesGeraisUtils.validarIdRota(id, "Clube não encontrado.");
        EscalacaoDto escalacao = ligaService.atualizarEscalacao(clubeId, request);
        return ResponseEntity.ok(escalacao);
    }

    @GetMapping("/clubs/{id}/lineup")
    @Operation(
            summary = "Consulta a escalação atual do clube",
            description = "Retorna a formação e os titulares na ordem do elenco (RN19 e RN11)."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Escalação consultada com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = EscalacaoDto.class))),
            @ApiResponse(responseCode = "404", description = "Clube inexistente")
    })
    public ResponseEntity<EscalacaoDto> obterEscalacao(
            @Parameter(description = "Identificador do clube", example = "1")
            @PathVariable String id
    ) {
        int clubeId = ValidacoesGeraisUtils.validarIdRota(id, "Clube não encontrado.");
        EscalacaoDto escalacao = ligaService.obterEscalacao(clubeId);
        return ResponseEntity.ok(escalacao);
    }

    @PostMapping("/matches")
    @Operation(
            summary = "Joga e registra uma partida",
            description = "Simula a partida através de 6 duelos determinísticos entre os titulares dos dois clubes (RN20).",
            requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    required = true,
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = CriarPartidaRequestDto.class),
                            examples = @ExampleObject(
                                    name = "Jogar partida",
                                    value = """
                                            {
                                              "home_club_id": 1,
                                              "away_club_id": 2
                                            }
                                            """
                            )
                    )
            )
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Partida jogada e registrada com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = PartidaDto.class))),
            @ApiResponse(responseCode = "400", description = "Dados da partida inválidos ou mandante igual ao visitante"),
            @ApiResponse(responseCode = "404", description = "Clube mandante ou visitante inexistente"),
            @ApiResponse(responseCode = "409", description = "Mandante ou visitante sem escalação completa")
    })
    public ResponseEntity<PartidaDto> jogarPartida(@RequestBody CriarPartidaRequestDto request) {
        PartidaDto partida = ligaService.jogarPartida(request);
        return ResponseEntity.created(URI.create("/api/v1/matches/" + partida.id())).body(partida);
    }

    @GetMapping("/matches")
    @Operation(
            summary = "Consulta o histórico de partidas",
            description = "Lista as partidas da mais recente para a mais antiga (RN21), sem detalhar os duelos."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Partidas listadas com sucesso",
                    content = @Content(mediaType = "application/json", array = @ArraySchema(schema = @Schema(implementation = PartidaDto.class)))),
            @ApiResponse(responseCode = "400", description = "Parâmetro club_id inválido"),
            @ApiResponse(responseCode = "404", description = "Clube do filtro inexistente")
    })
    public ResponseEntity<List<PartidaDto>> listarPartidas(
            @Parameter(description = "Filtro opcional por ID do clube (mandante ou visitante)", example = "1")
            @RequestParam(name = "club_id", required = false) String clubId
    ) {
        Integer idClube = clubId == null ? null : ValidacoesGeraisUtils.validarInteiroPositivoQuery("club_id", clubId);
        List<PartidaDto> partidas = ligaService.listarPartidas(idClube);
        return ResponseEntity.ok(partidas);
    }

    @GetMapping("/matches/{id}")
    @Operation(
            summary = "Consulta os detalhes de uma partida",
            description = "Retorna a partida completa com os 6 duelos disputados na ordem (RN21)."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Partida encontrada com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = PartidaDto.class))),
            @ApiResponse(responseCode = "404", description = "Partida não encontrada")
    })
    public ResponseEntity<PartidaDto> buscarPartida(
            @Parameter(description = "Identificador da partida", example = "1")
            @PathVariable String id
    ) {
        int partidaId = ValidacoesGeraisUtils.validarIdRota(id, "Partida não encontrada.");
        PartidaDto partida = ligaService.buscarPartida(partidaId);
        return ResponseEntity.ok(partida);
    }

    @GetMapping("/standings")
    @Operation(
            summary = "Consulta a classificação da liga",
            description = "Retorna a tabela de classificação de todos os clubes cadastrados na liga com os critérios estritos de desempate (RN21)."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Classificação retornada com sucesso",
                    content = @Content(mediaType = "application/json", array = @ArraySchema(schema = @Schema(implementation = ClassificacaoItemDto.class))))
    })
    public ResponseEntity<List<ClassificacaoItemDto>> obterClassificacao() {
        List<ClassificacaoItemDto> classificacao = ligaService.obterClassificacao();
        return ResponseEntity.ok(classificacao);
    }
}
