package com.github.melobreno.backend.dto;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record DueloPartidaDto(
        Integer order,
        Integer attackingClubId,
        ParticipanteDueloDto attacker,
        ParticipanteDueloDto defender,
        Boolean goal
) {
}
