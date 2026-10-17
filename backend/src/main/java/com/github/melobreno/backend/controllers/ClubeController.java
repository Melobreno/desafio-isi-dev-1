package com.github.melobreno.backend.controllers;

import com.github.melobreno.backend.dto.ClubeDto;
import com.github.melobreno.backend.dto.CriarClubeRequestDto;
import com.github.melobreno.backend.service.ClubeServices;
import com.github.melobreno.backend.util.ValidacoesGeraisUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/clubs")
public class ClubeController {

    private final ClubeServices clubeServices;

    @PostMapping
    @Operation(
            summary = "Cadastra um clube",
            requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    required = true,
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = CriarClubeRequestDto.class),
                            examples = @ExampleObject(
                                    name = "Criar clube",
                                    value = """
                                            {
                                              "name": "Águias FC",
                                              "acronym": "AGU"
                                            }
                                            """
                            )
                    )
            )
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Clube criado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados do clube inválidos"),
            @ApiResponse(responseCode = "409", description = "Conflito de unicidade de nome ou sigla, ou limite de clubes atingido")
    })
    public ResponseEntity<ClubeDto> criarClube(@RequestBody CriarClubeRequestDto request) {
        ClubeDto clube = clubeServices.criaClube(request);
        URI location = URI.create("/api/v1/clubs/" + clube.id());
        return ResponseEntity.created(location).body(clube);
    }

    @GetMapping
    @Operation(summary = "Lista todos os clubes")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lista de clubes"),
            @ApiResponse(responseCode = "400", description = "Parâmetro sort inválido")
    })
    public ResponseEntity<List<ClubeDto>> listarClubes(@RequestParam(required = false) String sort) {
        return ResponseEntity.ok(clubeServices.listarClubes(sort));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Busca detalhes de um clube e seu elenco")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Detalhes do clube"),
            @ApiResponse(responseCode = "404", description = "Clube não encontrado")
    })
    public ResponseEntity<ClubeDto> buscarClube(@PathVariable String id) {
        return ResponseEntity.ok(clubeServices.buscaClube(ValidacoesGeraisUtils.idUrl(id)));
    }
}
