package com.github.melobreno.backend.dto;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

import java.math.BigDecimal;

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record CriarJogadorResponseDto(
        Integer id,
        String name,
        String position,
        Integer agility,
        Integer age,
        String condition,
        BigDecimal baseValue,
        BigDecimal marketValue,
        Integer pace,
        Integer shooting,
        Integer passing,
        Integer dribbling,
        Integer defending,
        Integer physical,
        Integer potential,
        Integer overall,
        Integer clubId
) {
}
