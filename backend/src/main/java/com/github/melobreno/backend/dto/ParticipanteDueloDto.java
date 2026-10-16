package com.github.melobreno.backend.dto;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record ParticipanteDueloDto(
        Integer playerId,
        String playerName,
        String position,
        String condition,
        String attribute,
        Integer value
) {
}
