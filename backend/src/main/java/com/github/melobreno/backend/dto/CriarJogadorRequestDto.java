package com.github.melobreno.backend.dto;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record CriarJogadorRequestDto(
        String name,
        String position,
        Integer agility,
        Integer age,
        Integer pace,
        Integer shooting,
        Integer passing,
        Integer dribbling,
        Integer defending,
        Integer physical,
        Integer potential
) {
}
