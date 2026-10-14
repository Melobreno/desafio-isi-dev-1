package com.github.melobreno.backend.dto;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

import java.math.BigDecimal;
import java.util.List;

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record ClubeDto(
        Long id,
        String name,
        String acronym,
        BigDecimal cash,
        BigDecimal squadValue,
        BigDecimal netWorth,
        List<JogadorDto> players
) {
}
