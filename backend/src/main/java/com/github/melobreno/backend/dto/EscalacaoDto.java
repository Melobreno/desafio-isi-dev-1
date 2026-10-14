package com.github.melobreno.backend.dto;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

import java.util.List;

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record EscalacaoDto(
        Long clubId,
        String formation,
        Boolean complete,
        List<JogadorDto> players
) {
}
